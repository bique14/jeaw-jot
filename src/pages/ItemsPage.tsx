import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search } from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { ItemCard } from "@/components/items/ItemCard";
import {
  computeStatus,
  daysUntilExpiry,
  isExpiringSoon,
} from "@/lib/itemUtils";
import type { ProductItem } from "@/types";

type SortKey = "expiry" | "newest" | "name";
type FilterKey = "all" | "active" | "expired" | "depleted";

function sortItems(items: ProductItem[], sort: SortKey): ProductItem[] {
  return [...items].sort((a, b) => {
    if (sort === "expiry") return daysUntilExpiry(a) - daysUntilExpiry(b);
    if (sort === "name") return a.name.localeCompare(b.name, "th");
    // newest
    return b.createdAt.seconds - a.createdAt.seconds;
  });
}

export default function ItemsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, loading } = useItems();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("expiry");
  const [filter, setFilter] = useState<FilterKey>("active");

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== "all") {
      list = list.filter((item) => {
        const s = computeStatus(item);
        if (filter === "active") return s === "active";
        if (filter === "expired") return s === "expired";
        if (filter === "depleted") return s === "depleted";
        return true;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brand?.toLowerCase().includes(q),
      );
    }
    return sortItems(list, sort);
  }, [items, filter, search, sort]);

  const expiringCount = items.filter(
    (i) => computeStatus(i) === "active" && isExpiringSoon(i),
  ).length;

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-slate-900">
      {/* Header + controls */}
      <div className="px-4 pt-4 pb-3">
        <div className="rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-gray-100 dark:border-slate-700/70 shadow-sm backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-slate-100">
              {t("items.title")}
            </h1>
            {expiringCount > 0 && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                ⚠ {expiringCount} {t("dashboard.expiringSoon")}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("items.searchPlaceholder")}
              className="w-full rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-slate-100 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Filter + Sort controls */}
          <div className="mt-3 rounded-2xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700/70 p-2.5 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                {t("items.filterBy")}
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {(["active", "all", "expired", "depleted"] as FilterKey[]).map(
                (f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      filter === f
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white dark:bg-slate-700/90 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-600"
                    }`}
                  >
                    {f === "active"
                      ? t("items.filterActive")
                      : f === "all"
                        ? t("items.filterAll")
                        : t(`item.status.${f}`)}
                  </button>
                ),
              )}
            </div>

            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                {t("items.sortBy")}
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {(["expiry", "newest", "name"] as SortKey[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    sort === s
                      ? "bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                      : "bg-white dark:bg-slate-700/90 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-600"
                  }`}
                >
                  {s === "expiry"
                    ? t("items.sortExpiringSoon")
                    : s === "newest"
                      ? t("items.sortNewest")
                      : t("items.sortName")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-5">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400 dark:text-slate-500">
            {t("common.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white/70 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700/70 py-20 gap-2">
            <p className="text-gray-400 dark:text-slate-400 font-medium">
              {t("items.empty")}
            </p>
            <p className="text-sm text-gray-300 dark:text-slate-500">
              {t("items.emptyHint")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => navigate("/items/new")}
        className="fixed bottom-25 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 ring-4 ring-blue-100/70 dark:ring-blue-900/40 shadow-xl shadow-blue-200/80 dark:shadow-blue-950/50 active:scale-95 active:from-blue-700 active:to-blue-600 transition-all md:bottom-6"
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  );
}
