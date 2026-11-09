"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const DISTRIBUTION_PATHS = new Set([
  "/clients/porto",
  "/clients/suhai",
  "/clients/zaion",
]);

const STORAGE_PREFIX = "painel-multicanal:distribution-filters:";

interface LocationState {
  pathname: string;
  query: string;
}

export function DistributionFiltersMemory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.toString();

  const previousLocation = useRef<LocationState | null>(null);

  useEffect(() => {
    const previous = previousLocation.current;

    if (previous?.pathname === pathname && previous.query === query) {
      return;
    }

    previousLocation.current = {
      pathname,
      query,
    };

    if (!DISTRIBUTION_PATHS.has(pathname)) {
      return;
    }

    const storageKey = `${STORAGE_PREFIX}${pathname}`;

    try {
      if (query) {
        window.sessionStorage.setItem(storageKey, query);
        return;
      }

      if (previous?.pathname === pathname) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }

      const savedQuery = window.sessionStorage.getItem(storageKey);

      if (savedQuery) {
        router.replace(`${pathname}?${savedQuery}`, {
          scroll: false,
        });
      }
    } catch {}
  }, [pathname, query, router]);

  return null;
}
