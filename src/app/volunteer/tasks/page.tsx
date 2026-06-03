"use client";

// src/app/(volunteer)/tasks/page.tsx

import { createClient } from "@/lib/supabase/client";

export default function VolunteerTasks() {
  const supabase = createClient();
  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .dash-root { min-height: 100vh; background: #F0EDE8; font-family: 'DM Sans', sans-serif; display: flex; }
        .dash-sidebar { width: 220px; background: #1A1714; display: flex; flex-direction: column; padding: 32px 20px; gap: 4px; position: fixed; top: 0; left: 0; bottom: 0; }
        .dash-logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #E8450A; letter-spacing: -0.5px; margin-bottom: 36px; padding: 0 8px; }
        .dash-nav-label { font-size: 9px; font-weight: 600; color: rgba(240,237,232,0.25); text-transform: uppercase; letter-spacing: 0.12em; padding: 0 8px; margin-bottom: 6px; margin-top: 16px; }
        .dash-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 13px; color: rgba(240,237,232,0.45); cursor: pointer; transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; font-family: 'DM Sans', sans-serif; }
        .dash-nav-item:hover { color: rgba(240,237,232,0.8); background: rgba(255,255,255,0.04); }
        .dash-nav-item.active { color: #F0EDE8; background: rgba(232,69,10,0.15); }
        .dash-signout { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 12px; color: rgba(240,237,232,0.3); cursor: pointer; border: 1px solid rgba(240,237,232,0.08); background: none; width: 100%; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .dash-signout:hover { color: #E8450A; border-color: rgba(232,69,10,0.3); }
        .dash-main { margin-left: 220px; flex: 1; padding: 40px; }
        .dash-topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 36px; }
        .dash-greeting { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #1A1714; letter-spacing: -0.3px; }
        .dash-greeting-sub { font-size: 13px; color: #888; margin-top: 4px; font-weight: 300; }
        .dash-badge { background: #1A1714; color: #E8450A; font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 600; padding: 6px 14px; border-radius: 999px; letter-spacing: 0.05em; }
        .dash-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: #fff; border: 1.5px solid #E0DDD8; border-radius: 14px; padding: 22px 24px; box-shadow: 4px 4px 10px rgba(0,0,0,0.05), -2px -2px 6px rgba(255,255,255,0.9); }
        .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.09em; color: #AAA; font-weight: 500; margin-bottom: 10px; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 700; color: #1A1714; line-height: 1; }
        .stat-value.orange { color: #E8450A; }
        .stat-value.green { color: #1D9E75; }
        .stat-sub { font-size: 11px; color: #AAA; margin-top: 6px; font-weight: 300; }
        .dash-section-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #1A1714; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
        .coming-soon-card { background: #fff; border: 2px dashed #E0DDD8; border-radius: 14px; padding: 48px 32px; text-align: center; box-shadow: 3px 3px 0px #E0DDD8; }
        .coming-soon-label { display: inline-block; background: #1A1714; color: #E8450A; font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 14px; border-radius: 999px; margin-bottom: 16px; }
        .coming-soon-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #1A1714; margin-bottom: 8px; }
        .coming-soon-body { font-size: 13px; color: #AAA; font-weight: 300; line-height: 1.6; }
      `}</style>

      <div className="dash-root">
        <aside className="dash-sidebar">
          <div className="dash-logo">ReServe</div>
          <div className="dash-nav-label">Main</div>
          <button className="dash-nav-item active">
            <span style={{width:6,height:6,borderRadius:"50%",background:"#E8450A",flexShrink:0}}/>Task Feed
          </button>
          <button className="dash-nav-item">
            <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor",flexShrink:0}}/>My Stats
          </button>
          <div className="dash-nav-label">Account</div>
          <button className="dash-nav-item">
            <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor",flexShrink:0}}/>Notifications
          </button>
          <button className="dash-signout" onClick={logout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
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
            <div className="coming-soon-body">Accept pickup tasks, navigate to donors, and submit photo proof on completion.<br />This module is under active development.</div>
          </div>
        </main>
      </div>
    </>
  );
}

// const SHARED_STYLES = `
//   @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
//   * { margin: 0; padding: 0; box-sizing: border-box; }
 
//   .dash-root {
//     min-height: 100vh;
//     background: #F0EDE8;
//     font-family: 'DM Sans', sans-serif;
//     display: flex;
//   }
 
//   .dash-sidebar {
//     width: 220px;
//     background: #1A1714;
//     display: flex;
//     flex-direction: column;
//     padding: 32px 20px;
//     gap: 4px;
//     position: fixed;
//     top: 0; left: 0; bottom: 0;
//   }
 
//   .dash-logo {
//     font-family: 'Syne', sans-serif;
//     font-size: 22px;
//     font-weight: 800;
//     color: #E8450A;
//     letter-spacing: -0.5px;
//     margin-bottom: 36px;
//     padding: 0 8px;
//   }
 
//   .dash-nav-label {
//     font-size: 9px;
//     font-weight: 600;
//     color: rgba(240,237,232,0.25);
//     text-transform: uppercase;
//     letter-spacing: 0.12em;
//     padding: 0 8px;
//     margin-bottom: 6px;
//     margin-top: 16px;
//   }
 
//   .dash-nav-item {
//     display: flex;
//     align-items: center;
//     gap: 10px;
//     padding: 10px 12px;
//     border-radius: 8px;
//     font-size: 13px;
//     font-weight: 400;
//     color: rgba(240,237,232,0.45);
//     cursor: pointer;
//     transition: all 0.15s;
//     border: none;
//     background: none;
//     width: 100%;
//     text-align: left;
//   }
 
//   .dash-nav-item:hover { color: rgba(240,237,232,0.8); background: rgba(255,255,255,0.04); }
//   .dash-nav-item.active { color: #F0EDE8; background: rgba(232,69,10,0.15); }
//   .dash-nav-item.active svg { color: #E8450A; }
 
//   .dash-nav-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
 
//   .dash-signout {
//     margin-top: auto;
//     display: flex;
//     align-items: center;
//     gap: 10px;
//     padding: 10px 12px;
//     border-radius: 8px;
//     font-size: 12px;
//     font-weight: 400;
//     color: rgba(240,237,232,0.3);
//     cursor: pointer;
//     border: 1px solid rgba(240,237,232,0.08);
//     background: none;
//     width: 100%;
//     transition: all 0.15s;
//   }
//   .dash-signout:hover { color: #E8450A; border-color: rgba(232,69,10,0.3); }
 
//   .dash-main {
//     margin-left: 220px;
//     flex: 1;
//     padding: 40px 40px;
//   }
 
//   .dash-topbar {
//     display: flex;
//     align-items: flex-start;
//     justify-content: space-between;
//     margin-bottom: 36px;
//   }
 
//   .dash-greeting {
//     font-family: 'Syne', sans-serif;
//     font-size: 26px;
//     font-weight: 700;
//     color: #1A1714;
//     letter-spacing: -0.3px;
//   }
 
//   .dash-greeting-sub {
//     font-size: 13px;
//     color: #888;
//     margin-top: 4px;
//     font-weight: 300;
//   }
 
//   .dash-badge {
//     background: #1A1714;
//     color: #E8450A;
//     font-family: 'Syne', sans-serif;
//     font-size: 11px;
//     font-weight: 600;
//     padding: 6px 14px;
//     border-radius: 999px;
//     letter-spacing: 0.05em;
//   }
 
//   .dash-stats {
//     display: grid;
//     grid-template-columns: repeat(3, 1fr);
//     gap: 16px;
//     margin-bottom: 28px;
//   }
 
//   .stat-card {
//     background: #fff;
//     border: 1.5px solid #E0DDD8;
//     border-radius: 14px;
//     padding: 22px 24px;
//     /* Neumorphism */
//     box-shadow: 4px 4px 10px rgba(0,0,0,0.05), -2px -2px 6px rgba(255,255,255,0.9);
//   }
 
//   .stat-label {
//     font-size: 10px;
//     text-transform: uppercase;
//     letter-spacing: 0.09em;
//     color: #AAA;
//     font-weight: 500;
//     margin-bottom: 10px;
//   }
 
//   .stat-value {
//     font-family: 'Syne', sans-serif;
//     font-size: 32px;
//     font-weight: 700;
//     color: #1A1714;
//     line-height: 1;
//   }
 
//   .stat-value.orange { color: #E8450A; }
//   .stat-value.green { color: #1D9E75; }
 
//   .stat-sub {
//     font-size: 11px;
//     color: #AAA;
//     margin-top: 6px;
//     font-weight: 300;
//   }
 
//   .dash-section-title {
//     font-family: 'Syne', sans-serif;
//     font-size: 14px;
//     font-weight: 700;
//     color: #1A1714;
//     text-transform: uppercase;
//     letter-spacing: 0.06em;
//     margin-bottom: 14px;
//   }
 
//   .coming-soon-card {
//     background: #fff;
//     border: 2px dashed #E0DDD8;
//     border-radius: 14px;
//     padding: 48px 32px;
//     text-align: center;
//     /* Neubrutalism subtle */
//     box-shadow: 3px 3px 0px #E0DDD8;
//   }
 
//   .coming-soon-label {
//     display: inline-block;
//     background: #1A1714;
//     color: #E8450A;
//     font-family: 'Syne', sans-serif;
//     font-size: 10px;
//     font-weight: 700;
//     letter-spacing: 0.1em;
//     text-transform: uppercase;
//     padding: 5px 14px;
//     border-radius: 999px;
//     margin-bottom: 16px;
//   }
 
//   .coming-soon-title {
//     font-family: 'Syne', sans-serif;
//     font-size: 20px;
//     font-weight: 700;
//     color: #1A1714;
//     margin-bottom: 8px;
//   }
 
//   .coming-soon-body {
//     font-size: 13px;
//     color: #AAA;
//     font-weight: 300;
//     line-height: 1.6;
//   }
// `;