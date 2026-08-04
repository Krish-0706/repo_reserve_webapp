import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return new NextResponse("Unauthorised", { status: 401 });
    }

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile) return new NextResponse("Profile not found", { status: 404 });

    const role = profile.role;
    let csvStr = "";

    try {
        if (role === "donor") {
            const { data: listings } = await supabase
                .from("listings")
                .select("food_name, food_type, quantity_kg, status, created_at")
                .eq("donor_id", user.id)
                .order("created_at", { ascending: false });

            csvStr = "Date,Food Name,Category,Quantity (kg),Status\n";
            if (listings) {
                listings.forEach(l => {
                    const date = new Date(l.created_at).toLocaleDateString();
                    // Basic escaping for CSV (wrap in quotes if commas exist)
                    const name = `"${(l.food_name || "").replace(/"/g, '""')}"`;
                    csvStr += `${date},${name},${l.food_type},${l.quantity_kg},${l.status}\n`;
                });
            }
        } else if (role === "ngo") {
            const { data: pickups } = await supabase
                .from("pickups")
                .select("claimed_at, completed_at, status, listings(food_name, food_type, quantity_kg)")
                .eq("ngo_id", user.id)
                .order("claimed_at", { ascending: false });

            csvStr = "Claimed Date,Completed Date,Food Name,Category,Quantity (kg),Status\n";
            if (pickups) {
                pickups.forEach(p => {
                    const claimed = new Date(p.claimed_at).toLocaleDateString();
                    const completed = p.completed_at ? new Date(p.completed_at).toLocaleDateString() : "Pending";
                    const l = p.listings as { food_name?: string, food_type?: string, quantity_kg?: number } | null;
                    const name = l ? `"${(l.food_name || "").replace(/"/g, '""')}"` : "Unknown";
                    const type = l ? l.food_type : "Unknown";
                    const kg = l ? l.quantity_kg : 0;
                    csvStr += `${claimed},${completed},${name},${type},${kg},${p.status}\n`;
                });
            }
        } else if (role === "volunteer") {
            const { data: pickups } = await supabase
                .from("pickups")
                .select("completed_at, status, listings(food_name, address, quantity_kg)")
                .eq("volunteer_id", user.id)
                .order("completed_at", { ascending: false });

            csvStr = "Completion Date,Food Name,Address,Quantity (kg),Status\n";
            if (pickups) {
                pickups.forEach(p => {
                    const completed = p.completed_at ? new Date(p.completed_at).toLocaleDateString() : "Pending";
                    const l = p.listings as { food_name?: string, address?: string, quantity_kg?: number } | null;
                    const name = l ? `"${(l.food_name || "").replace(/"/g, '""')}"` : "Unknown";
                    const address = l ? `"${(l.address || "").replace(/"/g, '""')}"` : "Unknown";
                    const kg = l ? l.quantity_kg : 0;
                    csvStr += `${completed},${name},${address},${kg},${p.status}\n`;
                });
            }
        }

        const headers = new Headers();
        headers.set("Content-Type", "text/csv");
        headers.set("Content-Disposition", `attachment; filename="${role}_impact_export.csv"`);

        return new NextResponse(csvStr, { status: 200, headers });
    } catch (err) {
        console.error("Export Error:", err);
        return new NextResponse("Server Error", { status: 500 });
    }
}
