"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/src/components/ui/input";

interface SearchQueryInputProps {
  placeholder: string;
  queryParam?: string;
  debounceMs?: number;
  showClearButton?: boolean;
}

interface SearchFieldProps {
  placeholder: string;
  queryParam: string;
  debounceMs: number;
  showClearButton: boolean;
  initialSearch: string;
  pathname: string;
  searchParamsString: string;
}

const SearchField = ({
  placeholder,
  queryParam,
  debounceMs,
  showClearButton,
  initialSearch,
  pathname,
  searchParamsString,
}: SearchFieldProps) => {
  const router = useRouter();

  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParamsString);

      const normalizedSearch = search.trim();

      const currentSearch = params.get(queryParam) ?? "";

      if (normalizedSearch === currentSearch) {
        return;
      }

      if (normalizedSearch) {
        params.set(queryParam, normalizedSearch);
      } else {
        params.delete(queryParam);
      }

      params.delete("page");

      const query = params.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, debounceMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search, debounceMs, pathname, queryParam, router, searchParamsString]);

  const clearSearch = () => {
    setSearch("");

    const params = new URLSearchParams(searchParamsString);

    if (!params.has(queryParam)) {
      return;
    }

    params.delete(queryParam);
    params.delete("page");

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className="relative min-w-64 flex-1 sm:w-80 sm:flex-none">
      <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
        }}
        placeholder={placeholder}
        className={showClearButton ? "pl-9 pr-9" : "pl-9"}
      />

      {showClearButton && search.length > 0 && (
        <button
          type="button"
          aria-label="Limpar pesquisa"
          title="Limpar pesquisa"
          onClick={clearSearch}
          className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
};

const SearchQueryInput = ({
  placeholder,
  queryParam = "q",
  debounceMs = 400,
  showClearButton = false,
}: SearchQueryInputProps) => {
  const pathname = usePathname();

  const searchParams = useSearchParams();

  const initialSearch = searchParams.get(queryParam) ?? "";

  return (
    <SearchField
      key={`${pathname}:${queryParam}:${initialSearch}`}
      placeholder={placeholder}
      queryParam={queryParam}
      debounceMs={debounceMs}
      showClearButton={showClearButton}
      initialSearch={initialSearch}
      pathname={pathname}
      searchParamsString={searchParams.toString()}
    />
  );
};

export default SearchQueryInput;
