// src/app/api/listings/nearby/route.ts
//
// GET /api/listings/nearby?lat=&lng=&radius=
//
// Public endpoint — no auth required.
// Returns all active listings within `radius` km of the given coordinates.
// Uses Haversine formula in JavaScript — no PostGIS needed.
//
// Query params:
//   lat    — latitude (float, required)
//   lng    — longitude (float, required)
//   radius — search radius in km (float, optional, default 10)
//
// If lat/lng are omitted, returns all active listings (for initial map load).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Haversine formula — returns distance in km between two lat/lng points
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const radiusParam = searchParams.get("radius") ?? "10";

    const lat = latParam ? parseFloat(latParam) : null;
    const lng = lngParam ? parseFloat(lngParam) : null;
    const radius = parseFloat(radiusParam);

    if (lat !== null && (isNaN(lat) || isNaN(lng!))) {
        return NextResponse.json({ error: "Invalid lat/lng values" }, { status: 400 });
    }

    // Fetch all active listings — RLS policy "ngo_volunteer_read_active"
    // allows authenticated NGOs/volunteers/admins to read active rows.
    // For unauthenticated requests (public map load), we use the anon key
    // which bypasses auth but is still subject to RLS.
    const { data: listings, error } = await supabase
        .from("listings")
        .select(`
      id, food_name, food_type, quantity_kg, photo_url,
      lat, lng, address, pickup_start, pickup_end, status, created_at,
      donor_id
    `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Nearby listings error:", error);
        return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
    }

    // If no lat/lng provided, return all active listings (for initial full map load)
    if (lat === null || lng === null) {
        return NextResponse.json({ data: listings ?? [] }, { status: 200 });
    }

    // Filter by Haversine distance
    const nearby = (listings ?? []).filter((l) => {
        const dist = haversineKm(lat, lng, l.lat, l.lng);
        return dist <= radius;
    });

    return NextResponse.json({ data: nearby }, { status: 200 });
}