"use client";
// src/app/admin/kyc/page.tsx
//
// M6 — KYC Approval Queue
//
// Refactored to:
//  - Use shared Sidebar + navConfig (consistent with all dashboards)
//  - Fetch from GET /api/admin/registrations (not direct Supabase query)
//  - Display uploaded KYC documents (Cloudinary thumbnails)
//  - Approve/Reject via POST /api/admin/approve|reject/:id
//  - Show role-specific info (org_name for NGOs)
//  - Custom-SVG empty state (consistent with other dashboards)

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner } from "@/components/shared/Loader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getNavItems } from "@/lib/navConfig";

type NgoProfile = {
    org_name: string;
    contact_phone: string;
    kyc_status: string;
};

type PendingUser = {
    id: string;
    email: string;
    role: string;
    status: string;
    kyc_documents: string[];
    created_at: string;
    ngo_profile: NgoProfile | null;
};

function EmptyQueueIllustration() {
    return (
        <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
            <rect x="20" y="20" width="100" height="70" rx="10" fill="#fff" stroke="#E5E7EB" strokeWidth="2" />
            <circle cx="70" cy="50" r="16" fill="#F0FDF4" />
            <path d="M63 50l4 4 8-8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="32" y="76" width="60" height="4" rx="2" fill="#F3F4F6" />
        </svg>
    );
}

