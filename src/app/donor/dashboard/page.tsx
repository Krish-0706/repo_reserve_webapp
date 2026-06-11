"use client";
// src/app/(donor)/dashboard/page.tsx
//
// Real donor dashboard — replaces the dummy.
//
// On load: fetches all listings for the authenticated donor via GET /api/listings
// Shows: stat cards (total kg, meals, active count) + listing feed with status badges
// "Post Listing" button navigates to /donor/listings/create
// Each listing card links to /donor/listings/[id]

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type ListingStatus = "active" | "claimed" | "completed" | "expired";

type Listing = {
  id: string;
  food_type: string;
  quantity_kg: number;
  photo_url: string | null;
  address: string;
  pickup_start: string;
  pickup_end: string;
  status: ListingStatus;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns time remaining as a human-readable string
function timeRemaining(pickupEnd: string): string {
  const diff = new Date(pickupEnd).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours   = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// Returns the status badge style based on listing status
function statusStyle(status: ListingStatus): React.CSSProperties {
  const map: Record<ListingStatus, { bg: string; color: string }> = {
    active:    { bg: "rgba(29,158,117,0.12)",  color: "#1D9E75" },
    claimed:   { bg: "rgba(24,95,165,0.1)",    color: "#185FA5" },
    completed: { bg: "rgba(29,158,117,0.12)",  color: "#1D9E75" },
    expired:   { bg: "rgba(136,136,128,0.12)", color: "#888880" },
  };
  const s = map[status];
  return {
    display: "inline-block",
    background: s.bg, color: s.color,
    fontSize: "9px", fontWeight: 700,
    fontFamily: "Syne, sans-serif",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "3px 9px", borderRadius: "999px",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DonorDashboard() {
  const router   = useRouter();
  const supabase = createClient();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // Fetch listings on mount
  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) { setError(json.error); }
        else { setListings(json.data ?? []); }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load listings."); setLoading(false); });
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalKg      = listings.reduce((sum, l) => sum + l.quantity_kg, 0);
  const totalMeals   = Math.round(totalKg * 2.5);  // industry estimate: 1 kg ≈ 2.5 meals
  const activeCount  = listings.filter((l) => l.status === "active").length;
  const claimedCount = listings.filter((l) => l.status === "claimed").length;

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dash-root">

      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-logo">ReServe</div>
        <div className="dash-nav-label">Main</div>
        <button className="dash-nav-item active">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#E8450A", flexShrink:0 }} />
          Dashboard
        </button>
        <button className="dash-nav-item" onClick={() => router.push("/donor/listings/create")}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Post Listing
        </button>
        <button className="dash-nav-item" onClick={() => router.push("/donor/impact")}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Impact
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

      {/* Main */}
      <main className="dash-main">

        {/* Top bar */}
        <div className="dash-topbar">
          <div>
            <div className="dash-greeting">Donor Dashboard</div>
            <div className="dash-greeting-sub">Manage your food surplus listings</div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div className="dash-badge">DONOR</div>
            <button
              onClick={() => router.push("/donor/listings/create")}
              style={{
                height: "38px", padding: "0 20px",
                borderRadius: "999px",
                background: "#E8450A", color: "#fff",
                fontFamily: "Syne, sans-serif",
                fontSize: "12px", fontWeight: 700,
                border: "2px solid #1A1714",
                boxShadow: "2px 2px 0px #1A1714",
                cursor: "pointer",
                letterSpacing: "0.03em",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              + Post Listing
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-label">Total Donated</div>
            <div className="stat-value orange">{totalKg.toFixed(1)} kg</div>
            <div className="stat-sub">Across all listings</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Meals Enabled</div>
            <div className="stat-value green">{totalMeals}</div>
            <div className="stat-sub">Est. at 2.5 meals / kg</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Now</div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-sub">{claimedCount} claimed</div>
          </div>
        </div>

        {/* Listing feed */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div className="dash-section-title">My Listings</div>
          {listings.length > 0 && (
            <span style={{ fontSize: "11px", color: "#AAA" }}>
              {listings.length} total
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{
                background: "#fff", border: "1.5px solid #E0DDD8",
                borderRadius: "14px", height: "80px",
                animation: "pulse 1.5s ease-in-out infinite",
                opacity: 0.6,
              }} />
            ))}
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

        {/* Empty state */}
        {!loading && !error && listings.length === 0 && (
          <div className="coming-soon-card">
            <div style={{
              width: "48px", height: "48px",
              background: "#F0EDE8", borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div className="coming-soon-title" style={{ fontSize: "18px" }}>No listings yet</div>
            <div className="coming-soon-body" style={{ marginBottom: "20px" }}>
              Post your first surplus food listing to get started.
            </div>
            <button
              onClick={() => router.push("/donor/listings/create")}
              style={{
                height: "44px", padding: "0 28px",
                borderRadius: "10px",
                background: "#E8450A", color: "#fff",
                fontFamily: "Syne, sans-serif",
                fontSize: "13px", fontWeight: 700,
                border: "2px solid #1A1714",
                boxShadow: "2px 2px 0px #1A1714",
                cursor: "pointer",
              }}
            >
              Post Listing →
            </button>
          </div>
        )}

        {/* Listing cards */}
        {!loading && !error && listings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => router.push(`/donor/listings/${listing.id}`)}
                style={{
                  background: "#fff",
                  border: "1.5px solid #E0DDD8",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto",
                  gap: "14px",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  boxShadow: "2px 2px 6px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "3px 3px 0px #E0DDD8";
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(-1px,-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "2px 2px 6px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(0,0)";
                }}
              >
                {/* Photo or placeholder */}
                <div style={{
                  width: "56px", height: "56px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "#F0EDE8",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {listing.photo_url ? (
                    <img
                      src={listing.photo_url}
                      alt={listing.food_type}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: "14px", fontWeight: 600,
                    color: "#1A1714", marginBottom: "3px",
                  }}>
                    {listing.food_type}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", fontWeight: 300 }}>
                    {listing.quantity_kg} kg · {listing.address.split(",")[0]}
                  </div>
                  <div style={{ fontSize: "11px", color: listing.status === "active" ? "#E8450A" : "#AAA", marginTop: "3px" }}>
                    {listing.status === "active" ? timeRemaining(listing.pickup_end) : ""}
                  </div>
                </div>

                {/* Status badge + arrow */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <span style={statusStyle(listing.status)}>
                    {listing.status}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}