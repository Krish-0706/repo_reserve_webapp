"use client";
// src/app/(ngo)/pickups/page.tsx
//
// Active Pickups — shows all pickups claimed by this NGO
// Status: claimed → in_progress → completed
// NGO can assign a volunteer from this page

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/shared/Sidebar";
import { PageLoader } from "@/components/shared/Loader";

type PickupStatus = "claimed" | "in_progress" | "completed" | "cancelled";

type Pickup = {
    id: string;
    status: PickupStatus;
    claimed_at: string;
    completed_at: string | null;
    listing_id: string;
    volunteer_id: string | null;
    listings: {
        id: string;
        food_name: string;
        food_type: string;
        quantity_kg: number;
        photo_url: string | null;
        address: string;
        pickup_start: string;
        pickup_end: string;
    };
    volunteers: {
        id: string;
        hours_logged: number;
        rating: number;
        users: { email: string };
    } | null;
};



function statusColor(s: PickupStatus) {
    const map: Record<PickupStatus, { bg: string; fg: string }> = {
        claimed: { bg: "rgba(24,95,165,0.1)", fg: "#185FA5" },
        in_progress: { bg: "rgba(186,117,23,0.1)", fg: "#BA7517" },
        completed: { bg: "rgba(29,158,117,0.12)", fg: "#1D9E75" },
        cancelled: { bg: "rgba(136,136,128,0.12)", fg: "#888880" },
    };
    return map[s];
}

