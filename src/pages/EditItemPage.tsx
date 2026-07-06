import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { ItemForm } from "@/components/items/ItemForm";
import { updateItem } from "@/services/items";
import { useItems } from "@/hooks/useItems";
import type { ItemFormValues } from "@/lib/itemSchema";

export default function EditItemPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { items, loading } = useItems();

  const item = items.find((i) => i.id === id);

  const handleSubmit = async (values: ItemFormValues) => {
    if (!id) return;
    await updateItem(id, {
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
    });
    navigate(`/items/${id}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh text-sm text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-dvh text-sm text-gray-400">
        {t("error.notFound")}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <div className="flex items-center gap-2 px-2 h-14 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-semibold text-gray-900">{t("form.editItem")}</h1>
      </div>

      <div className="pt-4">
        <ItemForm
          initialValues={item}
          onSubmit={handleSubmit}
          submitLabel={t("action.save")}
        />
      </div>
    </div>
  );
}
