import type { ReactNode } from "react";
import { useMemo } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router";
import { Layout } from "./Layout.js";
import { BottomNav } from "./BottomNav.js";

/**
 * AppShell — thin react-router scaffold for Gridverse apps.
 *
 * Props:
 * - routes: top-level route declarations, each with an optional navId that
 *   links the route to a BottomNav tab.
 * - nav: tab configuration passed through to BottomNav.
 * - immersivePatterns: regexes tested against location.pathname; matches hide
 *   the bottom nav (defaults to /play, /boss, /results).
 * - mascotSrc: optional image URL for the portrait interstitial.
 */
export function AppShell({
  routes,
  nav,
  immersivePatterns = [/^\/play/, /^\/boss/, /^\/results/],
  mascotSrc,
}: {
  routes: ReadonlyArray<{ path: string; element: ReactNode; navId?: string }>;
  nav: ReadonlyArray<{ id: string; label: string; icon: ReactNode }>;
  immersivePatterns?: readonly RegExp[];
  mascotSrc?: string;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const immersive = immersivePatterns.some((re) => re.test(pathname));

  const { activeNavId, pathForTab } = useMemo(() => {
    const pathForTab = new Map<string, string>();
    let activeNavId = "";
    for (const route of routes) {
      if (route.navId) {
        if (!pathForTab.has(route.navId)) {
          pathForTab.set(route.navId, route.path);
        }
        const matched =
          route.path === "/"
            ? pathname === "/"
            : pathname.startsWith(route.path);
        if (matched && !activeNavId) {
          activeNavId = route.navId;
        }
      }
    }
    return { activeNavId, pathForTab };
  }, [routes, pathname]);

  const handleSelect = (id: string) => {
    const path = pathForTab.get(id);
    if (path) navigate(path);
  };

  return (
    <Layout
      immersive={immersive}
      mascotSrc={mascotSrc}
      bottomNav={
        <BottomNav tabs={nav} activeId={activeNavId} onSelect={handleSelect} />
      }
    >
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Layout>
  );
}
