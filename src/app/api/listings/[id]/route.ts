// src/app/api/listings/[id]/route.ts
//
// GET    /api/listings/[id]  — fetch a single listing (donor sees own, NGO sees active)
// PATCH  /api/listings/[id]  — donor edits own listing (status, etc.)
// DELETE /api/listings/[id]  — donor or admin deletes/expires listing

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Fetch the listing — RLS handles visibility automatically
  // Donors see own rows, NGOs see active rows (per migration 001 policies)
  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      *,
      pickups (
        id, status, claimed_at, completed_at,
        ngo_id,
        ngos ( org_name )
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ data: listing }, { status: 200 });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Only allow deletion of active listings — can't delete claimed/completed
  const { data: listing } = await supabase
    .from("listings")
    .select("status, donor_id")
    .eq("id", params.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.donor_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (listing.status !== "active") {
    return NextResponse.json({ error: "Only active listings can be deleted" }, { status: 400 });
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "expired" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });

  return NextResponse.json({ message: "Listing expired" }, { status: 200 });
}