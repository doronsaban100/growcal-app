"use client";

import { useEffect, useState } from "react";

export function useGlobalDemoMode() {
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

  return demoMode;
}
