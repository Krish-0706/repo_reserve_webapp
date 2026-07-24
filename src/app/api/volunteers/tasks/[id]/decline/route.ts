// src/app/api/volunteers/tasks/[id]/decline/route.ts
//
// PATCH /api/volunteers/tasks/:id/decline
// Volunteer declines an assigned task → status reverts to 'claimed', volunteer_id cleared

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function PATCH(_req: NextRequest, { params }: Params) {
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

    // Call SECURITY DEFINER function
    const { data, error } = await supabase.rpc("decline_task", {
        p_pickup_id: pickupId,
    });

    if (error) {
        console.error("Decline task error:", error);
        const message = error.message.includes("not assigned")
            ? "You are not assigned to this task."
            : error.message.includes("not in assigned state")
                ? "This task can no longer be declined."
                : "Failed to decline task.";
        return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ data }, { status: 200 });
}
