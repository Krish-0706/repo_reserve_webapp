"use client";
// src/app/(ngo)/map/page.tsx
//
// M2 — NGO Discovery & Claim
//
// Layout:
//   Left (60%) — full-height Leaflet map with listing pins
//   Right (40%) — sidebar panel:
//       • Default: listing feed cards (scrollable)
//       • On pin click: listing detail with Claim button
//
// Realtime: Supabase subscription on public.listings keeps pins live.
// Claim: POST /api/pickups/[id]/claim → removes pin, updates panel.

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner, PageLoader } from "@/components/shared/Loader";

// Leaflet must be dynamically imported — it uses browser-only APIs
const MapView = dynamic(() => import("@/components/ngo/MapView"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%",
      background: "#F0EDE8",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <Spinner size={24} color="#E8450A" />
        <div style={{ fontSize: "13px", color: "#888", marginTop: "12px", fontFamily: "DM Sans, sans-serif" }}>
          Loading map...
        </div>
      </div>
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type MapListing = {
  id: string;
  food_name: string;
  food_type: string;
  quantity_kg: number;
  photo_url: string | null;
  address: string;
  lat: number;
  lng: number;
  pickup_start: string;
  pickup_end: string;
  status: "active";
  created_at: string;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function timeLeft(pickupEnd: string): string {
  const diff = new Date(pickupEnd).getTime() - Date.now();
  if (diff <= 0) return "Closing now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

// ─── Listing detail panel ─────────────────────────────────────────────────────
function ListingPanel({
  listing, onClaim, onClose, claiming,
}: {
  listing: MapListing;
  onClaim: (id: string) => void;
  onClose: () => void;
  claiming: boolean;
}) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: "#fff", overflow: "hidden",
    }}>
      {/* Photo */}
      {listing.photo_url ? (
        <div style={{ height: "200px", flexShrink: 0, overflow: "hidden" }}>
          <img src={listing.photo_url} alt={listing.food_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{
          height: "140px", flexShrink: 0,
          background: "#F0EDE8", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.2">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {/* Back button */}
        <button onClick={onClose} style={{
          display: "flex", alignItems: "center", gap: "5px",
          background: "none", border: "none", cursor: "pointer",
          fontSize: "12px", color: "#888", padding: 0, marginBottom: "14px",
          fontFamily: "DM Sans, sans-serif",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to listings
        </button>

        {/* Title */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{
            display: "inline-block", background: "#FEF0EA", color: "#E8450A",
            fontSize: "10px", fontWeight: 700, padding: "3px 10px",
            borderRadius: "999px", fontFamily: "Syne, sans-serif",
            letterSpacing: "0.06em", textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            {listing.food_type}
          </div>
          <h2 style={{
            fontFamily: "Syne, sans-serif", fontSize: "20px",
            fontWeight: 700, color: "#1A1714", letterSpacing: "-0.3px",
            marginBottom: "4px",
          }}>
            {listing.food_name || listing.food_type}
          </h2>
          <p style={{ fontSize: "13px", color: "#888", fontWeight: 300 }}>
            {listing.quantity_kg} kg · {listing.address}
          </p>
        </div>

        {/* Urgency strip */}
        <div style={{
          background: "#FEF0EA", borderRadius: "10px", padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "16px",
        }}>
          <div style={{ fontSize: "12px", color: "#888" }}>Pickup window</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#E8450A" }}>
            {formatTime(listing.pickup_start)} – {formatTime(listing.pickup_end)}
          </div>
        </div>
        <div style={{
          background: "#1A1714", borderRadius: "10px", padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "20px",
        }}>
          <div style={{ fontSize: "12px", color: "rgba(240,237,232,0.5)" }}>Time remaining</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: "14px", fontWeight: 700, color: "#E8450A" }}>
            {timeLeft(listing.pickup_end)}
          </div>
        </div>

        {/* Map deeplink */}
        <a
          href={`https://maps.google.com/?q=${listing.lat},${listing.lng}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            height: "42px", borderRadius: "10px",
            border: "1.5px solid #E0DDD8", background: "#F8F6F3",
            color: "#555", fontSize: "12px", fontWeight: 500,
            textDecoration: "none", fontFamily: "DM Sans, sans-serif",
            justifyContent: "center", marginBottom: "10px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="10" r="3" />
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          View on Google Maps
        </a>
      </div>

      {/* Claim button — sticky bottom */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #F0EDE8", flexShrink: 0 }}>
        <button
          onClick={() => onClaim(listing.id)}
          disabled={claiming}
          style={{
            width: "100%", height: "52px", borderRadius: "14px",
            background: claiming ? "#E89070" : "#E8450A",
            color: "#fff", fontFamily: "Syne, sans-serif",
            fontSize: "15px", fontWeight: 700,
            border: "2px solid #1A1714",
            cursor: claiming ? "not-allowed" : "pointer",
            boxShadow: "3px 3px 0px #1A1714",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: "10px",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!claiming) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(-1px,-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0px #1A1714";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(0,0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #1A1714";
          }}
        >
          {claiming && <Spinner size={16} />}
          {claiming ? "Claiming..." : "Claim This Listing →"}
        </button>
      </div>
    </div>
  );
}

// ─── Listing card (in feed) ───────────────────────────────────────────────────
function ListingCard({ listing, onClick }: { listing: MapListing; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid", gridTemplateColumns: "52px 1fr",
        gap: "12px", alignItems: "center",
        padding: "14px 16px",
        borderBottom: "1px solid #F0EDE8",
        cursor: "pointer", transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "#FAFAF8"}
      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
    >
      <div style={{
        width: "52px", height: "52px", borderRadius: "10px",
        overflow: "hidden", background: "#F0EDE8", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {listing.photo_url
          ? <img src={listing.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
        }
      </div>
      <div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#1A1714", marginBottom: "2px" }}>
          {listing.food_name || listing.food_type}
        </div>
        <div style={{ fontSize: "11px", color: "#888", fontWeight: 300 }}>
          {listing.food_type} · {listing.quantity_kg} kg
        </div>
        <div style={{ fontSize: "10px", color: "#E8450A", marginTop: "3px", fontFamily: "Syne, sans-serif", fontWeight: 600 }}>
          {timeLeft(listing.pickup_end)}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NGOMapPage() {
  const supabase = createClient();

  const [listings, setListings] = useState<MapListing[]>([]);
  const [selected, setSelected] = useState<MapListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch active listings
  const fetchListings = useCallback(async () => {
    const res = await fetch("/api/listings/nearby");
    const json = await res.json();
    if (!json.error) setListings(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchListings();

    // Supabase Realtime — subscribe to public.listings changes
    const channel = supabase
      .channel("listings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // New listing — add pin if still active
            const newListing = payload.new as MapListing;
            if (newListing.status === "active") {
              setListings((prev) => [newListing, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            // Status changed (e.g. claimed/expired) — remove from map
            const updated = payload.new as MapListing;
            if (updated.status !== "active") {
              setListings((prev) => prev.filter((l) => l.id !== updated.id));
              // If this was the selected listing, close the panel
              setSelected((s) => s?.id === updated.id ? null : s);
            }
          } else if (payload.eventType === "DELETE") {
            setListings((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchListings, supabase]);

  // Claim a listing
  const handleClaim = async (listingId: string) => {
    setClaiming(true);
    setClaimError("");

    const res = await fetch(`/api/pickups/${listingId}/claim`, { method: "POST" });
    const json = await res.json();

    if (!res.ok) {
      setClaimError(json.error ?? "Failed to claim listing. Please try again.");
      setClaiming(false);
      return;
    }

    // Remove from local list (Realtime will also fire, but this is instant)
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    setSelected(null);
    setClaiming(false);
    showToast("Listing claimed successfully. Check Active Pickups.");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "DM Sans, sans-serif" }}>

      {navigating && <PageLoader label="Loading..." />}

      <Sidebar
        role="NGO"
        items={[
          { label: "Live Map", href: "/ngo/map", icon: "map", badge: listings.length },
          { label: "Active Pickups", href: "/ngo/pickups", icon: "truck" },
          { label: "Impact Report", href: "/ngo/impact", icon: "chart" },
          { label: "Notifications", href: "/notifications", icon: "bell" },
        ]}
      />

      {/* Main area — map + right panel */}
      <div style={{ marginLeft: "240px", flex: 1, display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* Left — Map (60%) */}
        <div style={{ flex: "0 0 60%", position: "relative", background: "#E8E4DE" }}>
          {loading ? (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spinner size={28} color="#E8450A" />
            </div>
          ) : (
            <MapView
              listings={listings}
              selectedId={selected?.id ?? null}
              onPinClickAction={(listing) => {
                setSelected(listing);
                setClaimError("");
              }}
            />
          )}

          {/* Live badge */}
          <div style={{
            position: "absolute", top: "14px", left: "14px", zIndex: 1000,
            background: "#1A1714", borderRadius: "999px",
            padding: "6px 14px",
            display: "flex", alignItems: "center", gap: "7px",
          }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#1D9E75",
              animation: "reserve-pulse 2s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "Syne, sans-serif", fontSize: "11px",
              fontWeight: 600, color: "#F0EDE8", letterSpacing: "0.05em",
            }}>
              {listings.length} ACTIVE
            </span>
          </div>
          <style>{`@keyframes reserve-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }`}</style>
        </div>

        {/* Right — Panel (40%) */}
        <div style={{
          flex: "0 0 40%", display: "flex",
          flexDirection: "column", background: "#fff",
          borderLeft: "1px solid #E0DDD8", overflow: "hidden",
        }}>

          {/* Panel header */}
          <div style={{
            padding: "20px 20px 14px", borderBottom: "1px solid #F0EDE8",
            flexShrink: 0,
          }}>
            <h1 style={{
              fontFamily: "Syne, sans-serif", fontSize: "18px",
              fontWeight: 700, color: "#1A1714", letterSpacing: "-0.3px",
            }}>
              {selected ? "Listing Details" : "Nearby Listings"}
            </h1>
            <p style={{ fontSize: "12px", color: "#AAA", marginTop: "3px", fontWeight: 300 }}>
              {selected
                ? "Review and claim this listing"
                : `${listings.length} active listing${listings.length !== 1 ? "s" : ""} near you`
              }
            </p>
          </div>

          {/* Claim error */}
          {claimError && (
            <div style={{
              margin: "12px 16px 0",
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: "10px", padding: "10px 14px",
              fontSize: "12px", color: "#DC2626",
            }}>
              {claimError}
            </div>
          )}

          {/* Panel body */}
          {selected ? (
            <ListingPanel
              listing={selected}
              onClaim={handleClaim}
              onClose={() => { setSelected(null); setClaimError(""); }}
              claiming={claiming}
            />
          ) : (
            <div style={{ flex: 1, overflow: "auto" }}>
              {listings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 24px" }}>
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ display: "block", margin: "0 auto 16px" }}>
                    <circle cx="40" cy="40" r="36" fill="#F0EDE8" />
                    <circle cx="40" cy="32" r="10" stroke="#CCC" strokeWidth="2" fill="none" />
                    <path d="M40 22C31.7 22 25 28.7 25 37c0 9.7 15 23 15 23s15-13.3 15-23c0-8.3-6.7-15-15-15z" stroke="#CCC" strokeWidth="2" fill="none" />
                  </svg>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: "16px", fontWeight: 700, color: "#1A1714", marginBottom: "6px" }}>
                    No active listings
                  </div>
                  <div style={{ fontSize: "13px", color: "#AAA", fontWeight: 300, lineHeight: 1.5 }}>
                    New listings will appear here and on the map in real time as donors post them.
                  </div>
                </div>
              ) : (
                listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => { setSelected(listing); setClaimError(""); }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "28px", right: "28px",
          background: "#fff", border: "none",
          borderLeft: "4px solid #1D9E75",
          borderRadius: "12px", padding: "13px 20px",
          fontSize: "13px", fontWeight: 500, color: "#1A1714",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          zIndex: 9999, fontFamily: "DM Sans, sans-serif",
          animation: "slideUp 0.25s ease",
        }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}