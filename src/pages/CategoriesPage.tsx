import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useHousehold } from "@/hooks/useHousehold";
import {
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categories";
import type { Category } from "@/types";

const COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#94A3B8",
];

// const ICONS = [
//   "ShoppingBasket",
//   "Pill",
//   "Sparkles",
//   "WashingMachine",
//   "Baby",
//   "PawPrint",
//   "Box",
//   "Apple",
//   "Coffee",
//   "Shirt",
//   "Dumbbell",
//   "Heart",
//   "Star",
//   "Home",
//   "Zap",
// ];

interface FormState {
  labelTh: string;
  labelEn: string;
  color: string;
  icon: string;
}

const EMPTY_FORM: FormState = {
  labelTh: "",
  labelEn: "",
  color: "#3B82F6",
  icon: "Box",
};

export default function CategoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { householdId } = useHousehold();
  const { categories } = useCategories();

  const [sheet, setSheet] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSheet("add");
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      labelTh: cat.label.th,
      labelEn: cat.label.en,
      color: cat.color,
      icon: cat.icon,
    });
    setSheet("edit");
  };

  const handleSave = async () => {
    if (!householdId || !form.labelTh.trim()) return;
    setSaving(true);
    try {
      const data = {
        label: {
          th: form.labelTh.trim(),
          en: form.labelEn.trim() || form.labelTh.trim(),
        },
        color: form.color,
        icon: form.icon,
      };
      if (sheet === "add") {
        await addCategory(householdId, data);
      } else if (editing) {
        await updateCategory(editing.id, data);
      }
      setSheet(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    setConfirmDeleteId(null);
  };

  // const handleToggleVisible = async (cat: Category) => {
  //   // ใช้ color เป็น indicator: prefix '#' = visible, '#hidden_' = hidden
  //   // วิธีที่สะอาดกว่า: เพิ่ม field hidden แต่ type ยังไม่มี — ใช้ updateCategory
  //   await updateCategory(cat.id, {
  //     // toggle ด้วย icon prefix เป็น workaround ง่ายๆ
  //     // จริงๆ ควรเพิ่ม field `hidden: boolean` ใน type — ทำได้ใน future
  //   } as Parameters<typeof updateCategory>[1]);
  // };

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-2 h-14 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-slate-700 transition-colors"
        >
          <ChevronLeft
            size={22}
            className="text-gray-700 dark:text-slate-300"
          />
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-slate-100">
          {t("categories.title")}
        </h1>
        <button
          type="button"
          onClick={openAdd}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-slate-700 transition-colors"
        >
          <Plus size={22} className="text-blue-600 dark:text-blue-400" />
        </button>
      </div>

      {/* List */}
      <div className="px-4 py-4 flex flex-col gap-2">
        {/* Preset */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
          {t("categories.preset")}
        </p>
        {categories
          .filter((c) => c.isPreset)
          .map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: cat.color + "20" }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  {cat.label.th}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  {cat.label.en}
                </p>
              </div>
              <span className="text-xs text-gray-300 dark:text-slate-500 italic">
                {t("categories.preset")}
              </span>
            </div>
          ))}

        {/* Custom */}
        {categories.filter((c) => !c.isPreset).length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mt-3 mb-1">
              กำหนดเอง
            </p>
            {categories
              .filter((c) => !c.isPreset)
              .map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: cat.color + "20" }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {cat.label.th}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {cat.label.en}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-slate-700 transition-colors"
                    >
                      <Pencil
                        size={15}
                        className="text-gray-400 dark:text-slate-500"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(cat.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
                    >
                      <Trash2
                        size={15}
                        className="text-red-400 dark:text-red-500"
                      />
                    </button>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>

      {/* Add/Edit Sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-3xl bg-white dark:bg-slate-800 p-6 pb-10 max-h-[85dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 dark:text-slate-100">
              {sheet === "add" ? t("categories.add") : t("categories.edit")}
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t("categories.nameTh")}
                </label>
                <input
                  value={form.labelTh}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, labelTh: e.target.value }))
                  }
                  placeholder="เช่น เครื่องดื่ม"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t("categories.nameEn")}{" "}
                  <span className="text-gray-400 dark:text-slate-500 font-normal">
                    (ไม่บังคับ)
                  </span>
                </label>
                <input
                  value={form.labelEn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, labelEn: e.target.value }))
                  }
                  placeholder="e.g. Beverages"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Color picker */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t("categories.color")}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-9 h-9 rounded-full transition-transform active:scale-95"
                      style={{
                        backgroundColor: c,
                        outline: form.color === c ? `3px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={saving || !form.labelTh.trim()}
                onClick={handleSave}
                className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white active:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {saving ? t("common.loading") : t("action.save")}
              </button>
              <button
                type="button"
                onClick={() => setSheet(null)}
                className="w-full rounded-xl bg-gray-100 dark:bg-slate-700 py-4 text-base font-semibold text-gray-700 dark:text-slate-200 active:bg-gray-200 dark:active:bg-slate-600 transition-colors"
              >
                {t("action.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-3xl bg-white dark:bg-slate-800 p-6 pb-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {t("action.delete")} หมวดหมู่
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              ลบหมวดหมู่นี้? สินค้าที่อยู่ในหมวดนี้จะยังคงอยู่
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="w-full rounded-xl bg-red-600 py-4 text-base font-semibold text-white active:bg-red-700 transition-colors"
              >
                {t("action.delete")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="w-full rounded-xl bg-gray-100 dark:bg-slate-700 py-4 text-base font-semibold text-gray-700 dark:text-slate-200 active:bg-gray-200 dark:active:bg-slate-600 transition-colors"
              >
                {t("action.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
