"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadCount() {
    const supabase = createClient();
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        const { count: c } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false);
        setCount(c ?? 0);
    }, [supabase]);

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            fetchCount();

            channel = supabase
                .channel("notifications-badge")
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "notifications" },
                    () => fetchCount()
                )
                .subscribe();
        })();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [fetchCount, supabase]);

    return count;
}