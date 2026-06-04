"use client";

// src/app/(admin)/kyc/page.tsx

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type PendingUser = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  org_name?: string;
};

export default function AdminKYC() {
  const supabase = createClient();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

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
    setPendingUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (userId: string, role: string) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", userId);
    if (error) { showToast("Failed to approve. Try again.", "error"); }
    else { showToast("Account approved successfully.", "success"); fetchPending(); }
    setActionLoading(null);
  };

  const reject = async (userId: string) => {
    setActionLoading(userId + "_reject");
    const { error } = await supabase
      .from("users")
      .update({ status: "suspended" })
      .eq("id", userId);
    if (error) { showToast("Failed to reject. Try again.", "error"); }
    else { showToast("Account rejected.", "success"); fetchPending(); }
    setActionLoading(null);
  };

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'DM Sans',sans-serif; }

        .admin-root { min-height:100vh; background:#F0EDE8; display:flex; font-family:'DM Sans',sans-serif; }

        .admin-sidebar {
          width:220px; background:#1A1714;
          display:flex; flex-direction:column;
          padding:32px 20px; gap:4px;
          position:fixed; top:0; left:0; bottom:0;
        }

        .admin-logo {
          font-family:'Syne',sans-serif; font-size:22px; font-weight:800;
          color:#E8450A; letter-spacing:-0.5px;
          margin-bottom:8px; padding:0 8px;
        }

        .admin-logo-sub {
          font-size:9px; font-weight:600; letter-spacing:0.1em;
          text-transform:uppercase; color:rgba(240,237,232,0.2);
          padding:0 8px; margin-bottom:28px;
        }

        .nav-label {
          font-size:9px; font-weight:600; color:rgba(240,237,232,0.25);
          text-transform:uppercase; letter-spacing:0.12em;
          padding:0 8px; margin-bottom:6px; margin-top:12px;
        }

        .nav-item {
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:8px;
          font-size:13px; color:rgba(240,237,232,0.45);
          cursor:pointer; transition:all 0.15s;
          border:none; background:none; width:100%; text-align:left;
          font-family:'DM Sans',sans-serif;
        }

        .nav-item:hover { color:rgba(240,237,232,0.8); background:rgba(255,255,255,0.04); }
        .nav-item.active { color:#F0EDE8; background:rgba(232,69,10,0.15); }

        .nav-dot { width:5px; height:5px; border-radius:50%; background:currentColor; flex-shrink:0; }
        .nav-dot.orange { background:#E8450A; }

        .nav-badge {
          margin-left:auto;
          background:#E8450A; color:#fff;
          font-size:9px; font-weight:700;
          padding:2px 7px; border-radius:999px;
          font-family:'Syne',sans-serif;
        }

        .signout-btn {
          margin-top:auto;
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:8px;
          font-size:12px; color:rgba(240,237,232,0.3);
          cursor:pointer; border:1px solid rgba(240,237,232,0.08);
          background:none; width:100%; transition:all 0.15s;
          font-family:'DM Sans',sans-serif;
        }

        .signout-btn:hover { color:#E8450A; border-color:rgba(232,69,10,0.3); }

        .admin-main { margin-left:220px; flex:1; padding:40px; }

        .admin-topbar {
          display:flex; align-items:flex-start;
          justify-content:space-between; margin-bottom:36px;
        }

        .admin-greeting {
          font-family:'Syne',sans-serif; font-size:26px;
          font-weight:700; color:#1A1714; letter-spacing:-0.3px;
        }

        .admin-greeting-sub {
          font-size:13px; color:#888; margin-top:4px; font-weight:300;
        }

        .admin-badge {
          background:#1A1714; color:#E8450A;
          font-family:'Syne',sans-serif; font-size:11px; font-weight:600;
          padding:6px 14px; border-radius:999px; letter-spacing:0.05em;
        }

        .stats-row {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:14px; margin-bottom:32px;
        }

        .mini-stat {
          background:#fff; border:1.5px solid #E0DDD8;
          border-radius:12px; padding:18px 20px;
          box-shadow:3px 3px 8px rgba(0,0,0,0.04),-1px -1px 4px rgba(255,255,255,0.9);
        }

        .mini-stat-label {
          font-size:9px; text-transform:uppercase; letter-spacing:0.09em;
          color:#AAA; font-weight:500; margin-bottom:8px;
        }

        .mini-stat-val {
          font-family:'Syne',sans-serif; font-size:28px;
          font-weight:700; color:#1A1714; line-height:1;
        }

        .mini-stat-val.orange { color:#E8450A; }

        .section-header {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:16px;
        }

        .section-title {
          font-family:'Syne',sans-serif; font-size:13px;
          font-weight:700; color:#1A1714; text-transform:uppercase; letter-spacing:0.07em;
        }

        .refresh-btn {
          font-size:11px; color:#888; background:none; border:none;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          padding:4px 8px; border-radius:6px; transition:all 0.15s;
        }

        .refresh-btn:hover { color:#1A1714; background:rgba(0,0,0,0.04); }

        .kyc-table {
          background:#fff; border:1.5px solid #E0DDD8;
          border-radius:16px; overflow:hidden;
          box-shadow:3px 3px 0px #E0DDD8;
        }

        .kyc-table-head {
          display:grid; grid-template-columns:1fr 100px 140px 140px;
          padding:12px 20px;
          background:#F8F6F3;
          border-bottom:1px solid #E0DDD8;
          font-size:10px; font-weight:600; color:#AAA;
          text-transform:uppercase; letter-spacing:0.09em;
        }

        .kyc-row {
          display:grid; grid-template-columns:1fr 100px 140px 140px;
          padding:16px 20px;
          border-bottom:1px solid #F0EDE8;
          align-items:center;
          transition:background 0.15s;
        }

        .kyc-row:last-child { border-bottom:none; }
        .kyc-row:hover { background:#FAFAF8; }

        .kyc-email { font-size:13px; color:#1A1714; font-weight:400; }
        .kyc-sub { font-size:11px; color:#AAA; margin-top:2px; font-weight:300; }

        .role-pill {
          display:inline-block; padding:4px 10px;
          border-radius:999px; font-size:10px; font-weight:600;
          text-transform:uppercase; letter-spacing:0.07em;
          font-family:'Syne',sans-serif;
        }

        .role-pill.donor { background:#FEF0EA; color:#E8450A; }
        .role-pill.ngo { background:#EDF2FF; color:#3B6BD6; }
        .role-pill.volunteer { background:#E6F7F2; color:#1D9E75; }

        .kyc-actions { display:flex; gap:8px; }

        .approve-btn {
          padding:7px 16px; border-radius:8px;
          background:#1D9E75; color:#fff;
          font-family:'Syne',sans-serif; font-size:11px; font-weight:700;
          border:1.5px solid #147a5c;
          cursor:pointer; transition:all 0.15s;
          box-shadow:2px 2px 0px #147a5c;
          letter-spacing:0.03em;
        }

        .approve-btn:hover:not(:disabled) { transform:translate(-1px,-1px); box-shadow:3px 3px 0px #147a5c; }
        .approve-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .reject-btn {
          padding:7px 14px; border-radius:8px;
          background:transparent; color:#E24B4A;
          font-family:'Syne',sans-serif; font-size:11px; font-weight:600;
          border:1.5px solid #E24B4A;
          cursor:pointer; transition:all 0.15s;
        }

        .reject-btn:hover:not(:disabled) { background:#FEF2F2; }
        .reject-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .empty-state {
          text-align:center; padding:64px 32px;
        }

        .empty-icon {
          width:48px; height:48px; background:#F0EDE8;
          border-radius:12px; display:flex; align-items:center;
          justify-content:center; margin:0 auto 16px;
        }

        .empty-title {
          font-family:'Syne',sans-serif; font-size:16px;
          font-weight:700; color:#1A1714; margin-bottom:6px;
        }

        .empty-body { font-size:13px; color:#AAA; font-weight:300; }

        .toast {
          position:fixed; bottom:28px; right:28px;
          padding:13px 20px; border-radius:12px;
          font-size:13px; font-weight:500;
          box-shadow:0 4px 20px rgba(0,0,0,0.12);
          z-index:999; font-family:'DM Sans',sans-serif;
          border-left:4px solid transparent;
          animation:slideUp 0.25s ease;
        }

        .toast.success { background:#fff; border-left-color:#1D9E75; color:#1A1714; }
        .toast.error { background:#fff; border-left-color:#E24B4A; color:#1A1714; }

        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="admin-root">
        <aside className="admin-sidebar">
          <div className="admin-logo">ReServe</div>
          <div className="admin-logo-sub">Admin Panel</div>

          <div className="nav-label">Moderation</div>
          <button className="nav-item active">
            <span className="nav-dot orange" />
            KYC Queue
            {pendingUsers.length > 0 && (
              <span className="nav-badge">{pendingUsers.length}</span>
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
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
              <div className="mini-stat-val orange">{loading ? "—" : pendingUsers.length}</div>
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
            ) : pendingUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                </div>
                <div className="empty-title">Queue is clear</div>
                <div className="empty-body">No pending registrations at this time.</div>
              </div>
            ) : (
              pendingUsers.map((u) => (
                <div key={u.id} className="kyc-row">
                  <div>
                    <div className="kyc-email">{u.email}</div>
                    <div className="kyc-sub">{u.id.slice(0, 8)}...</div>
                  </div>
                  <div>
                    <span className={`role-pill ${u.role}`}>{u.role}</span>
                  </div>
                  <div className="kyc-sub">{formatDate(u.created_at)}</div>
                  <div className="kyc-actions">
                    <button
                      className="approve-btn"
                      disabled={actionLoading === u.id}
                      onClick={() => approve(u.id, u.role)}
                    >
                      {actionLoading === u.id ? "..." : "Approve"}
                    </button>
                    <button
                      className="reject-btn"
                      disabled={actionLoading === u.id + "_reject"}
                      onClick={() => reject(u.id)}
                    >
                      {actionLoading === u.id + "_reject" ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}