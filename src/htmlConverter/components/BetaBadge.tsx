import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type BadgeState = "idle" | "falling" | "fallen" | "rising";

export interface BetaBadgeHandle {
  /** Play the detach → swing to vertical ×2 → drop → rest → rise sequence (no-op unless idle). */
  play: () => void;
}

/**
 * "Beta" pill that, when triggered, detaches from its right edge and swings on
 * that hinge past vertical (twice, damping out), then falls to the bottom of
 * its container, lies there for 3s, then rises back.
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
        riseTimeoutRef.current = setTimeout(() => setState("rising"), 2000);
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
            --beta-drop: 26px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          }

          /* Стан спокою */
          .beta-badge-idle {
            transform: rotate(0deg) translateY(0);
          }

          /* Відрив справа → двічі гойднутися (до вертикалі й трохи за неї) → падіння на низ.
             Timing-function задано per-keyframe (нижче) — гойдання, вільне падіння й удар
             мають різну фізичну природу, тож "linear" тут лише fallback. */
          .beta-badge-falling {
            animation: beta-badge-fall 1.8s linear forwards;
          }

          /* Лежить на дні (кадр = 100% падіння), чекає 3с перед підйомом */
          .beta-badge-fallen {
            transform: rotate(0deg) translateY(var(--beta-drop));
            box-shadow: 0 6px 9px rgba(0, 0, 0, 0.3);
          }

          /* Плавний підйом назад у стан спокою з легким пружним переletом */
          .beta-badge-rising {
            animation: beta-badge-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          /*
           * Physically-motivated phases (each keyframe's animation-timing-function
           * governs the segment TO THE NEXT keyframe — CSS applies it per-interval).
           * The badge is pinned only at its left edge (origin-left) once the hinge
           * tears — under gravity its stable hanging position is VERTICAL (rotate(90deg)),
           * not flat. Released from flat (0deg), it swings down past vertical the same
           * way a dropped trapdoor does:
           *   0%–24%   swing 1: accelerates down through vertical (ease-in-quad — torque,
           *            and so angular speed, is greatest passing 90deg) and overshoots to
           *            ~120deg before gravity decelerates it (ease-out) into the peak.
           *   24%–48%  swing back down through vertical to a rebound low, then a second,
           *            smaller swing back up past vertical (~100deg) — amplitude damped.
           *   48%–58%  settle dip: the hinge is failing, energy bleeding off.
           *   58%–80%  hinge fully gives way → free fall, accelerating (ease-in-quad ≈
           *            gravity, position ∝ t²) while de-rotating back toward flat, as if
           *            straightening out as it drops (no more hinge torque to fight).
           *   80%–96%  impact: energy absorption (ease-out) with a slight overshoot past
           *            rest, then a small elastic rebound back up.
           *   96%–100% final settle, ending exactly at .beta-badge-fallen's transform so
           *            the animation → static-class handoff doesn't pop.
           */
          @keyframes beta-badge-fall {
            0%   { transform: rotate(0deg)    translateY(0);                             box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); animation-timing-function: cubic-bezier(0.11, 0, 0.5, 0); }
            14%  { transform: rotate(95deg)   translateY(0);                             box-shadow: 0 4px 6px rgba(0, 0, 0, 0.24); animation-timing-function: cubic-bezier(0.5, 1, 0.89, 1); }
            24%  { transform: rotate(120deg)  translateY(0);                             box-shadow: 0 4px 7px rgba(0, 0, 0, 0.26); animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1); }
            36%  { transform: rotate(90deg)   translateY(0);                             box-shadow: 0 3px 5px rgba(0, 0, 0, 0.21); animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1); }
            48%  { transform: rotate(100deg)  translateY(0);                             box-shadow: 0 3px 5px rgba(0, 0, 0, 0.22); animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1); }
            58%  { transform: rotate(70deg)   translateY(0);                             box-shadow: 0 2px 4px rgba(0, 0, 0, 0.19); animation-timing-function: cubic-bezier(0.11, 0, 0.5, 0); }
            80%  { transform: rotate(40deg)   translateY(calc(var(--beta-drop) * 0.6));  box-shadow: 0 10px 14px rgba(0, 0, 0, 0.34); animation-timing-function: cubic-bezier(0.5, 1, 0.89, 1); }
            90%  { transform: rotate(-6deg)   translateY(calc(var(--beta-drop) + 4px));  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.38); animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1); }
            96%  { transform: rotate(4deg)    translateY(calc(var(--beta-drop) - 2px));  box-shadow: 0 5px 7px rgba(0, 0, 0, 0.30); animation-timing-function: cubic-bezier(0.5, 1, 0.89, 1); }
            100% { transform: rotate(0deg)    translateY(var(--beta-drop));              box-shadow: 0 6px 9px rgba(0, 0, 0, 0.30); }
          }

          @keyframes beta-badge-rise {
            0%   { transform: rotate(0deg)  translateY(var(--beta-drop)); box-shadow: 0 6px 9px rgba(0, 0, 0, 0.30); }
            55%  { transform: rotate(-5deg) translateY(-2px);            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.18); }
            78%  { transform: rotate(2deg)  translateY(0);               box-shadow: 0 1.5px 2px rgba(0, 0, 0, 0.16); }
            100% { transform: rotate(0deg)  translateY(0);               box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); }
          }
        `}</style>
      </span>
    );
  },
);
