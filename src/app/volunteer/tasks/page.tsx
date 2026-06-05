"use client";
// src/app/(volunteer)/tasks/page.tsx

import { createClient } from "@/lib/supabase/client";

export default function VolunteerTasks() {
  const supabase = createClient();
  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo">ReServe</div>
        <div className="dash-nav-label">Main</div>
        <button className="dash-nav-item active">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#E8450A", flexShrink:0 }} />
          Task Feed
        </button>
        <button className="dash-nav-item">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          My Stats
        </button>
        <div className="dash-nav-label">Account</div>
        <button className="dash-nav-item">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Notifications
        </button>
        <button className="dash-signout" onClick={logout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <div className="dash-greeting">Volunteer Dashboard</div>
            <div className="dash-greeting-sub">View and manage your assigned pickup tasks</div>
          </div>
          <div className="dash-badge">VOLUNTEER</div>
        </div>

        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-label">Tasks Completed</div>
            <div className="stat-value orange">0</div>
            <div className="stat-sub">All time</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Hours Logged</div>
            <div className="stat-value green">0</div>
            <div className="stat-sub">Total volunteer hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rating</div>
            <div className="stat-value">—</div>
            <div className="stat-sub">Complete tasks to earn</div>
          </div>
        </div>

        <div className="dash-section-title">Assigned Tasks</div>
        <div className="coming-soon-card">
          <div className="coming-soon-label">Coming Soon</div>
          <div className="coming-soon-title">M3 — Volunteer Logistics</div>
          <div className="coming-soon-body">
            Accept pickup tasks, navigate to donors, and submit photo proof on completion.<br />
            This module is under active development.
          </div>
        </div>
      </main>
    </div>
  );
}