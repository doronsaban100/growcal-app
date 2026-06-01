"use client";

import { useEffect, useState } from "react";

export default function DemoModeToggle() {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readMode = () => window.localStorage.getItem("appDemoMode") === "true";
    setDemoMode(readMode());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "appDemoMode") {
        setDemoMode(e.newValue === "true");
      }
    };

    const handleCustom = () => {
      setDemoMode(readMode());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("appDemoModeChange", handleCustom as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("appDemoModeChange", handleCustom as EventListener);
    };
  }, []);

  const toggleDemoMode = () => {
    const nextMode = !demoMode;
    window.localStorage.setItem("appDemoMode", nextMode ? "true" : "false");
    setDemoMode(nextMode);
    window.dispatchEvent(new Event("appDemoModeChange"));
  };

  return (
    <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-sm text-stone-800">
        <span className="font-medium">מצב דמו גלובלי</span>
        <button
          type="button"
          onClick={toggleDemoMode}
          className="rounded-2xl border px-3 py-2 text-xs font-semibold transition hover:bg-stone-100"
        >
          {demoMode ? "כבה דמו" : "הפעל דמו"}
        </button>
      </div>
    </div>
  );
}