// ─── Empty state illustration ─────────────────────────────────────────────────
function EmptyPickups() {
    return (
        <svg width="130" height="100" viewBox="0 0 130 100" fill="none">
            <rect x="15" y="20" width="100" height="64" rx="10" fill="#fff" stroke="#E0DDD8" strokeWidth="1.5" />
            <rect x="28" y="36" width="36" height="5" rx="2.5" fill="#E0DDD8" />
            <rect x="28" y="48" width="56" height="5" rx="2.5" fill="#F0EDE8" />
            <rect x="28" y="60" width="44" height="5" rx="2.5" fill="#F0EDE8" />
            <circle cx="100" cy="28" r="14" fill="#FEF0EA" stroke="#E8450A" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M100 23v8M96 27h8" stroke="#E8450A" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function NGOPickupsPage() {
    const router = useRouter();

    const [pickups, setPickups] = useState<Pickup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [navigating, setNavigating] = useState(false);

    const nav = (path: string) => { setNavigating(true); router.push(path); };

    useEffect(() => {
        fetch("/api/pickups/ngo")
            .then((r) => r.json())
            .then((json) => {
                if (json.error) setError(json.error);
                else setPickups(json.data ?? []);
                setLoading(false);
            })
            .catch(() => { setError("Failed to load pickups."); setLoading(false); });
    }, []);

    const active = pickups.filter((p) => ["claimed", "in_progress"].includes(p.status));
    const completed = pickups.filter((p) => p.status === "completed");

    return (
        <div style={{ minHeight: "100vh", background: "#F0EDE8", fontFamily: "DM Sans, sans-serif", display: "flex" }}>

            {navigating && <PageLoader label="Loading..." />}
            {loading && <PageLoader label="Loading pickups..." />}

            <Sidebar
                role="NGO"
                items={[
                    { label: "Live Map", href: "/ngo/map", icon: "map" },
                    { label: "Active Pickups", href: "/ngo/pickups", icon: "truck", badge: active.length },
                    { label: "Impact Report", href: "/ngo/impact", icon: "chart" },
                    { label: "Notifications", href: "/notifications", icon: "bell" },
                ]}
            />

            <main style={{ marginLeft: "240px", flex: 1, padding: "44px 52px 60px" }}>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
                    <div>
                        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "32px", fontWeight: 800, color: "#1A1714", letterSpacing: "-0.5px" }}>
                            Active Pickups
                        </h1>
                        <p style={{ fontSize: "14px", color: "#888", marginTop: "6px", fontWeight: 300 }}>
                            Track and manage your claimed food listings
                        </p>
                    </div>
                    <button
                        onClick={() => nav("/ngo/map")}
                        style={{
                            height: "46px", padding: "0 22px", borderRadius: "999px",
                            background: "#E8450A", color: "#fff",
                            fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700,
                            border: "2px solid #1A1714", boxShadow: "3px 3px 0px #1A1714",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
                        Find More Listings
                    </button>
                </div>

                {error && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", padding: "14px 18px", fontSize: "13px", color: "#DC2626", marginBottom: "24px" }}>
                        {error}
                    </div>
                )}

                {!loading && pickups.length === 0 && (
                    <div style={{ background: "#fff", border: "2px dashed #E0DDD8", borderRadius: "22px", padding: "64px 32px", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
                            <EmptyPickups />
                        </div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: "20px", fontWeight: 700, color: "#1A1714", marginBottom: "8px" }}>
                            No pickups yet
                        </div>
                        <div style={{ fontSize: "14px", color: "#AAA", marginBottom: "26px", fontWeight: 300 }}>
                            Claim a listing from the live map to get started.
                        </div>
                        <button
                            onClick={() => nav("/ngo/map")}
                            style={{
                                height: "48px", padding: "0 32px", borderRadius: "12px",
                                background: "#E8450A", color: "#fff",
                                fontFamily: "Syne, sans-serif", fontSize: "14px", fontWeight: 700,
                                border: "2px solid #1A1714", boxShadow: "3px 3px 0px #1A1714", cursor: "pointer",
                            }}
                        >
                            Go to Live Map →
                        </button>
                    </div>
                )}

                {!loading && active.length > 0 && (
                    <>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#1A1714", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "16px" }}>
                            In Progress — {active.length}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px" }}>
                            {active.map((pickup) => (
                                <PickupCard key={pickup.id} pickup={pickup} />
                            ))}
                        </div>
                    </>
                )}

                {!loading && completed.length > 0 && (
                    <>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#1A1714", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "16px" }}>
                            Completed — {completed.length}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {completed.map((pickup) => (
                                <PickupCard key={pickup.id} pickup={pickup} />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function PickupCard({ pickup }: { pickup: Pickup }) {
    const sc = statusColor(pickup.status);
    const l = pickup.listings;
    if (!l) return null;

    return (
        <div style={{
            background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "16px",
            padding: "20px 24px", display: "grid",
            gridTemplateColumns: "56px 1fr auto", gap: "18px", alignItems: "center",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.04)",
        }}>
            <div style={{
                width: "56px", height: "56px", borderRadius: "12px",
                overflow: "hidden", background: "#F0EDE8", flexShrink: 0, position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {l.photo_url
                    ? <Image src={l.photo_url} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                }
            </div>

            <div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: "15px", fontWeight: 700, color: "#1A1714", marginBottom: "3px" }}>
                    {l.food_name || l.food_type}
                </div>
                <div style={{ fontSize: "12px", color: "#888", fontWeight: 300 }}>
                    {l.food_type} · {l.quantity_kg} kg · {l.address.split(",")[0]}
                </div>
                <div style={{ fontSize: "11px", color: "#AAA", marginTop: "4px" }}>
                    Claimed {new Date(pickup.claimed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {pickup.volunteers && (
                        <span style={{ marginLeft: "10px", color: "#1D9E75" }}>
                            · Volunteer: {pickup.volunteers.users?.email?.split("@")[0] ?? "Assigned"}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                <span style={{
                    background: sc.bg, color: sc.fg,
                    fontSize: "10px", fontWeight: 700,
                    fontFamily: "Syne, sans-serif",
                    letterSpacing: "0.07em", textTransform: "uppercase",
                    padding: "4px 10px", borderRadius: "999px",
                }}>
                    {pickup.status.replace("_", " ")}
                </span>
                {pickup.status === "completed" && pickup.completed_at && (
                    <span style={{ fontSize: "11px", color: "#AAA" }}>
                        {new Date(pickup.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                )}
            </div>
        </div>
    );
}