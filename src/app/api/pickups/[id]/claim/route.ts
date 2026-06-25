// src/app/api/pickups/[id]/claim/route.ts
//
// POST /api/pickups/[id]/claim
//
// Claims a listing for the authenticated NGO.
// [id] is the listing_id (not pickup_id).
//
// What this route does atomically:
//  1. Verifies the user is an active NGO
//  2. Verifies the listing is still active (not already claimed/expired)
//  3. Updates listings.status → 'claimed'
//  4. Inserts a row into public.pickups
//  5. Inserts a notification for the donor
//
// Returns the created pickup row.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
    const supabase = createClient();
    const listingId = params.id;

    // 1 — Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // 2 — Role check: must be active NGO
    const { data: profile } = await supabase
        .from("users")
        .select("role, status")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "ngo" || profile.status !== "active") {
        return NextResponse.json({ error: "Forbidden — NGO accounts only" }, { status: 403 });
    }

    // 3 — Verify listing exists and is still active
    const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("id, status, donor_id, food_name, food_type, pickup_end")
        .eq("id", listingId)
        .single();

    if (listingError || !listing) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "active") {
        return NextResponse.json({
            error: `Listing is no longer available — status is '${listing.status}'`,
        }, { status: 409 });
    }

    // Check pickup window hasn't closed
    if (new Date(listing.pickup_end) < new Date()) {
        // Also expire it lazily
        await supabase.from("listings").update({ status: "expired" }).eq("id", listingId);
        return NextResponse.json({ error: "Pickup window has closed for this listing" }, { status: 409 });
    }

    // 4 — Update listing status to claimed
    const { error: updateError } = await supabase
        .from("listings")
        .update({ status: "claimed" })
        .eq("id", listingId);

    if (updateError) {
        console.error("Claim update error:", updateError);
        return NextResponse.json({ error: "Failed to claim listing" }, { status: 500 });
    }

    // 5 — Insert pickup row
    const { data: pickup, error: pickupError } = await supabase
        .from("pickups")
        .insert({
            listing_id: listingId,
            ngo_id: user.id,
            volunteer_id: null,           // assigned later by NGO via PATCH /assign
            status: "claimed",
            claimed_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (pickupError) {
        console.error("Pickup insert error:", pickupError);
        // Rollback the listing status update
        await supabase.from("listings").update({ status: "active" }).eq("id", listingId);
        return NextResponse.json({ error: "Failed to create pickup record" }, { status: 500 });
    }

    // 6 — Insert notification for the donor
    const foodLabel = listing.food_name || listing.food_type;
    await supabase.from("notifications").insert({
        user_id: listing.donor_id,
        type: "listing_claimed",
        title: "Your listing was claimed",
        body: `${foodLabel} has been claimed by an NGO and is being picked up.`,
        reference_id: listingId,
        is_read: false,
    });

    return NextResponse.json({ data: pickup }, { status: 201 });
}