import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getWeekLabel(dateString: string) {
    const date = new Date(dateString);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `W${weekNo}`;
}

export async function GET() {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const role = profile.role;

    // Service role client for global leaderboards (bypasses RLS)
    const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let total_kg = 0;
    const weekly_trend_map = new Map<string, number>();
    let personal_rank = { rank: 1, total: 1 };
    let volunteer_stats = null;

    // Advanced Analytics
    let donor_food_types: { name: string, value: number }[] = [];
    let ngo_logistics: { day: string, pickups: number }[] = [];
    let volunteer_radar: { subject: string, A: number, fullMark: number }[] = [];
    let volunteer_milestones: { current: number, next: number, progress: number } | null = null;

    try {
        if (role === "donor") {
            // 1. Personal Stats
            const { data: myListings } = await supabase
                .from("listings")
                .select("quantity_kg, created_at, food_type")
                .eq("donor_id", user.id)
                .eq("status", "completed");

            if (myListings) {
                const foodTypeMap = new Map<string, number>();
                for (const l of myListings) {
                    const kg = Number(l.quantity_kg) || 0;
                    total_kg += kg;
                    const w = getWeekLabel(l.created_at);
                    weekly_trend_map.set(w, (weekly_trend_map.get(w) || 0) + kg);

                    const fType = l.food_type || "Other";
                    foodTypeMap.set(fType, (foodTypeMap.get(fType) || 0) + kg);
                }
                donor_food_types = Array.from(foodTypeMap.entries()).map(([name, value]) => ({ name, value }));
            }

            // 2. Global Donor Leaderboard
            const { data: allCompleted, error: donorErr } = await adminClient
                .from("listings")
                .select("donor_id, quantity_kg")
                .eq("status", "completed");

            if (donorErr) console.error("Donor Leaderboard Error:", donorErr);

            if (allCompleted && allCompleted.length > 0) {
                const scores = new Map<string, number>();
                for (const l of allCompleted) {
                    const s = scores.get(l.donor_id) || 0;
                    scores.set(l.donor_id, s + (Number(l.quantity_kg) || 0));
                }
                const scoresArr = Array.from(scores.entries()).map(([id, score]) => ({ id, score }));
                scoresArr.sort((a, b) => b.score - a.score);

                const myRankIndex = scoresArr.findIndex(s => s.id === user.id);
                personal_rank = {
                    rank: myRankIndex !== -1 ? myRankIndex + 1 : scoresArr.length + 1,
                    total: scoresArr.length + (myRankIndex === -1 ? 1 : 0)
                };
            }

        } else if (role === "ngo") {
            // 1. Personal Stats
            const { data: myPickups } = await supabase
                .from("pickups")
                .select("completed_at, listings(quantity_kg)")
                .eq("ngo_id", user.id)
                .eq("status", "completed");

            if (myPickups) {
                const daysMap = new Map<string, number>([
                    ["Sun", 0], ["Mon", 0], ["Tue", 0], ["Wed", 0], ["Thu", 0], ["Fri", 0], ["Sat", 0]
                ]);
                for (const p of myPickups) {
                    const kg = Number((p.listings as { quantity_kg?: number })?.quantity_kg) || 0;
                    total_kg += kg;
                    if (p.completed_at) {
                        const w = getWeekLabel(p.completed_at);
                        weekly_trend_map.set(w, (weekly_trend_map.get(w) || 0) + kg);

                        const date = new Date(p.completed_at);
                        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                        const day = days[date.getDay()];
                        daysMap.set(day, (daysMap.get(day) || 0) + 1); // count pickups
                    }
                }
                ngo_logistics = Array.from(daysMap.entries()).map(([day, pickups]) => ({ day, pickups }));
            }

            // 2. Global NGO Leaderboard
            const { data: allPickups, error: ngoErr } = await adminClient
                .from("pickups")
                .select("ngo_id, listings(quantity_kg)")
                .eq("status", "completed");

            if (ngoErr) console.error("NGO Leaderboard Error:", ngoErr);

            if (allPickups && allPickups.length > 0) {
                const scores = new Map<string, number>();
                for (const p of allPickups) {
                    const s = scores.get(p.ngo_id) || 0;
                    scores.set(p.ngo_id, s + (Number((p.listings as { quantity_kg?: number })?.quantity_kg) || 0));
                }
                const scoresArr = Array.from(scores.entries()).map(([id, score]) => ({ id, score }));
                scoresArr.sort((a, b) => b.score - a.score);

                const myRankIndex = scoresArr.findIndex(s => s.id === user.id);
                personal_rank = {
                    rank: myRankIndex !== -1 ? myRankIndex + 1 : scoresArr.length + 1,
                    total: scoresArr.length + (myRankIndex === -1 ? 1 : 0)
                };
            }

        } else if (role === "volunteer") {
            // 1. Personal Volunteer Stats
            const { data: vol } = await supabase
                .from("volunteers")
                .select("hours_logged, tasks_completed, rating")
                .eq("id", user.id)
                .single();

            if (vol) {
                const tasks = Number(vol.tasks_completed) || 0;
                volunteer_stats = {
                    hours_logged: Number(vol.hours_logged) || 0,
                    tasks_completed: tasks,
                    rating: Number(vol.rating) || 0
                };

                // Dynamic Gamification Milestones
                let next_goal = 5;
                if (tasks >= 5) next_goal = 10;
                if (tasks >= 10) next_goal = Math.ceil((tasks + 1) / 10) * 10;
                if (tasks >= 50) next_goal = Math.ceil((tasks + 1) / 25) * 25;

                volunteer_milestones = {
                    current: tasks,
                    next: next_goal,
                    progress: Math.min(100, Math.round((tasks / next_goal) * 100))
                };
            }

            // Total KG for Volunteer & Radar Profile
            const { data: myPickups } = await supabase
                .from("pickups")
                .select("completed_at, listings(quantity_kg)")
                .eq("volunteer_id", user.id)
                .eq("status", "completed");

            if (myPickups) {
                let morning = 0, evening = 0, weekend = 0, heavy = 0;
                for (const p of myPickups) {
                    const kg = Number((p.listings as { quantity_kg?: number })?.quantity_kg) || 0;
                    total_kg += kg;
                    if (kg >= 20) heavy++;

                    if (p.completed_at) {
                        const w = getWeekLabel(p.completed_at);
                        weekly_trend_map.set(w, (weekly_trend_map.get(w) || 0) + kg);

                        const d = new Date(p.completed_at);
                        const hr = d.getHours();
                        const day = d.getDay();

                        if (hr < 12) morning++;
                        else evening++;

                        if (day === 0 || day === 6) weekend++;
                    }
                }

                const maxVal = Math.max(morning, evening, weekend, heavy, 1);
                volunteer_radar = [
                    { subject: "Morning", A: morning, fullMark: maxVal },
                    { subject: "Evening", A: evening, fullMark: maxVal },
                    { subject: "Weekend", A: weekend, fullMark: maxVal },
                    { subject: "Heavy Lifts", A: heavy, fullMark: maxVal }
                ];
            }

            // 2. Global Volunteer Leaderboard
            const { data: allVols, error: volErr } = await adminClient
                .from("volunteers")
                .select("id, tasks_completed")
                .order("tasks_completed", { ascending: false });

            if (volErr) console.error("Volunteer Leaderboard Error:", volErr);

            if (allVols && allVols.length > 0) {
                const scoresArr = allVols.map((v: { id: string, tasks_completed: number }) => ({ id: v.id, score: Number(v.tasks_completed) || 0 }));
                scoresArr.sort((a, b) => b.score - a.score);

                const myRankIndex = scoresArr.findIndex((s: { id: string, score: number }) => s.id === user.id);
                personal_rank = {
                    rank: myRankIndex !== -1 ? myRankIndex + 1 : scoresArr.length + 1,
                    total: scoresArr.length + (myRankIndex === -1 ? 1 : 0)
                };
            }
        }

        // Convert map to sorted array
        const weekly_trend = Array.from(weekly_trend_map.entries())
            .map(([week, kg]) => ({ week, kg }))
            .sort((a, b) => a.week.localeCompare(b.week));

        return NextResponse.json({
            data: {
                total_kg,
                total_meals: total_kg * 2.5,
                co2_offset: total_kg * 2.5,
                weekly_trend,
                personal_rank,
                volunteer_stats,
                donor_food_types,
                ngo_logistics,
                volunteer_radar,
                volunteer_milestones
            }
        });
    } catch (err) {
        console.error("Impact API Error:", err);
        return NextResponse.json({ error: "Failed to load impact stats" }, { status: 500 });
    }
}
