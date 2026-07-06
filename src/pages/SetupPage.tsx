import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FirebaseError } from "firebase/app";
import {
  generateHouseholdId,
  hashPin,
  saveHousehold,
  markSessionVerified,
  getStoredHouseholdId,
  getStoredPinHash,
} from "@/lib/pin";
import { ChevronLeft } from "lucide-react";
import { createHouseholdAuth, verifyHouseholdPin } from "@/services/households";

type Tab = "create" | "join";
type Step = "tab" | "houseName" | "householdId" | "pin" | "confirmPin";

interface PinPadProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  error: string;
  shake: boolean;
  disabled?: boolean;
}

function PinPad({
  title,
  subtitle,
  value,
  onChange,
  onComplete,
  error,
  shake,
  disabled = false,
}: PinPadProps) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  const handleDigit = (d: string) => {
    if (disabled || value.length >= 4) return;
    const next = value + d;
    onChange(next);
    if (next.length === 4) onComplete(next);
  };

  const handleDel = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center flex-1 justify-between py-8">
      <div className="flex flex-col items-center gap-1">
        <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</p>
        {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div
        className={`${shake ? "animate-[shake_0.4s_ease-in-out]" : ""} flex flex-col items-center gap-3`}
      >
        <div className="flex gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < value.length
                  ? "bg-blue-600 border-blue-600 scale-110"
                  : "bg-transparent border-gray-300 dark:border-slate-600"
              }`}
            />
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
      </div>

      <div className="w-full max-w-xs grid grid-cols-3 gap-3 px-4">
        {digits.map((d, idx) => {
          if (d === "") return <div key={idx} />;
          if (d === "del") {
            return (
              <button
                key="del"
                type="button"
                onClick={handleDel}
                disabled={disabled}
                className="flex items-center justify-center h-16 rounded-2xl text-gray-600 dark:text-slate-300 text-2xl active:bg-gray-100 dark:active:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              disabled={disabled}
              className="flex items-center justify-center h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 text-xl font-semibold active:bg-gray-200 dark:active:bg-slate-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("create");
  const [step, setStep] = useState<Step>("tab");
  const [houseName, setHouseName] = useState("");
  const [houseNameError, setHouseNameError] = useState("");
  const [joinHouseholdId, setJoinHouseholdId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [shake, setShake] = useState(false);
  const [householdIdError, setHouseholdIdError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showPinError = (message: string) => {
    setShake(true);
    setTimeout(() => {
      setPin("");
      setConfirmPin("");
      setPinError(message);
      setShake(false);
    }, 400);
  };

  const mapAsyncFailureMessage = (error: unknown): string => {
    if (error instanceof FirebaseError) {
      if (
        error.code === "failed-precondition" ||
        error.code === "unavailable" ||
        error.code === "deadline-exceeded"
      ) {
        return t("error.offline");
      }
      if (error.code === "permission-denied") {
        return t("setup.joinNoPermission");
      }
    }
    return t("error.generic");
  };

  useEffect(() => {
    if (getStoredHouseholdId() && getStoredPinHash()) {
      navigate("/pin", { replace: true });
    }
  }, [navigate]);

  const goBack = () => {
    if (isSubmitting) return;
    setPinError("");
    setPin("");
    setConfirmPin("");
    if (step === "pin") {
      if (tab === "join") setStep("householdId");
      else setStep("houseName");
    } else if (step === "confirmPin") {
      setStep("pin");
    } else if (step === "houseName") {
      setStep("tab");
    } else {
      setStep("tab");
    }
  };

  const switchTab = (nextTab: Tab) => {
    if (isSubmitting) return;
    setTab(nextTab);
    setPin("");
    setConfirmPin("");
    setPinError("");
  };

  const handlePinComplete = (v: string) => {
    if (isSubmitting) return;
    if (tab === "create") {
      setPin(v);
      setStep("confirmPin");
      return;
    }
    finishJoin(v);
  };

  const handleConfirmPinComplete = async (v: string) => {
    if (isSubmitting) return;

    if (v !== pin) {
      showPinError(t("setup.pinMismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      const householdId = generateHouseholdId();
      const pinHash = await hashPin(pin);
      const result = await createHouseholdAuth(
        householdId,
        pinHash,
        houseName.trim() || undefined,
      );

      if (result === "forbidden") {
        showPinError(t("setup.createNoPermission"));
        return;
      }
      if (result !== "ok") {
        showPinError(t("setup.createFailed"));
        return;
      }

      saveHousehold(householdId, pinHash, houseName.trim() || undefined);
      markSessionVerified();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      showPinError(mapAsyncFailureMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishJoin = async (pinValue: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const enteredHouseholdId = joinHouseholdId.trim();
      const pinHash = await hashPin(pinValue);
      const result = await verifyHouseholdPin(enteredHouseholdId, pinHash);

      if (result === "not-found") {
        showPinError(t("setup.householdNotFound"));
        return;
      }
      if (result === "wrong-pin") {
        showPinError(t("setup.pinWrong"));
        return;
      }
      if (result === "forbidden") {
        showPinError(t("setup.joinNoPermission"));
        return;
      }
      if (result === "failed") {
        showPinError(t("setup.joinFailed"));
        return;
      }

      saveHousehold(enteredHouseholdId, pinHash);
      markSessionVerified();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      showPinError(mapAsyncFailureMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHouseholdIdNext = () => {
    if (isSubmitting) return;
    if (!joinHouseholdId.trim()) {
      setHouseholdIdError("กรุณากรอก Household ID");
      return;
    }
    setHouseholdIdError("");
    setStep("pin");
  };

  const showBack = step !== "tab";

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center h-14 px-2 relative">
        {showBack && (
          <button
            type="button"
            onClick={goBack}
            disabled={isSubmitting}
            className="flex items-center justify-center w-10 h-10 rounded-full active:bg-gray-100 dark:active:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={22} className="text-gray-700 dark:text-slate-300" />
          </button>
        )}

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">J</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">
            {t("setup.title")}
          </span>
        </div>
      </div>

      {step === "tab" && (
        <div className="flex flex-col flex-1 px-6">
          <div className="flex flex-col items-center pt-12 pb-10">
            <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
              <span className="text-white text-4xl font-bold">J</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {t("setup.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {t("setup.subtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                switchTab("create");
                setStep("houseName");
              }}
              className="w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white shadow-sm active:scale-[0.98] active:bg-blue-700 transition-all"
            >
              {t("setup.createNew")}
            </button>
            <button
              type="button"
              onClick={() => {
                switchTab("join");
                setStep("householdId");
              }}
              className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 text-base font-semibold text-gray-900 active:scale-[0.98] active:bg-gray-50 transition-all"
            >
              {t("setup.joinExisting")}
            </button>
          </div>
        </div>
      )}

      {step === "houseName" && (
        <div className="flex flex-col flex-1 px-6">
          <div className="flex flex-col items-center pt-12 pb-8">
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {t("setup.houseNameLabel")}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {t("setup.houseNameHint")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={houseName}
              onChange={(e) => {
                setHouseName(e.target.value);
                setHouseNameError("");
              }}
              placeholder={t("setup.houseNamePlaceholder")}
              maxLength={30}
              autoFocus
              className="w-full rounded-2xl border-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 px-4 py-4 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
            {houseNameError && <p className="text-sm text-red-500 text-center">{houseNameError}</p>}
          </div>

          <div className="mt-auto pb-8 pt-6">
            <button
              type="button"
              onClick={() => {
                const trimmed = houseName.trim();
                if (trimmed.length < 2) {
                  setHouseNameError(t("setup.houseNameHint"));
                  return;
                }
                setHouseNameError("");
                setStep("pin");
              }}
              className="w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white active:scale-[0.98] active:bg-blue-700 transition-all"
            >
              {t("setup.next")}
            </button>
          </div>
        </div>
      )}

      {step === "householdId" && (
        <div className="flex flex-col flex-1 px-6">
          <div className="flex flex-col items-center pt-12 pb-8">
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {t("setup.householdIdLabel")}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">กรอก ID ของบ้านที่ต้องการเข้าร่วม</p>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={joinHouseholdId}
              onChange={(e) => {
                setJoinHouseholdId(e.target.value);
                setHouseholdIdError("");
              }}
              placeholder={t("setup.householdIdPlaceholder")}
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus
              className="w-full rounded-2xl border-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 px-4 py-4 text-sm font-mono text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
            {householdIdError && <p className="text-sm text-red-500 text-center">{householdIdError}</p>}
          </div>

          <div className="mt-auto pb-8 pt-6">
            <button
              type="button"
              onClick={handleHouseholdIdNext}
              className="w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white active:scale-[0.98] active:bg-blue-700 transition-all"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {step === "pin" && (
        <PinPad
          title={tab === "create" ? "ตั้ง PIN ใหม่" : "กรอก PIN เพื่อเข้าร่วม"}
          subtitle={tab === "create" ? "PIN 4 หลักสำหรับเข้าใช้งาน" : undefined}
          value={pin}
          onChange={setPin}
          onComplete={handlePinComplete}
          error={pinError}
          shake={shake}
          disabled={isSubmitting}
        />
      )}

      {step === "confirmPin" && (
        <PinPad
          title="ยืนยัน PIN อีกครั้ง"
          value={confirmPin}
          onChange={(v) => {
            setConfirmPin(v);
            setPinError("");
          }}
          onComplete={handleConfirmPinComplete}
          error={pinError}
          shake={shake}
          disabled={isSubmitting}
        />
      )}
    </div>
  );
}
