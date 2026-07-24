"use client";
// src/app/volunteer/tasks/[id]/page.tsx
//
// M3 — Volunteer Task Detail
// Shows full task details, directions deeplink, status timeline,
// and completion with Cloudinary photo proof upload.

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/shared/Sidebar";
import { PageLoader, Spinner } from "@/components/shared/Loader";

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskStatus = "assigned" | "in_progress" | "completed" | "cancelled";

type TaskDetail = {
    id: string;
    status: TaskStatus;
    claimed_at: string;
    completed_at: string | null;
    proof_photo_url: string | null;
    listing_id: string;
    ngo_id: string;
    volunteer_id: string;
    listings: {
        id: string;
        food_name: string;
        food_type: string;
        quantity_kg: number;
        photo_url: string | null;
        address: string;
        lat: number;
        lng: number;
        pickup_start: string;
        pickup_end: string;
    };
    ngos: {
        id: string;
        org_name: string;
        contact_phone: string;
    };
};

// ─── Status badge colours ─────────────────────────────────────────────────────
function statusStyle(s: TaskStatus): { bg: string; fg: string } {
    const map: Record<TaskStatus, { bg: string; fg: string }> = {
        assigned: { bg: "rgba(186,117,23,0.1)", fg: "#BA7517" },
        in_progress: { bg: "rgba(24,95,165,0.1)", fg: "#185FA5" },
        completed: { bg: "rgba(29,158,117,0.12)", fg: "#1D9E75" },
        cancelled: { bg: "rgba(136,136,128,0.12)", fg: "#888880" },
    };
    return map[s] ?? { bg: "#F0EDE8", fg: "#888" };
}

