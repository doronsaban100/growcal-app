﻿"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import CollectionGrid from "@/components/CollectionGrid";
import EmptyState from "@/components/EmptyState";
import { useGlobalDemoMode } from "@/components/useGlobalDemoMode";

/**
 * ׳ ׳×׳•׳ ׳™ ׳”׳“׳׳™׳” (Mock Data) ׳–׳”׳™׳ ׳׳׳׳• ׳©׳‘׳׳•׳¡׳£ ׳׳¦׳•׳¨׳ ׳¡׳ ׳›׳¨׳•׳ ׳”׳׳׳©׳§
 */
const mockPlants: ShopPlant[] = [
  {
    _id: "mock2",
    type: "פילודנדרון",
    sub_type: "לימון",
    status: "for-sale",
    estimated_value: 450,
    current_price: 450,
    location: "חיפה",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/31/Pink_princess_philodendron.jpg",
    defaultCareGuide: {
      lightNeeds: "אור צל",
      wateringFrequency: 7
    }
  },
  {
    _id: "mock3",
    type: "סנסיוויריה",
    sub_type: "צילינדריקה",
    status: "for-sale",
    estimated_value: 90,
    current_price: 90,
    location: "ירושלים",
    imageUrl: "https://images.unsplash.com/photo-1597293774028-d89155745104?q=80&w=800&auto=format&fit=crop",
    defaultCareGuide: {
      lightNeeds: "אור חלקי",
      wateringFrequency: 14
    }
  },
];

type ShopPlant = {
  _id: string;
  type: string;
  sub_type?: string;
  status: "for-sale" | "auction" | "personal" | "collection" | "selling";
  estimated_value?: number;
  current_price?: number;
  location?: string;
  imageUrl?: string;
  defaultCareGuide?: {
    lightNeeds?: string;
    wateringFrequency?: number;
  };
};

export default function ShopPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // ׳©׳׳™׳₪׳× ׳¦׳׳—׳™׳ ׳©׳ ׳”׳׳©׳×׳׳© ׳©׳”׳ ׳׳׳›׳™׳¨׳” ׳׳• ׳׳׳›׳¨׳– (׳”׳—׳ ׳•׳× ׳©׳׳™)
  const realPlants = useQuery(
    api.plants.getMyListingPlants,
    isLoaded && isSignedIn ? {} : "skip"
  ) as ShopPlant[] | undefined;

  // Load persisted mock data if available so collection/shop stay in sync in populated mode
  const [mockPlantsState, setMockPlantsState] = useState<ShopPlant[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("mockPlants") : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as ShopPlant[]) : mockPlants;
    } catch (e) {
      return mockPlants;
    }
  });

  // On mount, sanitize persisted mock data: remove any 'אלוקסיה' entries
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("mockPlants");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const cleaned = parsed.filter((p) => p.type !== "אלוקסיה");
      if (cleaned.length !== parsed.length) {
        try { localStorage.setItem("mockPlants", JSON.stringify(cleaned)); } catch (e) {}
        setMockPlantsState(cleaned as ShopPlant[]);
        console.info("Sanitized mockPlants: removed 'אלוקסיה'");
      }
    } catch (e) {
      /* ignore parse errors */
    }
  }, []);

  // When localStorage is updated in another tab, sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mockPlants") {
        try { setMockPlantsState(e.newValue ? JSON.parse(e.newValue) : []); } catch (err) {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLocalStatusChange = (plantId: string, newStatus: ShopPlant["status"]) => {
    setMockPlantsState((prev) => {
      const next = prev.map((p) => (p._id === plantId ? { ...p, status: newStatus } : p));
      try { localStorage.setItem("mockPlants", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const globalDemoMode = useGlobalDemoMode();
  const effectiveDisplayMode = globalDemoMode ? "populated" : "auto";

  const shopMockItems = mockPlantsState.filter((plant) => plant.status === "for-sale" && plant.type !== "אלוקסיה");

  const realShopItems = realPlants?.filter(
    (plant) => (plant.status === "for-sale" || plant.status === "selling") && plant.type !== "אלוקסיה"
  ) ?? [];

  const displayedItems = useMemo<ShopPlant[]>(() => {
    if (effectiveDisplayMode === "populated") return shopMockItems;
    if (!isLoaded || !isSignedIn) return [];
    if (realPlants === undefined) return [];
    return realShopItems;
  }, [effectiveDisplayMode, isLoaded, isSignedIn, realPlants, shopMockItems]);

  const isLoading = effectiveDisplayMode === "auto" && isLoaded && isSignedIn && realPlants === undefined;

  return (
    <div className="flex flex-col h-full">
      <header className="p-6 bg-white border-b border-stone-100 sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-stone-800">החנות שלי</h1>
        <p className="text-stone-500 text-sm mt-1">כאן יופיעו המודעות והפריטים שלך למכירה.</p>
        {globalDemoMode && (
          <p className="text-[11px] text-stone-500 mt-2">מצב דמו פעיל. מראה חנות מלאת דמו כדי שתוכל לעצב את הממשק.</p>
        )}
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          </div>
        ) : displayedItems.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="אין כרגע פריטים למכירה"
            description="החנות שלך תופיע כאן ברגע שתוסיף הצעה חדשה למכירה."
            buttonText="הוסף פריט"
            buttonHref="/new"
          />
        ) : (
          <CollectionGrid plants={displayedItems} isEditable={true} onStatusChange={handleLocalStatusChange} />
        )}
      </div>
    </div>
  );
}
