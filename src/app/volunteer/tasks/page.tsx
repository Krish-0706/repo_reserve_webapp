"use client";
// src/app/volunteer/tasks/page.tsx
//
// M3 — Volunteer Task Feed
// Shows assigned + in-progress tasks with accept/decline actions.
// Stat cards at top: Tasks Completed, Hours Logged, Rating.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/shared/Sidebar";
import { PageLoader, Spinner } from "@/components/shared/Loader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
// ─── Types ────────────────────────────────────────────────────────────────────
type TaskStatus = "assigned" | "in_progress";

type Task = {
    id: string;
    status: TaskStatus;
    claimed_at: string;
    completed_at: string | null;
    listing_id: string;
    ngo_id: string;
    volunteer_id: string;
    listings: {
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
    };
    ngos: {
        id: string;
        org_name: string;
        contact_phone: string;
    };
};

type VolunteerStats = {
    hours_logged: number;
    rating: number;
    tasks_completed: number;
};

// ─── Status badge colours ─────────────────────────────────────────────────────
function statusColor(s: TaskStatus) {
    const map: Record<TaskStatus, { bg: string; fg: string }> = {
        assigned: { bg: "rgba(186,117,23,0.1)", fg: "#BA7517" },
        in_progress: { bg: "rgba(24,95,165,0.1)", fg: "#185FA5" },
    };
    return map[s];
}

// ─── Time window formatter ────────────────────────────────────────────────────
function formatWindow(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    return `${s.toLocaleDateString("en-IN", dateOpts)} · ${s.toLocaleTimeString("en-IN", timeOpts)} – ${e.toLocaleTimeString("en-IN", timeOpts)}`;
}

// ─── Empty state SVG ──────────────────────────────────────────────────────────
function EmptyTasks() {
    return (
        <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
            <rect x="20" y="18" width="100" height="70" rx="14" fill="#fff" stroke="#E5E7EB" strokeWidth="1.5" />
            <rect x="36" y="34" width="40" height="5" rx="2.5" fill="#E5E7EB" />
            <rect x="36" y="46" width="60" height="5" rx="2.5" fill="#FAFAFA" />
            <rect x="36" y="58" width="48" height="5" rx="2.5" fill="#FAFAFA" />
            <circle cx="108" cy="26" r="16" fill="#FFF4ED" stroke="#E8450A" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M108 20v10M103 25h10" stroke="#E8450A" strokeWidth="2" strokeLinecap="round" />
            <rect x="30" y="70" width="24" height="8" rx="4" fill="#FAFAFA" />
            <rect x="60" y="70" width="24" height="8" rx="4" fill="#FAFAFA" />
        </svg>
    );
}

