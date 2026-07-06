import { useState, useEffect, useRef } from "react";
import { searchTemplates } from "@/services/templates";
import { useHousehold } from "./useHousehold";
import type { ProductTemplate } from "@/types";

export function useTemplates(searchText: string) {
  const { householdId } = useHousehold();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!householdId || searchText.length < 1) {
      setTemplates([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchTemplates(householdId, searchText);
        setTemplates(results);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [householdId, searchText]);

  return { templates, loading };
}
