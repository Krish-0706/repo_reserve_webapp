// src/app/api/listings/route.ts
// Updated: now accepts and validates `food_name`

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "donor" || profile.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { food_name, food_type, quantity_kg, photo_url, address, lat, lng, pickup_start, pickup_end } = body;

  // NEW — food_name validation
  if (!food_name || typeof food_name !== "string" || food_name.trim() === "") {
    return NextResponse.json({ error: "food_name is required" }, { status: 400 });
  }
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

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      donor_id:     user.id,
      food_name:    (food_name as string).trim(),   // NEW
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

  return NextResponse.json({ data: listing }, { status: 201 });
}

export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: listings, error: fetchError } = await supabase
    .from("listings")
    .select("*")
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }

  const now = new Date();
  const toExpire = (listings ?? []).filter(
    (l) => l.status === "active" && new Date(l.pickup_end) < now
  );

  if (toExpire.length > 0) {
    const ids = toExpire.map((l) => l.id);
    await supabase.from("listings").update({ status: "expired" }).in("id", ids);
    (listings ?? []).forEach((l) => { if (ids.includes(l.id)) l.status = "expired"; });
  }

  return NextResponse.json({ data: listings ?? [] }, { status: 200 });
}