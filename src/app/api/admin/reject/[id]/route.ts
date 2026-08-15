// src/app/api/admin/reject/[id]/route.ts
//
// POST /api/admin/reject/:id
//
// Rejects a pending user registration.
// Thin route: auth-check → call SECURITY DEFINER → return result.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
    const supabase = createClient();
    const targetId = params.id;

    // 1 — Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // 2 — Role check: must be admin
    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3 — Extract optional reason from body
    let reason = "";
    try {
        const body = await req.json();
        reason = body.reason ?? "";
    } catch {
        // No body is fine — reason is optional
    }

    // 4 — Call SECURITY DEFINER function
    const { data, error } = await supabase.rpc("admin_reject_user", {
        p_target_id: targetId,
        p_reason: reason,
    });

    if (error) {
        console.error("Reject error:", error);
        const message = error.message || "Failed to reject user";
        return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ data }, { status: 200 });
}
