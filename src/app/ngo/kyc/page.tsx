"use client";
// src/app/ngo/kyc/page.tsx
//
// M6 — NGO KYC Submission Page
//
// Allows pending NGOs to upload their KYC documents (URLs) via Cloudinary
// and save them to users.kyc_documents. Once saved, they await admin approval.

import { useState, useEffect } from "react";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner } from "@/components/shared/Loader";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { IconName } from "@/lib/navConfig";
import { createClient } from "@/lib/supabase/client";

function UploadIllustration() {
    return (
        <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
            <rect x="20" y="20" width="100" height="70" rx="10" fill="#fff" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="6 6" />
            <path d="M70 45v20M60 55l10-10 10 10" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="50" y="75" width="40" height="4" rx="2" fill="#F3F4F6" />
        </svg>
    );
}

function PendingIllustration() {
    return (
        <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
            <circle cx="70" cy="55" r="30" fill="#fff" stroke="#E5E7EB" strokeWidth="2" />
            <circle cx="70" cy="55" r="22" fill="#F0FDF4" />
            <path d="M62 55l5 5 10-10" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M95 30a30 30 0 0110 40" stroke="#F3F4F6" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function NGOKYCPage() {
    const isMobile = useIsMobile();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [hasDocs, setHasDocs] = useState(false);
    const [docUrls, setDocUrls] = useState<string[]>([]);
    const [tempUrl, setTempUrl] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/login";
                return;
            }
            setUserId(user.id);
            const { data: profile } = await supabase
                .from("users")
                .select("status, kyc_documents")
                .eq("id", user.id)
                .single();

            if (profile?.status === "active") {
                window.location.href = "/ngo/map";
            } else {
                if (profile?.kyc_documents && profile.kyc_documents.length > 0) {
                    setHasDocs(true);
                    setDocUrls(profile.kyc_documents);
                }
            }
            setLoading(false);
        };
        checkStatus();
    }, [supabase]);

    const handleAddDoc = () => {
        if (tempUrl.trim() === "") return;
        setDocUrls([...docUrls, tempUrl.trim()]);
        setTempUrl("");
    };

    const handleRemoveDoc = (index: number) => {
        setDocUrls(docUrls.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (docUrls.length === 0) {
            setError("Please upload at least one document.");
            return;
        }
        setSubmitting(true);
        setError("");

        const { error: updateError } = await supabase
            .from("users")
            .update({ kyc_documents: docUrls })
            .eq("id", userId);

        if (updateError) {
            setError("Failed to save documents. Please try again.");
            setSubmitting(false);
            return;
        }

        setHasDocs(true);
        setSubmitting(false);
    };

    // Use a minimal nav for pending NGOs since they shouldn't access other routes yet
    const navItems = [
        { label: "KYC Setup", href: "/ngo/kyc", icon: "shield" as IconName }
    ];

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#FAFAFA", display: "flex" }}>
                <Sidebar role="NGO" items={navItems} />
                <main style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Spinner />
                </main>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "Geist, sans-serif", display: "flex" }}>
            <Sidebar role="NGO" items={navItems} />

            <main style={{
                marginLeft: isMobile ? 0 : "220px",
                flex: 1,
                padding: isMobile ? "20px" : "40px",
                marginBottom: isMobile ? "64px" : 0,
                display: "flex", justifyContent: "center", alignItems: "flex-start"
            }}>
                <style>{`
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>

                <div style={{
                    width: "100%", maxWidth: "600px", marginTop: isMobile ? "0" : "40px",
                    background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px",
                    padding: isMobile ? "24px" : "40px", boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                    animation: "fade-in-up 0.5s ease backwards"
                }}>

                    {hasDocs ? (
                        <div style={{ textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                                <PendingIllustration />
                            </div>
                            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111", marginBottom: "12px", letterSpacing: "-0.02em" }}>
                                Documents Submitted
                            </h1>
                            <p style={{ fontSize: "15px", color: "#6B7280", lineHeight: 1.6, marginBottom: "32px" }}>
                                Thank you for providing your KYC documents. Your registration is currently <strong>pending review</strong> by our administration team. You will be notified once your account is activated.
                            </p>

                            <div style={{ textAlign: "left", background: "#F9FAFB", padding: "16px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                                    Submitted Documents
                                </div>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {docUrls.map((url, idx) => (
                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{
                                            display: "flex", alignItems: "center", gap: "6px",
                                            padding: "6px 12px", borderRadius: "8px", border: "1px solid #E5E7EB",
                                            background: "#fff", color: "#111", textDecoration: "none",
                                            fontSize: "13px", fontWeight: 500,
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
                                            View Doc {idx + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
                                style={{
                                    marginTop: "32px", height: "44px", padding: "0 24px", borderRadius: "10px",
                                    background: "#fff", color: "#111", border: "1px solid #E5E7EB",
                                    fontFamily: "Geist, sans-serif", fontSize: "14px", fontWeight: 600, cursor: "pointer"
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                                <UploadIllustration />
                            </div>
                            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111", marginBottom: "8px", textAlign: "center", letterSpacing: "-0.02em" }}>
                                Complete KYC Setup
                            </h1>
                            <p style={{ fontSize: "14px", color: "#6B7280", textAlign: "center", marginBottom: "32px" }}>
                                To ensure accountability, all NGO partners must provide identity verification documents before gaining access to the platform.
                            </p>

                            {error && (
                                <div style={{ background: "#FEF2F2", color: "#EF4444", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, marginBottom: "20px", border: "1px solid #FECACA" }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                                    Document Image URLs
                                </label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <input
                                        type="text"
                                        value={tempUrl}
                                        onChange={(e) => setTempUrl(e.target.value)}
                                        placeholder="https://drive.google.com/.../kyc.png"
                                        style={{
                                            flex: 1, padding: "10px 14px", borderRadius: "8px",
                                            border: "1px solid #E5E7EB", fontSize: "14px", fontFamily: "Geist, sans-serif",
                                            outline: "none"
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddDoc}
                                        style={{
                                            padding: "0 16px", borderRadius: "8px", background: "#F3F4F6", color: "#111",
                                            border: "1px solid #E5E7EB", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                            fontFamily: "Geist, sans-serif"
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {docUrls.length > 0 && (
                                <div style={{ marginBottom: "32px" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                                        Added Documents ({docUrls.length})
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {docUrls.map((url, idx) => (
                                            <div key={idx} style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                padding: "10px 14px", background: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB"
                                            }}>
                                                <div style={{ fontSize: "13px", color: "#4B5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "12px" }}>
                                                    {url}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveDoc(idx)}
                                                    style={{ background: "none", border: "none", color: "#EF4444", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: "4px" }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{
                                    width: "100%", height: "48px", borderRadius: "10px",
                                    background: "#185FA5", color: "#fff", border: "none",
                                    fontFamily: "Geist, sans-serif", fontSize: "14px", fontWeight: 600,
                                    cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1
                                }}
                            >
                                {submitting ? "Submitting..." : "Submit Documents"}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
