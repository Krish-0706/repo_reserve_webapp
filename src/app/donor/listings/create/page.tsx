"use client";
// src/app/(donor)/listings/create/page.tsx
//
// v2 changes:
//  - Step 2 location tip card removed → replaced with "What happens next" timeline card
//  - PageLoader shown during photo upload, final submit, and navigation
//  - Spinner inside buttons during async actions
//  - Refined spacing throughout

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner, PageLoader } from "@/components/shared/Loader";
import { useIsMobile } from "@/hooks/useIsMobile";

type FoodType = "Cooked" | "Raw" | "Baked" | "Packaged" | "Beverages" | "Other";
const FOOD_TYPES: FoodType[] = ["Cooked", "Raw", "Baked", "Packaged", "Beverages", "Other"];

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

function FoodBowlIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
      <path d="M60 20c0 8-8 8-8 16s8 8 8 16" stroke="#E8450A" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M80 14c0 8-8 8-8 16s8 8 8 16" stroke="#E8450A" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M100 20c0 8-8 8-8 16s8 8 8 16" stroke="#E8450A" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M30 65h100l-8 30a12 12 0 01-12 10H50a12 12 0 01-12-10l-8-30z" fill="#F3F4F6" stroke="#111111" strokeWidth="2" />
      <ellipse cx="80" cy="65" rx="50" ry="10" fill="#E8450A" opacity="0.15" />
      <ellipse cx="80" cy="63" rx="42" ry="7" fill="#E8450A" />
      <path d="M30 65h100" stroke="#111111" strokeWidth="2" />
    </svg>
  );
}

