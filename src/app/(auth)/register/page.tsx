"use client";
// src/app/(auth)/register/page.tsx

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Role = "donor" | "ngo" | "volunteer";


const ROLES: { value: Role; tag: string; label: string; description: string }[] = [
  { value: "donor",     tag: "RESTAURANT / CATERER",   label: "Donor",     description: "Post surplus food listings with pickup windows" },
  { value: "ngo",       tag: "ORGANISATION / SHELTER", label: "NGO",       description: "Discover and claim nearby food listings" },
  { value: "volunteer", tag: "INDIVIDUAL",              label: "Volunteer", description: "Accept tasks and complete pickups" },
];

export default function RegisterPage() {
  const supabase = createClient();
  const [role,         setRole]         = useState<Role | "">("");
  const [orgName,      setOrgName]      = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [ngoState,     setNgoState]     = useState("");
  const [ngoDistrict,  setNgoDistrict]  = useState("");
  const [ngoCity,      setNgoCity]      = useState("");
  const [ngoLandmark,  setNgoLandmark]  = useState("");
  const [volName,      setVolName]      = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);

  const validate = () => {
    if (!role)                                         { setError("Please select a role."); return false; }
    if (role === "ngo" && !orgName.trim())             { setError("Organisation name is required."); return false; }
    if (role === "ngo" && !contactPhone.trim())        { setError("Contact phone number is required."); return false; }
    if (role === "ngo" && !ngoState.trim())             { setError("State is required for NGOs."); return false; }
    if (role === "ngo" && !ngoCity.trim())              { setError("City is required for NGOs."); return false; }
    if (role === "volunteer" && !volName.trim())       { setError("Your name is required."); return false; }
    if (!email.includes("@") || !email.includes(".")) { setError("Enter a valid email address."); return false; }
    if (password.length < 8)                          { setError("Password must be at least 8 characters."); return false; }
    if (password !== confirm)                          { setError("Passwords do not match."); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.signUp({ email, password });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Registration failed."); setLoading(false); return;
    }

    const userId = authData.user.id;

    const { error: profileError } = await supabase
      .from("users").insert({ id: userId, email, role, status: "pending" });

    if (profileError) {
      setError("Profile setup failed. Contact support."); setLoading(false); return;
    }

    if (role === "ngo") {
      await supabase.from("ngos").insert({
        id: userId, org_name: orgName.trim(), kyc_status: "pending", contact_phone: contactPhone.trim(),
        state: ngoState.trim() || null, district: ngoDistrict.trim() || null,
        city: ngoCity.trim() || null, landmark: ngoLandmark.trim() || null,
      });
    }
    if (role === "volunteer") {
      await supabase.from("volunteers").insert({
        id: userId, hours_logged: 0, rating: 0, tasks_completed: 0, vol_name: volName.trim(),
      });
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
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
    );
  }

  // ── Register form ─────────────────────────────────────────────────────────
  return (
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

          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: "flex", flexDirection: "column", flex: 1 }}
          >
            <div className="reg-fields">

              {role === "ngo" && (
                <>
                  <div className="form-group field-full">
                    <label className="form-label">Organisation Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Mumbai Food Bank"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                  <div className="form-group field-full">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +91 98765 43210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Maharashtra"
                      value={ngoState}
                      onChange={(e) => setNgoState(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Mumbai Suburban"
                      value={ngoDistrict}
                      onChange={(e) => setNgoDistrict(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Mumbai"
                      value={ngoCity}
                      onChange={(e) => setNgoCity(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Landmark</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Near Andheri Station"
                      value={ngoLandmark}
                      onChange={(e) => setNgoLandmark(e.target.value)}
                    />
                  </div>
                </>
              )}

              {role === "volunteer" && (
                <div className="form-group field-full">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={volName}
                    onChange={(e) => setVolName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group field-full">
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
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: "40px" }}
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                    {showPass
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="pass-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="form-input"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: "40px" }}
                  />
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
              <div className="reg-note">
                All accounts are reviewed before activation. NGOs require KYC upload after approval.
              </div>
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
  );
}