// ─── Timeline step component ─────────────────────────────────────────────────
function TimelineStep({ label, timestamp, isActive, isLast }: { label: string; timestamp?: string; isActive: boolean; isLast?: boolean }) {
    return (
        <div style={{ display: "flex", gap: "14px", position: "relative" }}>
            {/* Vertical line */}
            {!isLast && (
                <div style={{
                    position: "absolute", left: "9px", top: "22px", width: "2px",
                    height: "calc(100% + 4px)", background: isActive ? "#E8450A" : "#E0DDD8",
                }} />
            )}
            {/* Dot */}
            <div style={{
                width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${isActive ? "#E8450A" : "#E0DDD8"}`,
                background: isActive ? "#E8450A" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1,
            }}>
                {isActive && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
            </div>
            {/* Content */}
            <div style={{ paddingBottom: isLast ? 0 : "20px" }}>
                <div style={{
                    fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700,
                    color: isActive ? "#1A1714" : "#BBB",
                }}>
                    {label}
                </div>
                {timestamp && (
                    <div style={{ fontSize: "11px", color: "#AAA", marginTop: "2px" }}>
                        {new Date(timestamp).toLocaleString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: true,
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function TaskDetailPage() {
    const router = useRouter();
    const params = useParams();
    const pickupId = params.id as string;

    const [task, setTask] = useState<TaskDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [navigating, setNavigating] = useState(false);

    // Completion state
    const [proofUrl, setProofUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [completionSuccess, setCompletionSuccess] = useState(false);

    const nav = (path: string) => { setNavigating(true); router.push(path); };

    // Fetch task detail
    const fetchTask = useCallback(async () => {
        try {
            const res = await fetch("/api/volunteers/tasks");
            const json = await res.json();
            if (json.error) { setError(json.error); setLoading(false); return; }

            // Find this specific task — the tasks API returns all active tasks
            // We also need to check completed tasks, so fetch from pickups directly
            const allTasks = json.data ?? [];
            const found = allTasks.find((t: TaskDetail) => t.id === pickupId);

            if (found) {
                setTask(found);
            } else {
                setError("Task not found or you don't have access.");
            }
            setLoading(false);
        } catch {
            setError("Failed to load task details.");
            setLoading(false);
        }
    }, [pickupId]);

    useEffect(() => { fetchTask(); }, [fetchTask]);

    // ─── Cloudinary upload ───────────────────────────────────────────────────
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "reserve_uploads");
            formData.append("folder", "reserve/proofs");

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.secure_url) {
                setProofUrl(data.secure_url);
            } else {
                setError("Failed to upload photo. Please try again.");
            }
        } catch {
            setError("Photo upload failed. Check your connection.");
        }
        setUploading(false);
    };

    // ─── Complete task ───────────────────────────────────────────────────────
    const handleComplete = async () => {
        if (!proofUrl) { setError("Please upload a proof photo first."); return; }
        setCompleting(true);
        setError("");

        try {
            const res = await fetch(`/api/pickups/${pickupId}/complete`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proof_photo_url: proofUrl }),
            });
            const json = await res.json();
            if (json.error) {
                setError(json.error);
            } else {
                setCompletionSuccess(true);
                setTask((prev) => prev ? { ...prev, status: "completed" as TaskStatus, completed_at: new Date().toISOString(), proof_photo_url: proofUrl } : prev);
            }
        } catch {
            setError("Failed to complete task.");
        }
        setCompleting(false);
    };

    const l = task?.listings;
    const n = task?.ngos;

    // Determine timeline state
    const statusOrder = ["claimed", "assigned", "in_progress", "completed"];
    const currentIdx = task ? statusOrder.indexOf(task.status) : -1;

    return (
        <div style={{ minHeight: "100vh", background: "#F0EDE8", fontFamily: "DM Sans, sans-serif", display: "flex" }}>
            {navigating && <PageLoader label="Loading..." />}
            {loading && <PageLoader label="Loading task..." />}

            <Sidebar
                role="Volunteer"
                items={[
                    { label: "Task Feed", href: "/volunteer/tasks", icon: "list" },
                    { label: "My Stats", href: "/volunteer/stats", icon: "star" },
                    { label: "Notifications", href: "/notifications", icon: "bell" },
                ]}
            />

            <main style={{ marginLeft: "240px", flex: 1, padding: "44px 52px 60px", maxWidth: "900px" }}>
                {/* ─── Back button + header ────────────────────────────────── */}
                <button
                    onClick={() => nav("/volunteer/tasks")}
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: "none", border: "none", color: "#888",
                        fontSize: "13px", cursor: "pointer", marginBottom: "24px",
                        fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Task Feed
                </button>

                {error && !task && (
                    <div style={{
                        background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px",
                        padding: "14px 18px", fontSize: "13px", color: "#DC2626",
                    }}>
                        {error}
                    </div>
                )}

                {task && l && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
                        {/* ─── Left column: Details ───────────────────────── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Listing card */}
                            <div style={{
                                background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "18px",
                                padding: "28px", boxShadow: "3px 3px 10px rgba(0,0,0,0.03)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                    <h2 style={{
                                        fontFamily: "Syne, sans-serif", fontSize: "22px", fontWeight: 800,
                                        color: "#1A1714", letterSpacing: "-0.3px",
                                    }}>
                                        {l.food_name || l.food_type}
                                    </h2>
                                    <span style={{
                                        background: statusStyle(task.status).bg,
                                        color: statusStyle(task.status).fg,
                                        fontSize: "10px", fontWeight: 700,
                                        fontFamily: "Syne, sans-serif",
                                        letterSpacing: "0.07em", textTransform: "uppercase",
                                        padding: "5px 12px", borderRadius: "999px",
                                    }}>
                                        {task.status.replace("_", " ")}
                                    </span>
                                </div>

                                {/* Photo */}
                                {l.photo_url && (
                                    <div style={{
                                        width: "100%", height: "200px", borderRadius: "14px",
                                        overflow: "hidden", marginBottom: "20px", position: "relative",
                                        background: "#F0EDE8",
                                    }}>
                                        <Image src={l.photo_url} alt={l.food_name || "Food"} fill style={{ objectFit: "cover" }} unoptimized />
                                    </div>
                                )}

                                {/* Info grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    <div>
                                        <div style={{ fontSize: "11px", color: "#AAA", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Food Type</div>
                                        <div style={{ fontSize: "14px", color: "#1A1714", fontWeight: 500 }}>{l.food_type}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", color: "#AAA", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Quantity</div>
                                        <div style={{ fontSize: "14px", color: "#1A1714", fontWeight: 500 }}>{l.quantity_kg} kg</div>
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <div style={{ fontSize: "11px", color: "#AAA", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Pickup Address</div>
                                        <div style={{ fontSize: "14px", color: "#1A1714", fontWeight: 500 }}>{l.address}</div>
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <div style={{ fontSize: "11px", color: "#AAA", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Pickup Window</div>
                                        <div style={{ fontSize: "14px", color: "#1A1714", fontWeight: 500 }}>
                                            {new Date(l.pickup_start).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
                                            {" — "}
                                            {new Date(l.pickup_end).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NGO card */}
                            {n && (
                                <div style={{
                                    background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "18px",
                                    padding: "22px 28px", boxShadow: "3px 3px 10px rgba(0,0,0,0.03)",
                                }}>
                                    <div style={{
                                        fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700,
                                        color: "#1A1714", textTransform: "uppercase", letterSpacing: "0.07em",
                                        marginBottom: "14px",
                                    }}>
                                        Deliver To — NGO
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <div style={{
                                            width: "44px", height: "44px", borderRadius: "12px",
                                            background: "rgba(29,158,117,0.08)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "15px", fontWeight: 700, color: "#1A1714" }}>
                                                {n.org_name}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#888", fontWeight: 300, marginTop: "2px" }}>
                                                {n.contact_phone}
                                            </div>
                                        </div>
                                    </div>
                                    {n.contact_phone && (
                                        <a
                                            href={`tel:${n.contact_phone}`}
                                            style={{
                                                marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                                height: "40px", borderRadius: "10px",
                                                background: "rgba(29,158,117,0.08)", color: "#1D9E75",
                                                fontFamily: "Syne, sans-serif", fontSize: "12px", fontWeight: 700,
                                                border: "1.5px solid rgba(29,158,117,0.2)", textDecoration: "none",
                                                cursor: "pointer", transition: "all 0.15s",
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                                            </svg>
                                            Call NGO · {n.contact_phone}
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Directions button */}
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    height: "50px", borderRadius: "14px",
                                    background: "#E8450A", color: "#fff",
                                    fontFamily: "Syne, sans-serif", fontSize: "14px", fontWeight: 700,
                                    border: "2px solid #1A1714", boxShadow: "4px 4px 0px #1A1714",
                                    cursor: "pointer", textDecoration: "none",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                    transition: "all 0.15s",
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                </svg>
                                Get Directions to Donors Location
                            </a>

                            {/* ─── Complete Pickup section ────────────────── */}
                            {task.status === "in_progress" && !completionSuccess && (
                                <div style={{
                                    background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "18px",
                                    padding: "28px", boxShadow: "3px 3px 10px rgba(0,0,0,0.03)",
                                }}>
                                    <div style={{
                                        fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700,
                                        color: "#1A1714", textTransform: "uppercase", letterSpacing: "0.07em",
                                        marginBottom: "18px",
                                    }}>
                                        Complete Pickup
                                    </div>
                                    <p style={{ fontSize: "13px", color: "#888", marginBottom: "18px", fontWeight: 300 }}>
                                        Upload a photo of the food pickup as proof of completion. This will be shared with the NGO.
                                    </p>

                                    {/* Upload area */}
                                    {!proofUrl ? (
                                        <label style={{
                                            display: "flex", flexDirection: "column", alignItems: "center",
                                            justifyContent: "center", gap: "10px",
                                            height: "140px", borderRadius: "14px",
                                            border: "2px dashed #E0DDD8", background: "#FAFAF8",
                                            cursor: uploading ? "wait" : "pointer",
                                            transition: "all 0.15s",
                                        }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                                style={{ display: "none" }}
                                                disabled={uploading}
                                            />
                                            {uploading ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888" }}>
                                                    <Spinner /> Uploading...
                                                </div>
                                            ) : (
                                                <>
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="3" width="18" height="18" rx="3" />
                                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                                        <polyline points="21 15 16 10 5 21" />
                                                    </svg>
                                                    <span style={{ fontSize: "13px", color: "#AAA", fontWeight: 400 }}>
                                                        Click to upload proof photo
                                                    </span>
                                                </>
                                            )}
                                        </label>
                                    ) : (
                                        <div style={{ position: "relative" }}>
                                            <div style={{
                                                width: "100%", height: "160px", borderRadius: "14px",
                                                overflow: "hidden", position: "relative", background: "#F0EDE8",
                                            }}>
                                                <Image src={proofUrl} alt="Proof" fill style={{ objectFit: "cover" }} unoptimized />
                                            </div>
                                            <button
                                                onClick={() => setProofUrl("")}
                                                style={{
                                                    position: "absolute", top: "8px", right: "8px",
                                                    width: "28px", height: "28px", borderRadius: "50%",
                                                    background: "rgba(0,0,0,0.5)", color: "#fff",
                                                    border: "none", cursor: "pointer", fontSize: "14px",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div style={{
                                            background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px",
                                            padding: "10px 14px", fontSize: "12px", color: "#DC2626", marginTop: "14px",
                                        }}>
                                            {error}
                                        </div>
                                    )}

                                    {/* Complete button */}
                                    <button
                                        onClick={handleComplete}
                                        disabled={!proofUrl || completing}
                                        style={{
                                            width: "100%", height: "48px", marginTop: "18px",
                                            borderRadius: "12px",
                                            background: proofUrl ? "#1D9E75" : "#E0DDD8",
                                            color: proofUrl ? "#fff" : "#AAA",
                                            fontFamily: "Syne, sans-serif", fontSize: "14px", fontWeight: 700,
                                            border: proofUrl ? "2px solid #1A1714" : "1.5px solid #E0DDD8",
                                            boxShadow: proofUrl ? "3px 3px 0px #1A1714" : "none",
                                            cursor: proofUrl && !completing ? "pointer" : "not-allowed",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {completing ? <Spinner /> : null}
                                        Complete Pickup
                                    </button>
                                </div>
                            )}

                            {/* Success message */}
                            {completionSuccess && (
                                <div style={{
                                    background: "rgba(29,158,117,0.08)", border: "1.5px solid rgba(29,158,117,0.2)",
                                    borderRadius: "18px", padding: "28px", textAlign: "center",
                                }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "12px" }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="16 8 10 16 7 13" />
                                    </svg>
                                    <div style={{
                                        fontFamily: "Syne, sans-serif", fontSize: "18px", fontWeight: 800,
                                        color: "#1D9E75", marginBottom: "6px",
                                    }}>
                                        Pickup Completed
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#888", fontWeight: 300, marginBottom: "20px" }}>
                                        Great work! The NGO and donor have been notified.
                                    </div>
                                    <button
                                        onClick={() => nav("/volunteer/tasks")}
                                        style={{
                                            height: "42px", padding: "0 28px", borderRadius: "10px",
                                            background: "#1D9E75", color: "#fff",
                                            fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700,
                                            border: "2px solid #1A1714", boxShadow: "3px 3px 0px #1A1714",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Back to Task Feed
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ─── Right column: Timeline ─────────────────────── */}
                        <div>
                            <div style={{
                                background: "#fff", border: "1.5px solid #E0DDD8", borderRadius: "18px",
                                padding: "24px", boxShadow: "3px 3px 10px rgba(0,0,0,0.03)",
                                position: "sticky", top: "44px",
                            }}>
                                <div style={{
                                    fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700,
                                    color: "#1A1714", textTransform: "uppercase", letterSpacing: "0.07em",
                                    marginBottom: "22px",
                                }}>
                                    Status Timeline
                                </div>

                                <TimelineStep
                                    label="Claimed by NGO"
                                    timestamp={task.claimed_at}
                                    isActive={currentIdx >= 0}
                                />
                                <TimelineStep
                                    label="Volunteer Assigned"
                                    timestamp={currentIdx >= 1 ? task.claimed_at : undefined}
                                    isActive={currentIdx >= 1}
                                />
                                <TimelineStep
                                    label="In Progress"
                                    timestamp={currentIdx >= 2 ? task.claimed_at : undefined}
                                    isActive={currentIdx >= 2}
                                />
                                <TimelineStep
                                    label="Completed"
                                    timestamp={task.completed_at ?? undefined}
                                    isActive={currentIdx >= 3}
                                    isLast
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
