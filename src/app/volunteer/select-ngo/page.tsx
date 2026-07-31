"use client";
// src/app/volunteer/select-ngo/page.tsx
//
// Onboarding page — shown after first volunteer login.
// Volunteer picks which NGO they want to work with.
// Once selected, they proceed to /volunteer/tasks.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageLoader, Spinner } from "@/components/shared/Loader";

type NgoOption = { id: string; org_name: string };

export default function SelectNgoPage() {
    const supabase = createClient();
    const router = useRouter();

    const [ngoList, setNgoList] = useState<NgoOption[]>([]);
    const [selectedNgoId, setSelectedNgoId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [navigating, setNavigating] = useState(false);

    // Fetch approved NGOs
    useEffect(() => {
        supabase
            .from("ngos")
            .select("id, org_name")
            .eq("kyc_status", "approved")
            .order("org_name")
            .then(({ data, error: fetchError }) => {
                if (fetchError) {
                    console.error("Failed to fetch NGOs:", fetchError);
                    setError("Failed to load NGOs. Please try again.");
                }
                setNgoList(data ?? []);
                setLoading(false);
            });
    }, [supabase]);

    const handleSubmit = async () => {
        if (!selectedNgoId) {
            setError("Please select an NGO to volunteer with.");
            return;
        }
        setSaving(true);
        setError("");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Session expired. Please log in again."); setSaving(false); return; }

        const { error: updateError } = await supabase
            .from("volunteers")
            .update({ ngo_id: selectedNgoId })
            .eq("id", user.id);

        if (updateError) {
            console.error("Failed to update NGO:", updateError);
            setError("Failed to save selection. Please try again.");
            setSaving(false);
            return;
        }

        setNavigating(true);
        router.push("/volunteer/tasks");
    };

    return (
        <div style={{
            minHeight: "100vh", background: "#FAFAFA",
            fontFamily: "Geist, sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            {navigating && <PageLoader label="Loading your dashboard..." />}

            <div style={{
                width: "100%", maxWidth: "520px", padding: "0 24px",
            }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "10px",
                        fontFamily: "Geist, sans-serif", fontSize: "28px", fontWeight: 700,
                        color: "#111111", letterSpacing: "-0.02em",
                    }}>
                        <div style={{
                            width: "14px", height: "14px", borderRadius: "50%",
                            background: "#E8450A",
                        }} />
                        ReServe
                    </div>
                    <div style={{
                        fontSize: "13px", color: "#6B7280", fontWeight: 400, marginTop: "6px",
                    }}>
                        One last step before you get started
                    </div>
                </div>

                {/* Card */}
                <div style={{
                    background: "#fff", borderRadius: "16px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "6px 6px 16px rgba(0,0,0,0.04), -3px -3px 10px rgba(255,255,255,0.9)",
                    padding: "36px 32px",
                }}>
                    <div style={{
                        fontFamily: "Geist, sans-serif", fontSize: "22px", fontWeight: 700,
                        color: "#111111", letterSpacing: "-0.3px", marginBottom: "8px",
                    }}>
                        Choose Your NGO
                    </div>
                    <div style={{
                        fontSize: "14px", color: "#6B7280", fontWeight: 400, marginBottom: "28px",
                        lineHeight: "1.5",
                    }}>
                        Select the organisation you&apos;d like to volunteer with. You&apos;ll receive task assignments from this NGO.
                    </div>

                    {error && (
                        <div style={{
                            background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px",
                            padding: "12px 16px", fontSize: "13px", color: "#EF4444", marginBottom: "18px",
                        }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "40px 0", color: "#6B7280", gap: "10px", fontSize: "14px",
                        }}>
                            <Spinner /> Loading NGOs...
                        </div>
                    ) : ngoList.length === 0 ? (
                        <div style={{
                            background: "#FAFAF8", border: "1px dashed #E5E7EB", borderRadius: "14px",
                            padding: "32px 20px", textAlign: "center",
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" style={{ marginBottom: "10px" }}>
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                            </svg>
                            <div style={{
                                fontFamily: "Geist, sans-serif", fontSize: "16px", fontWeight: 700,
                                color: "#111111", marginBottom: "6px",
                            }}>
                                No NGOs available yet
                            </div>
                            <div style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: 400 }}>
                                NGOs are being reviewed. Check back soon or contact support.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {ngoList.map((ngo) => (
                                <button
                                    key={ngo.id}
                                    type="button"
                                    onClick={() => setSelectedNgoId(ngo.id)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "14px",
                                        padding: "16px 18px", borderRadius: "14px",
                                        background: selectedNgoId === ngo.id ? "rgba(232,69,10,0.06)" : "#FAFAF8",
                                        border: selectedNgoId === ngo.id
                                            ? "2px solid #E8450A"
                                            : "1.5px solid #E5E7EB",
                                        cursor: "pointer", transition: "all 0.15s",
                                        textAlign: "left", width: "100%",
                                    }}
                                >
                                    <div style={{
                                        width: "40px", height: "40px", borderRadius: "10px",
                                        background: selectedNgoId === ngo.id
                                            ? "rgba(232,69,10,0.1)"
                                            : "rgba(29,158,117,0.08)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                            stroke={selectedNgoId === ngo.id ? "#E8450A" : "#10B981"}
                                            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontFamily: "Geist, sans-serif", fontSize: "15px",
                                            fontWeight: 700, color: "#111111",
                                        }}>
                                            {ngo.org_name}
                                        </div>
                                    </div>
                                    {selectedNgoId === ngo.id && (
                                        <div style={{
                                            width: "22px", height: "22px", borderRadius: "50%",
                                            background: "#E8450A",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Submit */}
                    {ngoList.length > 0 && (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedNgoId || saving}
                            style={{
                                width: "100%", height: "52px", marginTop: "24px",
                                borderRadius: "14px",
                                background: selectedNgoId ? "#E8450A" : "#E5E7EB",
                                color: selectedNgoId ? "#fff" : "#AAA",
                                fontFamily: "Geist, sans-serif", fontSize: "15px", fontWeight: 700,
                                border: selectedNgoId ? "2px solid #111111" : "1.5px solid #E5E7EB",
                                boxShadow: selectedNgoId ? "4px 4px 0px #111111" : "none",
                                cursor: selectedNgoId && !saving ? "pointer" : "not-allowed",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                transition: "all 0.2s",
                            }}
                        >
                            {saving ? <><Spinner /> Saving...</> : "Continue to Dashboard →"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
