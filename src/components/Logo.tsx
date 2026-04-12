import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark";
  className?: string;
}

const sizes = {
  sm:  { icon: 28,  name: 16, gap: 8  },
  md:  { icon: 38,  name: 22, gap: 10 },
  lg:  { icon: 50,  name: 28, gap: 12 },
  xl:  { icon: 64,  name: 36, gap: 16 },
};

/**
 * Learnovora — v3 Logo
 *
 * Icon concept: A rounded square with a gradient fill contains an open-book
 * shape whose right page curves upward into a subtle upward-pointing chevron —
 * symbolising knowledge lifting you higher. Clean, minimal, memorable.
 *
 * Palette: violet #7C3AED → indigo #4F46E5 → sky #0EA5E9
 * Wordmark: "Learnov" in near-black, "ora" in brand violet — split gives a
 * natural rhythm and makes the name scannable at small sizes.
 */
export function Logo({
  variant = "full",
  size    = "md",
  theme   = "light",
  className,
}: LogoProps) {
  const s          = sizes[size];
  const isDark     = theme === "dark";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";

  // Unique IDs so multiple instances on the same page don't clash
  const uid = "lv3";

  return (
    <div
      className={cn("inline-flex items-center shrink-0 select-none", className)}
      style={{ gap: s.gap }}
    >
      {/* ── ICON MARK ── */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Brand gradient: teal only to match app theme */}
          <linearGradient id={`${uid}-g1`} x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#004643" />
            <stop offset="50%"  stopColor="#006661" />
            <stop offset="100%" stopColor="#008a85" />
          </linearGradient>

          {/* Lighter tint for the book pages */}
          <linearGradient id={`${uid}-g2`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#EDE9FE" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>

          {/* Subtle drop shadow on the badge */}
          <filter id={`${uid}-shadow`} x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4F46E5" floodOpacity="0.28" />
          </filter>

          {/* Glow on the arrow tip */}
          <filter id={`${uid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Rounded badge background */}
        <rect
          width="48" height="48" rx="13"
          fill={`url(#${uid}-g1)`}
          filter={`url(#${uid}-shadow)`}
        />

        {/* ── Open book body ── */}
        {/* Left page */}
        <path
          d="M10 14 C10 13 11 12 12 12 L22 13.5 L22 34 L12 32.5 C11 32.3 10 31.3 10 30.3 Z"
          fill="white"
          opacity="0.92"
        />
        {/* Right page — top-right corner lifts up (the "rising" motif) */}
        <path
          d="M26 13.5 L36 12 C37 12 38 13 38 14 L38 30.3 C38 31.3 37 32.3 36 32.5 L26 34 Z"
          fill="white"
          opacity="0.75"
        />
        {/* Spine line */}
        <line x1="24" y1="13" x2="24" y2="34" stroke={`url(#${uid}-g1)`} strokeWidth="1.5" strokeLinecap="round" />

        {/* ── Upward chevron / arrow emerging from the book top ── */}
        <g filter={`url(#${uid}-glow)`}>
          <polyline
            points="18,20 24,13 30,20"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Arrow stem */}
          <line
            x1="24" y1="13" x2="24" y2="8"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>

        {/* ── Three text lines on left page (detail) ── */}
        <line x1="13" y1="19" x2="20" y2="19.4" stroke={`url(#${uid}-g1)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <line x1="13" y1="22.5" x2="20" y2="22.9" stroke={`url(#${uid}-g1)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        <line x1="13" y1="26" x2="18" y2="26.3" stroke={`url(#${uid}-g1)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      </svg>

      {/* ── WORDMARK ── */}
      {variant === "full" && (
        <span
          style={{
            fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: s.name,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "baseline",
          }}
        >
          <span style={{ color: textPrimary }}>Learnov</span>
          <span
            style={{
              background: "linear-gradient(120deg, #004643 0%, #006661 55%, #008a85 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ora
          </span>
        </span>
      )}
    </div>
  );
}
