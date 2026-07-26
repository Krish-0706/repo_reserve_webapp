"use client";
// src/app/notifications/page.tsx
//
// Shared across all roles. Fetches the current user's role to build the
// FULL sidebar nav (via navConfig)
// mark-all-as-read, and a real empty-state illustration.

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/shared/Sidebar";
import { PageLoader, Spinner } from "@/components/shared/Loader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { getNavItems } from "@/lib/navConfig";

type Notification = {
    id: string;
    type: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
};

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function isToday(iso: string): boolean {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

// ─── Per-type icon — gives each notification a distinct visual identity ───
function TypeIcon({ type }: { type: string }) {
    const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    switch (type) {
        case "listing_claimed":
            return <svg {...common}><path d="M20 6L9 17l-5-5" /></svg>; // check
        case "task_assigned":
            return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12h8M12 8v8" /></svg>; // plus
        case "task_accepted":
            return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>; // check-circle
        case "task_declined":
            return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>; // x-circle
        case "task_completed":
            return <svg {...common}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>; // arrow
        case "listing_expiring":
        case "pickup_reminder":
            return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>; // clock
        default:
            return <svg {...common}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /></svg>; // bell
    }
}

function typeColor(type: string): string {
    if (type === "task_declined") return "#E24B4A";
    if (type === "listing_expiring" || type === "pickup_reminder") return "#BA7517";
    if (type === "task_completed" || type === "task_accepted" || type === "listing_claimed") return "#1D9E75";
    return "#E8450A";
}

// ─── Empty state — custom SVG, matching app convention (no emojis) ────────
function EmptyState() {
    return (
        <div style={{ textAlign: "center", padding: "80px 24px", animation: "fadeIn 0.3s ease" }}>
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none" style={{ display: "block", margin: "0 auto 18px" }}>
                <circle cx="40" cy="40" r="36" fill="#F0EDE8" />
                <path d="M40 24c-8 0-14 6-14 14v10l-4 6h36l-4-6V38c0-8-6-14-14-14z" stroke="#CCC" strokeWidth="2" fill="none" />
                <path d="M34 58a6 6 0 0012 0" stroke="#CCC" strokeWidth="2" fill="none" />
            </svg>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "16px", fontWeight: 700, color: "#1A1714", marginBottom: "6px" }}>
                You`&apos;`re all caught up
            </div>
            <div style={{ fontSize: "13px", color: "#AAA", fontWeight: 300 }}>
                New activity on your listings and tasks will show up here.
            </div>
        </div>
    );
}

export default function NotificationsPage() {
    const supabase = createClient();
    const unread = useUnreadCount();
    const [role, setRole] = useState<string>("donor");
    const [items, setItems] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchAll = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
            if (userRow?.role) setRole(userRow.role);
        }
        const { data } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
        setItems(data ?? []);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchAll();
        const channel = supabase
            .channel("notifications-feed")
            .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchAll)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchAll, supabase]);

    const markRead = async (id: string) => {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
        await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
        setMarkingAll(false);
    };

    const todayItems = items.filter((n) => isToday(n.created_at));
    const earlierItems = items.filter((n) => !isToday(n.created_at));

    const renderRow = (n: Notification, index: number) => (
        <div
            key={n.id}
            onClick={() => !n.is_read && markRead(n.id)}
            style={{
                display: "flex", alignItems: "flex-start", gap: "13px",
                padding: "15px 18px", borderRadius: "12px",
                background: n.is_read ? "#fff" : "#FEF0EA",
                border: "1.5px solid #E0DDD8",
                cursor: n.is_read ? "default" : "pointer",
                transition: "transform 0.15s, box-shadow 0.15s, background 0.4s",
                animation: `slideIn 0.35s ease ${index * 0.04}s backwards`,
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateX(2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "2px 2px 8px rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
        >
            <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: typeColor(n.type),
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <TypeIcon type={n.type} />
                </div>
                {!n.is_read && (
                    <div style={{
                        position: "absolute", top: "-2px", right: "-2px",
                        width: "9px", height: "9px", borderRadius: "50%",
                        background: "#E8450A", border: "2px solid #FEF0EA",
                        animation: "reserve-pulse 2s ease-in-out infinite",
                    }} />
                )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#1A1714", marginBottom: "3px" }}>
                    {n.title}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px", lineHeight: 1.4 }}>{n.body}</div>
                <div style={{ fontSize: "10px", color: "#AAA", fontFamily: "Syne, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {timeAgo(n.created_at)}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#F0EDE8", fontFamily: "DM Sans, sans-serif", display: "flex" }}>
            {loading && <PageLoader label="Loading notifications..." />}

            <Sidebar role={role.charAt(0).toUpperCase() + role.slice(1)} items={getNavItems(role, unread)} />

            <main style={{ marginLeft: "240px", flex: 1, padding: "44px 52px 60px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                    <div>
                        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "24px", fontWeight: 700, color: "#1A1714" }}>
                            Notifications
                        </h1>
                        <p style={{ fontSize: "12px", color: "#AAA", marginTop: "3px" }}>
                            {unread > 0 ? `${unread} unread` : "You're all caught up"}
                        </p>
                    </div>
                    {unread > 0 && (
                        <button
                            onClick={markAllRead}
                            disabled={markingAll}
                            style={{
                                height: "38px", padding: "0 16px", borderRadius: "10px",
                                border: "1.5px solid #E0DDD8", background: "#fff",
                                color: "#555", fontSize: "12px", fontWeight: 500,
                                cursor: markingAll ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", gap: "8px",
                                fontFamily: "DM Sans, sans-serif",
                            }}
                        >
                            {markingAll && <Spinner size={13} />}
                            Mark all as read
                        </button>
                    )}
                </div>

                {!loading && items.length === 0 && <EmptyState />}

                {todayItems.length > 0 && (
                    <>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#AAA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", fontFamily: "Syne, sans-serif" }}>
                            Today
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
                            {todayItems.map((n, i) => renderRow(n, i))}
                        </div>
                    </>
                )}

                {earlierItems.length > 0 && (
                    <>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#AAA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", fontFamily: "Syne, sans-serif" }}>
                            Earlier
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {earlierItems.map((n, i) => renderRow(n, i))}
                        </div>
                    </>
                )}
            </main>

            <style>{`
        @keyframes reserve-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
        </div>
    );
}