import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn.js";
import { haptics } from "../lib/haptics.js";
import { sfx } from "../lib/sfx.js";

/**
 * BottomNav per design.md §13 — app-shell bottom navigation (64px + safe area).
 * Tabs are supplied as a prop so each game/app can define its own nav items.
 * Active tab: accent icon+label, 6px glow dot above, pill bg accent/10%,
 * spring pop on switch.
 */

const pop = { type: "spring", stiffness: 420, damping: 24 } as const;

export function BottomNav({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: ReadonlyArray<{ id: string; label: string; icon: ReactNode }>;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-night-1/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px]"
    >
      <div
        className="grid h-16"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map(({ id, label, icon }) => {
          const active = id === activeId;
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                haptics.tick();
                sfx.tick();
                onSelect(id);
              }}
              className="relative flex min-h-[44px] flex-col items-center justify-center gap-0.5"
            >
              {active && (
                <>
                  <motion.span
                    layoutId="bottomnav-pill"
                    transition={pop}
                    className="absolute inset-x-3 inset-y-1.5 rounded-pill bg-amber/10"
                  />
                  <motion.span
                    layoutId="bottomnav-dot"
                    transition={pop}
                    className="absolute top-0.5 h-1.5 w-1.5 rounded-full bg-amber shadow-glow-amber"
                  />
                </>
              )}
              <span
                className={cn(
                  "relative h-5 w-5",
                  active ? "text-amber" : "text-low",
                )}
              >
                {icon}
              </span>
              <span
                className={cn(
                  "relative text-[10px] font-extrabold uppercase tracking-[0.08em]",
                  active ? "text-amber" : "text-low",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
