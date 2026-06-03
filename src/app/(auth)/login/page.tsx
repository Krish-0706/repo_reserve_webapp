"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ROLE_HOME: Record<string, string> = {
  donor: "/donor/dashboard",
  ngo: "/ngo/map",
  volunteer: "/volunteer/tasks",
  admin: "/admin/kyc",
};

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.includes("@") || !email.includes(".")) { setError("Enter a valid email address."); return false; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) { setError("Invalid email or password."); setLoading(false); return; }

    const { data: profile } = await supabase.from("users").select("role, status").eq("id", authData.user.id).single();
    if (!profile) { setError("Account not found. Contact support."); setLoading(false); return; }
    if (profile.status === "suspended") { await supabase.auth.signOut(); setError("Account suspended. Contact support."); setLoading(false); return; }
    if (profile.status === "pending") { await supabase.auth.signOut(); setError("Account pending admin approval."); setLoading(false); return; }

    window.location.href = ROLE_HOME[profile.role] ?? "/";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-root {
          min-height: 100vh;
          background: #F0EDE8;
          display: flex;
          font-family: 'DM Sans', sans-serif;
        }

        /* Left panel */
        .login-left {
          width: 42%;
          background: #1A1714;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,69,10,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-left::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,69,10,0.10) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-brand {
          position: relative;
          z-index: 1;
        }

        .login-logo {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #E8450A;
          letter-spacing: -1px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .login-logo-icon {
          width: 36px; height: 36px;
          background: #E8450A;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }

        .login-logo-icon svg { width: 20px; height: 20px; }

        .login-tagline {
          margin-top: 48px;
          position: relative;
          z-index: 1;
        }

        .login-tagline h2 {
          font-family: 'Syne', sans-serif;
          font-size: 38px;
          font-weight: 700;
          color: #F0EDE8;
          line-height: 1.15;
          letter-spacing: -0.5px;
        }

        .login-tagline h2 span {
          color: #E8450A;
        }

        .login-tagline p {
          margin-top: 16px;
          font-size: 14px;
          color: rgba(240,237,232,0.45);
          line-height: 1.6;
          font-weight: 300;
          max-width: 280px;
        }

        .login-stats {
          display: flex;
          gap: 32px;
          position: relative;
          z-index: 1;
        }

        .login-stat {
          border-top: 1px solid rgba(240,237,232,0.12);
          padding-top: 16px;
        }

        .login-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #E8450A;
        }

        .login-stat-label {
          font-size: 11px;
          color: rgba(240,237,232,0.35);
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* Right panel */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        .login-form-wrap {
          width: 100%;
          max-width: 400px;
        }

        .login-form-header {
          margin-bottom: 36px;
        }

        .login-form-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #1A1714;
          letter-spacing: -0.5px;
        }

        .login-form-header p {
          font-size: 14px;
          color: #888;
          margin-top: 6px;
          font-weight: 300;
        }

        .login-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          color: #DC2626;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          height: 50px;
          border-radius: 12px;
          border: 1.5px solid #E0DDD8;
          background: #F8F6F3;
          padding: 0 16px;
          font-size: 14px;
          color: #1A1714;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          /* Neumorphism */
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.8);
        }

        .form-input:focus {
          border-color: #E8450A;
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.8), 0 0 0 3px rgba(232,69,10,0.08);
        }

        .form-input::placeholder { color: #BBBBBB; }

        .pass-wrap { position: relative; }

        .pass-toggle {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #AAA; padding: 4px;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: #555; }

        .submit-btn {
          width: 100%;
          height: 50px;
          border-radius: 12px;
          background: #E8450A;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          margin-top: 8px;
          letter-spacing: 0.02em;
          /* Neubrutalism shadow */
          box-shadow: 3px 3px 0px #1A1714;
          transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
          position: relative;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0px #1A1714;
        }

        .submit-btn:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px #1A1714;
        }

        .submit-btn:disabled {
          background: #E89070;
          cursor: not-allowed;
          box-shadow: 2px 2px 0px #AAA;
        }

        .login-divider {
          border: none;
          border-top: 1px solid #E0DDD8;
          margin: 24px 0;
        }

        .login-register-link {
          text-align: center;
          font-size: 13px;
          color: #888;
        }

        .login-register-link a {
          color: #E8450A;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid rgba(232,69,10,0.3);
          padding-bottom: 1px;
          transition: border-color 0.2s;
        }

        .login-register-link a:hover { border-color: #E8450A; }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { padding: 24px; }
        }
      `}</style>

      <div className="login-root">

        {/* Left — brand panel */}
        <div className="login-left">
          <div className="login-brand">
            <div className="login-logo">
              <div className="login-logo-icon">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 10C3 6.13 6.13 3 10 3s7 3.13 7 7-3.13 7-7 7-7-3.13-7-7z" stroke="#fff" strokeWidth="1.5"/>
                  <path d="M7 10h6M10 7v6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              ReServe
            </div>
          </div>

          <div className="login-tagline">
            <h2>Food that <span>feeds</span> the future.</h2>
            <p>Connecting surplus food donors with NGOs and volunteers across Mumbai in real time.</p>
          </div>

          <div className="login-stats">
            <div className="login-stat">
              <div className="login-stat-num">7.4K</div>
              <div className="login-stat-label">Tonnes saved daily</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-num">94%</div>
              <div className="login-stat-label">Donor surplus rate</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-num">&lt;30m</div>
              <div className="login-stat-label">Avg. claim time</div>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="login-right">
          <div className="login-form-wrap">

            <div className="login-form-header">
              <h1>Welcome back</h1>
              <p>Sign in to continue to ReServe</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="pass-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: "44px" }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <hr className="login-divider" />

            <div className="login-register-link">
              Don&apos;t have an account?{" "}
              <Link href="/register">Register →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}