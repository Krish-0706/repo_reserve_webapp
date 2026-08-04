"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/shared/Sidebar";
import { Spinner } from "@/components/shared/Loader";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getNavItems } from "@/lib/navConfig";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, Trophy } from "lucide-react";

const COLORS = ["#10B981", "#185FA5", "#E8450A", "#BA7517", "#6B7280"];

export default function DonorImpactPage() {
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

    const navItems = getNavItems("donor", unread);

    return (
        <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "Geist, sans-serif", display: "flex" }}>
            <Sidebar role="Donor" items={navItems} />

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
                            Impact Dashboard
                        </h1>
                        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px", fontWeight: 400 }}>
                            See the real-world difference your donations are making
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <a href="/api/impact/export" download style={{ background: "#111111", color: "#fff", padding: "10px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: isMobile ? "100%" : "auto", transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"} onMouseOut={(e) => e.currentTarget.style.opacity = "1"}>
                            <Download size={16} /> Export CSV Ledger
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
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "40px" }}>
                                <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.2s" }}>
                                    <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500, marginBottom: "8px" }}>Total KG Rescued</div>
                                    <div style={{ fontSize: "32px", fontWeight: 700, color: "#111111" }}>{data.total_kg} <span style={{ fontSize: "16px", color: "#9CA3AF" }}>kg</span></div>
                                </div>
                                <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.3s" }}>
                                    <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500, marginBottom: "8px" }}>Meals Enabled</div>
                                    <div style={{ fontSize: "32px", fontWeight: 700, color: "#10B981" }}>{data.total_meals} <span style={{ fontSize: "16px", color: "#9CA3AF" }}>meals</span></div>
                                </div>
                                <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.4s" }}>
                                    <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500, marginBottom: "8px" }}>CO₂ Offset</div>
                                    <div style={{ fontSize: "32px", fontWeight: 700, color: "#185FA5" }}>{data.co2_offset} <span style={{ fontSize: "16px", color: "#9CA3AF" }}>kg</span></div>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "24px", marginBottom: "24px" }}>
                                {/* Trend Chart */}
                                <div className="hover-card" style={{ flex: 2, background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.5s" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "24px" }}>Weekly Impact Trend</h3>
                                    <div style={{ height: "300px", width: "100%" }}>
                                        {data.weekly_trend.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data.weekly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#E8450A" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#E8450A" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                                                        itemStyle={{ color: "#E8450A", fontWeight: 700 }}
                                                    />
                                                    <Area type="monotone" dataKey="kg" stroke="#E8450A" strokeWidth={3} fillOpacity={1} fill="url(#colorKg)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: "14px" }}>
                                                No data available yet
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Food Types Pie Chart */}
                                <div className="hover-card" style={{ flex: 1, background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.6s" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "20px" }}>
                                        Food Types Donated
                                    </h3>
                                    <div style={{ height: "300px", width: "100%" }}>
                                        {data.donor_food_types && data.donor_food_types.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data.donor_food_types}
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {data.donor_food_types.map((entry: { name: string, value: number }, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: "14px" }}>
                                                No food data yet
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                                        {data.donor_food_types?.map((entry: { name: string, value: number }, i: number) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B7280" }}>
                                                <div style={{ width: "8px", height: "8px", borderRadius: "4px", background: COLORS[i % COLORS.length] }} />
                                                {entry.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Leaderboard */}
                            <div className="hover-card" style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px", animation: "fade-in-up 0.5s ease backwards", animationDelay: "0.7s" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    Your Global Rank
                                </h3>
                                {data.personal_rank ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF4ED", padding: "20px", borderRadius: "12px", border: "1px solid #FFEDD5" }}>
                                        <div>
                                            <div style={{ fontSize: "13px", color: "#E8450A", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Donor Leaderboard</div>
                                            <div style={{ fontSize: "28px", fontWeight: 800, color: "#9A3412" }}>
                                                #{data.personal_rank.rank} <span style={{ fontSize: "16px", color: "#FB923C", fontWeight: 600 }}>/ {data.personal_rank.total}</span>
                                            </div>
                                        </div>
                                        <Trophy size={40} color="#EA580C" strokeWidth={1.5} />
                                    </div>
                                ) : (
                                    <div style={{ color: "#9CA3AF", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                                        Complete a donation to get your rank!
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
