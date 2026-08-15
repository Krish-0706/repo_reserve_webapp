// src/app/api/admin/registrations/route.ts
//
// GET /api/admin/registrations
//
// Returns all pending users for the admin KYC queue.
// Thin route: auth-check → query → return. No business logic.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createClient();

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

    // 3 — Fetch pending users with KYC documents
    const { data: pendingUsers, error: fetchError } = await supabase
        .from("users")
        .select("id, email, role, status, kyc_documents, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

    if (fetchError) {
        console.error("Registrations fetch error:", fetchError);
        return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
    }

    // 4 — For NGOs, enrich with org_name and contact_phone
    const enriched = await Promise.all(
        (pendingUsers ?? []).map(async (u) => {
            if (u.role === "ngo") {
                const { data: ngo } = await supabase
                    .from("ngos")
                    .select("org_name, contact_phone, kyc_status")
                    .eq("id", u.id)
                    .single();
                return { ...u, ngo_profile: ngo ?? null };
            }
            return { ...u, ngo_profile: null };
        })
    );

    return NextResponse.json({ data: enriched }, { status: 200 });
}
