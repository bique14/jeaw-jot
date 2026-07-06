import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { subMonths, format, isBefore, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useAllTemplates } from "@/hooks/useAllTemplates";
import { toDate } from "@/lib/itemUtils";

type Period = "3m" | "6m" | "1y";

const PERIOD_MONTHS: Record<Period, number> = { "3m": 3, "6m": 6, "1y": 12 };

export default function AnalyticsPage() {
  const { t, i18n } = useTranslation();
  const { items } = useItems();
  const { categories } = useCategories();
  const { templates } = useAllTemplates();
  const [period, setPeriod] = useState<Period>("6m");
  const locale = i18n.language === "th" ? th : undefined;
  const isDark = document.documentElement.classList.contains("dark");

  const cutoff = useMemo(
    () => subMonths(new Date(), PERIOD_MONTHS[period]),
    [period],
  );

  // ---- filtered items within period ----
  const filteredItems = useMemo(
    () => items.filter((i) => !isBefore(toDate(i.purchaseDate), cutoff)),
    [items, cutoff],
  );

  // ---- monthly spend ----
  const monthlySpendData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredItems.forEach((item) => {
      const key = format(toDate(item.purchaseDate), "MMM yy", { locale });
      map[key] = (map[key] ?? 0) + item.price * item.quantity;
    });
    // build sorted array month-by-month
    const months = PERIOD_MONTHS[period];
    return Array.from({ length: months }, (_, i) => {
      const d = subMonths(new Date(), months - 1 - i);
      const key = format(d, "MMM yy", { locale });
      return { month: key, total: Math.round(map[key] ?? 0) };
    });
  }, [filteredItems, period, locale]);

  // ---- category breakdown ----
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredItems.forEach((item) => {
      map[item.categoryId] =
        (map[item.categoryId] ?? 0) + item.price * item.quantity;
    });
    return categories
      .filter((c) => map[c.id] > 0)
      .map((c) => ({
        name: c.label[i18n.language === "th" ? "th" : "en"],
        value: Math.round(map[c.id]),
        color: c.color,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredItems, categories, i18n.language]);

  // ---- most bought (from templates, limit 8) ----
  const mostBoughtData = useMemo(
    () =>
      templates
        .filter((t) => (t.timesAdded ?? 0) > 0)
        .slice(0, 8)
        .map((t) => ({ name: t.name, times: t.timesAdded ?? 0 }))
        .reverse(),
    [templates],
  );

  // ---- avg lifespan per template (from items within period) ----
  const lifespanData = useMemo(() => {
    const map: Record<string, number[]> = {};
    filteredItems.forEach((item) => {
      const days = differenceInDays(
        toDate(item.expiryDate),
        toDate(item.startDate),
      );
      if (days > 0) {
        const key = item.name;
        if (!map[key]) map[key] = [];
        map[key].push(days);
      }
    });
    return Object.entries(map)
      .map(([name, vals]) => ({
        name,
        days: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 8)
      .reverse();
  }, [filteredItems]);

  const totalSpend = filteredItems.reduce(
    (s, i) => s + i.price * i.quantity,
    0,
  );

  return (
    <div className="flex flex-col gap-6 pb-10 bg-gray-50 dark:bg-slate-900 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-violet-500 px-5 pt-6 pb-10">
        <h1 className="text-white text-2xl font-bold">
          {t("analytics.title")}
        </h1>
        <p className="text-violet-200 text-sm mt-0.5">
          {t("analytics.totalSpend", { amount: totalSpend.toLocaleString() })}
        </p>
        {/* Period selector */}
        <div className="mt-4 flex gap-2">
          {(["3m", "6m", "1y"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                period === p
                  ? "bg-white text-violet-700 shadow"
                  : "bg-white/20 text-white"
              }`}
            >
              {t(`analytics.period${p}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4">
        {/* Monthly spend bar chart */}
        <ChartCard title={t("analytics.monthlySpend")} unit="บาท (฿)">
          {monthlySpendData.every((d) => d.total === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={monthlySpendData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#334155" : "#f0f0f0"}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: isDark ? "#64748b" : "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: isDark ? "#64748b" : "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    `฿${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                  }
                />
                <Tooltip
                  formatter={(v) => [
                    `฿${Number(v).toLocaleString()}`,
                    "ค่าใช้จ่าย",
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    color: isDark ? "#f1f5f9" : "#111",
                    boxShadow: "0 4px 20px rgba(0,0,0,.15)",
                    fontSize: 12,
                  }}
                  cursor={{ fill: isDark ? "#8b5cf620" : "#8b5cf610" }}
                />
                <Bar
                  dataKey="total"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Category breakdown pie */}
        <ChartCard title={t("analytics.byCategory")} unit="บาท (฿)">
          {categoryData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`฿${Number(v).toLocaleString()}`, ""]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,.08)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {categoryData.slice(0, 5).map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs text-gray-600 dark:text-slate-300 truncate flex-1">
                      {d.name}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-slate-100">
                      ฿{d.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Most bought */}
        {mostBoughtData.length > 0 && (
          <ChartCard
            title={t("analytics.mostBought")}
            unit={`หน่วย: ${t("analytics.times")} (ครั้ง)`}
          >
            <ResponsiveContainer
              width="100%"
              height={mostBoughtData.length * 36 + 8}
            >
              <BarChart
                data={mostBoughtData}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#334155" : "#f0f0f0"}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} ครั้ง`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#374151" }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v)} ครั้ง`, "ซื้อรวม"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    color: isDark ? "#f1f5f9" : "#111",
                    boxShadow: "0 4px 20px rgba(0,0,0,.15)",
                    fontSize: 12,
                  }}
                  cursor={{ fill: isDark ? "#0ea5e920" : "#0ea5e910" }}
                />
                <Bar
                  dataKey="times"
                  fill="#0ea5e9"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Avg lifespan */}
        {lifespanData.length > 0 && (
          <ChartCard
            title={t("analytics.avgLifespan")}
            unit={`หน่วย: ${t("analytics.days")} (วัน)`}
          >
            <ResponsiveContainer
              width="100%"
              height={lifespanData.length * 36 + 8}
            >
              <BarChart
                data={lifespanData}
                layout="vertical"
                margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#334155" : "#f0f0f0"}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} วัน`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#374151" }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v)} วัน`, "อายุการใช้"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    color: isDark ? "#f1f5f9" : "#111",
                    boxShadow: "0 4px 20px rgba(0,0,0,.15)",
                    fontSize: 12,
                  }}
                  cursor={{ fill: isDark ? "#10b98120" : "#10b98110" }}
                />
                <Bar
                  dataKey="days"
                  fill="#10b981"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

// ---- ChartCard ----
function ChartCard({
  title,
  unit,
  children,
}: {
  title: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 shadow-sm p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100">
          {title}
        </h2>
        {unit && (
          <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
            {unit}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ---- EmptyChart ----
function EmptyChart() {
  return (
    <div className="h-28 flex items-center justify-center text-sm text-gray-300 dark:text-slate-600">
      ยังไม่มีข้อมูล
    </div>
  );
}
