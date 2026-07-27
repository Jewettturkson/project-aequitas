"use client";

// TurkNode wordmark: lowercase Manrope ExtraBold with the cyan full stop.
// animated: letters rise in staggered, the period pops last and keeps a
// slow heartbeat pulse. CSS-only; respects prefers-reduced-motion.
type BrandLogoProps = {
  variant?: "full" | "icon" | "auto";
  className?: string;
  priority?: boolean;
  onDark?: boolean;
  animated?: boolean;
};

const WORD = "turknode".split("");

export default function BrandLogo({ variant = "auto", className = "", onDark = false, animated = false }: BrandLogoProps) {
  const color = onDark ? "text-white" : "text-[#0b1a37]";
  const icon = variant === "icon";
  const text = icon ? ["t", "n"] : WORD;

  return (
    <span
      className={`flex h-full w-full items-center justify-center font-extrabold tracking-tight ${color} ${className}`}
      style={{ fontFamily: "Manrope, Inter, sans-serif" }}
      aria-label="TurkNode"
    >
      <span className={icon ? "text-[1.5em]" : "text-[1.35em] md:text-[1.6em]"}>
        {animated ? (
          <>
            {text.map((letter, i) => (
              <span key={i} className="tn-clip">
                <span className="tn-letter" style={{ animationDelay: `${i * 0.055}s` }}>
                  {letter}
                </span>
              </span>
            ))}
            <span className="tn-dot text-cyan-400">.</span>
          </>
        ) : (
          <>
            {text.join("")}
            <span className="text-cyan-400">.</span>
          </>
        )}
      </span>
    </span>
  );
}