export default function CreateListingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [step, setStep] = useState<1 | 2>(1);
  const [navigating, setNavigating] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [foodName, setFoodName] = useState("");
  const [foodType, setFoodType] = useState<FoodType | "">("");
  const [quantityKg, setQuantityKg] = useState<string>("");
  const [uploadingImg, setUploadingImg] = useState(false);

  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [pickupStart, setPickupStart] = useState("");
  const [pickupEnd, setPickupEnd] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setError("");
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setLocLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocLoading(false); },
      () => { setError("Could not get location. Defaulting to Mumbai centre."); setLocLoading(false); setLat(19.0760); setLng(72.8777); },
      { timeout: 10000 }
    );
  };

  const handleStep1Next = async () => {
    setError("");
    if (!foodName.trim()) { setError("Please enter a food item name."); return; }
    if (!foodType) { setError("Please select a food category."); return; }
    if (!quantityKg || isNaN(Number(quantityKg)) || Number(quantityKg) <= 0) {
      setError("Enter a valid quantity in kg."); return;
    }

    if (photoFile && !photoUrl) {
      setUploadingImg(true);
      try { setPhotoUrl(await uploadToCloudinary(photoFile)); }
      catch { setError("Photo upload failed. Please try again."); setUploadingImg(false); return; }
      setUploadingImg(false);
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!address.trim()) { setError("Please enter a pickup address."); return; }
    if (!pickupStart) { setError("Please set a pickup start time."); return; }
    if (!pickupEnd) { setError("Please set a pickup end time."); return; }

    const startDate = new Date(pickupStart);
    const endDate = new Date(pickupEnd);
    if (endDate <= startDate) { setError("Pickup end must be after start."); return; }

    setSubmitting(true);
    const finalLat = lat ?? 19.0760;
    const finalLng = lng ?? 72.8777;

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_name: foodName.trim(),
        food_type: foodType,
        quantity_kg: Number(quantityKg),
        photo_url: photoUrl,
        address: address.trim(),
        lat: finalLat, lng: finalLng,
        pickup_start: startDate.toISOString(),
        pickup_end: endDate.toISOString(),
      }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to create listing."); setSubmitting(false); return; }

    // Show full-page loader during the redirect transition
    setNavigating(true);
    router.push(`/donor/listings/${json.data.id}`);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: "44px",
    borderRadius: "8px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "0 16px",
    fontSize: "15px", color: "#111111",
    fontFamily: "Geist, sans-serif",
    outline: "none",
    boxShadow: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 500,
    color: "#6B7280", textTransform: "uppercase",
    letterSpacing: "0.06em", marginBottom: "8px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "Geist, sans-serif", display: "flex" }}>

      {navigating && <PageLoader label="Opening your listing..." />}

      <Sidebar
        role="Donor"
        items={[
          { label: "Dashboard", href: "/donor/dashboard", icon: "grid" },
          { label: "Post Listing", href: "/donor/listings/create", icon: "plus" },
          { label: "Impact", href: "/donor/impact", icon: "chart" },
          { label: "Notifications", href: "/notifications", icon: "bell" },
        ]}
      />

      <main style={{ 
        marginLeft: isMobile ? 0 : "220px", 
        flex: 1, 
        padding: isMobile ? "20px" : "40px",
        marginBottom: isMobile ? "64px" : 0 
      }}>

        {/* Top bar */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{
              background: "#111111", color: "#E8450A",
              fontFamily: "Geist, sans-serif", fontSize: "11px", fontWeight: 600,
              padding: "5px 12px", borderRadius: "999px", letterSpacing: "0.04em",
            }}>
              STEP {step} OF 2
            </span>
            {!isMobile && (
              <span style={{ fontSize: "13px", color: "#9CA3AF" }}>
                {step === 1 ? "Tell us what you're donating" : "Where and when can it be picked up?"}
              </span>
            )}
          </div>
          <h1 style={{
            fontFamily: "Geist, sans-serif", fontSize: isMobile ? "24px" : "28px", fontWeight: 700,
            color: "#111111", letterSpacing: "-0.02em",
          }}>
            {step === 1 ? "What's on the menu?" : "Set the pickup details"}
          </h1>
        </div>

        {/* Progress bar */}
        <div style={{ background: "#E5E7EB", borderRadius: "4px", height: "4px", margin: "24px 0 32px" }}>
          <div style={{
            background: "#E8450A", width: step === 1 ? "50%" : "100%",
            height: "4px", borderRadius: "4px", transition: "width 0.35s ease",
          }} />
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: "8px", padding: "14px 18px",
            fontSize: "13px", color: "#EF4444", marginBottom: "24px",
          }}>
            {error}
          </div>
        )}

        {/* ═══ TWO-COLUMN LAYOUT ═══ */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr", 
          gap: isMobile ? "24px" : "32px", 
          alignItems: "start" 
        }}>

          {/* ── LEFT — FORM ── */}
          <div style={{
            background: "#fff", border: "1px solid #E5E7EB",
            borderRadius: "16px", padding: isMobile ? "24px" : "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)",
          }}>

            {step === 1 && (
              <>
                <div style={{ marginBottom: "28px" }}>
                  <label style={labelStyle}>Food Item Name</label>
                  <input
                    type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g. Vegetable Biryani"
                    style={{ ...inputStyle, fontFamily: "Geist, sans-serif", fontWeight: 600, fontSize: "16px" }}
                  />
                </div>

                <div style={{ marginBottom: "28px" }}>
                  <label style={labelStyle}>Photo</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed", borderColor: photoPreview ? "#E8450A" : "#E5E7EB",
                      borderRadius: "12px", height: "200px",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      cursor: "pointer", overflow: "hidden", position: "relative",
                      background: "#F9FAFB", transition: "border-color 0.2s",
                    }}
                  >
                    {photoPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>Click to change photo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ marginBottom: "14px", opacity: 0.5 }}><FoodBowlIllustration /></div>
                        <span style={{ fontSize: "14px", color: "#6B7280", fontWeight: 400 }}>Click to upload a photo</span>
                        <span style={{ fontSize: "12px", color: "#CCC", marginTop: "4px" }}>JPG or PNG, up to 5MB — optional but recommended</span>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
                </div>

                <div style={{ marginBottom: "32px" }}>
                  <label style={labelStyle}>Food Category</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    {FOOD_TYPES.map((type) => (
                      <button
                        key={type} type="button" onClick={() => setFoodType(type)}
                        style={{
                          padding: "16px 12px", borderRadius: "12px",
                          border: `1px solid ${foodType === type ? "#E8450A" : "#E5E7EB"}`,
                          background: foodType === type ? "#FFF4ED" : "#F9FAFB",
                          color: foodType === type ? "#E8450A" : "#6B7280",
                          fontSize: "13px", fontWeight: foodType === type ? 600 : 400,
                          cursor: "pointer", transition: "all 0.15s",
                          fontFamily: "Geist, sans-serif",
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "36px" }}>
                  <label style={labelStyle}>Quantity Available</label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input
                      type="number" min="0.1" step="0.5" value={quantityKg}
                      onChange={(e) => setQuantityKg(e.target.value)}
                      placeholder="0"
                      style={{ ...inputStyle, fontFamily: "Geist, sans-serif", fontSize: "20px", fontWeight: 700, maxWidth: "180px" }}
                    />
                    <div style={{
                      background: "#111111", color: "#E8450A", borderRadius: "8px",
                      padding: "0 24px", height: "44px",
                      display: "flex", alignItems: "center",
                      fontSize: "14px", fontWeight: 600, fontFamily: "Geist, sans-serif",
                    }}>
                      kilograms
                    </div>
                  </div>
                </div>

                <button
                  type="button" onClick={handleStep1Next} disabled={uploadingImg}
                  style={{
                    height: "48px", width: "100%", borderRadius: "10px",
                    background: uploadingImg ? "#E89070" : "#E8450A",
                    color: "#fff", fontFamily: "Geist, sans-serif",
                    fontSize: "15px", fontWeight: 600, border: "2px solid #111111",
                    cursor: uploadingImg ? "not-allowed" : "pointer",
                    boxShadow: "4px 4px 0px #111111", letterSpacing: "0.01em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  }}
                >
                  {uploadingImg && <Spinner size={16} />}
                  {uploadingImg ? "Uploading photo..." : "Continue to Location & Time →"}
                </button>
              </>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: "28px" }}>
                  <label style={labelStyle}>Pickup Address</label>
                  <input
                    type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 42 Hill Road, Bandra West, Mumbai"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: "32px" }}>
                  <label style={labelStyle}>Geolocation</label>
                  <button
                    type="button" onClick={handleGetLocation} disabled={locLoading}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "16px 20px", borderRadius: "12px", width: "100%",
                      border: `1px solid ${lat ? "#10B981" : "#E5E7EB"}`,
                      background: lat ? "#ECFDF5" : "#F9FAFB",
                      color: lat ? "#10B981" : "#6B7280",
                      fontSize: "14px", fontWeight: 500,
                      cursor: locLoading ? "not-allowed" : "pointer",
                      fontFamily: "Geist, sans-serif",
                    }}
                  >
                    {locLoading
                      ? <Spinner size={15} color="#6B7280" />
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
                    }
                    {locLoading ? "Getting your location..." : lat ? `Location captured (${lat.toFixed(4)}, ${lng!.toFixed(4)})` : "Use my current location"}
                  </button>
                </div>

                <div style={{ marginBottom: "36px" }}>
                  <label style={labelStyle}>Pickup Window</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "8px" }}>Available from</div>
                      <input type="datetime-local" value={pickupStart} onChange={(e) => setPickupStart(e.target.value)} style={inputStyle} min={new Date().toISOString().slice(0, 16)} />
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "8px" }}>Available until</div>
                      <input type="datetime-local" value={pickupEnd} onChange={(e) => setPickupEnd(e.target.value)} style={inputStyle} min={pickupStart || new Date().toISOString().slice(0, 16)} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button" onClick={() => { setStep(1); setError(""); }}
                    style={{
                      height: "48px", padding: "0 28px", borderRadius: "10px",
                      background: "transparent", color: "#6B7280",
                      fontFamily: "Geist, sans-serif", fontSize: "15px",
                      border: "1px solid #E5E7EB", cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    style={{
                      flex: 1, height: "48px", borderRadius: "10px",
                      background: submitting ? "#E89070" : "#E8450A",
                      color: "#fff", fontFamily: "Geist, sans-serif",
                      fontSize: "15px", fontWeight: 600, border: "2px solid #111111",
                      cursor: submitting ? "not-allowed" : "pointer",
                      boxShadow: "4px 4px 0px #111111", letterSpacing: "0.01em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    }}
                  >
                    {submitting && <Spinner size={16} />}
                    {submitting ? "Posting listing..." : "Post Listing →"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── RIGHT — LIVE PREVIEW ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>

            {/* Preview card */}
            <div style={{
              background: "#111111", borderRadius: "16px",
              padding: "28px", color: "#FAFAFA",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: "-60px", right: "-60px",
                width: "180px", height: "180px", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(232,69,10,0.15) 0%, transparent 70%)",
              }} />
              <div style={{
                fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px",
                fontFamily: "Geist, sans-serif",
              }}>
                Live Preview
              </div>

              <div style={{
                width: "100%", height: "150px", borderRadius: "14px",
                background: "rgba(255,255,255,0.05)", marginBottom: "18px",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", position: "relative", zIndex: 1,
              }}>
                {photoPreview
                  ? <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </>
                  : <div style={{ opacity: 0.3 }}><FoodBowlIllustration /></div>
                }
              </div>

              <div style={{ fontFamily: "Geist, sans-serif", fontSize: "20px", fontWeight: 600, marginBottom: "5px", position: "relative", zIndex: 1 }}>
                {foodName || "Your food item"}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "16px", position: "relative", zIndex: 1 }}>
                {foodType || "Category"} · {quantityKg ? `${quantityKg} kg` : "Quantity"}
              </div>

              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Address</span>
                    <span style={{ color: "#FAFAFA", maxWidth: "160px", textAlign: "right" }}>{address || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Window</span>
                    <span style={{ color: "#E8450A" }}>
                      {pickupStart && pickupEnd
                        ? `${new Date(pickupStart).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – ${new Date(pickupEnd).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}

              <div style={{
                position: "absolute", top: "30px", right: "30px",
                background: "rgba(16,185,129,0.15)", color: "#10B981",
                fontSize: "9px", fontWeight: 600, padding: "4px 10px",
                borderRadius: "999px", letterSpacing: "0.06em",
                fontFamily: "Geist, sans-serif", zIndex: 1,
              }}>
                WILL BE ACTIVE
              </div>
            </div>

            {/* Impact card — only on step 1 */}
            {step === 1 && (
              <div style={{
                background: "#fff", border: "1px solid #E5E7EB",
                borderRadius: "16px", padding: "28px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                flex: 1,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>
                    Estimated Impact
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span style={{ fontFamily: "Geist, sans-serif", fontSize: "44px", fontWeight: 700, color: "#10B981" }}>
                      {quantityKg ? Math.round(Number(quantityKg) * 2.5) : 0}
                    </span>
                    <span style={{ fontSize: "14px", color: "#6B7280" }}>meals enabled</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#CCC", marginTop: "8px" }}>
                    Based on 2.5 meals per kg of surplus food
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #F3F4F6", margin: "24px 0" }} />

                {/* Secondary impact metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <div style={{ fontFamily: "Geist, sans-serif", fontSize: "24px", fontWeight: 700, color: "#E8450A" }}>
                      {quantityKg ? Number(quantityKg).toFixed(1) : "0.0"} <span style={{ fontSize: "14px" }}>kg</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>Food rescued</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "Geist, sans-serif", fontSize: "24px", fontWeight: 700, color: "#185FA5" }}>
                      {quantityKg ? (Number(quantityKg) * 2.5).toFixed(1) : "0.0"} <span style={{ fontSize: "14px" }}>kg</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>CO₂ offset</div>
                  </div>
                </div>

                {/* Bottom illustration strip */}
                <div style={{
                  marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #F3F4F6",
                  display: "flex", alignItems: "center", gap: "14px",
                }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: "#FFF4ED", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8450A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: 400, lineHeight: 1.5 }}>
                    Every listing you post helps reduce Mumbai&apos;s <strong style={{ color: "#111111", fontWeight: 600 }}>7.4K tonnes</strong> of daily food waste.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}