import { useEffect, useState } from "react";
import { useHousehold } from "./useHousehold";
import { getTemplates } from "@/services/templates";
import type { ProductTemplate } from "@/types";

export function useAllTemplates() {
  const { householdId, isReady } = useHousehold();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !householdId) return;
    setLoading(true);
    getTemplates(householdId)
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [householdId, isReady]);

  return { templates, loading };
}