export default function AdminKYCPage() {
    const unread = useUnreadCount();
    const isMobile = useIsMobile();
    const [pending, setPending] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [rejectModal, setRejectModal] = useState<{ userId: string; email: string } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/registrations");
            const json = await res.json();
            if (json.error) showToast(json.error, "error");
            else setPending(json.data ?? []);
        } catch {
            showToast("Failed to load queue.", "error");
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const approve = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/approve/${userId}`, { method: "POST" });
            const json = await res.json();
            if (json.error) showToast(json.error, "error");
            else { showToast("Account approved successfully.", "success"); fetchPending(); }
        } catch {
            showToast("Failed to approve.", "error");
        }
        setActionLoading(null);
    };

    const reject = async (userId: string, reason: string) => {
        setActionLoading(userId + "_r");
        try {
            const res = await fetch(`/api/admin/reject/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            const json = await res.json();
            if (json.error) showToast(json.error, "error");
            else { showToast("Registration rejected.", "success"); fetchPending(); }
        } catch {
            showToast("Failed to reject.", "error");
        }
        setRejectModal(null);
        setRejectReason("");
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
        };
        const c = colors[role] || { bg: "#F3F4F6", color: "#6B7280" };
        return {
            display: "inline-block", background: c.bg, color: c.color,
            fontSize: "10px", fontWeight: 600, fontFamily: "Geist, sans-serif",
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "3px 10px", borderRadius: "999px",
        };
    };

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

                {/* Header */}
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
                            Approval Queue
                        </h1>
                        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px", fontWeight: 400 }}>
                            Review and verify new users
                        </p>
                    </div>
                    <button
                        onClick={fetchPending}
                        style={{
                            height: "40px", padding: "0 20px", borderRadius: "10px",
                            background: "#fff", color: "#111",
                            fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 500,
                            border: "1px solid #E5E7EB", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "6px",
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget).style.borderColor = "#111"; }}
                        onMouseLeave={(e) => { (e.currentTarget).style.borderColor = "#E5E7EB"; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div style={{
                    display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                    gap: "16px", marginBottom: "32px",
                }}>
                    {[
                        { label: "Pending Approval", value: loading ? "—" : pending.length, color: "#E8450A" },
                        { label: "Donors", value: loading ? "—" : pending.filter(u => u.role === "donor").length, color: "#111" },
                        { label: "NGOs", value: loading ? "—" : pending.filter(u => u.role === "ngo").length, color: "#185FA5" },
                    ].map((s) => (
                        <div key={s.label} style={{
                            background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
                            padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            animation: "fade-in-up 0.5s ease backwards",
                        }}>
                            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", fontWeight: 500, marginBottom: "12px" }}>
                                {s.label}
                            </div>
                            <div style={{ fontFamily: "Geist, sans-serif", fontSize: "32px", fontWeight: 700, color: s.color, lineHeight: 1 }}>
                                {s.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Queue */}
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                        <Spinner />
                    </div>
                ) : pending.length === 0 ? (
                    <div style={{
                        background: "#fff", border: "1px dashed #E5E7EB", borderRadius: "16px",
                        padding: "64px 32px", textAlign: "center",
                        animation: "fade-in-up 0.5s ease backwards",
                    }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
                            <EmptyQueueIllustration />
                        </div>
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "20px", fontWeight: 600, color: "#111111", marginBottom: "8px" }}>
                            Queue is clear
                        </div>
                        <div style={{ fontSize: "14px", color: "#9CA3AF", fontWeight: 400 }}>
                            No pending registrations at this time.
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {pending.map((u, i) => (
                            <div key={u.id} style={{
                                background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
                                padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                animation: `fade-in-up 0.4s ease backwards`,
                                animationDelay: `${i * 0.05}s`,
                            }}>
                                {/* User info row */}
                                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: "16px" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                            <span style={{ fontFamily: "Geist, sans-serif", fontSize: "16px", fontWeight: 600, color: "#111" }}>
                                                {u.ngo_profile?.org_name || u.email}
                                            </span>
                                            <span style={rolePillStyle(u.role)}>{u.role}</span>
                                        </div>
                                        <div style={{ fontSize: "13px", color: "#6B7280" }}>
                                            {u.email} · Registered {fmt(u.created_at)}
                                        </div>
                                        {u.ngo_profile && (
                                            <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
                                                Phone: {u.ngo_profile.contact_phone}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                        <button
                                            disabled={actionLoading === u.id}
                                            onClick={() => approve(u.id)}
                                            style={{
                                                height: "36px", padding: "0 18px", borderRadius: "8px",
                                                background: "#10B981", color: "#fff",
                                                fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 600,
                                                border: "none", cursor: "pointer",
                                                opacity: actionLoading === u.id ? 0.6 : 1,
                                                transition: "opacity 0.15s",
                                            }}
                                        >
                                            {actionLoading === u.id ? "..." : "Approve"}
                                        </button>
                                        <button
                                            disabled={actionLoading === u.id + "_r"}
                                            onClick={() => setRejectModal({ userId: u.id, email: u.email })}
                                            style={{
                                                height: "36px", padding: "0 18px", borderRadius: "8px",
                                                background: "#fff", color: "#EF4444",
                                                fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 600,
                                                border: "1px solid #FECACA", cursor: "pointer",
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>

                                {/* KYC Documents */}
                                {u.kyc_documents && u.kyc_documents.length > 0 && (
                                    <div style={{ marginTop: "16px", borderTop: "1px solid #F3F4F6", paddingTop: "16px" }}>
                                        <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", fontWeight: 500, marginBottom: "10px" }}>
                                            KYC Documents ({u.kyc_documents.length})
                                        </div>
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                            {u.kyc_documents.map((url, idx) => (
                                                <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: "8px",
                                                        padding: "8px 12px", borderRadius: "8px",
                                                        border: "1px solid #E5E7EB", background: "#F9FAFB",
                                                        color: "#111", textDecoration: "none",
                                                        fontSize: "13px", fontWeight: 500,
                                                        transition: "border-color 0.15s, background 0.15s",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        (e.currentTarget).style.borderColor = "#D1D5DB";
                                                        (e.currentTarget).style.background = "#F3F4F6";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (e.currentTarget).style.borderColor = "#E5E7EB";
                                                        (e.currentTarget).style.background = "#F9FAFB";
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
                                                    View Document {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No docs warning for NGOs only */}
                                {u.role === "ngo" && (!u.kyc_documents || u.kyc_documents.length === 0) && (
                                    <div style={{
                                        marginTop: "16px", borderTop: "1px solid #F3F4F6", paddingTop: "12px",
                                        fontSize: "12px", color: "#F59E0B",
                                        display: "flex", alignItems: "center", gap: "6px",
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                        Awaiting KYC document submission from NGO
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Reject reason modal */}
            {rejectModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 200,
                }} onClick={() => { setRejectModal(null); setRejectReason(""); }}>
                    <div
                        style={{
                            background: "#fff", borderRadius: "16px", padding: "32px",
                            width: "100%", maxWidth: "440px",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "18px", fontWeight: 700, color: "#111", marginBottom: "8px" }}>
                            Reject Registration
                        </div>
                        <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>
                            Rejecting <strong>{rejectModal.email}</strong>. Optionally provide a reason.
                        </div>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (optional)"
                            rows={3}
                            style={{
                                width: "100%", padding: "12px", borderRadius: "8px",
                                border: "1px solid #E5E7EB", fontSize: "14px",
                                fontFamily: "Geist, sans-serif", resize: "vertical",
                                outline: "none", boxSizing: "border-box",
                            }}
                            onFocus={(e) => { (e.currentTarget).style.borderColor = "#111"; }}
                            onBlur={(e) => { (e.currentTarget).style.borderColor = "#E5E7EB"; }}
                        />
                        <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(""); }}
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
                                onClick={() => reject(rejectModal.userId, rejectReason)}
                                disabled={actionLoading === rejectModal.userId + "_r"}
                                style={{
                                    height: "40px", padding: "0 20px", borderRadius: "8px",
                                    background: "#EF4444", color: "#fff",
                                    fontFamily: "Geist, sans-serif", fontSize: "13px", fontWeight: 600,
                                    border: "none", cursor: "pointer",
                                    opacity: actionLoading === rejectModal.userId + "_r" ? 0.6 : 1,
                                }}
                            >
                                {actionLoading === rejectModal.userId + "_r" ? "Rejecting..." : "Reject Registration"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
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