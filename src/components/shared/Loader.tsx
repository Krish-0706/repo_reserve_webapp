"use client";
// src/components/shared/Loader.tsx
//
// Two exports:
//  - <Spinner />     small inline spinner for inside buttons
//  - <PageLoader />  full-screen overlay shown during navigation / page transitions

export function Spinner({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: "reserve-spin 0.7s linear infinite" }}
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 00-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <style>{`@keyframes reserve-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// Full-screen overlay with brand mark — shown while navigating between pages
// or while a blocking API call is in flight (e.g. posting a listing).
export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(240,237,232,0.85)",
      backdropFilter: "blur(4px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "16px",
    }}>
      {/* Pulsing brand ring */}
      <div style={{ position: "relative", width: "56px", height: "56px" }}>
        <div style={{
          position: "absolute", inset: 0,
          border: "3px solid rgba(232,69,10,0.15)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          border: "3px solid transparent",
          borderTopColor: "#E8450A",
          borderRadius: "50%",
          animation: "reserve-spin 0.8s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: "20px", height: "20px", borderRadius: "50%",
            background: "#1A1714",
            animation: "reserve-pulse 1.2s ease-in-out infinite",
          }} />
        </div>
      </div>

      <div style={{
        fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 600,
        color: "#1A1714", letterSpacing: "0.02em",
      }}>
        {label}
      </div>

      <style>{`
        @keyframes reserve-spin { to { transform: rotate(360deg); } }
        @keyframes reserve-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(0.8); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}