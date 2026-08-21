"use client";
// src/app/volunteer/select-ngo/page.tsx
//
// Onboarding page — shown after first volunteer login.
// Volunteer picks which NGO they want to work with.
// Now includes a search bar and cascading location filters
// (state → district → city → landmark) so volunteers can
// find NGOs near them.

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageLoader, Spinner } from "@/components/shared/Loader";
import { useIsMobile } from "@/hooks/useIsMobile";

type NgoOption = {
    id: string;
    org_name: string;
    state: string | null;
    district: string | null;
    city: string | null;
    landmark: string | null;
};

/* ── tiny SVG icons (inline to avoid extra deps) ──────────────────────────── */

function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function FilterIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}

function MapPinIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

/* ── helper: build a sorted list of unique non-null values ────────────────── */
function uniqueValues(items: NgoOption[], key: keyof NgoOption): string[] {
    const set = new Set<string>();
    for (const item of items) {
        const v = item[key];
        if (typeof v === "string" && v.trim()) set.add(v.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/* ── reusable filter dropdown ─────────────────────────────────────────────── */
function FilterSelect({
    label, value, options, onChange, disabled,
}: {
    label: string; value: string; options: string[];
    onChange: (v: string) => void; disabled?: boolean;
}) {
    return (
        <div style={{ flex: 1, minWidth: "130px" }}>
            <label style={{
                display: "block", fontSize: "11px", fontWeight: 600,
                color: "#6B7280", marginBottom: "5px", textTransform: "uppercase",
                letterSpacing: "0.05em",
            }}>{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled || options.length === 0}
                style={{
                    width: "100%", height: "38px", borderRadius: "10px",
                    border: "1.5px solid #E5E7EB", background: disabled ? "#F9FAFB" : "#fff",
                    padding: "0 12px", fontSize: "13px", fontFamily: "Geist, sans-serif",
                    color: value ? "#111" : "#9CA3AF", cursor: disabled ? "not-allowed" : "pointer",
                    outline: "none", transition: "border-color 0.15s",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                }}
            >
                <option value="">All</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SelectNgoPage() {
    const supabase = createClient();
    const router = useRouter();
    const isMobile = useIsMobile();

    const [ngoList, setNgoList] = useState<NgoOption[]>([]);
    const [selectedNgoId, setSelectedNgoId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [navigating, setNavigating] = useState(false);

    // Search & filter state
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filterState, setFilterState] = useState("");
    const [filterDistrict, setFilterDistrict] = useState("");
    const [filterCity, setFilterCity] = useState("");
    const [filterLandmark, setFilterLandmark] = useState("");

    const hasActiveFilters = !!(filterState || filterDistrict || filterCity || filterLandmark);

    // Fetch approved NGOs with location data
    useEffect(() => {
        supabase
            .from("ngos")
            .select("id, org_name, state, district, city, landmark")
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

    /* ── cascading filter logic (client-side) ──────────────────────────────── */

    // 1. Filtered list after applying location filters + search
    const filteredNgos = useMemo(() => {
        let result = ngoList;

        if (filterState) result = result.filter(n => n.state === filterState);
        if (filterDistrict) result = result.filter(n => n.district === filterDistrict);
        if (filterCity) result = result.filter(n => n.city === filterCity);
        if (filterLandmark) result = result.filter(n => n.landmark === filterLandmark);

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(n =>
                n.org_name.toLowerCase().includes(q) ||
                (n.city && n.city.toLowerCase().includes(q)) ||
                (n.state && n.state.toLowerCase().includes(q)) ||
                (n.landmark && n.landmark.toLowerCase().includes(q))
            );
        }

        return result;
    }, [ngoList, filterState, filterDistrict, filterCity, filterLandmark, search]);

    // 2. Dropdown options cascade: each level narrows the next
    const stateOptions = useMemo(() => uniqueValues(ngoList, "state"), [ngoList]);

    const districtOptions = useMemo(() => {
        const pool = filterState ? ngoList.filter(n => n.state === filterState) : ngoList;
        return uniqueValues(pool, "district");
    }, [ngoList, filterState]);

    const cityOptions = useMemo(() => {
        let pool = ngoList;
        if (filterState) pool = pool.filter(n => n.state === filterState);
        if (filterDistrict) pool = pool.filter(n => n.district === filterDistrict);
        return uniqueValues(pool, "city");
    }, [ngoList, filterState, filterDistrict]);

    const landmarkOptions = useMemo(() => {
        let pool = ngoList;
        if (filterState) pool = pool.filter(n => n.state === filterState);
        if (filterDistrict) pool = pool.filter(n => n.district === filterDistrict);
        if (filterCity) pool = pool.filter(n => n.city === filterCity);
        return uniqueValues(pool, "landmark");
    }, [ngoList, filterState, filterDistrict, filterCity]);

    // Reset child filters when a parent changes
    const handleStateChange = (v: string) => {
        setFilterState(v);
        setFilterDistrict("");
        setFilterCity("");
        setFilterLandmark("");
    };
    const handleDistrictChange = (v: string) => {
        setFilterDistrict(v);
        setFilterCity("");
        setFilterLandmark("");
    };
    const handleCityChange = (v: string) => {
        setFilterCity(v);
        setFilterLandmark("");
    };

    const clearFilters = () => {
        setSearch("");
        setFilterState("");
        setFilterDistrict("");
        setFilterCity("");
        setFilterLandmark("");
    };

    /* ── submit ────────────────────────────────────────────────────────────── */

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

    /* ── build location subtitle for each card ─────────────────────────────── */
    const locationText = (ngo: NgoOption): string | null => {
        const parts = [ngo.landmark, ngo.city, ngo.district, ngo.state].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : null;
    };

    /* ── render ────────────────────────────────────────────────────────────── */
    return (
        <div style={{
            minHeight: "100vh", background: "#FAFAFA",
            fontFamily: "Geist, sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: isMobile ? "24px 0" : "0",
        }}>
            {navigating && <PageLoader label="Loading your dashboard..." />}

            <div style={{
                width: "100%", maxWidth: "560px", padding: "0 24px",
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
                    padding: isMobile ? "28px 20px" : "36px 32px",
                }}>
                    <div style={{
                        fontFamily: "Geist, sans-serif", fontSize: "22px", fontWeight: 700,
                        color: "#111111", letterSpacing: "-0.3px", marginBottom: "8px",
                    }}>
                        Choose Your NGO
                    </div>
                    <div style={{
                        fontSize: "14px", color: "#6B7280", fontWeight: 400, marginBottom: "24px",
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
                        <>
                            {/* ── Search bar ───────────────────────────────── */}
                            <div style={{
                                display: "flex", gap: "8px", marginBottom: "12px",
                            }}>
                                <div style={{
                                    flex: 1, position: "relative",
                                }}>
                                    <div style={{
                                        position: "absolute", left: "12px", top: "50%",
                                        transform: "translateY(-50%)", pointerEvents: "none",
                                    }}>
                                        <SearchIcon />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name, city, or state..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        style={{
                                            width: "100%", height: "42px", borderRadius: "12px",
                                            border: "1.5px solid #E5E7EB", background: "#FAFAF8",
                                            padding: "0 14px 0 38px", fontSize: "14px",
                                            fontFamily: "Geist, sans-serif", color: "#111",
                                            outline: "none", transition: "border-color 0.15s",
                                        }}
                                        onFocus={e => e.target.style.borderColor = "#E8450A"}
                                        onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                                    />
                                </div>

                                {/* Filter toggle button */}
                                <button
                                    type="button"
                                    onClick={() => setFiltersOpen(v => !v)}
                                    style={{
                                        height: "42px", padding: "0 14px", borderRadius: "12px",
                                        border: hasActiveFilters ? "1.5px solid #E8450A" : "1.5px solid #E5E7EB",
                                        background: hasActiveFilters ? "rgba(232,69,10,0.06)" : "#FAFAF8",
                                        color: hasActiveFilters ? "#E8450A" : "#6B7280",
                                        cursor: "pointer", display: "flex", alignItems: "center",
                                        gap: "6px", fontSize: "13px", fontWeight: 600,
                                        fontFamily: "Geist, sans-serif",
                                        transition: "all 0.15s",
                                        flexShrink: 0,
                                    }}
                                >
                                    <FilterIcon />
                                    {!isMobile && "Filters"}
                                    {hasActiveFilters && (
                                        <span style={{
                                            width: "6px", height: "6px", borderRadius: "50%",
                                            background: "#E8450A",
                                        }} />
                                    )}
                                    <ChevronIcon open={filtersOpen} />
                                </button>
                            </div>

                            {/* ── Collapsible location filters ─────────────── */}
                            <div style={{
                                maxHeight: filtersOpen ? "200px" : "0",
                                overflow: "hidden",
                                transition: "max-height 0.25s ease, opacity 0.2s ease, margin 0.25s ease",
                                opacity: filtersOpen ? 1 : 0,
                                marginBottom: filtersOpen ? "16px" : "0",
                            }}>
                                <div style={{
                                    display: "flex", flexWrap: "wrap", gap: "10px",
                                    padding: "14px 16px", background: "#F9FAFB",
                                    borderRadius: "12px", border: "1px solid #F3F4F6",
                                }}>
                                    <FilterSelect
                                        label="State"
                                        value={filterState}
                                        options={stateOptions}
                                        onChange={handleStateChange}
                                    />
                                    <FilterSelect
                                        label="District"
                                        value={filterDistrict}
                                        options={districtOptions}
                                        onChange={handleDistrictChange}
                                        disabled={!filterState && districtOptions.length === 0}
                                    />
                                    <FilterSelect
                                        label="City"
                                        value={filterCity}
                                        options={cityOptions}
                                        onChange={handleCityChange}
                                    />
                                    <FilterSelect
                                        label="Landmark"
                                        value={filterLandmark}
                                        options={landmarkOptions}
                                        onChange={v => setFilterLandmark(v)}
                                    />
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            style={{
                                                alignSelf: "flex-end", height: "38px",
                                                padding: "0 14px", borderRadius: "10px",
                                                border: "1.5px solid #FECACA", background: "#FEF2F2",
                                                color: "#EF4444", fontSize: "12px", fontWeight: 600,
                                                fontFamily: "Geist, sans-serif",
                                                cursor: "pointer", transition: "all 0.15s",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ── Results count ────────────────────────────── */}
                            {(search || hasActiveFilters) && (
                                <div style={{
                                    fontSize: "12px", color: "#9CA3AF", marginBottom: "10px",
                                    fontWeight: 500,
                                }}>
                                    {filteredNgos.length} of {ngoList.length} NGO{ngoList.length !== 1 ? "s" : ""} shown
                                </div>
                            )}

                            {/* ── NGO list ─────────────────────────────────── */}
                            {filteredNgos.length === 0 ? (
                                <div style={{
                                    background: "#FAFAF8", border: "1px dashed #E5E7EB",
                                    borderRadius: "14px", padding: "28px 20px", textAlign: "center",
                                }}>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                                        stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"
                                        strokeLinejoin="round" style={{ marginBottom: "8px" }}>
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        <line x1="8" y1="11" x2="14" y2="11" />
                                    </svg>
                                    <div style={{
                                        fontFamily: "Geist, sans-serif", fontSize: "15px",
                                        fontWeight: 700, color: "#111", marginBottom: "4px",
                                    }}>
                                        No matching NGOs
                                    </div>
                                    <div style={{
                                        fontSize: "13px", color: "#9CA3AF", marginBottom: "14px",
                                    }}>
                                        Try broadening your search or clearing filters.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        style={{
                                            padding: "8px 20px", borderRadius: "10px",
                                            border: "1.5px solid #E5E7EB", background: "#fff",
                                            color: "#6B7280", fontSize: "13px", fontWeight: 600,
                                            fontFamily: "Geist, sans-serif", cursor: "pointer",
                                        }}
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            ) : (
                                <div style={{
                                    display: "flex", flexDirection: "column", gap: "10px",
                                    maxHeight: "340px", overflowY: "auto",
                                    paddingRight: "4px",
                                }}>
                                    {filteredNgos.map((ngo) => {
                                        const loc = locationText(ngo);
                                        const isSelected = selectedNgoId === ngo.id;
                                        return (
                                            <button
                                                key={ngo.id}
                                                type="button"
                                                onClick={() => setSelectedNgoId(ngo.id)}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: "14px",
                                                    padding: "16px 18px", borderRadius: "14px",
                                                    background: isSelected ? "rgba(232,69,10,0.06)" : "#FAFAF8",
                                                    border: isSelected
                                                        ? "2px solid #E8450A"
                                                        : "1.5px solid #E5E7EB",
                                                    cursor: "pointer", transition: "all 0.15s",
                                                    textAlign: "left", width: "100%",
                                                }}
                                            >
                                                <div style={{
                                                    width: "40px", height: "40px", borderRadius: "10px",
                                                    background: isSelected
                                                        ? "rgba(232,69,10,0.1)"
                                                        : "rgba(29,158,117,0.08)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0,
                                                }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                                        stroke={isSelected ? "#E8450A" : "#10B981"}
                                                        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                                                    </svg>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontFamily: "Geist, sans-serif", fontSize: "15px",
                                                        fontWeight: 700, color: "#111111",
                                                    }}>
                                                        {ngo.org_name}
                                                    </div>
                                                    {loc && (
                                                        <div style={{
                                                            display: "flex", alignItems: "center", gap: "4px",
                                                            marginTop: "3px",
                                                        }}>
                                                            <MapPinIcon />
                                                            <span style={{
                                                                fontSize: "12px", color: "#9CA3AF",
                                                                fontWeight: 400, overflow: "hidden",
                                                                textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                            }}>
                                                                {loc}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div style={{
                                                        width: "22px", height: "22px", borderRadius: "50%",
                                                        background: "#E8450A",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        flexShrink: 0,
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
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
