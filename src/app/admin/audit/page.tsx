"use client";
// src/app/admin/audit/page.tsx
//
// M6 — Audit Log
//
// Shared Sidebar + navConfig.
// Read-only view of the audit_log table, fetched via GET /api/admin/audit.

import { useState, useEffect } from "react";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner } from "@/components/shared/Loader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getNavItems } from "@/lib/navConfig";

type AuditEntry = {
    id: string;
    admin_id: string;
    admin_email: string;
    action_type: string;
    target_user_id: string;
    target_email: string;
    target_role: string;
    reason: string;
    created_at: string;
};

function EmptyAuditIllustration() {
    return (
        <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
            <rect x="30" y="20" width="80" height="70" rx="8" fill="#fff" stroke="#E5E7EB" strokeWidth="2" />
            <line x1="45" y1="40" x2="95" y2="40" stroke="#F3F4F6" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="55" x2="80" y2="55" stroke="#F3F4F6" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="70" x2="95" y2="70" stroke="#F3F4F6" strokeWidth="3" strokeLinecap="round" />
            <circle cx="105" cy="85" r="16" fill="#F3F4F6" />
            <path d="M100 80l4 4 6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function AdminAuditPage() {
    const unread = useUnreadCount();
    const isMobile = useIsMobile();
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/audit");
            const json = await res.json();
            if (!json.error) setLogs(json.data ?? []);
        } catch {
            console.error("Failed to load audit logs");
        }
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, []);

    const fmt = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + 
               " " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const navItems = getNavItems("admin", unread);

    const actionPillStyle = (action: string): React.CSSProperties => {
        const colors: Record<string, { bg: string; color: string }> = {
            approve: { bg: "rgba(16,185,129,0.1)", color: "#10B981" },
            reject:  { bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
            suspend: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
        };
        const c = colors[action] || { bg: "#F3F4F6", color: "#6B7280" };
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
                            Audit Log
                        </h1>
                        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px", fontWeight: 400 }}>
                            Immutable record of all admin moderation actions
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                        <Spinner />
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{
                        background: "#fff", border: "1px dashed #E5E7EB", borderRadius: "16px",
                        padding: "64px 32px", textAlign: "center",
                        animation: "fade-in-up 0.5s ease backwards",
                    }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
                            <EmptyAuditIllustration />
                        </div>
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: "20px", fontWeight: 600, color: "#111111", marginBottom: "8px" }}>
                            No actions recorded
                        </div>
                        <div style={{ fontSize: "14px", color: "#9CA3AF", fontWeight: 400 }}>
                            The audit log is currently empty.
                        </div>
                    </div>
                ) : (
                    <div style={{
                        background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden",
                        animation: "fade-in-up 0.5s ease backwards",
                    }}>
                        {/* Table Header */}
                        {!isMobile && (
                            <div style={{
                                display: "grid", gridTemplateColumns: "2fr 1fr 2fr 3fr", gap: "16px",
                                padding: "16px 20px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB",
                                fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em"
                            }}>
                                <div>Timestamp & Admin</div>
                                <div>Action</div>
                                <div>Target User</div>
                                <div>Reason</div>
                            </div>
                        )}

                        {/* Table Body */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {logs.map((log) => (
                                <div key={log.id} style={{
                                    display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 2fr 3fr", gap: "12px",
                                    padding: "16px 20px", borderBottom: "1px solid #F3F4F6",
                                }}>
                                    {/* Timestamp & Admin */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{fmt(log.created_at)}</div>
                                        <div style={{ fontSize: "14px", color: "#111", fontWeight: 500 }}>{log.admin_email}</div>
                                    </div>

                                    {/* Action */}
                                    <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center" }}>
                                        <span style={actionPillStyle(log.action_type)}>{log.action_type}</span>
                                    </div>

                                    {/* Target User */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", justifyContent: "center" }}>
                                        <div style={{ fontSize: "14px", color: "#111" }}>{log.target_email}</div>
                                        <div style={{ fontSize: "12px", color: "#6B7280" }}>{log.target_role}</div>
                                    </div>

                                    {/* Reason */}
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <div style={{
                                            fontSize: "13px", color: log.reason ? "#4B5563" : "#9CA3AF",
                                            fontStyle: log.reason ? "normal" : "italic",
                                        }}>
                                            {log.reason || "No reason provided"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
