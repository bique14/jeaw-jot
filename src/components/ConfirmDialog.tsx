import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white dark:bg-slate-800 shadow-xl p-5 flex flex-col gap-4 sm:mb-0"
        style={{ marginBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-base font-bold text-gray-900 dark:text-slate-100">
            {title}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-gray-100 dark:bg-slate-700 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 active:bg-gray-200 dark:active:bg-slate-600 transition-colors"
          >
            {cancelLabel ?? t("action.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors ${
              destructive
                ? "bg-red-500 active:bg-red-600"
                : "bg-blue-600 active:bg-blue-700"
            }`}
          >
            {confirmLabel ?? t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
