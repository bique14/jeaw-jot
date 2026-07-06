import { useState, useEffect } from "react";
import {
  subscribeCategories,
  seedCategoriesIfNeeded,
} from "@/services/categories";
import { useHousehold } from "./useHousehold";
import type { Category } from "@/types";

export function useCategories() {
  const { householdId } = useHousehold();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    // Seed preset categories ถ้ายังไม่มี (ทำครั้งเดียว)
    seedCategoriesIfNeeded(householdId).catch(console.error);

    const unsub = subscribeCategories(householdId, (cats) => {
      setCategories(cats);
      setLoading(false);
    });

    return unsub;
  }, [householdId]);

  return { categories, loading };
}
