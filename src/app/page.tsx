// src/app/page.tsx
// ReServe Landing Page

import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        :root {
          --brand: #E8450A;
          --brand-dark: #C23A08;
          --ink: #1A1714;
          --paper: #F0EDE8;
          --paper-dark: #E8E4DE;
          --green: #1D9E75;
          --muted: #888880;
          --white: #FFFFFF;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 20px 60px;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(240,237,232,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(26,23,20,0.06);
        }

        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: var(--brand);
          letter-spacing: -0.5px;
          text-decoration: none;
          display: flex; align-items: center; gap: 8px;
        }

        .nav-logo-mark {
          width: 28px; height: 28px;
          background: var(--ink);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }

        .nav-links {
          display: flex; align-items: center; gap: 32px;
          list-style: none;
        }

        .nav-links a {
          font-size: 13px; font-weight: 400;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }

        .nav-links a:hover { color: var(--ink); }

        .nav-cta {
          display: flex; gap: 10px; align-items: center;
        }

        .btn-ghost {
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 13px; font-weight: 500;
          color: var(--ink);
          text-decoration: none;
          border: 1.5px solid rgba(26,23,20,0.15);
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .btn-ghost:hover {
          border-color: var(--ink);
          background: rgba(26,23,20,0.04);
        }

        .btn-primary {
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 13px; font-weight: 700;
          color: #fff;
          text-decoration: none;
          background: var(--brand);
          border: 2px solid var(--ink);
          box-shadow: 2px 2px 0px var(--ink);
          transition: all 0.15s;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.02em;
        }

        .btn-primary:hover {
          transform: translate(-1px,-1px);
          box-shadow: 3px 3px 0px var(--ink);
        }

        .btn-primary:active {
          transform: translate(1px,1px);
          box-shadow: 1px 1px 0px var(--ink);
        }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 120px 60px 80px;
          position: relative;
          overflow: hidden;
        }

        .hero-bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(26,23,20,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,23,20,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .hero-bg-glow {
          position: absolute;
          top: 10%; right: -10%;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,69,10,0.07) 0%, transparent 65%);
          pointer-events: none;
        }

        .hero-content {
          position: relative; z-index: 1;
          max-width: 820px;
        }

        .hero-kicker {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--ink);
          color: var(--brand);
          font-family: 'Syne', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 28px;
        }

        .hero-kicker-dot {
          width: 5px; height: 5px;
          background: var(--brand);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(48px, 7vw, 88px);
          font-weight: 800;
          color: var(--ink);
          line-height: 0.95;
          letter-spacing: -3px;
          margin-bottom: 28px;
        }

        .hero-title .accent { color: var(--brand); }

        .hero-title .line-outline {
          -webkit-text-stroke: 2px var(--ink);
          color: transparent;
        }

        .hero-desc {
          font-size: 16px;
          color: var(--muted);
          line-height: 1.65;
          max-width: 480px;
          font-weight: 300;
          margin-bottom: 40px;
        }

        .hero-actions {
          display: flex; align-items: center; gap: 16px;
          flex-wrap: wrap;
        }

        .hero-btn-main {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px;
          background: var(--brand);
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700;
          text-decoration: none;
          border-radius: 10px;
          border: 2px solid var(--ink);
          box-shadow: 4px 4px 0px var(--ink);
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }

        .hero-btn-main:hover {
          transform: translate(-2px,-2px);
          box-shadow: 6px 6px 0px var(--ink);
        }

        .hero-btn-main:active {
          transform: translate(2px,2px);
          box-shadow: 2px 2px 0px var(--ink);
        }

        .hero-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 14px 24px;
          background: transparent;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          text-decoration: none;
          border-radius: 10px;
          border: 1.5px solid rgba(26,23,20,0.2);
          transition: all 0.2s;
        }

        .hero-btn-secondary:hover {
          border-color: var(--ink);
          background: rgba(26,23,20,0.03);
        }

        /* ── TICKER ── */
        .ticker-wrap {
          overflow: hidden;
          border-top: 1px solid rgba(26,23,20,0.08);
          border-bottom: 1px solid rgba(26,23,20,0.08);
          background: var(--ink);
          padding: 14px 0;
          margin: 0;
        }

        .ticker-track {
          display: flex; gap: 0;
          animation: ticker 20s linear infinite;
          width: max-content;
        }

        .ticker-item {
          display: flex; align-items: center; gap: 16px;
          padding: 0 40px;
          font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 600;
          color: rgba(240,237,232,0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }

        .ticker-item span { color: var(--brand); }

        .ticker-sep {
          color: rgba(232,69,10,0.4);
          font-size: 18px;
        }

        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ── STATS BAR ── */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border-bottom: 1px solid rgba(26,23,20,0.08);
        }

        .stat-item {
          padding: 40px 48px;
          border-right: 1px solid rgba(26,23,20,0.08);
        }

        .stat-item:last-child { border-right: none; }

        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 42px; font-weight: 800;
          color: var(--ink);
          letter-spacing: -1.5px;
          line-height: 1;
          margin-bottom: 6px;
        }

        .stat-num .unit { color: var(--brand); font-size: 28px; }

        .stat-desc {
          font-size: 12px;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.5;
        }

        /* ── HOW IT WORKS ── */
        .section {
          padding: 100px 60px;
        }

        .section-kicker {
          font-family: 'Syne', sans-serif;
          font-size: 10px; font-weight: 700;
          color: var(--brand);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -1.5px;
          line-height: 1.05;
          max-width: 560px;
          margin-bottom: 60px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          background: rgba(26,23,20,0.08);
          border: 1px solid rgba(26,23,20,0.08);
          border-radius: 20px;
          overflow: hidden;
        }

        .step-card {
          background: var(--paper);
          padding: 40px 36px;
          position: relative;
          transition: background 0.2s;
        }

        .step-card:hover { background: #fff; }

        .step-num {
          font-family: 'Syne', sans-serif;
          font-size: 11px; font-weight: 700;
          color: var(--brand);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }

        .step-num::after {
          content: '';
          flex: 1; height: 1px;
          background: rgba(232,69,10,0.2);
        }

        .step-icon-wrap {
          width: 48px; height: 48px;
          background: var(--ink);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        .step-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 700;
          color: var(--ink);
          margin-bottom: 10px;
          letter-spacing: -0.3px;
        }

        .step-body {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.65;
          font-weight: 300;
        }

        /* ── MODULES ── */
        .modules-section {
          padding: 100px 60px;
          background: var(--ink);
        }

        .modules-section .section-kicker { color: var(--brand); }
        .modules-section .section-title { color: var(--paper); }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .module-card {
          border: 1px solid rgba(240,237,232,0.08);
          border-radius: 16px;
          padding: 28px;
          background: rgba(240,237,232,0.03);
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .module-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--brand);
          transform: scaleX(0);
          transition: transform 0.2s;
          transform-origin: left;
        }

        .module-card:hover { background: rgba(240,237,232,0.06); border-color: rgba(240,237,232,0.15); }
        .module-card:hover::before { transform: scaleX(1); }

        .module-tag {
          display: inline-block;
          background: rgba(232,69,10,0.12);
          color: var(--brand);
          font-family: 'Syne', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 16px;
        }

        .module-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 700;
          color: var(--paper);
          margin-bottom: 8px;
          letter-spacing: -0.2px;
        }

        .module-body {
          font-size: 12px;
          color: rgba(240,237,232,0.35);
          line-height: 1.6;
          font-weight: 300;
        }

        /* ── ROLES ── */
        .roles-section { padding: 100px 60px; }

        .roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 60px;
        }

        .role-card-land {
          border: 2px solid var(--ink);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 5px 5px 0px var(--ink);
          transition: all 0.15s;
        }

        .role-card-land:hover {
          transform: translate(-2px,-2px);
          box-shadow: 7px 7px 0px var(--ink);
        }

        .role-card-head {
          padding: 28px 28px 24px;
          background: var(--ink);
        }

        .role-card-head.donor { background: var(--brand); }
        .role-card-head.ngo { background: var(--ink); }
        .role-card-head.volunteer { background: var(--green); }

        .role-card-label {
          font-family: 'Syne', sans-serif;
          font-size: 10px; font-weight: 700;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .role-card-name {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .role-card-body {
          padding: 24px 28px;
          background: #fff;
        }

        .role-feature {
          display: flex; align-items: flex-start; gap: 10px;
          margin-bottom: 12px;
          font-size: 13px;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.4;
        }

        .role-feature:last-child { margin-bottom: 0; }

        .role-feature-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--brand);
          flex-shrink: 0;
          margin-top: 5px;
        }

        /* ── CTA BAND ── */
        .cta-band {
          margin: 0 60px 100px;
          background: var(--ink);
          border-radius: 24px;
          border: 2px solid var(--ink);
          padding: 64px 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          position: relative;
          overflow: hidden;
          box-shadow: 6px 6px 0px var(--brand);
        }

        .cta-band::before {
          content: '';
          position: absolute; top: -100px; right: -100px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(232,69,10,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .cta-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 800;
          color: var(--paper);
          letter-spacing: -1px;
          line-height: 1.1;
          position: relative; z-index: 1;
          max-width: 480px;
        }

        .cta-title span { color: var(--brand); }

        .cta-actions {
          display: flex; gap: 12px; flex-shrink: 0;
          position: relative; z-index: 1;
        }

        .cta-btn-main {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px;
          background: var(--brand);
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700;
          text-decoration: none;
          border-radius: 10px;
          border: 2px solid var(--paper);
          box-shadow: 3px 3px 0px var(--paper);
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }

        .cta-btn-main:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0px var(--paper); }

        .cta-btn-ghost {
          display: inline-flex; align-items: center;
          padding: 14px 24px;
          background: transparent;
          color: rgba(240,237,232,0.5);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 400;
          text-decoration: none;
          border-radius: 10px;
          border: 1.5px solid rgba(240,237,232,0.12);
          transition: all 0.2s;
        }

        .cta-btn-ghost:hover { color: var(--paper); border-color: rgba(240,237,232,0.3); }

        /* ── FOOTER ── */
        .footer {
          border-top: 1px solid rgba(26,23,20,0.08);
          padding: 40px 60px;
          display: flex; align-items: center; justify-content: space-between;
        }

        .footer-logo {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800;
          color: var(--brand);
          text-decoration: none;
        }

        .footer-copy {
          font-size: 12px;
          color: var(--muted);
          font-weight: 300;
        }

        .footer-links {
          display: flex; gap: 24px; list-style: none;
        }

        .footer-links a {
          font-size: 12px;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover { color: var(--ink); }

        @media (max-width: 900px) {
          .nav { padding: 16px 24px; }
          .nav-links { display: none; }
          .hero { padding: 100px 24px 60px; }
          .stats-bar { grid-template-columns: repeat(2,1fr); }
          .section { padding: 64px 24px; }
          .steps-grid { grid-template-columns: 1fr; }
          .modules-section { padding: 64px 24px; }
          .modules-grid { grid-template-columns: 1fr 1fr; }
          .roles-section { padding: 64px 24px; }
          .roles-grid { grid-template-columns: 1fr; }
          .cta-band { margin: 0 24px 64px; padding: 40px 32px; flex-direction: column; }
          .footer { padding: 32px 24px; flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-logo-mark">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#E8450A" strokeWidth="1.5"/>
              <path d="M7 10h6M10 7v6" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          ReServe
        </a>
        <ul className="nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#modules">Modules</a></li>
          <li><a href="#roles">Who it&apos;s for</a></li>
        </ul>
        <div className="nav-cta">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/register" className="btn-primary">Get started →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-bg-glow" />
        <div className="hero-content">
          <div className="hero-kicker">
            <div className="hero-kicker-dot" />
            Mumbai · Food Redistribution Platform
          </div>
          <h1 className="hero-title">
            Food that<br />
            <span className="accent">feeds</span> the<br />
            <span className="line-outline">future.</span>
          </h1>
          <p className="hero-desc">
            ReServe connects surplus food from restaurants, caterers, and canteens with verified NGOs and volunteers — in real time. Coordination that used to take 5 hours now takes under 30 minutes.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="hero-btn-main">
              Join ReServe
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/login" className="hero-btn-secondary">
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{display:"flex"}}>
              <div className="ticker-item">Donor Listing Portal <span className="ticker-sep">×</span></div>
              <div className="ticker-item">NGO Discovery & Claim <span className="ticker-sep">×</span></div>
              <div className="ticker-item">Volunteer Logistics <span className="ticker-sep">×</span></div>
              <div className="ticker-item">Real-time Notifications <span className="ticker-sep">×</span></div>
              <div className="ticker-item">Impact Dashboard <span className="ticker-sep">×</span></div>
              <div className="ticker-item">Admin Verification <span className="ticker-sep">×</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-num">7.4<span className="unit">K</span></div>
          <div className="stat-desc">Tonnes of food waste generated<br />in Mumbai daily (MCGM 2023)</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">94<span className="unit">%</span></div>
          <div className="stat-desc">Mumbai restaurants produce<br />daily surplus food</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">&lt;30<span className="unit">m</span></div>
          <div className="stat-desc">Target coordination time<br />vs. 3–5 hours today</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">189<span className="unit">M</span></div>
          <div className="stat-desc">Undernourished people<br />in India (FAO 2022)</div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works">
        <div className="section-kicker">How it works</div>
        <div className="section-title">From surplus to served in three steps.</div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <div className="step-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg>
            </div>
            <div className="step-title">Donor posts a listing</div>
            <div className="step-body">Restaurant uploads a photo, sets food type, quantity in kg, and a pickup window. The listing goes live on the NGO map within 5 seconds.</div>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <div className="step-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            </div>
            <div className="step-title">NGO discovers and claims</div>
            <div className="step-body">NGO coordinators see live pins on a Google Map. One-tap claim reserves the listing instantly and triggers a real-time alert to the donor.</div>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <div className="step-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
            </div>
            <div className="step-title">Volunteer completes pickup</div>
            <div className="step-body">Assigned volunteer navigates to the donor, collects food, and submits photo proof on delivery. Hours are logged and impact is tracked automatically.</div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="modules-section" id="modules">
        <div className="section-kicker">Platform modules</div>
        <div className="section-title">Six modules. One mission.</div>
        <div className="modules-grid">
          {[
            { tag: "M1", title: "Donor Listing Portal", body: "Post surplus food with photo, geo-tag, quantity, and pickup window. Auto-expires at window close." },
            { tag: "M2", title: "NGO Discovery & Claim", body: "Live Google Map with real-time listing pins. One-tap claim with instant donor notification." },
            { tag: "M3", title: "Volunteer Logistics", body: "Task feed, navigation deeplink, photo proof upload, and automatic hours logging." },
            { tag: "M4", title: "Notification Centre", body: "Per-role real-time alerts via Supabase Realtime. Unread badges and mark-as-read flow." },
            { tag: "M5", title: "Impact Dashboard", body: "Meals saved, kg rescued, CO₂ offset, weekly charts, and a donor leaderboard." },
            { tag: "M6", title: "Admin Verification", body: "KYC queue, approve/reject registrations, suspend accounts, full audit log." },
          ].map((m) => (
            <div key={m.tag} className="module-card">
              <div className="module-tag">{m.tag}</div>
              <div className="module-title">{m.title}</div>
              <div className="module-body">{m.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="roles-section" id="roles">
        <div className="section-kicker">Who it&apos;s for</div>
        <div className="section-title">Built for everyone in the chain.</div>
        <div className="roles-grid">
          <div className="role-card-land">
            <div className="role-card-head donor">
              <div className="role-card-label">Role 01</div>
              <div className="role-card-name">Donor</div>
            </div>
            <div className="role-card-body">
              <div className="role-feature"><div className="role-feature-dot"/><span>Post surplus listings with photo and pickup window</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>Track listing status in real time</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>View personal impact score and leaderboard rank</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>Get notified when your listing is claimed</span></div>
            </div>
          </div>
          <div className="role-card-land">
            <div className="role-card-head ngo">
              <div className="role-card-label">Role 02</div>
              <div className="role-card-name">NGO</div>
            </div>
            <div className="role-card-body">
              <div className="role-feature"><div className="role-feature-dot"/><span>Discover active listings on a live Google Map</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>Claim pickups with one tap</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>Assign volunteers and track pickup progress</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>Export grant-ready impact reports</span></div>
            </div>
          </div>
          <div className="role-card-land">
            <div className="role-card-head volunteer">
              <div className="role-card-label">Role 03</div>
              <div className="role-card-name">Volunteer</div>
            </div>
            <div className="role-card-body">
              <div className="role-feature"><div className="role-feature-dot"/><span>Accept or decline assigned pickup tasks</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>Get directions to donor location</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>Submit photo proof on completion</span></div>
              <div className="role-feature"><div className="role-feature-dot"/><span>Track hours logged and earn ratings</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <div className="cta-band">
        <div className="cta-title">
          Ready to <span>reduce waste</span> and feed communities?
        </div>
        <div className="cta-actions">
          <Link href="/register" className="cta-btn-main">
            Create account →
          </Link>
          <Link href="/login" className="cta-btn-ghost">
            Sign in
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <a href="/" className="footer-logo">ReServe</a>
        <div className="footer-copy">
          Third Year B.E. CS Project · 2025–26 · Mumbai
        </div>
        <ul className="footer-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#modules">Modules</a></li>
          <li><Link href="/login">Sign in</Link></li>
        </ul>
      </footer>
    </>
  );
}