"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner } from "@/components/shared/Loader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getNavItems } from "@/lib/navConfig";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Trophy, Download } from "lucide-react";

export default function VolunteerStatsPage() {
    const unread = useUnreadCount();
    const isMobile = useIsMobile();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/impact")
            .then(res => res.json())
            .then(json => {
                if (json.error) setError(json.error);
                else setData(json.data);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load impact stats.");
                setLoading(false);
            });
    }, []);

    const navItems = getNavItems("volunteer", unread);

    return (
        <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "Geist, sans-serif", display: "flex" }}>
            <Sidebar role="Volunteer" items={navItems} />

            <main style={{
                marginLeft: isMobile ? 0 : "220px",
                flex: 1,
                padding: isMobile ? "20px" : "40px",
                marginBottom: isMobile ? "64px" : 0
            }}>
                <style>{`
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .hover-card {
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                    }
                    .hover-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 24px -10px rgba(0,0,0,0.08);
                    }
                `}</style>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? "16px" : 0, justifyContent: "space-between", marginBottom: "40px", animation: "fade-in-up 0.4s ease backwards" }}>
                    <div>
                        <h1 style={{ fontFamily: "Geist, sans-serif", fontSize: "32px", fontWeight: 700, color: "#111111", letterSpacing: "-0.02em" }}>
                            My Stats
                        </h1>
                        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px", fontWeight: 400 }}>
                            Track your personal impact and deliveries
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <a href="/api/impact/export" download style={{ background: "#111111", color: "#fff", padding: "10px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", width: isMobile ? "100%" : "auto", transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"} onMouseOut={(e) => e.currentTarget.style.opacity = "1"}>
                            <Download size={16} /> Export Activity (CSV)
                        </a>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", padding: "14px 18px", fontSize: "13px", color: "#EF4444", marginBottom: "24px" }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
                        <Spinner />
                    </div>
                ) : (
                    data && (
                        <>
                            {/* Summary Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                                <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.1s" }}>
                                    <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500, marginBottom: "8px" }}>Tasks Done</div>
                                    <div style={{ fontSize: "32px", fontWeight: 700, color: "#111111" }}>{data.volunteer_stats?.tasks_completed || 0}</div>
                                </div>
                                <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.2s" }}>
                                    <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500, marginBottom: "8px" }}>Hours Logged</div>
                                    <div style={{ fontSize: "32px", fontWeight: 700, color: "#185FA5" }}>{data.volunteer_stats?.hours_logged || 0} <span style={{ fontSize: "16px", color: "#9CA3AF" }}>hrs</span></div>
                                </div>
                                <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.3s" }}>
                                    <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500, marginBottom: "8px" }}>Average Rating</div>
                                    <div style={{ fontSize: "32px", fontWeight: 700, color: "#E8450A", display: "flex", alignItems: "center", gap: "6px" }}>
                                        {data.volunteer_stats?.rating ? Number(data.volunteer_stats.rating).toFixed(1) : "0.0"}
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" style={{ marginTop: "-2px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    </div>
                                </div>
                                <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.4s" }}>
                                    <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500, marginBottom: "8px" }}>Food Rescued</div>
                                    <div style={{ fontSize: "32px", fontWeight: 700, color: "#10B981" }}>{data.total_kg} <span style={{ fontSize: "16px", color: "#9CA3AF" }}>kg</span></div>
                                </div>
                            </div>

                            {/* Gamification Banner */}
                            {data.volunteer_milestones && (
                                <div className="hover-card" style={{ background: "#F4F6F8", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "20px 24px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.5s" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ color: "#E8450A", background: "#FFF4ED", padding: "10px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Trophy size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "16px", fontWeight: 700, color: "#111111" }}>Next Milestone: {data.volunteer_milestones.next} Rescues</div>
                                                <div style={{ fontSize: "13px", color: "#6B7280" }}>You have completed {data.volunteer_milestones.current} rescues so far. Keep it up!</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#185FA5" }}>{data.volunteer_milestones.progress}%</div>
                                    </div>
                                    <div style={{ width: "100%", height: "8px", background: "#E5E7EB", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{ width: `${data.volunteer_milestones.progress}%`, height: "100%", background: "#185FA5", borderRadius: "4px", transition: "width 0.5s ease" }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "24px", marginBottom: "24px" }}>
                                {/* Trend Chart */}
                                <div className="hover-card" style={{ flex: 2, background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.6s" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "24px" }}>Weekly Food Deliveries (kg)</h3>
                                    <div style={{ height: "300px", width: "100%" }}>
                                        {data.weekly_trend.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data.weekly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#185FA5" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#185FA5" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                                                        itemStyle={{ color: "#185FA5", fontWeight: 700 }}
                                                    />
                                                    <Area type="monotone" dataKey="kg" stroke="#185FA5" strokeWidth={3} fillOpacity={1} fill="url(#colorKg)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: "14px" }}>
                                                No deliveries yet
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Radar Chart for Volunteer Profile */}
                                <div className="hover-card" style={{ flex: 1, background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.7s" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "20px" }}>
                                        Activity Profile
                                    </h3>
                                    <div style={{ height: "300px", width: "100%" }}>
                                        {data.volunteer_radar && data.volunteer_radar.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.volunteer_radar}>
                                                    <PolarGrid stroke="#F3F4F6" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B7280", fontSize: 12 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                                                    <Radar name="Pickups" dataKey="A" stroke="#185FA5" fill="#185FA5" fillOpacity={0.4} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: "14px" }}>
                                                No activity data yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Leaderboard */}
                            <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.8s" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    Your Global Rank
                                </h3>
                                {data.personal_rank ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(24,95,165,0.05)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(24,95,165,0.2)" }}>
                                        <div>
                                            <div style={{ fontSize: "13px", color: "#185FA5", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Volunteer Leaderboard</div>
                                            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E3A8A" }}>
                                                #{data.personal_rank.rank} <span style={{ fontSize: "16px", color: "#3B82F6", fontWeight: 600 }}>/ {data.personal_rank.total}</span>
                                            </div>
                                        </div>
                                        <Trophy size={40} color="#1D4ED8" strokeWidth={1.5} />
                                    </div>
                                ) : (
                                    <div style={{ color: "#9CA3AF", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                                        Complete a pickup to get your rank!
                                    </div>
                                )}
                            </div>
                        </>
                    )
                )}
            </main>
        </div>
    );
}
