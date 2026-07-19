"use client";
// src/app/(donor)/listings/[id]/page.tsx
//
// Reverted to original single-column design, with:
//  - food_name added to title + info grid
//  - shared Sidebar component
//  - Spinner / PageLoader for loading states

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner, PageLoader } from "@/components/shared/Loader";

type ListingStatus = "active" | "claimed" | "completed" | "expired";

type Listing = {
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
  status: ListingStatus;
  created_at: string;
  pickups?: {
    id: string; status: string; claimed_at: string; completed_at: string | null;
    ngos: { org_name: string } | null;
  }[];
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
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

const TIMELINE_STEPS = ["Posted", "Claimed", "Completed"] as const;

function timelineIndex(status: ListingStatus): number {
  if (status === "active") return 0;
  if (status === "claimed") return 1;
  if (status === "completed") return 2;
  return 0;
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const countdown = useCountdown(listing?.pickup_end ?? new Date().toISOString());

  const fetchListing = useCallback(async () => {
    const res = await fetch(`/api/listings/${id}`);
    const json = await res.json();
    if (json.error) setError(json.error);
    else setListing(json.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  const handleDelete = async () => {
    if (!confirm("Expire this listing? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to expire listing."); setDeleting(false); return; }
    setDeleted(true);
    setTimeout(() => router.push("/donor/dashboard"), 1500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F0EDE8", fontFamily: "DM Sans, sans-serif", display: "flex" }}>

      {navigating && <PageLoader label="Back to dashboard..." />}
      {loading && <PageLoader label="Loading listing..." />}

      <Sidebar
        role="Donor"
        items={[
          { label: "Dashboard", href: "/donor/dashboard", icon: "grid" },
          { label: "Post Listing", href: "/donor/listings/create", icon: "plus" },
          { label: "Impact", href: "/donor/impact", icon: "chart" },
          { label: "Notifications", href: "/notifications", icon: "bell" },
        ]}
      />

      <main style={{ marginLeft: "240px", flex: 1, padding: "44px 52px 60px" }}>

        {/* Back link */}
        <button
          onClick={() => { setNavigating(true); router.push("/donor/dashboard"); }}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "13px", color: "#888", fontFamily: "DM Sans, sans-serif",
            marginBottom: "24px", padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          Back to dashboard
        </button>

        {/* Error */}
        {!loading && error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "14px 16px", fontSize: "13px", color: "#DC2626" }}>
            {error}
          </div>
        )}

        {/* Deleted confirmation */}
        {deleted && (
          <div style={{ background: "#E6F7F2", border: "1px solid #1D9E75", borderRadius: "10px", padding: "14px 16px", fontSize: "13px", color: "#1D9E75" }}>
            Listing expired. Redirecting to dashboard...
          </div>
        )}

        {/* Detail card – two-column grid */}
        {!loading && listing && !deleted && (
          <div style={{
            maxWidth: "1040px",
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            gap: "32px",
          }}>

            {/* ── Left column ── */}
            <div>
              {/* Photo */}
              {listing.photo_url ? (
                <div style={{
                  width: "100%", height: "300px", borderRadius: "16px", overflow: "hidden",
                  marginBottom: "20px", border: "1.5px solid #E0DDD8",
                  boxShadow: "4px 4px 10px rgba(0,0,0,0.05)", position: "relative",
                }}>
                  <Image src={listing.photo_url} alt={listing.food_name} fill style={{ objectFit: "cover" }} unoptimized />
                </div>
              ) : (
                <div style={{
                  width: "100%", height: "200px", borderRadius: "16px",
                  background: "#F0EDE8", border: "1.5px dashed #E0DDD8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "20px",
                }}>
                  <span style={{ fontSize: "13px", color: "#AAA" }}>No photo uploaded</span>
                </div>
              )}

              {/* Title + badge (stacked) */}
              <div style={{ marginBottom: "20px" }}>
                <h1 style={{
                  fontFamily: "Syne, sans-serif", fontSize: "24px", fontWeight: 700,
                  color: "#1A1714", letterSpacing: "-0.3px", marginBottom: "4px",
                }}>
                  {listing.food_name || listing.food_type}
                </h1>
                <p style={{ fontSize: "14px", color: "#888", fontWeight: 300, marginBottom: "10px" }}>
                  {listing.food_type} · {listing.quantity_kg} kg · {listing.address}
                </p>
                {/* Status badge – below title */}
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
                }}>
                  {listing.status}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  href={`https://maps.google.com/?q=${listing.lat},${listing.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    height: "44px", padding: "0 20px", borderRadius: "10px",
                    border: "1.5px solid #E0DDD8", background: "#F8F6F3",
                    color: "#555", fontSize: "13px", fontWeight: 500,
                    textDecoration: "none", fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
                  View on Map
                </a>

                {listing.status === "active" && (
                  <button
                    onClick={handleDelete} disabled={deleting}
                    style={{
                      height: "44px", padding: "0 20px", borderRadius: "10px",
                      border: "1.5px solid #E24B4A", background: "transparent",
                      color: "#E24B4A", fontSize: "13px", fontWeight: 500,
                      cursor: deleting ? "not-allowed" : "pointer",
                      fontFamily: "DM Sans, sans-serif", opacity: deleting ? 0.6 : 1,
                      display: "flex", alignItems: "center", gap: "8px",
                    }}
                  >
                    {deleting && <Spinner size={14} color="#E24B4A" />}
                    {deleting ? "Expiring..." : "Expire listing"}
                  </button>
                )}
              </div>
            </div>

            {/* ── Right column ── */}
            <div>
              {/* Info grid */}
              <div style={{
                background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "14px",
                overflow: "hidden", marginBottom: "20px",
                boxShadow: "3px 3px 8px rgba(0,0,0,0.04)",
              }}>
                {[
                  { label: "Food item", value: listing.food_name || "—" },
                  { label: "Food category", value: listing.food_type },
                  {
                    label: "Pickup window",
                    value: `${formatDateTime(listing.pickup_start)} \u2192 ${formatDateTime(listing.pickup_end)}`,
                  },
                  {
                    label: "Time remaining",
                    value: listing.status === "active" ? countdown : "—",
                    highlight: listing.status === "active",
                  },
                  { label: "Posted", value: formatDateTime(listing.created_at) },
                  ...(listing.pickups && listing.pickups.length > 0 ? [{
                    label: "Claimed by",
                    value: listing.pickups[0].ngos?.org_name ?? "Unknown NGO",
                    highlight: true,
                  }] : []),
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px",
                      borderBottom: i < arr.length - 1 ? "1px solid #F0EDE8" : "none",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#888", fontWeight: 400 }}>{row.label}</span>
                    <span style={{
                      fontSize: "13px", fontWeight: 500,
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
                background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "14px",
                padding: "20px 24px",
                boxShadow: "3px 3px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  fontFamily: "Syne, sans-serif", fontSize: "11px", fontWeight: 600,
                  color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px",
                }}>
                  Status Timeline
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {TIMELINE_STEPS.map((step, i) => {
                    const current = timelineIndex(listing.status);
                    const done = i <= current;
                    const active = i === current;
                    return (
                      <div key={step} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                          <div style={{
                            width: "16px", height: "16px", borderRadius: "50%",
                            background: done ? "#E8450A" : "#E0DDD8",
                            border: `2px solid ${done ? "#E8450A" : "#E0DDD8"}`,
                            boxShadow: active ? "0 0 0 4px rgba(232,69,10,0.12)" : "none",
                            transition: "all 0.2s", flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: "10px", fontWeight: done ? 600 : 400,
                            color: done ? "#E8450A" : "#AAA",
                            fontFamily: "Syne, sans-serif",
                            textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
                          }}>
                            {step}
                          </span>
                        </div>
                        {i < 2 && (
                          <div style={{
                            flex: 1, height: "2px",
                            background: i < current ? "#E8450A" : "#E0DDD8",
                            margin: "0 4px", marginBottom: "22px",
                            transition: "background 0.2s",
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}