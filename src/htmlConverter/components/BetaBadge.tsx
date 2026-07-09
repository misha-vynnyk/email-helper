import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type BadgeState = "idle" | "falling" | "fallen" | "rising";

export interface BetaBadgeHandle {
  /** Play the detach → sway ×2 → drop → rest → rise sequence (no-op unless idle). */
  play: () => void;
}

/**
 * "Beta" pill that, when triggered, detaches from its right edge, swings twice,
 * falls to the bottom of its container, lies there for 3s, then rises back.
 *
 * Trigger sources:
 *  - hovering the badge itself (onMouseEnter) — used where the badge is the target;
 *  - imperatively via ref.play() — used when a larger element (e.g. an "Advanced"
 *    button wrapping the badge) should trigger it.
 *
 * Drop depth is the `--beta-drop` CSS var — override per usage (e.g. Tailwind
 * arbitrary property `[--beta-drop:36px]`) to reach that container's bottom.
 */
export const BetaBadge = forwardRef<BetaBadgeHandle, { className?: string }>(
  function BetaBadge({ className = "" }, ref) {
    const [state, setState] = useState<BadgeState>("idle");
    const riseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const play = useCallback(() => setState((s) => (s === "idle" ? "falling" : s)), []);
    useImperativeHandle(ref, () => ({ play }), [play]);

    useEffect(() => {
      return () => {
        if (riseTimeoutRef.current) clearTimeout(riseTimeoutRef.current);
      };
    }, []);

    const handleAnimationEnd = (e: React.AnimationEvent<HTMLSpanElement>) => {
      if (e.animationName === "beta-badge-fall") {
        // Landed at the bottom → lie there for 3s, then rise back to place.
        setState("fallen");
        riseTimeoutRef.current = setTimeout(() => setState("rising"), 3000);
      } else if (e.animationName === "beta-badge-rise") {
        setState("idle");
      }
    };

    return (
      <span
        onMouseEnter={play}
        onAnimationEnd={handleAnimationEnd}
        className={`
        inline-flex items-center overflow-hidden rounded-full
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
            /* Глибина падіння — на низ контейнера. Перевизначай per-usage. */
            --beta-drop: 16px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          }

          /* Стан спокою */
          .beta-badge-idle {
            transform: rotate(0deg) translateY(0);
          }

          /* Відрив справа → двічі колихнутися → падіння на низ контейнера */
          .beta-badge-falling {
            animation: beta-badge-fall 1.6s ease-in-out forwards;
          }

          /* Лежить на дні (кадр = 100% падіння), чекає 3с перед підйомом */
          .beta-badge-fallen {
            transform: rotate(6deg) translateY(var(--beta-drop));
            box-shadow: 0 6px 9px rgba(0, 0, 0, 0.3);
          }

          /* Плавний підйом назад у стан спокою з легким пружним переletом */
          .beta-badge-rising {
            animation: beta-badge-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          @keyframes beta-badge-fall {
            0%   { transform: rotate(0deg)  translateY(0);                            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); }
            /* відрив і два колихання правого краю (origin-left → права частина гойдається) */
            10%  { transform: rotate(20deg) translateY(0);                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.20); }
            22%  { transform: rotate(5deg)  translateY(0);                            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.18); }
            34%  { transform: rotate(16deg) translateY(0);                            box-shadow: 0 3px 5px rgba(0, 0, 0, 0.22); }
            46%  { transform: rotate(9deg)  translateY(0);                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.20); }
            /* зрив із кріплення і падіння на низ, з легким приземленням */
            72%  { transform: rotate(24deg) translateY(calc(var(--beta-drop) * 0.7)); box-shadow: 0 6px 10px rgba(0, 0, 0, 0.30); }
            88%  { transform: rotate(2deg)  translateY(calc(var(--beta-drop) + 3px)); box-shadow: 0 7px 12px rgba(0, 0, 0, 0.32); }
            100% { transform: rotate(6deg)  translateY(var(--beta-drop));             box-shadow: 0 6px 9px rgba(0, 0, 0, 0.30); }
          }

          @keyframes beta-badge-rise {
            0%   { transform: rotate(6deg)  translateY(var(--beta-drop)); box-shadow: 0 6px 9px rgba(0, 0, 0, 0.30); }
            55%  { transform: rotate(-5deg) translateY(-2px);            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.18); }
            78%  { transform: rotate(2deg)  translateY(0);               box-shadow: 0 1.5px 2px rgba(0, 0, 0, 0.16); }
            100% { transform: rotate(0deg)  translateY(0);               box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); }
          }
        `}</style>
      </span>
    );
  },
);
