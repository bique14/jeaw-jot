import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import Header from "./Header";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function AppShell() {
  return (
    <div className="flex h-dvh flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
      <Header />
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <InstallPrompt />
      <Toaster position="top-center" richColors />
    </div>
  );
}
