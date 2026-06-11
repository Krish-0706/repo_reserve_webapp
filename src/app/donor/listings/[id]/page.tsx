"use client";
// src/app/(donor)/listings/[id]/page.tsx
//
// Listing detail page — shown after creating a listing, or by clicking
// a card on the dashboard.
//
// Shows: full photo, food type, quantity, address, pickup window countdown,
//        status timeline (Posted → Claimed → Completed), NGO name if claimed.
// Actions: Delete listing (active only)

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type ListingStatus = "active" | "claimed" | "completed" | "expired";

type Listing = {
  id: string;
  food_type: string;
  quantity_kg: number;
  photo_url: string | null;
  address: string;
  lat: number;
  lng: number;
  pickup_start: string;
  pickup_end: string;
  status: ListingStatus;
  created_at: string;
  pickups?: {
    id: string;
    status: string;
    claimed_at: string;
    completed_at: string | null;
    ngos: { org_name: string } | null;
  }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function useCountdown(pickupEnd: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(pickupEnd).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [pickupEnd]);

  return timeLeft;
}

// ─── Status timeline config ───────────────────────────────────────────────────
const TIMELINE_STEPS = ["Posted", "Claimed", "Completed"] as const;

function timelineIndex(status: ListingStatus): number {
  if (status === "active")    return 0;
  if (status === "claimed")   return 1;
  if (status === "completed") return 2;
  return 0; // expired shows at Posted
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params.id as string;

  const supabase = createClient();

  const [listing,  setListing]  = useState<Listing | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted,  setDeleted]  = useState(false);

  const countdown = useCountdown(listing?.pickup_end ?? new Date().toISOString());

  // Fetch listing
  const fetchListing = useCallback(async () => {
    const res  = await fetch(`/api/listings/${id}`);
    const json = await res.json();
    if (json.error) { setError(json.error); }
    else            { setListing(json.data); }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Expire this listing? This cannot be undone.")) return;
    setDeleting(true);
    const res  = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to expire listing."); setDeleting(false); return; }
    setDeleted(true);
    setTimeout(() => router.push("/donor/dashboard"), 1500);
  };

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dash-root">

      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-logo">ReServe</div>
        <div className="dash-nav-label">Main</div>
        <button className="dash-nav-item" onClick={() => router.push("/donor/dashboard")}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Dashboard
        </button>
        <button className="dash-nav-item active">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#E8450A", flexShrink:0 }} />
          Listing Detail
        </button>
        <button className="dash-nav-item" onClick={() => router.push("/donor/listings/create")}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Post Listing
        </button>
        <div className="dash-nav-label">Account</div>
        <button className="dash-nav-item">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Notifications
        </button>
        <button className="dash-signout" onClick={logout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </aside>

      <main className="dash-main">

        {/* Back link */}
        <button
          onClick={() => router.push("/donor/dashboard")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "13px", color: "#888",
            fontFamily: "DM Sans, sans-serif",
            marginBottom: "24px", padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back to dashboard
        </button>

        {/* Loading */}
        {loading && (
          <div style={{
            background: "#fff", border: "1.5px solid #E0DDD8",
            borderRadius: "16px", height: "400px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "13px", color: "#AAA" }}>Loading listing...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: "10px", padding: "14px 16px",
            fontSize: "13px", color: "#DC2626",
          }}>
            {error}
          </div>
        )}

        {/* Deleted confirmation */}
        {deleted && (
          <div style={{
            background: "#E6F7F2", border: "1px solid #1D9E75",
            borderRadius: "10px", padding: "14px 16px",
            fontSize: "13px", color: "#1D9E75",
          }}>
            Listing expired. Redirecting to dashboard...
          </div>
        )}

        {/* Detail card */}
        {!loading && listing && !deleted && (
          <div style={{ maxWidth: "680px" }}>

            {/* Photo */}
            {listing.photo_url ? (
              <div style={{
                width: "100%", height: "240px",
                borderRadius: "16px", overflow: "hidden",
                marginBottom: "24px",
                border: "1.5px solid #E0DDD8",
                boxShadow: "4px 4px 10px rgba(0,0,0,0.05)",
              }}>
                <img
                  src={listing.photo_url}
                  alt={listing.food_type}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div style={{
                width: "100%", height: "160px",
                borderRadius: "16px",
                background: "#F0EDE8",
                border: "1.5px dashed #E0DDD8",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "24px",
              }}>
                <span style={{ fontSize: "13px", color: "#AAA" }}>No photo uploaded</span>
              </div>
            )}

            {/* Title row */}
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", marginBottom: "20px",
            }}>
              <div>
                <h1 style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: "24px", fontWeight: 700,
                  color: "#1A1714", letterSpacing: "-0.3px",
                  marginBottom: "4px",
                }}>
                  {listing.food_type}
                </h1>
                <p style={{ fontSize: "14px", color: "#888", fontWeight: 300 }}>
                  {listing.quantity_kg} kg · {listing.address}
                </p>
              </div>
              {/* Status badge */}
              <div style={{
                display: "inline-block",
                background: listing.status === "active" ? "rgba(29,158,117,0.12)"
                  : listing.status === "claimed" ? "rgba(24,95,165,0.1)"
                  : listing.status === "completed" ? "rgba(29,158,117,0.12)"
                  : "rgba(136,136,128,0.12)",
                color: listing.status === "active" ? "#1D9E75"
                  : listing.status === "claimed" ? "#185FA5"
                  : listing.status === "completed" ? "#1D9E75"
                  : "#888880",
                fontSize: "11px", fontWeight: 700,
                fontFamily: "Syne, sans-serif",
                letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "5px 14px", borderRadius: "999px",
                flexShrink: 0, marginTop: "4px",
              }}>
                {listing.status}
              </div>
            </div>

            {/* Info grid */}
            <div style={{
              background: "#fff",
              border: "1.5px solid #E0DDD8",
              borderRadius: "14px",
              overflow: "hidden",
              marginBottom: "20px",
              boxShadow: "3px 3px 8px rgba(0,0,0,0.04)",
            }}>
              {[
                {
                  label: "Pickup window",
                  value: `${formatDateTime(listing.pickup_start)} → ${formatDateTime(listing.pickup_end)}`,
                },
                {
                  label: "Time remaining",
                  value: listing.status === "active" ? countdown : "—",
                  highlight: listing.status === "active",
                },
                {
                  label: "Posted",
                  value: formatDateTime(listing.created_at),
                },
                ...(listing.pickups && listing.pickups.length > 0 ? [{
                  label: "Claimed by",
                  value: listing.pickups[0].ngos?.org_name ?? "Unknown NGO",
                  highlight: true,
                }] : []),
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 20px",
                    borderBottom: i < arr.length - 1 ? "1px solid #F0EDE8" : "none",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#888", fontWeight: 400 }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: row.highlight ? "#E8450A" : "#1A1714",
                    fontFamily: row.highlight ? "Syne, sans-serif" : "DM Sans, sans-serif",
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Status timeline */}
            <div style={{
              background: "#fff",
              border: "1.5px solid #E0DDD8",
              borderRadius: "14px",
              padding: "20px 24px",
              marginBottom: "24px",
              boxShadow: "3px 3px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "11px", fontWeight: 600,
                color: "#888", textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: "16px",
              }}>
                Status Timeline
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {TIMELINE_STEPS.map((step, i) => {
                  const current = timelineIndex(listing.status);
                  const done    = i <= current;
                  const active  = i === current;
                  return (
                    <div key={step} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                      {/* Node */}
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                      }}>
                        <div style={{
                          width: "16px", height: "16px",
                          borderRadius: "50%",
                          background: done ? "#E8450A" : "#E0DDD8",
                          border: `2px solid ${done ? "#E8450A" : "#E0DDD8"}`,
                          boxShadow: active ? "0 0 0 4px rgba(232,69,10,0.12)" : "none",
                          transition: "all 0.2s",
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: "10px",
                          fontWeight: done ? 600 : 400,
                          color: done ? "#E8450A" : "#AAA",
                          fontFamily: "Syne, sans-serif",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}>
                          {step}
                        </span>
                      </div>
                      {/* Connector line */}
                      {i < 2 && (
                        <div style={{
                          flex: 1, height: "2px",
                          background: i < current ? "#E8450A" : "#E0DDD8",
                          margin: "0 4px",
                          marginBottom: "22px",
                          transition: "background 0.2s",
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Google Maps deeplink — opens directions to pickup address */}
              <a
                href={`https://maps.google.com/?q=${listing.lat},${listing.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  height: "44px", padding: "0 20px",
                  borderRadius: "10px",
                  border: "1.5px solid #E0DDD8",
                  background: "#F8F6F3",
                  color: "#555",
                  fontSize: "13px", fontWeight: 500,
                  textDecoration: "none",
                  fontFamily: "DM Sans, sans-serif",
                  transition: "all 0.15s",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                View on Map
              </a>

              {/* Delete — only for active listings */}
              {listing.status === "active" && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    height: "44px", padding: "0 20px",
                    borderRadius: "10px",
                    border: "1.5px solid #E24B4A",
                    background: "transparent",
                    color: "#E24B4A",
                    fontSize: "13px", fontWeight: 500,
                    cursor: deleting ? "not-allowed" : "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    transition: "all 0.15s",
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? "Expiring..." : "Expire listing"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}