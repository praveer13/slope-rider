import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { IconButton } from "./IconButton.js";
import { GearCounter } from "./GearCounter.js";

/**
 * TopBar per design.md §13 (home/map/codex/settings) — 56px + safe inset.
 * Left: profile chip (Vex avatar 32px in level ring, gold 2px stroke).
 * Center: screen title H1. Right: GearCounter + settings IconButton.
 * Entrance: children slide down 16px + fade, stagger 60ms.
 *
 * Kit decoupling: store lookups replaced by props; profile avatar is now
 * injected via `avatarSrc` and settings click via `onSettings`.
 */
const item = {
  hidden: { opacity: 0, y: -16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

export function TopBar({
  title,
  gears,
  avatarSrc,
  level,
  onProfile,
  onSettings,
}: {
  title: string;
  gears: number;
  avatarSrc?: string;
  level?: number;
  onProfile?: () => void;
  onSettings?: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-line/60 bg-night-1/90 px-4 backdrop-blur-[12px]"
      style={{ marginTop: "env(safe-area-inset-top)" }}
    >
      <motion.button
        type="button"
        aria-label="Open profile"
        onClick={onProfile}
        variants={item}
        initial="hidden"
        animate="show"
        custom={0}
        className="relative flex h-11 w-11 items-center justify-center"
      >
        <span className="absolute inset-0 rounded-full border-2 border-gold shadow-glow-gold" />
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Vex avatar"
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <span className="h-8 w-8 rounded-full bg-night-3" />
        )}
        {typeof level === "number" && (
          <span className="absolute -bottom-0.5 -right-0.5 rounded-pill bg-gold px-1 font-mono text-[9px] font-bold text-night-0">
            {level}
          </span>
        )}
      </motion.button>

      <motion.h1
        variants={item}
        initial="hidden"
        animate="show"
        custom={1}
        className="font-display text-h1 text-hi"
      >
        {title}
      </motion.h1>

      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        custom={2}
        className="flex items-center gap-2"
      >
        <GearCounter count={gears} />
        <IconButton ariaLabel="Open settings" onClick={onSettings}>
          <Settings className="h-5 w-5" />
        </IconButton>
      </motion.div>
    </header>
  );
}
