import type { ReactNode } from "react";
import { cn } from "../lib/cn.js";

/**
 * AppShell per design.md §4 — device frame, safe-area, portrait-only
 * interstitial. Renders the page content plus an optional bottom navigation
 * slot supplied by AppShell.
 *
 * - max-width 480px, min-height 100dvh, centered
 * - ≥520px viewports: device frame (1px line border, 24px radius, cyan halo)
 *   over a dimmed blurred copy of the grid horizon as ambient backdrop
 * - owns ALL chrome offset: content gets bottom padding = BottomNav height +
 *   safe-area when not immersive. Pages: do not add it.
 * - BottomNav is hidden on immersive routes via the `immersive` prop.
 * - portrait-only: landscape shows a "Tilt me up!" interstitial with an
 *   injectable mascot image.
 */
export function Layout({
  children,
  immersive,
  mascotSrc,
  backdropSrc,
  portraitHint,
  bottomNav,
}: {
  children: ReactNode;
  immersive: boolean;
  mascotSrc?: string;
  /** ambient desktop backdrop image; omitted when not provided */
  backdropSrc?: string;
  /** e.g. "Phase World plays in portrait" */
  portraitHint?: string;
  bottomNav?: ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] bg-night-0">
      {/* Desktop-only ambient backdrop: dimmed blurred image */}
      {backdropSrc ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 hidden min-[520px]:block"
        >
          <img
            src={backdropSrc}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
          <div className="absolute inset-0 bg-night-0/70" />
        </div>
      ) : null}

      {/* Device frame */}
      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-night-1",
          "min-[520px]:my-6 min-[520px]:min-h-[calc(100dvh-48px)] min-[520px]:overflow-hidden",
          "min-[520px]:rounded-[24px] min-[520px]:border min-[520px]:border-line min-[520px]:shadow-glow-cyan",
        )}
      >
        <main
          className="relative flex flex-1 flex-col"
          style={
            immersive
              ? undefined
              : { paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }
          }
        >
          {children}
        </main>
        {!immersive && bottomNav}
      </div>

      {/* Portrait-only interstitial */}
      <div className="fixed inset-0 z-[70] hidden flex-col items-center justify-center gap-4 bg-night-0 landscape:flex min-[900px]:hidden">
        {mascotSrc ? (
          <img src={mascotSrc} alt="" className="h-24 w-24 rotate-90" />
        ) : (
          <span className="h-24 w-24 rotate-90 rounded-full bg-night-2" />
        )}
        <p className="font-display text-h1 text-amber text-glow-amber">
          Tilt me up!
        </p>
        <p className="text-caption uppercase text-mid">
          {portraitHint ?? "Best played in portrait"}
        </p>
      </div>
    </div>
  );
}
