// src/app/api/pickups/[id]/assign/route.ts
//
// PATCH /api/pickups/:id/assign
// NGO assigns a volunteer to a claimed pickup.
// Body: { volunteer_id: string }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
    const supabase = createClient();
    const pickupId = params.id;

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Role check: must be active NGO
    const { data: profile } = await supabase
        .from("users").select("role, status").eq("id", user.id).single();

    if (!profile || profile.role !== "ngo" || profile.status !== "active") {
        return NextResponse.json({ error: "Forbidden — NGO accounts only" }, { status: 403 });
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { volunteer_id } = body;
    if (!volunteer_id || typeof volunteer_id !== "string") {
        return NextResponse.json({ error: "volunteer_id is required" }, { status: 400 });
    }

    // Call SECURITY DEFINER function
    const { data, error } = await supabase.rpc("assign_volunteer", {
        p_pickup_id: pickupId,
        p_volunteer_id: volunteer_id,
    });

    if (error) {
        console.error("Assign volunteer error:", error);
        const message = error.message.includes("not in claimable state")
            ? "This pickup already has a volunteer assigned."
            : error.message.includes("Volunteer not found")
                ? "Selected volunteer was not found."
                : error.message.includes("not active")
                    ? "Selected volunteer account is not active."
                    : error.message.includes("Only the claiming NGO")
                        ? "You can only assign volunteers to your own pickups."
                        : "Failed to assign volunteer.";
        return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ data }, { status: 200 });
}
