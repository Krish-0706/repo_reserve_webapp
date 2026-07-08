"use client";
// src/components/ngo/MapView.tsx
//
// Leaflet map component — dynamically imported (no SSR).
// Renders listing pins colour-coded by time urgency.
// Clicking a pin triggers onPinClickAction with the full listing object.
//
// Import leaflet-fix before Leaflet to patch marker icon resolution.

import { useEffect, useRef } from "react";
import type { MapListing } from "@/app/ngo/map/page";

// Must import leaflet-fix before L
import "@/lib/leaflet-fix";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Custom pin SVG — colour based on time remaining ─────────────────────────
function pinSvg(color: string, selected: boolean): string {
    const w = selected ? 24 : 20;
    const h = selected ? 34 : 28;
    const shadow = selected ? `filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));` : `filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));`;
    return `
    <div style="${shadow} transition: all 0.2s;">
      <svg width="${w}" height="${h}" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.48 15.52 0 10 0z"
          fill="${color}"/>
        <circle cx="10" cy="10" r="4" fill="#fff" opacity="0.95"/>
      </svg>
    </div>`;
}

function getPinColor(pickupEnd: string): string {
    const diff = new Date(pickupEnd).getTime() - Date.now();
    const hours = diff / 3600000;
    if (hours < 1) return "#E24B4A"; // red — closing soon
    if (hours < 2) return "#BA7517"; // amber — moderate urgency
    return "#E8450A";                  // brand orange — plenty of time
}

function makeIcon(listing: MapListing, selected: boolean): L.DivIcon {
    const color = getPinColor(listing.pickup_end);
    const w = selected ? 24 : 20;
    const h = selected ? 34 : 28;
    return L.divIcon({
        html: pinSvg(color, selected),
        iconSize: [w, h],
        iconAnchor: [w / 2, h],
        popupAnchor: [0, -h],
        className: "",
    });
}

// ─── Props ────────────────────────────────────────────────────────────────────
type MapViewProps = {
    listings: MapListing[];
    selectedId: string | null;
    onPinClickAction: (listing: MapListing) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function MapView({ listings, selectedId, onPinClickAction }: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Initialise map once ──────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [19.0760, 72.8777], // Mumbai centre
            zoom: 13,
            zoomControl: false,
        });

        // OSM tile layer — free, no API key
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        // Custom zoom control position
        L.control.zoom({ position: "bottomright" }).addTo(map);

        mapRef.current = map;

        // Cleanup
        return () => {
            map.remove();
            mapRef.current = null;
            markersRef.current.clear();
        };
    }, []);

    // ── Sync markers with listings ────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const currentIds = new Set(listings.map((l) => l.id));

        // Remove markers no longer in listings
        markersRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                marker.remove();
                markersRef.current.delete(id);
            }
        });

        // Add or update markers
        listings.forEach((listing) => {
            const isSelected = listing.id === selectedId;

            if (markersRef.current.has(listing.id)) {
                // Update icon if selection changed
                const marker = markersRef.current.get(listing.id)!;
                marker.setIcon(makeIcon(listing, isSelected));
            } else {
                // Create new marker
                const marker = L.marker([listing.lat, listing.lng], {
                    icon: makeIcon(listing, isSelected),
                    zIndexOffset: isSelected ? 1000 : 0,
                });

                marker.on("click", () => onPinClickAction(listing));

                // Tooltip on hover
                marker.bindTooltip(
                    `<div style="font-family:'DM Sans',sans-serif;font-size:12px;padding:2px 0;">
            <strong style="font-family:'Syne',sans-serif;color:#1A1714;">${listing.food_name || listing.food_type}</strong><br/>
            ${listing.quantity_kg} kg · ${listing.address.split(",")[0]}
          </div>`,
                    { direction: "top", offset: [0, -30], opacity: 0.97 }
                );

                marker.addTo(map);
                markersRef.current.set(listing.id, marker);
            }
        });

        // Auto-fit bounds if listings exist
        if (listings.length > 0 && !selectedId) {
            const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [listings, selectedId, onPinClickAction]);

    // ── Pan to selected pin ───────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !selectedId) return;
        const listing = markersRef.current.get(selectedId);
        if (listing) {
            map.setView(listing.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
        }
    }, [selectedId]);

    return (
        <div
            ref={containerRef}
            style={{ width: "100%", height: "100%", zIndex: 1 }}
        />
    );
}