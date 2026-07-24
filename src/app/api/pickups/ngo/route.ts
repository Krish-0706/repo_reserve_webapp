// src/app/api/pickups/ngo/route.ts
//
// GET /api/pickups/ngo
// Returns all pickups for the authenticated NGO,
// joined with listing details and volunteer info.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data: profile } = await supabase
        .from("users").select("role, status").eq("id", user.id).single();

    if (!profile || profile.role !== "ngo" || profile.status !== "active") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
        .from("pickups")
        .select(`
      id, status, claimed_at, completed_at, listing_id, volunteer_id,
      listings (
        id, food_name, food_type, quantity_kg,
        photo_url, address, pickup_start, pickup_end
      ),
      volunteers (
        id, vol_name, hours_logged, rating,
        users ( email )
      )
    `)
        .eq("ngo_id", user.id)
        .order("claimed_at", { ascending: false });

    if (error) {
        console.error("NGO pickups error:", error);
        return NextResponse.json({ error: "Failed to fetch pickups" }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
}