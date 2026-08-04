import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    try {
        const { rating } = await request.json();
        const { id } = params;

        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
        }

        // Fetch pickup to verify permissions and get volunteer_id
        const { data: pickup, error: pickupError } = await supabase
            .from("pickups")
            .select("ngo_id, volunteer_id, status")
            .eq("id", id)
            .single();

        if (pickupError || !pickup || pickup.ngo_id !== user.id) {
            return NextResponse.json({ error: "Invalid pickup or unauthorised" }, { status: 400 });
        }

        if (pickup.status !== "completed") {
            return NextResponse.json({ error: "Pickup is not completed yet" }, { status: 400 });
        }

        if (!pickup.volunteer_id) {
            return NextResponse.json({ error: "No volunteer assigned" }, { status: 400 });
        }

        const volId = pickup.volunteer_id;

        // Get current volunteer rating
        const { data: vol } = await supabase
            .from("volunteers")
            .select("rating, tasks_completed")
            .eq("id", volId)
            .single();

        if (vol) {
            const currentRating = Number(vol.rating) || 0;
            // tasks_completed already includes this task if it was completed, or we use a min of 1
            const tasksCompleted = Math.max(Number(vol.tasks_completed) || 1, 1);
            
            // True Average formula: ((current_avg * (N - 1)) + new_rating) / N
            const newRating = currentRating === 0 ? rating : ((currentRating * (tasksCompleted - 1)) + rating) / tasksCompleted;
            
            const { error: updateError } = await supabase
                .from("volunteers")
                .update({ rating: newRating })
                .eq("id", volId);
                
            if (updateError) {
                return NextResponse.json({ error: "Failed to update volunteer rating" }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, message: "Rating submitted successfully" });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
