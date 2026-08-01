"use client";
// src/app/(donor)/dashboard/page.tsx
//
// v2 changes:
//  - PageLoader shown while navigating to create/detail pages
//  - Refined spacing (more breathing room between sections)
//  - Loading skeletons use shimmer animation

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/shared/Sidebar";
import { PageLoader } from "@/components/shared/Loader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function statusStyle(status: ListingStatus): React.CSSProperties {
  const map: Record<ListingStatus, { bg: string; color: string }> = {
    active: { bg: "rgba(16,185,129,0.12)", color: "#10B981" },
    claimed: { bg: "rgba(24,95,165,0.1)", color: "#185FA5" },
    completed: { bg: "rgba(16,185,129,0.12)", color: "#10B981" },
    expired: { bg: "rgba(107,114,128,0.12)", color: "#6B7280" },
  };
  const s = map[status];
  return {
    display: "inline-block", background: s.bg, color: s.color,
    fontSize: "9px", fontWeight: 600, fontFamily: "Geist, sans-serif",
    letterSpacing: "0.06em", textTransform: "uppercase",
    padding: "3px 9px", borderRadius: "999px",
  };
}

function EmptyListingsIllustration() {
  return (
    <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
      <rect x="20" y="20" width="100" height="70" rx="10" fill="#fff" stroke="#E5E7EB" strokeWidth="2" />
      <rect x="32" y="36" width="40" height="6" rx="3" fill="#E5E7EB" />
      <rect x="32" y="50" width="60" height="6" rx="3" fill="#F3F4F6" />
      <rect x="32" y="64" width="50" height="6" rx="3" fill="#F3F4F6" />
      <circle cx="100" cy="30" r="14" fill="#FFF4ED" />
      <path d="M100 24v12M94 30h12" stroke="#E8450A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function DonorDashboard() {
  const router = useRouter();
  const unread = useUnreadCount();
  const isMobile = useIsMobile();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const totalKg = listings.reduce((sum, l) => sum + l.quantity_kg, 0);
  const totalMeals = Math.round(totalKg * 2.5);
  const activeCount = listings.filter((l) => l.status === "active").length;
  const claimedCount = listings.filter((l) => l.status === "claimed").length;

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "Geist, sans-serif", display: "flex" }}>

      {navigating && <PageLoader label={navigating} />}

      <Sidebar
        role="Donor"
        items={[
          { label: "Dashboard", href: "/donor/dashboard", icon: "grid" },
          { label: "Post Listing", href: "/donor/listings/create", icon: "plus" },
          { label: "Impact", href: "/donor/impact", icon: "chart" },
          { label: "Notifications", href: "/notifications", icon: "bell", badge: unread },
        ]}
      />

      <main style={{ 
        marginLeft: isMobile ? 0 : "220px", 
        flex: 1, 
        padding: isMobile ? "20px" : "40px",
        marginBottom: isMobile ? "64px" : 0 
      }}>

        {/* Top bar */}
        <div style={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center", 
          justifyContent: "space-between", 
          gap: isMobile ? "16px" : 0,
          marginBottom: "32px" 
        }}>
          <div>
            <h1 style={{ fontFamily: "Geist, sans-serif", fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
              Donor Dashboard
            </h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px", fontWeight: 400 }}>
              Manage your food surplus listings
            </p>
          </div>
          <button
            onClick={() => navigate("/donor/listings/create", "Opening listing form...")}
            style={{
              height: "44px", padding: "0 24px", borderRadius: "999px",
              background: "#E8450A", color: "#fff",
              fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 600,
              border: "2px solid #111111", boxShadow: "3px 3px 0px #111111",
              cursor: "pointer", letterSpacing: "0.01em",
              display: "flex", alignItems: "center", gap: "8px",
              justifyContent: "center",
              width: isMobile ? "100%" : "auto",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(-1px,-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0px #111111";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(0,0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #111111";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
            Post Listing
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Donated", value: `${totalKg.toFixed(1)} kg`, sub: "Across all listings", color: "#E8450A" },
            { label: "Meals Enabled", value: totalMeals, sub: "Est. at 2.5 meals / kg", color: "#10B981" },
            { label: "Active Now", value: activeCount, sub: `${claimedCount} claimed`, color: "#111111" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
              padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", fontWeight: 500, marginBottom: "12px" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "Geist, sans-serif", fontSize: "32px", fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px", fontWeight: 400 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Listings header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div style={{ fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 600, color: "#111111", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            My Listings
          </div>
          {listings.length > 0 && <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{listings.length} total</span>}
        </div>

        {/* Loading skeletons with shimmer */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                background: "linear-gradient(90deg, #fff 25%, #F9FAFB 37%, #fff 63%)",
                backgroundSize: "400% 100%",
                animation: "reserve-shimmer 1.4s ease infinite",
                border: "1px solid #E5E7EB", borderRadius: "12px", height: "88px",
              }} />
            ))}
            <style>{`@keyframes reserve-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }`}</style>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "14px 18px", fontSize: "13px", color: "#EF4444" }}>
            {error}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div style={{
            background: "#fff", border: "1px dashed #E5E7EB", borderRadius: "16px",
            padding: "64px 32px", textAlign: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
              <EmptyListingsIllustration />
            </div>
            <div style={{ fontFamily: "Geist, sans-serif", fontSize: "20px", fontWeight: 600, color: "#111111", marginBottom: "8px" }}>
              No listings yet
            </div>
            <div style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "26px", fontWeight: 400 }}>
              Post your first surplus food listing to get started.
            </div>
            <button
              onClick={() => navigate("/donor/listings/create", "Opening listing form...")}
              style={{
                height: "44px", padding: "0 32px", borderRadius: "10px",
                background: "#E8450A", color: "#fff",
                fontFamily: "Geist, sans-serif", fontSize: "14px", fontWeight: 600,
                border: "2px solid #111111", boxShadow: "3px 3px 0px #111111", cursor: "pointer",
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
                  background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
                  padding: "18px 24px", display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "20px", alignItems: isMobile ? "flex-start" : "center",
                  cursor: "pointer", transition: "box-shadow 0.15s, transform 0.15s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, width: "100%" }}>
                  {/* Photo */}
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "8px",
                    background: "#FAFAFA", overflow: "hidden", position: "relative",
                    flexShrink: 0,
                  }}>
                    {listing.photo_url ? (
                      <Image src={listing.photo_url} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Geist, sans-serif", fontSize: "16px", fontWeight: 600, color: "#111111", marginBottom: "4px" }}>
                      {listing.food_name || listing.food_type}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 400 }}>
                      {listing.food_type} · {listing.quantity_kg} kg
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: isMobile ? "row" : "column", 
                  alignItems: isMobile ? "center" : "flex-end",
                  justifyContent: isMobile ? "space-between" : "flex-end",
                  gap: "6px",
                  width: isMobile ? "100%" : "auto",
                  borderTop: isMobile ? "1px solid #F3F4F6" : "none",
                  paddingTop: isMobile ? "12px" : 0,
                }}>
                  <div style={{ fontSize: "11px", color: listing.status === "active" ? "#E8450A" : "#9CA3AF", marginTop: "5px" }}>
                    {listing.status === "active" ? timeRemaining(listing.pickup_end) : ""}
                  </div>
                  <span style={statusStyle(listing.status)}>{listing.status}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}