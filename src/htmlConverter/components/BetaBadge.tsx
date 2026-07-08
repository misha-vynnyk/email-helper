import { useEffect, useRef, useState } from "react";

type BadgeState = "idle" | "falling" | "fallen" | "rising";

export function BetaBadge({ className = "" }: { className?: string }) {
  const [state, setState] = useState<BadgeState>("idle");
  const riseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (riseTimeoutRef.current) clearTimeout(riseTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (state === "idle") {
      setState("falling");
    }
  };

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLSpanElement>) => {
    if (e.animationName === "beta-badge-fall") {
      setState("fallen");
      riseTimeoutRef.current = setTimeout(() => {
        setState("rising");
      }, 4000);
    } else if (e.animationName === "beta-badge-rise") {
      setState("idle");
    }
  };

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onAnimationEnd={handleAnimationEnd}
      className={`
      relative inline-flex items-center overflow-hidden rounded-full
      bg-gradient-to-r from-[hsl(var(--chart-3))] via-[hsl(var(--chart-5))] to-[hsl(var(--chart-4))]
      px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white

      /* Точка кріплення — лівий край, права частина "відривається" */
      origin-left

      beta-badge beta-badge-${state}

      ${className}
    `}
    >
      Beta
      <span className='pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out hover:translate-x-full' />

      <style>{`
        .beta-badge {
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }

        /* Стан спокою */
        .beta-badge-idle {
          transform: rotate(0deg) skewY(0deg) translateY(0);
        }

        /* Відрив і падіння правого краю: гойдається зі скосом (папір, а не жорсткий шарнір),
           тінь наростає — відчуття, що край підіймається над поверхнею */
        .beta-badge-falling {
          animation: beta-badge-fall 0.65s ease-in-out forwards;
        }

        /* Провисає й чекає 3с перед підйомом */
        .beta-badge-fallen {
          transform: rotate(14deg) skewY(-1deg) translateY(2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.35);
        }

        /* Плавний підйом назад у стан спокою з легким пружним переletом в кінці */
        .beta-badge-rising {
          animation: beta-badge-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes beta-badge-fall {
          0%   { transform: rotate(0deg)   skewY(0deg)   translateY(0);   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); }
          25%  { transform: rotate(24deg)  skewY(-4deg)  translateY(-1px); box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2); }
          45%  { transform: rotate(6deg)   skewY(3deg)   translateY(1px);  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.25); }
          65%  { transform: rotate(19deg)  skewY(-2deg)  translateY(0);    box-shadow: 0 4px 5px rgba(0, 0, 0, 0.28); }
          85%  { transform: rotate(9deg)   skewY(1deg)   translateY(2px);  box-shadow: 0 5px 7px rgba(0, 0, 0, 0.32); }
          100% { transform: rotate(14deg)  skewY(-1deg)  translateY(2px);  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.35); }
        }

        @keyframes beta-badge-rise {
          0%   { transform: rotate(14deg) skewY(-1deg)  translateY(2px);  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.35); }
          60%  { transform: rotate(-4deg) skewY(1deg)   translateY(-1px); box-shadow: 0 2px 3px rgba(0, 0, 0, 0.18); }
          80%  { transform: rotate(2deg)  skewY(-0.5deg) translateY(0);   box-shadow: 0 1.5px 2px rgba(0, 0, 0, 0.16); }
          100% { transform: rotate(0deg)  skewY(0deg)    translateY(0);   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); }
        }
      `}</style>
    </span>
  );
}
