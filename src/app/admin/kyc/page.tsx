"use client";
// src/app/(admin)/kyc/page.tsx

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type PendingUser = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export default function AdminKYC() {
  const supabase = createClient();
  const [pending,       setPending]       = useState<PendingUser[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast,         setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("id, email, role, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPending(data ?? []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPending(); }, []);

  const approve = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("users").update({ status: "active" }).eq("id", userId);
    if (error) showToast("Failed to approve. Try again.", "error");
    else { showToast("Account approved successfully.", "success"); fetchPending(); }
    setActionLoading(null);
  };

  const reject = async (userId: string) => {
    setActionLoading(userId + "_r");
    const { error } = await supabase.from("users").update({ status: "suspended" }).eq("id", userId);
    if (error) showToast("Failed to reject. Try again.", "error");
    else { showToast("Account rejected.", "success"); fetchPending(); }
    setActionLoading(null);
  };

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-logo">ReServe</div>
        <div className="admin-logo-sub">Admin Panel</div>

        <div className="nav-label">Moderation</div>
        <button className="nav-item active">
          <span className="nav-dot orange" />
          KYC Queue
          {pending.length > 0 && (
            <span className="nav-badge">{pending.length}</span>
          )}
        </button>
        <button className="nav-item">
          <span className="nav-dot" />
          User Management
        </button>

        <div className="nav-label">Analytics</div>
        <button className="nav-item">
          <span className="nav-dot" />
          Platform Stats
        </button>
        <button className="nav-item">
          <span className="nav-dot" />
          Notification Log
        </button>

        <button className="signout-btn" onClick={logout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <div className="admin-greeting">Admin Dashboard</div>
            <div className="admin-greeting-sub">Manage registrations and monitor platform integrity</div>
          </div>
          <div className="admin-badge">ADMIN</div>
        </div>

        <div className="stats-row">
          <div className="mini-stat">
            <div className="mini-stat-label">Pending Approval</div>
            <div className="mini-stat-val orange">{loading ? "—" : pending.length}</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-label">Total Users</div>
            <div className="mini-stat-val">—</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-label">Active Listings</div>
            <div className="mini-stat-val">—</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-label">Completed Pickups</div>
            <div className="mini-stat-val">—</div>
          </div>
        </div>

        <div className="section-header">
          <div className="section-title">KYC Approval Queue</div>
          <button className="refresh-btn" onClick={fetchPending}>↻ Refresh</button>
        </div>

        <div className="kyc-table">
          <div className="kyc-table-head">
            <span>User</span>
            <span>Role</span>
            <span>Registered</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-body">Loading queue...</div>
            </div>
          ) : pending.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
                </svg>
              </div>
              <div className="empty-title">Queue is clear</div>
              <div className="empty-body">No pending registrations at this time.</div>
            </div>
          ) : (
            pending.map((u) => (
              <div key={u.id} className="kyc-row">
                <div>
                  <div className="kyc-email">{u.email}</div>
                  <div className="kyc-sub">{u.id.slice(0, 8)}...</div>
                </div>
                <div>
                  <span className={`role-pill ${u.role}`}>{u.role}</span>
                </div>
                <div className="kyc-sub">{fmt(u.created_at)}</div>
                <div className="kyc-actions">
                  <button
                    className="approve-btn"
                    disabled={actionLoading === u.id}
                    onClick={() => approve(u.id)}
                  >
                    {actionLoading === u.id ? "..." : "Approve"}
                  </button>
                  <button
                    className="reject-btn"
                    disabled={actionLoading === u.id + "_r"}
                    onClick={() => reject(u.id)}
                  >
                    {actionLoading === u.id + "_r" ? "..." : "Reject"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}