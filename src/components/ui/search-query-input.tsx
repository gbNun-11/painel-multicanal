"use client";

import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/src/components/ui/input";

interface SearchQueryInputProps {
  placeholder: string;
  queryParam?: string;
  debounceMs?: number;
}

const SearchQueryInput = ({
  placeholder,
  queryParam = "q",
  debounceMs = 400,
}: SearchQueryInputProps) => {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();

  const [search, setSearch] = useState(searchParams.get(queryParam) ?? "");

  useEffect(() => {
    setSearch(searchParams.get(queryParam) ?? "");
  }, [queryParam, searchParams, searchParamsString]);

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

  return (
    <div className="relative min-w-64 flex-1 sm:w-80 sm:flex-none">
      <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
        }}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
};

export default SearchQueryInput;
