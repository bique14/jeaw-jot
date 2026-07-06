import { useState, useEffect } from "react";
import { subscribeItems } from "@/services/items";
import { useHousehold } from "./useHousehold";
import type { ProductItem } from "@/types";

export function useItems() {
  const { householdId } = useHousehold();
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeItems(
      householdId,
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsub;
  }, [householdId]);

  return { items, loading, error };
}
