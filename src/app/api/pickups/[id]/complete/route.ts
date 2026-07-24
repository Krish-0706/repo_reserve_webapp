// src/app/api/pickups/[id]/complete/route.ts
//
// PATCH /api/pickups/:id/complete
// Volunteer completes a task with photo proof.
// Body: { proof_photo_url: string }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
    const supabase = createClient();
    const pickupId = params.id;

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // Role check
    const { data: profile } = await supabase
        .from("users").select("role, status").eq("id", user.id).single();

    if (!profile || profile.role !== "volunteer" || profile.status !== "active") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { proof_photo_url } = body;
    if (!proof_photo_url || typeof proof_photo_url !== "string" || proof_photo_url.trim() === "") {
        return NextResponse.json({ error: "proof_photo_url is required" }, { status: 400 });
    }

    // Call SECURITY DEFINER function
    const { data, error } = await supabase.rpc("complete_task", {
        p_pickup_id: pickupId,
        p_proof_url: proof_photo_url,
    });

    if (error) {
        console.error("Complete task error:", error);
        const message = error.message.includes("not assigned")
            ? "You are not assigned to this task."
            : error.message.includes("not in progress")
                ? "This task is not currently in progress."
                : "Failed to complete task.";
        return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ data }, { status: 200 });
}
