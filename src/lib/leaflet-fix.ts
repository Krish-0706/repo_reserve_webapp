// src/lib/leaflet-fix.ts
//
// Fixes Leaflet's default marker icon resolution failure in Next.js.
// Webpack cannot resolve Leaflet's internal image paths at build time.
// This override uses CDN URLs instead.
//
// Import this file at the top of any component that uses Leaflet:
//   import "@/lib/leaflet-fix";

import L from "leaflet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});