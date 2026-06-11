"use client";
// src/app/(donor)/listings/create/page.tsx
//
// Two-step listing creation form.
//
// Step 1: Photo upload (Cloudinary) + food type selector + quantity
// Step 2: Address + geolocation + pickup window → POST /api/listings
//
// State management: all form fields live in this one component.
// Navigation between steps is handled by a local `step` state variable,
// not by URL routing — keeps the form data in memory between steps.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type FoodType = "Cooked" | "Raw" | "Baked" | "Packaged" | "Beverages" | "Other";

const FOOD_TYPES: FoodType[] = ["Cooked", "Raw", "Baked", "Packaged", "Beverages", "Other"];

// ─── Cloudinary unsigned upload ───────────────────────────────────────────────
// Sends the file directly to Cloudinary from the browser.
// No server involvement — Cloudinary handles storage and returns a URL.
async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  formData.append("folder", "reserve/listings");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url as string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateListingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl,     setPhotoUrl]     = useState<string | null>(null);  // Cloudinary URL after upload
  const [foodType,     setFoodType]     = useState<FoodType | "">("");
  const [quantityKg,   setQuantityKg]   = useState<string>("");
  const [uploadingImg, setUploadingImg] = useState(false);

  // Step 2 fields
  const [address,      setAddress]      = useState("");
  const [lat,          setLat]          = useState<number | null>(null);
  const [lng,          setLng]          = useState<number | null>(null);
  const [locLoading,   setLocLoading]   = useState(false);
  const [pickupStart,  setPickupStart]  = useState("");
  const [pickupEnd,    setPickupEnd]    = useState("");

  // Shared
  const [error,        setError]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Photo selection ──────────────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (max 5MB)
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Image must be under 5MB."); return; }

    setError("");
    setPhotoFile(file);

    // Show local preview immediately — no waiting for upload
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Geolocation ───────────────────────────────────────────────────────────
  // Gets the browser's current position and stores lat/lng.
  // The donor can also type an address manually — lat/lng defaults to 0,0
  // if they skip geolocation (not ideal but functional for MVP).
  const handleGetLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported by your browser."); return; }
    setLocLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocLoading(false);
      },
      (err) => {
        setError("Could not get location. Please enter address manually.");
        setLocLoading(false);
        // Fallback to Mumbai centre so the listing still works
        setLat(19.0760);
        setLng(72.8777);
      },
      { timeout: 10000 }
    );
  };

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
  const handleStep1Next = async () => {
    setError("");

    if (!foodType)             { setError("Please select a food type."); return; }
    if (!quantityKg || isNaN(Number(quantityKg)) || Number(quantityKg) <= 0) {
      setError("Enter a valid quantity in kg."); return;
    }

    // Upload photo to Cloudinary now (before step 2)
    // This way if upload fails, user hasn't lost step 2 data
    if (photoFile && !photoUrl) {
      setUploadingImg(true);
      try {
        const url = await uploadToCloudinary(photoFile);
        setPhotoUrl(url);
      } catch {
        setError("Photo upload failed. Please try again.");
        setUploadingImg(false);
        return;
      }
      setUploadingImg(false);
    }

    setStep(2);
  };

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!address.trim())  { setError("Please enter a pickup address."); return; }
    if (!pickupStart)     { setError("Please set a pickup start time."); return; }
    if (!pickupEnd)       { setError("Please set a pickup end time."); return; }

    const startDate = new Date(pickupStart);
    const endDate   = new Date(pickupEnd);
    if (endDate <= startDate) { setError("Pickup end must be after start."); return; }

    setSubmitting(true);

    // If no geolocation was captured, use Mumbai centre as fallback
    const finalLat = lat ?? 19.0760;
    const finalLng = lng ?? 72.8777;

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_type:    foodType,
        quantity_kg:  Number(quantityKg),
        photo_url:    photoUrl,
        address:      address.trim(),
        lat:          finalLat,
        lng:          finalLng,
        pickup_start: startDate.toISOString(),
        pickup_end:   endDate.toISOString(),
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Failed to create listing. Please try again.");
      setSubmitting(false);
      return;
    }

    // Redirect to the new listing's detail page
    router.push(`/donor/listings/${json.data.id}`);
  };

  // ─── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", height: "48px",
    borderRadius: "10px",
    border: "1.5px solid #E0DDD8",
    background: "#F8F6F3",
    padding: "0 14px",
    fontSize: "14px", color: "#1A1714",
    fontFamily: "DM Sans, sans-serif",
    outline: "none",
    boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.05), inset -1px -1px 3px rgba(255,255,255,0.9)",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "10px", fontWeight: 500,
    color: "#888", textTransform: "uppercase",
    letterSpacing: "0.09em", marginBottom: "7px",
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dash-root">

      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-logo">ReServe</div>
        <div className="dash-nav-label">Main</div>
        <button className="dash-nav-item" onClick={() => router.push("/donor/dashboard")}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Dashboard
        </button>
        <button className="dash-nav-item active">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#E8450A", flexShrink:0 }} />
          Post Listing
        </button>
        <button className="dash-nav-item" onClick={() => router.push("/donor/impact")}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Impact
        </button>
        <div className="dash-nav-label">Account</div>
        <button className="dash-nav-item">
          <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", flexShrink:0 }} />
          Notifications
        </button>
        <button className="dash-signout" onClick={async () => {
          const supabaseClient = createClient();
          await supabaseClient.auth.signOut();
          window.location.href = "/login";
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="dash-main">

        {/* Top bar */}
        <div className="dash-topbar">
          <div>
            <div className="dash-greeting">Post a Listing</div>
            <div className="dash-greeting-sub">
              {step === 1 ? "Step 1 of 2 — Food details and photo" : "Step 2 of 2 — Location and pickup window"}
            </div>
          </div>
          <div className="dash-badge">DONOR</div>
        </div>

        {/* Progress bar */}
        <div style={{
          background: "#E0DDD8", borderRadius: "4px",
          height: "4px", marginBottom: "32px",
        }}>
          <div style={{
            background: "#E8450A",
            width: step === 1 ? "50%" : "100%",
            height: "4px", borderRadius: "4px",
            transition: "width 0.3s ease",
          }} />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: "10px", padding: "11px 14px",
            fontSize: "13px", color: "#DC2626", marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* ── STEP 1 ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{
            background: "#fff",
            border: "1.5px solid #E0DDD8",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "4px 4px 10px rgba(0,0,0,0.05), -2px -2px 6px rgba(255,255,255,0.9)",
            maxWidth: "640px",
          }}>

            {/* Photo upload */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Food Photo (optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed",
                  borderColor: photoPreview ? "#E8450A" : "#E0DDD8",
                  borderRadius: "12px",
                  height: "180px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  position: "relative",
                  background: "#F8F6F3",
                  transition: "border-color 0.2s",
                }}
              >
                {photoPreview ? (
                  // Show preview of selected image
                  <>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "12px", color: "#fff", fontWeight: 500 }}>
                        Click to change photo
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.5" style={{ marginBottom: "10px" }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span style={{ fontSize: "13px", color: "#AAA", fontWeight: 300 }}>
                      Click to upload photo
                    </span>
                    <span style={{ fontSize: "11px", color: "#CCC", marginTop: "4px" }}>
                      JPG, PNG up to 5MB
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: "none" }}
              />
            </div>

            {/* Food type chips */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Food Type</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {FOOD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFoodType(type)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "999px",
                      border: `1.5px solid ${foodType === type ? "#E8450A" : "#E0DDD8"}`,
                      background: foodType === type ? "#FEF0EA" : "#F8F6F3",
                      color: foodType === type ? "#E8450A" : "#888",
                      fontSize: "13px",
                      fontWeight: foodType === type ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Quantity</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  placeholder="e.g. 12"
                  style={{ ...inputStyle, maxWidth: "160px" }}
                />
                <span style={{
                  background: "#F0EDE8",
                  border: "1.5px solid #E0DDD8",
                  borderRadius: "10px",
                  padding: "0 16px",
                  height: "48px",
                  display: "flex", alignItems: "center",
                  fontSize: "14px", color: "#888",
                  fontWeight: 500,
                }}>
                  kg
                </span>
              </div>
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={handleStep1Next}
              disabled={uploadingImg}
              style={{
                height: "50px", padding: "0 36px",
                borderRadius: "12px",
                background: uploadingImg ? "#E89070" : "#E8450A",
                color: "#fff",
                fontFamily: "Syne, sans-serif",
                fontSize: "14px", fontWeight: 700,
                border: "none",
                cursor: uploadingImg ? "not-allowed" : "pointer",
                boxShadow: "3px 3px 0px #1A1714",
                transition: "transform 0.15s, box-shadow 0.15s",
                letterSpacing: "0.02em",
              }}
            >
              {uploadingImg ? "Uploading photo..." : "Next — Location & Time →"}
            </button>
          </div>
        )}

        {/* ── STEP 2 ─────────────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{
              background: "#fff",
              border: "1.5px solid #E0DDD8",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "4px 4px 10px rgba(0,0,0,0.05), -2px -2px 6px rgba(255,255,255,0.9)",
              maxWidth: "640px",
            }}>

              {/* Address */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Pickup Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 42 Hill Road, Bandra West, Mumbai"
                  style={inputStyle}
                />
              </div>

              {/* Geolocation */}
              <div style={{ marginBottom: "24px" }}>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: `1.5px solid ${lat ? "#1D9E75" : "#E0DDD8"}`,
                    background: lat ? "#E6F7F2" : "#F8F6F3",
                    color: lat ? "#1D9E75" : "#888",
                    fontSize: "13px", fontWeight: 500,
                    cursor: locLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  {locLoading ? "Getting location..." : lat ? `Location set (${lat.toFixed(4)}, ${lng!.toFixed(4)})` : "Use my current location"}
                </button>
                <p style={{ fontSize: "11px", color: "#AAA", marginTop: "6px", fontWeight: 300 }}>
                  Used to show your listing on the NGO map. If skipped, defaults to Mumbai centre.
                </p>
              </div>

              {/* Pickup window */}
              <div style={{ marginBottom: "32px" }}>
                <label style={labelStyle}>Pickup Window</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#AAA", marginBottom: "5px" }}>From</div>
                    <input
                      type="datetime-local"
                      value={pickupStart}
                      onChange={(e) => setPickupStart(e.target.value)}
                      style={inputStyle}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#AAA", marginBottom: "5px" }}>Until</div>
                    <input
                      type="datetime-local"
                      value={pickupEnd}
                      onChange={(e) => setPickupEnd(e.target.value)}
                      style={inputStyle}
                      min={pickupStart || new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              </div>

              {/* Summary preview */}
              <div style={{
                background: "#F8F6F3",
                border: "1px solid #E0DDD8",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "24px",
                fontSize: "13px",
                color: "#555",
              }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: "11px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                  Listing Summary
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span><strong style={{ color: "#1A1714" }}>Food:</strong> {foodType || "—"}</span>
                  <span><strong style={{ color: "#1A1714" }}>Quantity:</strong> {quantityKg ? `${quantityKg} kg` : "—"}</span>
                  <span><strong style={{ color: "#1A1714" }}>Photo:</strong> {photoUrl ? "Uploaded" : "None"}</span>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  style={{
                    height: "50px", padding: "0 24px",
                    borderRadius: "12px",
                    background: "transparent",
                    color: "#888",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "14px",
                    border: "1.5px solid #E0DDD8",
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1, height: "50px",
                    borderRadius: "12px",
                    background: submitting ? "#E89070" : "#E8450A",
                    color: "#fff",
                    fontFamily: "Syne, sans-serif",
                    fontSize: "14px", fontWeight: 700,
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "3px 3px 0px #1A1714",
                    letterSpacing: "0.02em",
                  }}
                >
                  {submitting ? "Posting listing..." : "Post Listing →"}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}