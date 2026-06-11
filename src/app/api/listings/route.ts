// src/app/api/listings/route.ts
//
// POST /api/listings  — create a new listing (donor only)
// GET  /api/listings  — fetch the authenticated donor's own listings
//
// Both routes require an active session. The server client reads the
// session from cookies automatically via @supabase/ssr.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// POST — Create listing
// Body: { food_type, quantity_kg, photo_url, address, lat, lng,
//         pickup_start, pickup_end }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = createClient();

  // 1 — Confirm the user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // 2 — Confirm the user is a donor with active status
  const { data: profile } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "donor" || profile.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3 — Parse and validate the request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { food_type, quantity_kg, photo_url, address, lat, lng, pickup_start, pickup_end } = body;

  // Required field checks
  if (!food_type || typeof food_type !== "string" || food_type.trim() === "") {
    return NextResponse.json({ error: "food_type is required" }, { status: 400 });
  }
  if (!quantity_kg || typeof quantity_kg !== "number" || quantity_kg <= 0) {
    return NextResponse.json({ error: "quantity_kg must be a positive number" }, { status: 400 });
  }
  if (!address || typeof address !== "string" || address.trim() === "") {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng are required numbers" }, { status: 400 });
  }
  if (!pickup_start || !pickup_end) {
    return NextResponse.json({ error: "pickup_start and pickup_end are required" }, { status: 400 });
  }

  // Pickup window logic — end must be after start, and start must be in the future
  const startDate = new Date(pickup_start as string);
  const endDate   = new Date(pickup_end as string);
  const now       = new Date();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format for pickup window" }, { status: 400 });
  }
  if (startDate < now) {
    return NextResponse.json({ error: "Pickup start must be in the future" }, { status: 400 });
  }
  if (endDate <= startDate) {
    return NextResponse.json({ error: "Pickup end must be after pickup start" }, { status: 400 });
  }

  // 4 — Insert into public.listings
  // RLS policy "donors_manage_own" allows this because the session user is the donor
  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      donor_id:     user.id,
      food_type:    (food_type as string).trim(),
      quantity_kg:  quantity_kg as number,
      photo_url:    (photo_url as string | null) ?? null,
      address:      (address as string).trim(),
      lat:          lat as number,
      lng:          lng as number,
      pickup_start: (pickup_start as string),
      pickup_end:   (pickup_end as string),
      status:       "active",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Listing insert error:", insertError);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }

  // 5 — Return the created listing
  return NextResponse.json({ data: listing }, { status: 201 });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Fetch the authenticated donor's own listings
// Returns all listings for this donor, ordered by most recent first
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Fetch listings — RLS ensures only this donor's rows are returned
  // We also mark any expired listings inline before returning
  const { data: listings, error: fetchError } = await supabase
    .from("listings")
    .select("*")
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }

  // Auto-expire: if pickup_end has passed and status is still active,
  // update to expired. This runs lazily on each GET rather than via cron.
  const now = new Date();
  const toExpire = (listings ?? []).filter(
    (l) => l.status === "active" && new Date(l.pickup_end) < now
  );

  if (toExpire.length > 0) {
    const ids = toExpire.map((l) => l.id);
    await supabase
      .from("listings")
      .update({ status: "expired" })
      .in("id", ids);

    // Update the local array so the response reflects reality
    (listings ?? []).forEach((l) => {
      if (ids.includes(l.id)) l.status = "expired";
    });
  }

  return NextResponse.json({ data: listings ?? [] }, { status: 200 });
}