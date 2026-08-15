"use client";
// src/app/admin/users/page.tsx
//
// M6 — User Management
//
// Shared Sidebar + navConfig.
// Fetch all non-pending users from API (active, suspended, rejected).
// Searchable by email. Table with Suspend action.

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner } from "@/components/shared/Loader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getNavItems } from "@/lib/navConfig";
import { createClient } from "@/lib/supabase/client";

type User = {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
};

function EmptyUsersIllustration() {
    return (
        <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
            <rect x="20" y="20" width="100" height="70" rx="10" fill="#fff" stroke="#E5E7EB" strokeWidth="2" />
            <circle cx="70" cy="45" r="12" stroke="#9CA3AF" strokeWidth="2" />
            <path d="M50 75c0-10 10-15 20-15s20 5 20 15" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            <line x1="85" y1="80" x2="115" y2="100" stroke="#E5E7EB" strokeWidth="6" strokeLinecap="round" />
        </svg>
    );
}

export default function AdminUsersPage() {
    const unread = useUnreadCount();
    const isMobile = useIsMobile();
    const supabase = createClient();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [suspendModal, setSuspendModal] = useState<{ userId: string; email: string } | null>(null);
    const [suspendReason, setSuspendReason] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("users")
                .select("id, email, role, status, created_at")
                .neq("status", "pending")
                .order("created_at", { ascending: false });
            
            if (error) throw error;
            setUsers(data ?? []);
        } catch {
            showToast("Failed to load users.", "error");
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const suspend = async (userId: string, reason: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/suspend/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            const json = await res.json();
            if (json.error) showToast(json.error, "error");
            else { showToast("Account suspended.", "success"); fetchUsers(); }
        } catch {
            showToast("Failed to suspend.", "error");
        }
        setSuspendModal(null);
        setSuspendReason("");
        setActionLoading(null);
    };

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const navItems = getNavItems("admin", unread);

    const rolePillStyle = (role: string): React.CSSProperties => {
        const colors: Record<string, { bg: string; color: string }> = {
            donor:     { bg: "rgba(232,69,10,0.1)", color: "#E8450A" },
            ngo:       { bg: "rgba(24,95,165,0.1)", color: "#185FA5" },
            volunteer: { bg: "rgba(16,185,129,0.1)", color: "#10B981" },
            admin:     { bg: "#111", color: "#fff" },
        };
        const c = colors[role] || { bg: "#F3F4F6", color: "#6B7280" };
        return {
            display: "inline-block", background: c.bg, color: c.color,
            fontSize: "10px", fontWeight: 600, fontFamily: "Geist, sans-serif",
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "3px 10px", borderRadius: "999px",
        };
    };

    const statusPillStyle = (status: string): React.CSSProperties => {
        const colors: Record<string, { bg: string; color: string }> = {
            active:    { bg: "rgba(16,185,129,0.1)", color: "#10B981" },
            suspended: { bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
            rejected:  { bg: "#F3F4F6", color: "#6B7280" },
        };
        const c = colors[status] || { bg: "#F3F4F6", color: "#6B7280" };
        return {
            display: "inline-block", background: c.bg, color: c.color,
            fontSize: "10px", fontWeight: 600, fontFamily: "Geist, sans-serif",
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "3px 10px", borderRadius: "999px",
        };
    };

    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "Geist, sans-serif", display: "flex" }}>
            <Sidebar role="Admin" items={navItems} />

            <main style={{
                marginLeft: isMobile ? 0 : "220px",
                flex: 1,
                padding: isMobile ? "20px" : "40px",
                marginBottom: isMobile ? "64px" : 0
            }}>
                <style>{`
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes toast-slide {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `}</style>

                <div style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "space-between",
                    gap: isMobile ? "16px" : 0,
                    marginBottom: "32px",
                    animation: "fade-in-up 0.4s ease backwards",
                }}>
                    <div>
                        <h1 style={{ fontFamily: "Geist, sans-serif", fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
                            User Management
                        </h1>
                        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px", fontWeight: 400 }}>
                            View and manage all platform users
                        </p>
                    </div>
                </div>

                <div style={{
                    background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
                    padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    animation: "fade-in-up 0.5s ease backwards",
                    marginBottom: "24px"
                }}>
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%", padding: "12px 16px", borderRadius: "8px",
                            border: "1px solid #E5E7EB", fontSize: "14px",
                            fontFamily: "Geist, sans-serif", outline: "none", boxSizing: "border-box",
                        }}
                    />
                </div>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                        <Spinner />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{
                        background: "#fff", border: "1px dashed #E5E7EB", borderRadius: "16px",
                        padding: "64px 32px", textAlign: "center",
                        animation: "fade-in-up 0.5s ease backwards",
                    }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
                            <EmptyUsersIllustration />
                        </div>
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "20px", fontWeight: 600, color: "#111111", marginBottom: "8px" }}>
                            No users found
                        </div>
                        <div style={{ fontSize: "14px", color: "#9CA3AF", fontWeight: 400 }}>
                            {searchQuery ? "No users match your search." : "No active or suspended users yet."}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {filteredUsers.map((u, i) => (
                            <div key={u.id} style={{
                                background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
                                padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                animation: `fade-in-up 0.4s ease backwards`,
                                animationDelay: `${i * 0.02}s`,
                                display: "flex", flexDirection: isMobile ? "column" : "row",
                                alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: "12px"
                            }}>
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ fontFamily: "Geist, sans-serif", fontSize: "15px", fontWeight: 600, color: "#111" }}>
                                        {u.email}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6B7280" }}>
                                        {u.id.substring(0,8)}... · Joined {fmt(u.created_at)}
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={rolePillStyle(u.role)}>{u.role}</span>
                                    <span style={statusPillStyle(u.status)}>{u.status}</span>
                                    {u.status === "active" && u.role !== "admin" && (
                                        <button
                                            onClick={() => setSuspendModal({ userId: u.id, email: u.email })}
                                            disabled={actionLoading === u.id}
                                            style={{
                                                height: "32px", padding: "0 12px", borderRadius: "6px",
                                                background: "#fff", color: "#EF4444",
                                                fontFamily: "Geist, sans-serif", fontSize: "12px", fontWeight: 600,
                                                border: "1px solid #FECACA", cursor: "pointer",
                                                opacity: actionLoading === u.id ? 0.6 : 1,
                                            }}
                                        >
                                            {actionLoading === u.id ? "..." : "Suspend"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {suspendModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 200,
                }} onClick={() => { setSuspendModal(null); setSuspendReason(""); }}>
                    <div
                        style={{
                            background: "#fff", borderRadius: "16px", padding: "32px",
                            width: "100%", maxWidth: "440px",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "18px", fontWeight: 700, color: "#111", marginBottom: "8px" }}>
                            Suspend Account
                        </div>
                        <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>
                            Suspending <strong>{suspendModal.email}</strong>. This will cascade and expire their active listings/reject KYC. Optionally provide a reason.
                        </div>
                        <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="Reason for suspension (optional)"
                            rows={3}
                            style={{
                                width: "100%", padding: "12px", borderRadius: "8px",
                                border: "1px solid #E5E7EB", fontSize: "14px",
                                fontFamily: "Geist, sans-serif", resize: "vertical",
                                outline: "none", boxSizing: "border-box",
                            }}
                        />
                        <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => { setSuspendModal(null); setSuspendReason(""); }}
                                style={{
                                    height: "40px", padding: "0 20px", borderRadius: "8px",
                                    background: "#fff", color: "#6B7280",
                                    fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 500,
                                    border: "1px solid #E5E7EB", cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => suspend(suspendModal.userId, suspendReason)}
                                disabled={actionLoading === suspendModal.userId}
                                style={{
                                    height: "40px", padding: "0 20px", borderRadius: "8px",
                                    background: "#EF4444", color: "#fff",
                                    fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 600,
                                    border: "none", cursor: "pointer",
                                    opacity: actionLoading === suspendModal.userId ? 0.6 : 1,
                                }}
                            >
                                {actionLoading === suspendModal.userId ? "Suspending..." : "Suspend Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{
                    position: "fixed", bottom: "24px", right: "24px",
                    background: toast.type === "success" ? "#10B981" : "#EF4444",
                    color: "#fff", padding: "14px 24px", borderRadius: "10px",
                    fontSize: "13px", fontWeight: 600, fontFamily: "Geist, sans-serif",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    animation: "toast-slide 0.3s ease",
                    zIndex: 300,
                }}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