// ─── Stat card icon SVGs ──────────────────────────────────────────────────────
function TasksIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
    );
}
function ClockIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
function StarIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function VolunteerTasksPage() {
    const router = useRouter();
    const unread = useUnreadCount();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState<VolunteerStats>({ hours_logged: 0, rating: 0, tasks_completed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [navigating, setNavigating] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // pickup_id currently in action

    const nav = (path: string) => { setNavigating(true); router.push(path); };

    // Fetch tasks
    useEffect(() => {
        fetch("/api/volunteers/tasks")
            .then((r) => r.json())
            .then((json) => {
                if (json.error) setError(json.error);
                else {
                    setTasks(json.data ?? []);
                    setStats(json.stats ?? { hours_logged: 0, rating: 0, tasks_completed: 0 });
                }
                setLoading(false);
            })
            .catch(() => { setError("Failed to load tasks."); setLoading(false); });
    }, []);

    // ─── Accept / Decline handlers ───────────────────────────────────────────
    const handleAccept = async (pickupId: string) => {
        setActionLoading(pickupId);
        try {
            const res = await fetch(`/api/volunteers/tasks/${pickupId}/accept`, { method: "PATCH" });
            const json = await res.json();
            if (json.error) { setError(json.error); }
            else {
                setTasks((prev) => prev.map((t) => t.id === pickupId ? { ...t, status: "in_progress" as TaskStatus } : t));
            }
        } catch { setError("Failed to accept task."); }
        setActionLoading(null);
    };

    const handleDecline = async (pickupId: string) => {
        if (!confirm("Are you sure you want to decline this task? It will be returned to the NGO for reassignment.")) return;
        setActionLoading(pickupId);
        try {
            const res = await fetch(`/api/volunteers/tasks/${pickupId}/decline`, { method: "PATCH" });
            const json = await res.json();
            if (json.error) { setError(json.error); }
            else {
                setTasks((prev) => prev.filter((t) => t.id !== pickupId));
            }
        } catch { setError("Failed to decline task."); }
        setActionLoading(null);
    };

    // ─── Split tasks ─────────────────────────────────────────────────────────
    const pending = tasks.filter((t) => t.status === "assigned");
    const inProgress = tasks.filter((t) => t.status === "in_progress");

    return (
        <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "Geist, sans-serif", display: "flex" }}>
            {navigating && <PageLoader label="Loading..." />}
            {loading && <PageLoader label="Loading tasks..." />}

            <Sidebar
                role="Volunteer"
                items={[
                    { label: "Task Feed", href: "/volunteer/tasks", icon: "list" },
                    { label: "My Stats", href: "/volunteer/stats", icon: "star" },
                    { label: "Notifications", href: "/notifications", icon: "bell", badge: unread },
                ]}
            />

            <main style={{ marginLeft: "220px", flex: 1, padding: "40px" }}>
                {/* ─── Header ─────────────────────────────────────────────── */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "36px" }}>
                    <div>
                        <h1 style={{ fontFamily: "Geist, sans-serif", fontSize: "32px", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
                            Task Feed
                        </h1>
                        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px", fontWeight: 400 }}>
                            View and manage your assigned pickup tasks
                        </p>
                    </div>
                    <div style={{
                        background: "rgba(186,117,23,0.1)", color: "#BA7517",
                        fontSize: "11px", fontWeight: 700, fontFamily: "Geist, sans-serif",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        padding: "8px 18px", borderRadius: "999px",
                    }}>
                        VOLUNTEER
                    </div>
                </div>

                {/* ─── Stat cards ─────────────────────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px", marginBottom: "36px" }}>
                    {/* Tasks completed */}
                    <div style={{
                        background: "#fff", borderRadius: "12px", padding: "22px 26px",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(232,69,10,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <TasksIcon />
                            </div>
                            <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>Tasks Completed</span>
                        </div>
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "34px", fontWeight: 700, color: "#E8450A", letterSpacing: "-0.03em" }}>
                            {stats.tasks_completed}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>All time</div>
                    </div>
                    {/* Hours logged */}
                    <div style={{
                        background: "#fff", borderRadius: "12px", padding: "22px 26px",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(29,158,117,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ClockIcon />
                            </div>
                            <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>Hours Logged</span>
                        </div>
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "34px", fontWeight: 700, color: "#10B981", letterSpacing: "-0.03em" }}>
                            {Number(stats.hours_logged).toFixed(1)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>Total volunteer hours</div>
                    </div>
                    {/* Rating */}
                    <div style={{
                        background: "#fff", borderRadius: "12px", padding: "22px 26px",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(186,117,23,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <StarIcon />
                            </div>
                            <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>Rating</span>
                        </div>
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "34px", fontWeight: 700, color: "#BA7517", letterSpacing: "-0.03em" }}>
                            {Number(stats.rating) > 0 ? Number(stats.rating).toFixed(1) : "—"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                            {Number(stats.rating) > 0 ? "Out of 5.0" : "Complete tasks to earn"}
                        </div>
                    </div>
                </div>

                {/* ─── Error banner ───────────────────────────────────────── */}
                {error && (
                    <div style={{
                        background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px",
                        padding: "14px 18px", fontSize: "13px", color: "#EF4444", marginBottom: "24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{
                            background: "none", border: "none", color: "#EF4444",
                            cursor: "pointer", fontSize: "16px", lineHeight: 1,
                        }}>×</button>
                    </div>
                )}

                {/* ─── Empty state ────────────────────────────────────────── */}
                {!loading && tasks.length === 0 && (
                    <div style={{
                        background: "#fff", border: "1px dashed #E5E7EB", borderRadius: "16px",
                        padding: "64px 32px", textAlign: "center",
                    }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
                            <EmptyTasks />
                        </div>
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "20px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>
                            No tasks assigned yet
                        </div>
                        <div style={{ fontSize: "14px", color: "#9CA3AF", fontWeight: 400, maxWidth: "360px", margin: "0 auto" }}>
                            When an NGO assigns you a pickup task, it will appear here. Check back soon.
                        </div>
                    </div>
                )}

                {/* ─── Pending Acceptance ─────────────────────────────────── */}
                {!loading && pending.length > 0 && (
                    <>
                        <div style={{
                            fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 700,
                            color: "#111111", textTransform: "uppercase", letterSpacing: "0.04em",
                            marginBottom: "16px",
                        }}>
                            Pending Acceptance — {pending.length}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px" }}>
                            {pending.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onAccept={() => handleAccept(task.id)}
                                    onDecline={() => handleDecline(task.id)}
                                    onView={() => nav(`/volunteer/tasks/${task.id}`)}
                                    isLoading={actionLoading === task.id}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* ─── In Progress ────────────────────────────────────────── */}
                {!loading && inProgress.length > 0 && (
                    <>
                        <div style={{
                            fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 700,
                            color: "#111111", textTransform: "uppercase", letterSpacing: "0.04em",
                            marginBottom: "16px",
                        }}>
                            In Progress — {inProgress.length}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {inProgress.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onView={() => nav(`/volunteer/tasks/${task.id}`)}
                                    isLoading={actionLoading === task.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Task Card Component
// ═══════════════════════════════════════════════════════════════════════════════
function TaskCard({
    task,
    onAccept,
    onDecline,
    onView,
    isLoading,
}: {
    task: Task;
    onAccept?: () => void;
    onDecline?: () => void;
    onView: () => void;
    isLoading: boolean;
}) {
    const sc = statusColor(task.status);
    const l = task.listings;
    const n = task.ngos;
    if (!l) return null;

    return (
        <div style={{
            background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
            padding: "22px 26px",
            boxShadow: "3px 3px 10px rgba(0,0,0,0.03)",
            transition: "box-shadow 0.2s",
        }}>
            <div style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: "18px", alignItems: "start" }}>
                {/* Thumbnail */}
                <div
                    onClick={onView}
                    style={{
                        width: "56px", height: "56px", borderRadius: "12px",
                        overflow: "hidden", background: "#FAFAFA", flexShrink: 0,
                        position: "relative", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    {l.photo_url
                        ? <Image src={l.photo_url} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    }
                </div>

                {/* Details */}
                <div style={{ minWidth: 0 }}>
                    <div
                        onClick={onView}
                        style={{
                            fontFamily: "Geist, sans-serif", fontSize: "15px", fontWeight: 700,
                            color: "#111111", marginBottom: "3px", cursor: "pointer",
                        }}
                    >
                        {l.food_name || l.food_type}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: 400 }}>
                        {l.food_type} · {l.quantity_kg} kg · {l.address.split(",")[0]}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                        {formatWindow(l.pickup_start, l.pickup_end)}
                    </div>
                    {n && (
                        <div style={{ fontSize: "11px", color: "#10B981", marginTop: "3px", fontWeight: 500 }}>
                            {n.org_name}
                        </div>
                    )}
                </div>

                {/* Status badge */}
                <span style={{
                    background: sc.bg, color: sc.fg,
                    fontSize: "10px", fontWeight: 700,
                    fontFamily: "Geist, sans-serif",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    padding: "4px 10px", borderRadius: "999px",
                    whiteSpace: "nowrap",
                }}>
                    {task.status.replace("_", " ")}
                </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "flex-end" }}>
                {/* View Details — always shown */}
                <button
                    onClick={onView}
                    style={{
                        height: "38px", padding: "0 20px", borderRadius: "10px",
                        background: "#FAFAFA", color: "#111111",
                        fontFamily: "Geist, sans-serif", fontSize: "12px", fontWeight: 700,
                        border: "1px solid #E5E7EB", cursor: "pointer",
                        transition: "all 0.15s",
                    }}
                >
                    View Details
                </button>

                {/* Accept — only for assigned tasks */}
                {task.status === "assigned" && onAccept && (
                    <button
                        onClick={onAccept}
                        disabled={isLoading}
                        style={{
                            height: "38px", padding: "0 22px", borderRadius: "10px",
                            background: "#10B981", color: "#fff",
                            fontFamily: "Geist, sans-serif", fontSize: "12px", fontWeight: 700,
                            border: "2px solid #111111", boxShadow: "3px 3px 0px #111111",
                            cursor: isLoading ? "wait" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                            display: "flex", alignItems: "center", gap: "6px",
                            transition: "all 0.15s",
                        }}
                    >
                        {isLoading ? <Spinner /> : null}
                        Accept
                    </button>
                )}

                {/* Decline — only for assigned tasks */}
                {task.status === "assigned" && onDecline && (
                    <button
                        onClick={onDecline}
                        disabled={isLoading}
                        style={{
                            height: "38px", padding: "0 20px", borderRadius: "10px",
                            background: "#fff", color: "#EF4444",
                            fontFamily: "Geist, sans-serif", fontSize: "12px", fontWeight: 700,
                            border: "1.5px solid #FECACA", cursor: isLoading ? "wait" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                            transition: "all 0.15s",
                        }}
                    >
                        Decline
                    </button>
                )}
            </div>
        </div>
    );
}