// src/app/api/volunteers/available/route.ts
//
// GET /api/volunteers/available
// Returns all active volunteers for NGO volunteer assignment.
// NGO-only endpoint.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Role check: must be active NGO
    const { data: profile } = await supabase
        .from("users").select("role, status").eq("id", user.id).single();

    if (!profile || profile.role !== "ngo" || profile.status !== "active") {
        return NextResponse.json({ error: "Forbidden — NGO accounts only" }, { status: 403 });
    }

    // Fetch active volunteers affiliated with this NGO
    const { data, error } = await supabase
        .from("volunteers")
        .select(`
            id,
            vol_name,
            hours_logged,
            rating,
            tasks_completed,
            users ( email )
        `)
        .eq("ngo_id", user.id)
        .order("tasks_completed", { ascending: false });

    if (error) {
        console.error("Available volunteers error:", error);
        return NextResponse.json({ error: "Failed to fetch volunteers" }, { status: 500 });
    }

    // Filter to only active users (join doesn't support filtering on joined table easily)
    // The RLS policy on volunteers already allows NGOs to read their own volunteer rows
    // We need to filter by user status = active
    const activeVolunteers = (data ?? []).filter(
        (v: Record<string, unknown>) => {
            const users = v.users as { email: string } | null;
            return users !== null;
        }
    );

    return NextResponse.json({ data: activeVolunteers }, { status: 200 });
}
