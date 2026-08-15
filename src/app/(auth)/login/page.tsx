"use client";
// src/app/(auth)/login/page.tsx

import { useState } from "react";
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
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email address."); return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters."); return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      setError("Invalid email or password."); setLoading(false); return;
    }

    const { data: profile } = await supabase
      .from("users").select("role, status").eq("id", authData.user.id).single();

    if (!profile) {
      setError("Account not found. Contact support."); setLoading(false); return;
    }
    if (profile.status === "suspended") {
      await supabase.auth.signOut();
      setError("Account suspended. Contact support."); setLoading(false); return;
    }
    if (profile.status === "rejected") {
      await supabase.auth.signOut();
      setError("Account registration rejected. Contact support."); setLoading(false); return;
    }
    if (profile.status === "pending") {
      if (profile.role === "ngo") {
        window.location.href = "/ngo/kyc";
        return;
      }
      await supabase.auth.signOut();
      setError("Account pending admin approval."); setLoading(false); return;
    }

    window.location.href = ROLE_HOME[profile.role] ?? "/";
  };

  return (
    <div className="login-root">

      {/* Left panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="#fff" strokeWidth="1.5" />
                <path d="M7 10h6M10 7v6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            ReServe
          </div>
        </div>

        <div className="login-tagline">
          <h2>Food that <span>feeds</span> the future.</h2>
          <p>Connecting surplus food donors with NGOs and volunteers in real time.</p>
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

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-header">
            <h1>Welcome back</h1>
            <p>Sign in to continue to ReServe</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{ height: "50px", borderRadius: "12px" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label className="form-label">Password</label>
              <div className="pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ height: "50px", borderRadius: "12px", paddingRight: "44px" }}
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
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
  );
}