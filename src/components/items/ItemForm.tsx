import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  itemSchema,
  type ItemFormValues,
  DEFAULT_UNITS,
  DEFAULT_NOTIFY_DAYS,
} from "@/lib/itemSchema";
import { useTemplates } from "@/hooks/useTemplates";
import { useCategories } from "@/hooks/useCategories";
import type { ProductItem } from "@/types";
import { toDate } from "@/lib/itemUtils";

interface Props {
  initialValues?: ProductItem;
  onSubmit: (values: ItemFormValues) => Promise<void>;
  submitLabel: string;
}

function dateToInput(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function ItemForm({ initialValues, onSubmit, submitLabel }: Props) {
  const { t } = useTranslation();
  const today = dateToInput(new Date());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema) as Resolver<ItemFormValues>,
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          brand: initialValues.brand ?? "",
          categoryId: initialValues.categoryId,
          purchaseDate: dateToInput(toDate(initialValues.purchaseDate)),
          startDate: dateToInput(toDate(initialValues.startDate)),
          expiryDate: dateToInput(toDate(initialValues.expiryDate)),
          price: initialValues.price,
          quantity: initialValues.quantity,
          unit: initialValues.unit,
          notifyDaysBefore: initialValues.notifyDaysBefore,
          notes: initialValues.notes ?? "",
        }
      : {
          purchaseDate: today,
          startDate: today,
          price: 0,
          quantity: 1,
          unit: "ชิ้น",
          notifyDaysBefore: DEFAULT_NOTIFY_DAYS,
        },
  });

  const nameValue = watch("name") ?? "";
  const { templates } = useTemplates(nameValue);
  const { categories } = useCategories();
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setShowSuggestions(templates.length > 0 && nameValue.length > 0);
  }, [templates, nameValue]);

  const applyTemplate = (tpl: (typeof templates)[0]) => {
    setValue("name", tpl.name);
    setValue("brand", tpl.brand);
    setValue("categoryId", tpl.categoryId);
    setValue("unit", tpl.defaultUnit);
    setValue("notifyDaysBefore", tpl.defaultNotifyDaysBefore);
    if (tpl.lastPrice) setValue("price", tpl.lastPrice);
    setShowSuggestions(false);
  };

  const fieldClass =
    "w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
  const labelClass = "text-sm font-medium text-gray-700 dark:text-slate-300";
  const errorClass = "text-xs text-red-500 mt-0.5";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 px-4 pb-32"
    >
      {/* Name + autocomplete */}
      <div className="relative flex flex-col gap-1">
        <label className={labelClass}>{t("item.name")}</label>
        <input
          {...register("name")}
          placeholder="เช่น ยาสีฟัน"
          className={fieldClass}
          autoComplete="off"
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}

        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
            {templates.slice(0, 5).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="flex w-full flex-col px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-700 border-b border-gray-50 dark:border-slate-700/50 last:border-0"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  {tpl.name}
                </span>
                {tpl.brand && (
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {tpl.brand}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Brand */}
      <div className="flex flex-col gap-1">
        <label className={labelClass}>
          {t("item.brand")}{" "}
          <span className="text-gray-400 dark:text-slate-500 font-normal">
            (ไม่บังคับ)
          </span>
        </label>
        <input
          {...register("brand")}
          placeholder="เช่น Colgate"
          className={fieldClass}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label className={labelClass}>{t("item.category")}</label>
        <div className="relative">
          <select
            {...register("categoryId")}
            className={cn(fieldClass, "appearance-none pr-10")}
          >
            <option value="">{t("form.selectCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label.th}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
          />
        </div>
        {errors.categoryId && (
          <p className={errorClass}>{errors.categoryId.message}</p>
        )}
      </div>

      {/* Dates row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t("item.purchaseDate")}</label>
          <input
            type="date"
            {...register("purchaseDate")}
            className={fieldClass}
          />
          {errors.purchaseDate && (
            <p className={errorClass}>{errors.purchaseDate.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t("item.startDate")}</label>
          <input
            type="date"
            {...register("startDate")}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>{t("item.expiryDate")}</label>
        <input type="date" {...register("expiryDate")} className={fieldClass} />
        {errors.expiryDate && (
          <p className={errorClass}>{errors.expiryDate.message}</p>
        )}
      </div>

      {/* Price + Quantity + Unit */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 col-span-1">
          <label className={labelClass}>{t("item.price")}</label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            {...register("price")}
            className={fieldClass}
          />
          {errors.price && <p className={errorClass}>{errors.price.message}</p>}
        </div>
        <div className="flex flex-col gap-1 col-span-1">
          <label className={labelClass}>{t("item.quantity")}</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            {...register("quantity")}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1 col-span-1">
          <label className={labelClass}>{t("item.unit")}</label>
          <div className="relative">
            <select
              {...register("unit")}
              className={cn(fieldClass, "appearance-none pr-8 truncate")}
            >
              {DEFAULT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Notify days */}
      <div className="flex flex-col gap-1">
        <label className={labelClass}>
          {t("item.notifyDaysBefore")} ({watch("notifyDaysBefore")}{" "}
          {t("item.notifyDaysUnit")})
        </label>
        <input
          type="range"
          min={1}
          max={30}
          {...register("notifyDaysBefore")}
          className="accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500">
          <span>1 วัน</span>
          <span>30 วัน</span>
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className={labelClass}>
          {t("item.notes")}{" "}
          <span className="text-gray-400 dark:text-slate-500 font-normal">
            (ไม่บังคับ)
          </span>
        </label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="หมายเหตุเพิ่มเติม..."
          className={cn(fieldClass, "resize-none")}
        />
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 px-4 py-4 pb-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white active:scale-[0.98] active:bg-blue-700 transition-all disabled:opacity-60"
        >
          {isSubmitting ? t("common.loading") : submitLabel}
        </button>
      </div>
    </form>
  );
}
