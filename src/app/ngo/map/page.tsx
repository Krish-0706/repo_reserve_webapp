"use client";
// src/app/(ngo)/map/page.tsx

import { createClient } from "@/lib/supabase/client";

export default function NGOMap() {
  const supabase = createClient();
  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo">ReServe</div>
        <div className="dash-nav-label">Main</div>
        <button className="dash-nav-item active">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#E8450A", flexShrink:0 }} />
          Live Map
        </button>
        <button className="dash-nav-item">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Active Pickups
        </button>
        <button className="dash-nav-item">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Impact Report
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
            <div className="dash-greeting">NGO Dashboard</div>
            <div className="dash-greeting-sub">Discover and claim surplus food listings</div>
          </div>
          <div className="dash-badge">NGO</div>
        </div>

        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-label">Claims Today</div>
            <div className="stat-value orange">0</div>
            <div className="stat-sub">Listings claimed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Meals Rescued</div>
            <div className="stat-value green">0</div>
            <div className="stat-sub">Estimated total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Donors</div>
            <div className="stat-value">0</div>
            <div className="stat-sub">Within your area</div>
          </div>
        </div>

        <div className="dash-section-title">Live Map</div>
        <div className="coming-soon-card">
          <div className="coming-soon-label">Coming Soon</div>
          <div className="coming-soon-title">M2 — NGO Discovery & Claim</div>
          <div className="coming-soon-body">
            Live Google Maps view with real-time listing pins.<br />
            Claim pickups with one tap and assign volunteers instantly.
          </div>
        </div>
      </main>
    </div>
  );
}