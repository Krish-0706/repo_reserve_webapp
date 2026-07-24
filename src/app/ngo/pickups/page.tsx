"use client";
// src/app/(ngo)/pickups/page.tsx
//
// Active Pickups — shows all pickups claimed by this NGO
// Status: claimed → assigned → in_progress → completed
// NGO can assign a volunteer from this page

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/shared/Sidebar";
import { PageLoader, Spinner } from "@/components/shared/Loader";

type PickupStatus = "claimed" | "assigned" | "in_progress" | "completed" | "cancelled";

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
        vol_name: string;
        hours_logged: number;
        rating: number;
        users: { email: string };
    } | null;
};

type AvailableVolunteer = {
    id: string;
    vol_name: string;
    hours_logged: number;
    rating: number;
    tasks_completed: number;
    users: { email: string };
};


function statusColor(s: PickupStatus) {
    const map: Record<PickupStatus, { bg: string; fg: string }> = {
        claimed: { bg: "rgba(24,95,165,0.1)", fg: "#185FA5" },
        assigned: { bg: "rgba(186,117,23,0.1)", fg: "#BA7517" },
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

    // Volunteer assignment state
    const [volunteers, setVolunteers] = useState<AvailableVolunteer[]>([]);
    const [volunteersLoaded, setVolunteersLoaded] = useState(false);
    const [assigningPickupId, setAssigningPickupId] = useState<string | null>(null); // which pickup has the selector open
    const [assignLoading, setAssignLoading] = useState(false);

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

    // Fetch available volunteers when needed
    const loadVolunteers = async () => {
        if (volunteersLoaded) return;
        try {
            const res = await fetch("/api/volunteers/available");
            const json = await res.json();
            if (!json.error) {
                setVolunteers(json.data ?? []);
            }
            setVolunteersLoaded(true);
        } catch {
            console.error("Failed to load volunteers");
        }
    };

    // Open volunteer selector for a pickup
    const openAssignSelector = async (pickupId: string) => {
        if (assigningPickupId === pickupId) {
            setAssigningPickupId(null);
            return;
        }
        setAssigningPickupId(pickupId);
        await loadVolunteers();
    };

    // Assign a volunteer
    const handleAssign = async (pickupId: string, volunteerId: string) => {
        setAssignLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/pickups/${pickupId}/assign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ volunteer_id: volunteerId }),
            });
            const json = await res.json();
            if (json.error) {
                setError(json.error);
            } else {
                // Update the pickup in state
                const assignedVol = volunteers.find((v) => v.id === volunteerId);
                setPickups((prev) => prev.map((p) =>
                    p.id === pickupId
                        ? {
                            ...p,
                            status: "assigned" as PickupStatus,
                            volunteer_id: volunteerId,
                            volunteers: assignedVol ? {
                                id: assignedVol.id,
                                vol_name: assignedVol.vol_name,
                                hours_logged: assignedVol.hours_logged,
                                rating: assignedVol.rating,
                                users: assignedVol.users,
                            } : null,
                        }
                        : p
                ));
                setAssigningPickupId(null);
            }
        } catch {
            setError("Failed to assign volunteer.");
        }
        setAssignLoading(false);
    };

    const active = pickups.filter((p) => ["claimed", "assigned", "in_progress"].includes(p.status));
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
                    <div style={{
                        background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px",
                        padding: "14px 18px", fontSize: "13px", color: "#DC2626", marginBottom: "24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{
                            background: "none", border: "none", color: "#DC2626",
                            cursor: "pointer", fontSize: "16px", lineHeight: 1,
                        }}>×</button>
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
                                <PickupCard
                                    key={pickup.id}
                                    pickup={pickup}
                                    isAssigning={assigningPickupId === pickup.id}
                                    assignLoading={assignLoading}
                                    volunteers={volunteers}
                                    onToggleAssign={() => openAssignSelector(pickup.id)}
                                    onAssign={(volId) => handleAssign(pickup.id, volId)}
                                />
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
                                <PickupCard
                                    key={pickup.id}
                                    pickup={pickup}
                                    isAssigning={false}
                                    assignLoading={false}
                                    volunteers={[]}
                                    onToggleAssign={() => {}}
                                    onAssign={() => {}}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function PickupCard({
    pickup,
    isAssigning,
    assignLoading,
    volunteers,
    onToggleAssign,
    onAssign,
}: {
    pickup: Pickup;
    isAssigning: boolean;
    assignLoading: boolean;
    volunteers: AvailableVolunteer[];
    onToggleAssign: () => void;
    onAssign: (volunteerId: string) => void;
}) {
    const sc = statusColor(pickup.status);
    const l = pickup.listings;
    if (!l) return null;

    const canAssign = pickup.status === "claimed" && !pickup.volunteer_id;

    return (
        <div style={{
            background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.04)",
        }}>
            <div style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: "18px", alignItems: "center" }}>
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
                                · Volunteer: {pickup.volunteers.vol_name || pickup.volunteers.users?.email?.split("@")[0] || "Assigned"}
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

            {/* Assign Volunteer button — only for claimed pickups without a volunteer */}
            {canAssign && (
                <div style={{ marginTop: "14px", borderTop: "1px solid #F0EDE8", paddingTop: "14px" }}>
                    <button
                        onClick={onToggleAssign}
                        style={{
                            height: "36px", padding: "0 18px", borderRadius: "10px",
                            background: isAssigning ? "#F0EDE8" : "#fff",
                            color: "#1A1714",
                            fontFamily: "Syne, sans-serif", fontSize: "12px", fontWeight: 700,
                            border: "1.5px solid #E0DDD8", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "6px",
                            transition: "all 0.15s",
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" />
                        </svg>
                        {isAssigning ? "Cancel" : "Assign Volunteer"}
                    </button>

                    {/* Volunteer selector dropdown */}
                    {isAssigning && (
                        <div style={{
                            marginTop: "12px", background: "#FAFAF8", border: "1.5px solid #E0DDD8",
                            borderRadius: "14px", padding: "14px", maxHeight: "240px", overflowY: "auto",
                        }}>
                            {volunteers.length === 0 ? (
                                <div style={{ fontSize: "13px", color: "#AAA", textAlign: "center", padding: "12px 0" }}>
                                    No volunteers available
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {volunteers.map((vol) => (
                                        <button
                                            key={vol.id}
                                            onClick={() => onAssign(vol.id)}
                                            disabled={assignLoading}
                                            style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                padding: "10px 14px", borderRadius: "10px",
                                                background: "#fff", border: "1px solid #E0DDD8",
                                                cursor: assignLoading ? "wait" : "pointer",
                                                transition: "all 0.15s",
                                                width: "100%", textAlign: "left",
                                            }}
                                        >
                                            <div>
                                                <div style={{
                                                    fontFamily: "Syne, sans-serif", fontSize: "13px",
                                                    fontWeight: 700, color: "#1A1714",
                                                }}>
                                                    {vol.vol_name || vol.users?.email?.split("@")[0] || "Volunteer"}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                                                    {vol.tasks_completed} tasks · {Number(vol.rating).toFixed(1)} rating · {Number(vol.hours_logged).toFixed(0)}h logged
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: "11px", fontWeight: 700, fontFamily: "Syne, sans-serif",
                                                color: "#E8450A", display: "flex", alignItems: "center", gap: "4px",
                                            }}>
                                                {assignLoading ? <Spinner /> : "Assign"}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Show assigned volunteer info for assigned/in_progress pickups */}
            {(pickup.status === "assigned" || pickup.status === "in_progress") && pickup.volunteers && (
                <div style={{
                    marginTop: "14px", borderTop: "1px solid #F0EDE8", paddingTop: "14px",
                    display: "flex", alignItems: "center", gap: "10px",
                }}>
                    <div style={{
                        width: "28px", height: "28px", borderRadius: "8px",
                        background: "rgba(29,158,117,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div>
                        <span style={{ fontSize: "12px", color: "#1A1714", fontWeight: 500 }}>
                            {pickup.volunteers.vol_name || pickup.volunteers.users?.email?.split("@")[0] || "Volunteer"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#AAA", marginLeft: "8px" }}>
                            {pickup.status === "assigned" ? "Awaiting acceptance" : "En route"}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}