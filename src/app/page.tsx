// src/app/page.tsx
// ReServe Landing Page — no <style> tags, all CSS in reserve.css

import Link from "next/link";
import heroImg from "./images/hero.jpg";

export default function LandingPage() {
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-logo-mark">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#E8450A" strokeWidth="1.5" />
              <path d="M7 10h6M10 7v6" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round" />
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

        <div className="hero-visual-col">
          <div className="hero-visual">
            <div className="hero-visual-frame" />
            <div className="hero-visual-photo">
              <img
                src={heroImg.src}
                width={900}
                height={600}
                alt="Restaurant kitchen preparing food"
              />
              <div className="hero-visual-photo-fade" />
            </div>

          </div>
        </div>

        <div className="hero-content">
          <div className="hero-kicker">
            <div className="hero-kicker-dot" />
            Food Redistribution Platform
          </div>
          <h1 className="hero-title">
            Food that<br />
            <span className="accent">feeds</span> the<br />
            <span className="line-outline">future.</span>
          </h1>
          <p className="hero-desc">
            ReServe connects surplus food from restaurants, caterers, and canteens
            with verified NGOs and volunteers — in real time. Coordination that used
            to take 5 hours now takes under 30 minutes.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="hero-btn-main">
              Join ReServe
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
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
            <div key={i} style={{ display: "flex" }}>
              {[
                "Donor Listing Portal",
                "NGO Discovery & Claim",
                "Volunteer Logistics",
                "Real-time Notifications",
                "Impact Dashboard",
                "Admin Verification",
              ].map((item) => (
                <div key={item} className="ticker-item">
                  {item} <span className="ticker-sep">×</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        {[
          { num: "7.4", unit: "K", desc: "Tonnes of food waste generated\nin Mumbai daily (MCGM 2023)" },
          { num: "94", unit: "%", desc: "Mumbai restaurants produce\ndaily surplus food" },
          { num: "<30", unit: "m", desc: "Target coordination time\nvs. 3–5 hours today" },
          { num: "189", unit: "M", desc: "Undernourished people\nin India (FAO 2022)" },
        ].map((s) => (
          <div key={s.unit + s.num} className="stat-item">
            <div className="stat-num">
              {s.num}<span className="unit">{s.unit}</span>
            </div>
            <div className="stat-desc" style={{ whiteSpace: "pre-line" }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works">
        <div className="section-kicker">How it works</div>
        <div className="section-title">From surplus to served in three steps.</div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <div className="step-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <div className="step-title">Donor posts a listing</div>
            <div className="step-body">
              Restaurant uploads a photo, sets food type, quantity in kg, and a pickup window.
              The listing goes live on the NGO map within 5 seconds.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <div className="step-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
            </div>
            <div className="step-title">NGO discovers and claims</div>
            <div className="step-body">
              NGO coordinators see live pins on a Google Map.
              One-tap claim reserves the listing instantly and triggers a real-time alert to the donor.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <div className="step-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div className="step-title">Volunteer completes pickup</div>
            <div className="step-body">
              Assigned volunteer navigates to the donor, collects food,
              and submits photo proof on delivery. Hours are logged and impact tracked automatically.
            </div>
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
          {[
            {
              cls: "donor", label: "Role 01", name: "Donor",
              features: [
                "Post surplus listings with photo and pickup window",
                "Track listing status in real time",
                "View personal impact score and leaderboard rank",
                "Get notified when your listing is claimed",
              ],
            },
            {
              cls: "ngo", label: "Role 02", name: "NGO",
              features: [
                "Discover active listings on a live Google Map",
                "Claim pickups with one tap",
                "Assign volunteers and track pickup progress",
                "Export grant-ready impact reports",
              ],
            },
            {
              cls: "volunteer", label: "Role 03", name: "Volunteer",
              features: [
                "Accept or decline assigned pickup tasks",
                "Get directions to donor location",
                "Submit photo proof on completion",
                "Track hours logged and earn ratings",
              ],
            },
          ].map((r) => (
            <div key={r.cls} className="role-card-land">
              <div className={`role-card-head ${r.cls}`}>
                <div className="role-card-label">{r.label}</div>
                <div className="role-card-name">{r.name}</div>
              </div>
              <div className="role-card-body">
                {r.features.map((f) => (
                  <div key={f} className="role-feature">
                    <div className="role-feature-dot" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
          Third Year Bsc IT Project · 2025–26 · Mumbai
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