import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { ItemForm } from "@/components/items/ItemForm";
import { addItem } from "@/services/items";
import { useHousehold } from "@/hooks/useHousehold";
import { getStoredPinHash } from "@/lib/pin";
import type { ItemFormValues } from "@/lib/itemSchema";

export default function AddItemPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { householdId } = useHousehold();

  const handleSubmit = async (values: ItemFormValues) => {
    if (!householdId) return;
    await addItem({
      householdId,
      name: values.name,
      brand: values.brand,
      categoryId: values.categoryId,
      purchaseDate: new Date(values.purchaseDate),
      startDate: new Date(values.startDate),
      expiryDate: new Date(values.expiryDate),
      price: values.price,
      quantity: values.quantity,
      unit: values.unit,
      notes: values.notes,
      notifyDaysBefore: values.notifyDaysBefore,
      createdByPin: getStoredPinHash() ?? "",
    });
    navigate("/items", { replace: true });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-blue-50 via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -top-14 -right-10 h-40 w-40 rounded-full bg-blue-300/30 blur-2xl dark:bg-blue-500/10" />
      <div className="pointer-events-none absolute top-28 -left-12 h-36 w-36 rounded-full bg-cyan-200/30 blur-2xl dark:bg-cyan-500/10" />

      <div className="sticky top-0 z-10 border-b border-white/60 dark:border-slate-700/70 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-2">
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
            {t("form.addItem")}
          </h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-6">
        <div className="">
          <ItemForm onSubmit={handleSubmit} submitLabel={t("action.add")} />
        </div>
      </div>
    </div>
  );
}
