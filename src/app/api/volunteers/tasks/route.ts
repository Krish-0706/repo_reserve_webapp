// src/app/api/volunteers/tasks/route.ts
//
// GET /api/volunteers/tasks
// Returns all pickups assigned to the authenticated volunteer,
// joined with listing details and NGO info.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: profile } = await supabase
        .from("users").select("role, status").eq("id", user.id).single();

    if (!profile || profile.role !== "volunteer" || profile.status !== "active") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch assigned + in_progress tasks with listing and NGO details
    const { data, error } = await supabase
        .from("pickups")
        .select(`
            id, status, claimed_at, completed_at, listing_id, ngo_id, volunteer_id,
            listings (
                id, food_name, food_type, quantity_kg,
                photo_url, address, lat, lng,
                pickup_start, pickup_end
            ),
            ngos (
                id, org_name, contact_phone
            )
        `)
        .eq("volunteer_id", user.id)
        .in("status", ["assigned", "in_progress"])
        .order("claimed_at", { ascending: false });

    if (error) {
        console.error("Volunteer tasks error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    // Also fetch volunteer stats
    const { data: stats } = await supabase
        .from("volunteers")
        .select("hours_logged, rating, tasks_completed")
        .eq("id", user.id)
        .single();

    return NextResponse.json({
        data: data ?? [],
        stats: stats ?? { hours_logged: 0, rating: 0, tasks_completed: 0 },
    }, { status: 200 });
}
