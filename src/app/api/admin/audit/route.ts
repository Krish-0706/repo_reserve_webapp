// src/app/api/admin/audit/route.ts
//
// GET /api/admin/audit
//
// Returns the admin audit log — the accountability record.
// Enriches each entry with admin and target user emails.

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

    // 3 — Fetch audit log entries (RLS policy allows admin read)
    const { data: logs, error: fetchError } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

    if (fetchError) {
        console.error("Audit log fetch error:", fetchError);
        return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
    }

    // 4 — Enrich with admin and target user emails
    const userIds = new Set<string>();
    (logs ?? []).forEach((l) => {
        userIds.add(l.admin_id);
        userIds.add(l.target_user_id);
    });

    const { data: users } = await supabase
        .from("users")
        .select("id, email, role")
        .in("id", Array.from(userIds));

    const userMap = new Map<string, { email: string; role: string }>();
    (users ?? []).forEach((u) => userMap.set(u.id, { email: u.email, role: u.role }));

    const enriched = (logs ?? []).map((l) => ({
        ...l,
        admin_email: userMap.get(l.admin_id)?.email ?? "Unknown",
        target_email: userMap.get(l.target_user_id)?.email ?? "Unknown",
        target_role: userMap.get(l.target_user_id)?.role ?? "Unknown",
    }));

    return NextResponse.json({ data: enriched }, { status: 200 });
}
