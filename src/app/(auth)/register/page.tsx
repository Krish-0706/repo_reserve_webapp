"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Role = "donor" | "ngo" | "volunteer";

const ROLES: { value: Role; label: string; description: string; tag: string }[] = [
  { value: "donor", label: "Donor", tag: "RESTAURANT / CATERER", description: "Post surplus food listings with pickup windows" },
  { value: "ngo", label: "NGO", tag: "ORGANISATION / SHELTER", description: "Discover and claim nearby food listings" },
  { value: "volunteer", label: "Volunteer", tag: "INDIVIDUAL", description: "Accept tasks and complete pickups" },
];

export default function RegisterPage() {
  const supabase = createClient();
  const [role, setRole] = useState<Role | "">("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!role) { setError("Please select a role."); return false; }
    if (role === "ngo" && !orgName.trim()) { setError("Organisation name is required."); return false; }
    if (!email.includes("@") || !email.includes(".")) { setError("Enter a valid email address."); return false; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return false; }
    if (password !== confirm) { setError("Passwords do not match."); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) { setError(authError?.message ?? "Registration failed."); setLoading(false); return; }

    const userId = authData.user.id;
    const { error: profileError } = await supabase.from("users").insert({ id: userId, email, role, status: "pending" });
    if (profileError) { setError("Profile setup failed. Contact support."); setLoading(false); return; }

    if (role === "ngo") await supabase.from("ngos").insert({ id: userId, org_name: orgName.trim(), kyc_status: "pending", contact_phone: "" });
    if (role === "volunteer") await supabase.from("volunteers").insert({ id: userId, hours_logged: 0, rating: 0, tasks_completed: 0 });

    //Sign Out Immediately after registering
    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'DM Sans', sans-serif; }
          .success-root { min-height: 100vh; background: #F0EDE8; display: flex; align-items: center; justify-content: center; }
          .success-card {
            background: #fff;
            border: 2px solid #1A1714;
            border-radius: 20px;
            padding: 56px 48px;
            text-align: center;
            max-width: 440px;
            width: 100%;
            box-shadow: 6px 6px 0px #1A1714;
          }
          .success-icon {
            width: 64px; height: 64px;
            background: #1A1714;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
          }
          .success-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #1A1714; margin-bottom: 12px; }
          .success-body { font-size: 14px; color: #888; line-height: 1.65; margin-bottom: 32px; font-weight: 300; }
          .success-btn {
            display: inline-block; background: #E8450A; color: #fff;
            font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
            padding: 13px 36px; border-radius: 10px; text-decoration: none;
            box-shadow: 3px 3px 0px #1A1714; border: 2px solid #1A1714;
            transition: transform 0.15s, box-shadow 0.15s;
          }
          .success-btn:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0px #1A1714; }
        `}</style>
        <div className="success-root">
          <div className="success-card">
            <div className="success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="success-title">Registration submitted</div>
            <div className="success-body">
              Your account is pending admin approval.<br />
              You&apos;ll be notified by email once verified — usually within 24 hours.
            </div>
            <Link href="/login" className="success-btn">Back to Sign In</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .reg-root {
          min-height: 100vh;
          background: #F0EDE8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          font-family: 'DM Sans', sans-serif;
        }

        .reg-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .reg-logo {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #E8450A;
          letter-spacing: -0.5px;
          display: flex; align-items: center; gap: 8px;
          justify-content: center;
          margin-bottom: 6px;
        }

        .reg-logo-dot {
          width: 8px; height: 8px;
          background: #1A1714;
          border-radius: 50%;
          margin-bottom: 2px;
        }

        .reg-subtitle {
          font-size: 13px;
          color: #888;
          font-weight: 300;
        }

        /* Main card — horizontal layout */
        .reg-card {
          background: #fff;
          border: 2px solid #1A1714;
          border-radius: 20px;
          box-shadow: 6px 6px 0px #1A1714;
          width: 100%;
          max-width: 980px;
          display: grid;
          grid-template-columns: 300px 1fr;
          overflow: hidden;
        }

        /* Left col — role picker */
        .reg-roles-col {
          background: #1A1714;
          padding: 36px 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .reg-roles-heading {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: rgba(240,237,232,0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }

        .role-card {
          background: transparent;
          border: 1.5px solid rgba(240,237,232,0.12);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .role-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(232,69,10,0);
          transition: background 0.2s;
          border-radius: 10px;
        }

        .role-card.active {
          border-color: #E8450A;
          background: rgba(232,69,10,0.08);
        }

        .role-card.active::before {
          background: rgba(232,69,10,0.04);
        }

        .role-card:hover:not(.active) {
          border-color: rgba(240,237,232,0.3);
        }

        .role-tag {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240,237,232,0.35);
          margin-bottom: 6px;
        }

        .role-card.active .role-tag { color: #E8450A; }

        .role-name {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: rgba(240,237,232,0.75);
          margin-bottom: 4px;
        }

        .role-card.active .role-name { color: #F0EDE8; }

        .role-desc {
          font-size: 11px;
          color: rgba(240,237,232,0.3);
          line-height: 1.5;
          font-weight: 300;
        }

        .role-card.active .role-desc { color: rgba(240,237,232,0.5); }

        .role-indicator {
          position: absolute;
          top: 14px; right: 14px;
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 1.5px solid rgba(240,237,232,0.2);
          transition: all 0.2s;
        }

        .role-card.active .role-indicator {
          border-color: #E8450A;
          background: #E8450A;
          box-shadow: 0 0 0 3px rgba(232,69,10,0.2);
        }

        /* Right col — form */
        .reg-form-col {
          padding: 36px 40px;
          display: flex;
          flex-direction: column;
        }

        .reg-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #1A1714;
          margin-bottom: 4px;
        }

        .reg-form-sub {
          font-size: 13px;
          color: #888;
          font-weight: 300;
          margin-bottom: 28px;
        }

        .reg-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 12px;
          color: #DC2626;
          margin-bottom: 18px;
        }

        /* 2-column grid for fields */
        .reg-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          flex: 1;
        }

        .field-full { grid-column: 1 / -1; }

        .form-group { display: flex; flex-direction: column; }

        .form-label {
          font-size: 10px;
          font-weight: 500;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          margin-bottom: 7px;
        }

        .form-input {
          height: 46px;
          border-radius: 10px;
          border: 1.5px solid #E0DDD8;
          background: #F8F6F3;
          padding: 0 14px;
          font-size: 14px;
          color: #1A1714;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: inset 2px 2px 4px rgba(0,0,0,0.05), inset -1px -1px 3px rgba(255,255,255,0.9);
        }

        .form-input:focus {
          border-color: #E8450A;
          box-shadow: inset 2px 2px 4px rgba(0,0,0,0.05), inset -1px -1px 3px rgba(255,255,255,0.9), 0 0 0 3px rgba(232,69,10,0.07);
        }

        .form-input::placeholder { color: #C5C2BC; }

        .pass-wrap { position: relative; }

        .pass-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #AAA; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: #555; }

        .reg-actions {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .reg-note {
          font-size: 11px;
          color: #AAA;
          line-height: 1.5;
          font-weight: 300;
          max-width: 200px;
        }

        .reg-submit {
          height: 48px;
          padding: 0 36px;
          border-radius: 10px;
          background: #E8450A;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          border: 2px solid #1A1714;
          cursor: pointer;
          box-shadow: 3px 3px 0px #1A1714;
          transition: transform 0.15s, box-shadow 0.15s;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }

        .reg-submit:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0px #1A1714;
        }

        .reg-submit:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px #1A1714;
        }

        .reg-submit:disabled { background: #E89070; cursor: not-allowed; }

        .reg-signin {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #EEE;
          font-size: 12px;
          color: #888;
        }

        .reg-signin a {
          color: #E8450A;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid rgba(232,69,10,0.3);
          padding-bottom: 1px;
        }

        .reg-signin a:hover { border-color: #E8450A; }

        @media (max-width: 700px) {
          .reg-card { grid-template-columns: 1fr; max-width: 440px; }
          .reg-roles-col { flex-direction: row; overflow-x: auto; gap: 8px; }
          .role-card { min-width: 160px; }
          .reg-fields { grid-template-columns: 1fr; }
          .field-full { grid-column: 1; }
        }
      `}</style>

      <div className="reg-root">
        <div className="reg-header">
          <div className="reg-logo">
            <div className="reg-logo-dot" />
            ReServe
          </div>
          <div className="reg-subtitle">Technology-driven food surplus redistribution</div>
        </div>

        <div className="reg-card">

          {/* Role picker */}
          <div className="reg-roles-col">
            <div className="reg-roles-heading">Select your role</div>
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`role-card ${role === r.value ? "active" : ""}`}
                onClick={() => setRole(r.value)}
              >
                <div className="role-tag">{r.tag}</div>
                <div className="role-name">{r.label}</div>
                <div className="role-desc">{r.description}</div>
                <div className="role-indicator" />
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="reg-form-col">
            <div className="reg-form-title">Create account</div>
            <div className="reg-form-sub">Fill in your details to get started on ReServe</div>

            {error && <div className="reg-error">{error}</div>}

            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div className="reg-fields">

                {/* Org name — NGO only, full width */}
                {role === "ngo" && (
                  <div className="form-group field-full">
                    <label className="form-label">Organisation Name</label>
                    <input type="text" className="form-input" placeholder="e.g. Mumbai Food Bank" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                  </div>
                )}

                {/* Email — full width */}
                <div className="form-group field-full">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="pass-wrap">
                    <input type={showPass ? "text" : "password"} className="form-input" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: "40px", width: "100%" }} autoComplete="new-password" />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                      {showPass
                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="pass-wrap">
                    <input type={showConfirm ? "text" : "password"} className="form-input" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ paddingRight: "40px", width: "100%" }} autoComplete="new-password" />
                    <button type="button" className="pass-toggle" onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm
                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

              </div>

              <div className="reg-actions">
                <div className="reg-note">All accounts are reviewed before activation. NGOs require KYC upload.</div>
                <button type="submit" className="reg-submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Account →"}
                </button>
              </div>
            </form>

            <div className="reg-signin">
              Already have an account? <Link href="/login">Sign in →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}