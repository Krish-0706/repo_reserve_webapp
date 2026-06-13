"use client";
// src/app/(donor)/dashboard/page.tsx
//
// v2 changes:
//  - PageLoader shown while navigating to create/detail pages
//  - Refined spacing (more breathing room between sections)
//  - Loading skeletons use shimmer animation

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import { PageLoader } from "@/components/shared/Loader";

type ListingStatus = "active" | "claimed" | "completed" | "expired";

type Listing = {
  id: string;
  food_name: string;
  food_type: string;
  quantity_kg: number;
  photo_url: string | null;
  address: string;
  pickup_start: string;
  pickup_end: string;
  status: ListingStatus;
  created_at: string;
};

function timeRemaining(pickupEnd: string): string {
  const diff = new Date(pickupEnd).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours   = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function statusStyle(status: ListingStatus): React.CSSProperties {
  const map: Record<ListingStatus, { bg: string; color: string }> = {
    active:    { bg: "rgba(29,158,117,0.12)",  color: "#1D9E75" },
    claimed:   { bg: "rgba(24,95,165,0.1)",    color: "#185FA5" },
    completed: { bg: "rgba(29,158,117,0.12)",  color: "#1D9E75" },
    expired:   { bg: "rgba(136,136,128,0.12)", color: "#888880" },
  };
  const s = map[status];
  return {
    display: "inline-block", background: s.bg, color: s.color,
    fontSize: "9px", fontWeight: 700, fontFamily: "Syne, sans-serif",
    letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "3px 9px", borderRadius: "999px",
  };
}

function EmptyListingsIllustration() {
  return (
    <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
      <rect x="20" y="20" width="100" height="70" rx="10" fill="#fff" stroke="#E0DDD8" strokeWidth="2"/>
      <rect x="32" y="36" width="40" height="6" rx="3" fill="#E0DDD8"/>
      <rect x="32" y="50" width="60" height="6" rx="3" fill="#F0EDE8"/>
      <rect x="32" y="64" width="50" height="6" rx="3" fill="#F0EDE8"/>
      <circle cx="100" cy="30" r="14" fill="#FEF0EA"/>
      <path d="M100 24v12M94 30h12" stroke="#E8450A" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function DonorDashboard() {
  const router = useRouter();

  const [listings,   setListings]   = useState<Listing[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [navigating, setNavigating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setListings(json.data ?? []);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load listings."); setLoading(false); });
  }, []);

  const navigate = (path: string, label: string) => {
    setNavigating(label);
    router.push(path);
  };

  const totalKg      = listings.reduce((sum, l) => sum + l.quantity_kg, 0);
  const totalMeals   = Math.round(totalKg * 2.5);
  const activeCount  = listings.filter((l) => l.status === "active").length;
  const claimedCount = listings.filter((l) => l.status === "claimed").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F0EDE8", fontFamily: "DM Sans, sans-serif", display: "flex" }}>

      {navigating && <PageLoader label={navigating} />}

      <Sidebar
        role="Donor"
        items={[
          { label: "Dashboard",     href: "/donor/dashboard",       icon: "grid" },
          { label: "Post Listing",  href: "/donor/listings/create", icon: "plus" },
          { label: "Impact",        href: "/donor/impact",          icon: "chart" },
          { label: "Notifications", href: "/notifications",         icon: "bell" },
        ]}
      />

      <main style={{ marginLeft: "240px", flex: 1, padding: "44px 52px 60px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "32px", fontWeight: 800, color: "#1A1714", letterSpacing: "-0.5px" }}>
              Donor Dashboard
            </h1>
            <p style={{ fontSize: "14px", color: "#888", marginTop: "6px", fontWeight: 300 }}>
              Manage your food surplus listings
            </p>
          </div>
          <button
            onClick={() => navigate("/donor/listings/create", "Opening listing form...")}
            style={{
              height: "48px", padding: "0 26px", borderRadius: "999px",
              background: "#E8450A", color: "#fff",
              fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700,
              border: "2px solid #1A1714", boxShadow: "3px 3px 0px #1A1714",
              cursor: "pointer", letterSpacing: "0.03em",
              display: "flex", alignItems: "center", gap: "8px",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(-1px,-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0px #1A1714";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(0,0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #1A1714";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
            Post Listing
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px", marginBottom: "44px" }}>
          {[
            { label: "Total Donated", value: `${totalKg.toFixed(1)} kg`, sub: "Across all listings", color: "#E8450A" },
            { label: "Meals Enabled", value: totalMeals, sub: "Est. at 2.5 meals / kg", color: "#1D9E75" },
            { label: "Active Now",    value: activeCount, sub: `${claimedCount} claimed`, color: "#1A1714" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "18px",
              padding: "28px 28px", boxShadow: "4px 4px 10px rgba(0,0,0,0.04), -2px -2px 6px rgba(255,255,255,0.9)",
            }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.09em", color: "#AAA", fontWeight: 500, marginBottom: "12px" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: "34px", fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "11px", color: "#AAA", marginTop: "8px", fontWeight: 300 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Listings header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: "14px", fontWeight: 700, color: "#1A1714", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            My Listings
          </div>
          {listings.length > 0 && <span style={{ fontSize: "12px", color: "#AAA" }}>{listings.length} total</span>}
        </div>

        {/* Loading skeletons with shimmer */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{
                background: "linear-gradient(90deg, #fff 25%, #F8F6F3 37%, #fff 63%)",
                backgroundSize: "400% 100%",
                animation: "reserve-shimmer 1.4s ease infinite",
                border: "1.5px solid #E0DDD8", borderRadius: "16px", height: "88px",
              }} />
            ))}
            <style>{`@keyframes reserve-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }`}</style>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", padding: "14px 18px", fontSize: "13px", color: "#DC2626" }}>
            {error}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div style={{
            background: "#fff", border: "2px dashed #E0DDD8", borderRadius: "22px",
            padding: "64px 32px", textAlign: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
              <EmptyListingsIllustration />
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "20px", fontWeight: 700, color: "#1A1714", marginBottom: "8px" }}>
              No listings yet
            </div>
            <div style={{ fontSize: "14px", color: "#AAA", marginBottom: "26px", fontWeight: 300 }}>
              Post your first surplus food listing to get started.
            </div>
            <button
              onClick={() => navigate("/donor/listings/create", "Opening listing form...")}
              style={{
                height: "48px", padding: "0 32px", borderRadius: "12px",
                background: "#E8450A", color: "#fff",
                fontFamily: "Syne, sans-serif", fontSize: "14px", fontWeight: 700,
                border: "2px solid #1A1714", boxShadow: "3px 3px 0px #1A1714", cursor: "pointer",
              }}
            >
              Post Listing →
            </button>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/donor/listings/${listing.id}`, "Loading listing details...")}
                style={{
                  background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "16px",
                  padding: "20px 26px", display: "grid",
                  gridTemplateColumns: "64px 1fr auto", gap: "20px", alignItems: "center",
                  cursor: "pointer", transition: "box-shadow 0.15s, transform 0.15s",
                  boxShadow: "2px 2px 6px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "4px 4px 0px #E0DDD8";
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(-1px,-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "2px 2px 6px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(0,0)";
                }}
              >
                <div style={{
                  width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden",
                  background: "#F0EDE8", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {listing.photo_url ? (
                    <img src={listing.photo_url} alt={listing.food_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </div>

                <div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: "15px", fontWeight: 700, color: "#1A1714", marginBottom: "4px" }}>
                    {listing.food_name || listing.food_type}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", fontWeight: 300 }}>
                    {listing.food_type} · {listing.quantity_kg} kg · {listing.address.split(",")[0]}
                  </div>
                  <div style={{ fontSize: "11px", color: listing.status === "active" ? "#E8450A" : "#AAA", marginTop: "5px" }}>
                    {listing.status === "active" ? timeRemaining(listing.pickup_end) : ""}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                  <span style={statusStyle(listing.status)}>{listing.status}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}