"use client";
// src/app/(donor)/dashboard/page.tsx

import { createClient } from "@/lib/supabase/client";

export default function DonorDashboard() {
  const supabase = createClient();
  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo">ReServe</div>
        <div className="dash-nav-label">Main</div>
        <button className="dash-nav-item active">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#E8450A", flexShrink:0 }} />
          Dashboard
        </button>
        <button className="dash-nav-item">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          My Listings
        </button>
        <button className="dash-nav-item">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Impact
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
            <div className="dash-greeting">Donor Dashboard</div>
            <div className="dash-greeting-sub">Manage your food surplus listings</div>
          </div>
          <div className="dash-badge">DONOR</div>
        </div>

        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-label">Total Donated</div>
            <div className="stat-value orange">0 kg</div>
            <div className="stat-sub">Across all listings</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Meals Enabled</div>
            <div className="stat-value green">0</div>
            <div className="stat-sub">Estimated meals</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Listings</div>
            <div className="stat-value">0</div>
            <div className="stat-sub">Currently live</div>
          </div>
        </div>

        <div className="dash-section-title">Recent Listings</div>
        <div className="coming-soon-card">
          <div className="coming-soon-label">Coming Soon</div>
          <div className="coming-soon-title">M1 — Donor Listing Portal</div>
          <div className="coming-soon-body">
            Post surplus food with photo, quantity, food type, and pickup windows.<br />
            This module is under active development.
          </div>
        </div>
      </main>
    </div>
  );
}