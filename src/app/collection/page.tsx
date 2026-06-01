"use client";

import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import EmptyCollectionState from "@/components/EmptyCollectionState";
import CollectionGrid from "@/components/CollectionGrid";
import { useGlobalDemoMode } from "@/components/useGlobalDemoMode";

type PlantStatus = "personal" | "for-sale" | "auction" | "collection" | "selling";

type Plant = {
  _id: string;
  type: string;
  sub_type?: string;
  status: PlantStatus;
  estimated_value?: number | string;
  current_price?: number;
  price?: number;
  location?: string;
  wateringDate?: number;
  imageUrl?: string | null;
  listingId?: string;
  defaultCareGuide?: {
    lightNeeds?: string;
    wateringFrequency?: number;
  };
  timeline?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

// Location options for filter
const locationOptions = [
  { value: "", label: "הכל" },
  { value: "תל אביב", label: "תל אביב" },
  { value: "ירושלים", label: "ירושלים" },
  { value: "חיפה", label: "חיפה" },
  { value: "באר שבע", label: "באר שבע" },
  { value: "אשדוד", label: "אשדוד" },
  { value: "נתניה", label: "נתניה" },
  { value: "אשקלון", label: "אשקלון" },
  { value: "רמת גן", label: "רמת גן" },
  { value: "פתח תקווה", label: "פתח תקווה" },
  { value: "ראשון לציון", label: "ראשון לציון" },
  { value: "אילת", label: "אילת" },
  { value: "נהריה", label: "נהריה" },
  { value: "קריית אתא", label: "קריית אתא" },
  { value: "עפולה", label: "עפולה" },
  { value: "כפר סבא", label: "כפר סבא" },
  { value: "חולון", label: "חולון" },
  { value: "מודיעין", label: "מודיעין" },
  { value: "רעננה", label: "רעננה" },
  { value: "נצרת", label: "נצרת" },
  { value: "קריית אונו", label: "קריית אונו" },
  { value: "בת ים", label: "בת ים" },
  { value: "הרצליה", label: "הרצליה" },
  { value: "רחובות", label: "רחובות" },
  { value: "רמלה", label: "רמלה" },
  { value: "בית שמש", label: "בית שמש" },
];

// Sort options
type SortByType = "price_asc" | "price_desc" | "watering_date" | "type" | "";

const sortOptions: { value: SortByType; label: string }[] = [
  { value: "", label: "בחר סינון" },
  { value: "price_asc", label: "מחיר: מהנמוך לגבוה" },
  { value: "price_desc", label: "מחיר: מהגבוה לנמוך" },
  { value: "watering_date", label: "תאריך השקיה" },
  { value: "type", label: "סוג: א-ת" },
];

/**
 * ׳ ׳×׳•׳ ׳™ ׳”׳“׳׳™׳” (Mock Data) ׳׳¦׳•׳¨׳ ׳¢׳™׳¦׳•׳‘ ׳”׳׳׳©׳§
 */
const mockPlants: Plant[] = [
  {
    _id: "mock1",
    type: "סנסיווריה",
    sub_type: "קלאסית",
    status: "personal", // אישי
    estimated_value: 1200,
    price: 1200,
    location: "תל אביב",
    wateringDate: Date.now() - 86400000 * 3,
    imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b",
    defaultCareGuide: {
      lightNeeds: "אור מלא",
      wateringFrequency: 7
    }
  },
  {
    _id: "mock2",
    type: "פילודנדרון",
    sub_type: "לימון",
    status: "for-sale", // למכירה
    estimated_value: 450,
    price: 450,
    location: "חיפה",
    wateringDate: Date.now() - 86400000 * 1,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/31/Pink_princess_philodendron.jpg",
    defaultCareGuide: {
      lightNeeds: "אור צל",
      wateringFrequency: 5
    }
  },
  {
    _id: "mock3",
    type: "פוטוס",
    sub_type: "זהב",
    status: "auction", // מכרז פעיל
    estimated_value: 80,
    price: 80,
    location: "ירושלים",
    wateringDate: Date.now() - 86400000 * 7,
    imageUrl: "https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=800&auto=format&fit=crop",
    defaultCareGuide: {
      lightNeeds: "אור חלקי",
      wateringFrequency: 14
    }
  },
  {
    _id: "mock4",
    type: "פיקוס",
    sub_type: "סוקולנט",
    status: "personal", // אישי
    estimated_value: 120,
    price: 120,
    location: "באר שבע",
    wateringDate: Date.now() - 86400000 * 14,
    imageUrl: "https://images.unsplash.com/photo-1554631221-f9603e6808be",
    defaultCareGuide: {
      lightNeeds: "אור עדין",
      wateringFrequency: 3
    }
  },
];

const mockWishlist = [
  {
    _id: "wish1",
    plant_type: "דרקונית",
    preferred_location: "מרכז",
  },
  {
    _id: "wish2",
    plant_type: "קטליה",
  }
];

const mockNotifications = [
  {
    _id: "notif1",
    message: "נוצרה התראה חדשה על צמח שמעניין אותך!",
    is_read: false,
    created_at: Date.now() - 3600000,
  },
  {
    _id: "notif2",
    message: "פילודנדרון חדש נוסף למכירה באזור שלך!",
    is_read: false,
    created_at: Date.now() - 7200000,
  },
];

export default function CollectionPage() {
  const { isLoaded, isSignedIn } = useAuth();
  
  // Filter and sort state
  const [sortBy, setSortBy] = useState<SortByType>("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Always use the sorted query - it handles empty filter values gracefully
  const plants = useQuery(
    api.plants.getMyPlantsSorted,
    isLoaded && isSignedIn 
      ? { 
          sortBy: sortBy || undefined, 
          filterType: filterType || undefined, 
          filterLocation: filterLocation || undefined,
        }
      : "skip"
  );
  
  // Get unique plant types for filter dropdown
  const plantTypes = useQuery(api.plants.getPlantTypes, isLoaded && isSignedIn ? {} : "skip");
  
  const setCollectionPrivacy = useMutation(api.users.setCollectionPrivacy);
  const serverPrivacy = useQuery(api.users.getMyCollectionPrivacy, isLoaded && isSignedIn ? {} : "skip");
  const [localIsPublic, setLocalIsPublic] = useState(false); // Initial state for the toggle
  
  const globalDemoMode = useGlobalDemoMode();
  const effectiveDisplayMode: "auto" | "empty" | "populated" = globalDemoMode ? "populated" : "auto";

  // State for mock/demo plants so UI can update client-side in populated mode
  const [mockPlantsState, setMockPlantsState] = useState<Plant[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("mockPlants") : null;
      return raw ? (JSON.parse(raw) as Plant[]) : mockPlants;
    } catch (e) {
      return mockPlants;
    }
  });

  // Sanitize persisted mockPlants on mount (remove any 'אלוקסיה')
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
        setMockPlantsState(cleaned as Plant[]);
        console.info("Sanitized mockPlants in collection: removed 'אלוקסיה'");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mockPlants") {
        try {
          setMockPlantsState(e.newValue ? (JSON.parse(e.newValue) as Plant[]) : mockPlants);
        } catch (err) {
          setMockPlantsState(mockPlants);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Wishlist queries/mutations
  const wishlistData = useQuery(api.plants.getWishlist);
  const addToWishlist = useMutation(api.plants.addToWishlist);
  const notificationsData = useQuery(api.plants.getNotifications);
  const removeFromWishlist = useMutation(api.plants.removeFromWishlist);

  // Check if user is authenticated before allowing toggle
  const canToggle = isSignedIn === true;

  // Ref to track if toggle is in progress - prevents duplicate requests
  const isTogglingRef = useRef(false);
  // Loading state for UI feedback
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    // ׳¡׳ ׳›׳¨׳•׳ ׳¢׳ ׳”׳©׳¨׳× ׳¨׳§ ׳׳ ׳”׳׳©׳×׳׳© ׳׳—׳•׳‘׳¨ (׳›׳¨׳’׳¢ ׳‘׳׳¦׳‘ ׳¢׳™׳¦׳•׳‘ ׳–׳” ׳₪׳—׳•׳× ׳§׳¨׳™׳˜׳™)
    if (serverPrivacy !== undefined && !isTogglingRef.current) {
      setLocalIsPublic(serverPrivacy);
    }
    
    return () => {
      isTogglingRef.current = false;
    };
  }, [serverPrivacy]);
  
  const handleTogglePrivacy = useCallback(async () => {
    // Check if user is authenticated
    if (!canToggle) {
      console.info("Please sign in to change collection privacy");
      return;
    }
    
    // Prevent duplicate requests while toggle is in progress
    if (isTogglingRef.current) {
      return;
    }

    isTogglingRef.current = true;
    setIsToggling(true);
    
    const newPrivacy = !localIsPublic;
    setLocalIsPublic(newPrivacy);
    
    try {
      await setCollectionPrivacy({ isPublic: newPrivacy });
    } catch (error) {
      // Revert on error - keep local state for UI
      // Use a descriptive message instead of logging the full error object
      // to avoid duplicate error notifications from Convex and Next.js
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.info(`Collection privacy update: ${errorMessage}`);
      // Revert the local state on error
      setLocalIsPublic(!newPrivacy);
    } finally {
      // Always reset the toggling state
      isTogglingRef.current = false;
      setIsToggling(false);
    }
  }, [localIsPublic, setCollectionPrivacy, canToggle]);

  const combinedPlants = useMemo<Plant[]>(() => {
    if (effectiveDisplayMode === "populated") return mockPlantsState;
    return isSignedIn ? (plants ?? []) : [];
  }, [effectiveDisplayMode, isSignedIn, plants, mockPlantsState]);

  const handleLocalStatusChange = (plantId: string, newStatus: PlantStatus) => {
    setMockPlantsState((prev) => {
      const next = prev.map((p) => (p._id === plantId ? { ...p, status: newStatus } : p));
      try { localStorage.setItem("mockPlants", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const filteredAndSortedPlants = useMemo<Plant[]>(() => {
    return combinedPlants.filter((p) => 
      (!filterType || p.type === filterType) && 
      (!filterLocation || p.location === filterLocation)
    );
  }, [combinedPlants, filterType, filterLocation]);

  // ׳—׳׳•׳§׳× ׳”׳¦׳׳—׳™׳ ׳׳§׳‘׳•׳¦׳•׳× ׳׳₪׳™ ׳¡׳˜׳˜׳•׳¡
  const groupedPlants = useMemo(() => {
    return {
      personal: filteredAndSortedPlants.filter((p) => p.status === "personal" || p.status === "collection"),
      forSale: filteredAndSortedPlants.filter((p) => p.status === "for-sale" || p.status === "selling"),
      auction: filteredAndSortedPlants.filter((p) => p.status === "auction"),
    };
  }, [filteredAndSortedPlants]);

  // ׳©׳׳™׳₪׳× ׳”-Wishlist ׳׳₪׳™ ׳׳¦׳‘ ׳”׳×׳¦׳•׳’׳”
  const currentWishlist = useMemo(() => {
    if (effectiveDisplayMode === "populated") return mockWishlist;
    return wishlistData ?? [];
  }, [effectiveDisplayMode, wishlistData]);

  // ׳©׳׳™׳₪׳× ׳”׳”׳×׳¨׳׳•׳× ׳׳₪׳™ ׳׳¦׳‘ ׳”׳×׳¦׳•׳’׳”
  const currentNotifications = useMemo(() => {
    if (effectiveDisplayMode === "populated") return mockNotifications;
    return notificationsData ?? [];
  }, [effectiveDisplayMode, notificationsData]);

  // ׳˜׳¢׳™׳ ׳” ׳¨׳§ ׳›׳©׳׳ ׳—׳ ׳• ׳‘׳׳׳× ׳׳—׳›׳™׳ ׳׳ ׳×׳•׳ ׳™׳ ׳׳”׳©׳¨׳× ׳•׳‘׳׳¦׳‘ ׳׳•׳˜׳•׳׳˜׳™
  const isActuallyLoading = isSignedIn && plants === undefined && !globalDemoMode;

  if (isActuallyLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const displayedTypes = useMemo(() => {
    return [...new Set(combinedPlants.map((p) => p.type))].sort();
  }, [combinedPlants]);

  // ׳—׳™׳©׳•׳‘ ׳”׳©׳•׳•׳™ ׳”׳›׳•׳׳ ׳©׳ ׳”׳׳•׳¡׳£ ׳‘׳¦׳•׳¨׳” ׳‘׳˜׳•׳—׳” (Type Guarding)
  const totalValue = useMemo(() => {
    return filteredAndSortedPlants.reduce((acc: number, plant: Plant) => {
      const plantValue = typeof plant.estimated_value === 'number' 
        ? plant.estimated_value 
        : Number(plant.estimated_value) || 0;
      return acc + plantValue;
    }, 0);
  }, [filteredAndSortedPlants]);

  return (
    <div className="flex flex-col h-full p-6 bg-white" dir="rtl">
      <header className="mb-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-800">האוסף שלי</h1>
            <p className="text-stone-500 font-medium mt-1">{(filteredAndSortedPlants?.length || 0)} צמחים בתצוגה</p>
          </div>
          
          {/* Privacy Toggle */}
          <div className="flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-200">
            <span className="text-sm font-medium text-stone-600">
              {localIsPublic ? "פומבי" : "פרטי"}
            </span>
            <button
              onClick={handleTogglePrivacy}
              disabled={isToggling || !canToggle}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                localIsPublic ? "bg-emerald-600" : "bg-stone-300"
              } ${isToggling || !canToggle ? "opacity-50 cursor-not-allowed" : ""}`}
              role="switch"
              aria-checked={localIsPublic}
              aria-label="שנה את מצבי הנראות של האוסף"
              title={!canToggle ? "אנא היכנס כדי לשנות את הגדרות הפרטיות" : undefined}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                  localIsPublic ? "left-1 translate-x-6" : "right-1"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="mb-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
        <div className="flex flex-col gap-3">
          {/* Sort by */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-stone-600 whitespace-nowrap">מיין לפי:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortByType)}
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-emerald-600"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by type */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-stone-600 whitespace-nowrap">סנן לפי סוג:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-emerald-600"
            >
              <option value="">הכל</option>
              {displayedTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by location */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-stone-600 whitespace-nowrap">סנן לפי מיקום:</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-emerald-600"
            >
              {locationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters button */}
          {(sortBy || filterType || filterLocation) && (
            <button
              onClick={() => {
                setSortBy("");
                setFilterType("");
                setFilterLocation("");
              }}
              className="text-sm text-emerald-700 font-medium hover:text-emerald-900 transition-colors self-end"
            >
              נקה סינון
            </button>
          )}
        </div>
      </div>

      {/* ׳×׳¦׳•׳’׳” ׳׳•׳×׳ ׳™׳× ׳׳₪׳™ ׳›׳׳•׳× ׳”׳¦׳׳—׳™׳ ׳”׳׳׳™׳×׳™׳× */}
      {!filteredAndSortedPlants || filteredAndSortedPlants.length === 0 ? (
        <EmptyCollectionState />
      ) : (
        <div className="flex flex-col gap-6">
          {/* ׳¡׳¨׳’׳ ׳©׳•׳•׳™ ׳׳•׳¢׳¨׳ - ׳”׳•׳¢׳‘׳¨ ׳׳¨׳׳© ׳”׳×׳¦׳•׳’׳”, ׳׳×׳—׳× ׳׳׳¡׳ ׳ ׳™׳ */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs text-emerald-700 font-medium">ערך כולל:</span>
              <span className="text-xl font-black text-emerald-900">
                ₪{totalValue.toLocaleString()}
              </span>
            </div>
            <div className="text-2xl">🌿</div>
          </div>

          {/* ׳§׳‘׳•׳¦׳” 1: ׳׳•׳¡׳£ ׳׳™׳©׳™ */}
          {groupedPlants.personal.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">🌱 האוסף האישי שלי <span className="text-xs font-normal text-stone-400">({groupedPlants.personal.length})</span></h3>
              <CollectionGrid plants={groupedPlants.personal} onStatusChange={handleLocalStatusChange} />
            </section>
          )}

          {/* ׳§׳‘׳•׳¦׳” 2: ׳׳׳›׳™׳¨׳” ׳‘׳—׳ ׳•׳× */}
          {groupedPlants.forSale.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">🛒 צמחים למכירה שלי <span className="text-xs font-normal text-emerald-600/60">({groupedPlants.forSale.length})</span></h3>
              <CollectionGrid plants={groupedPlants.forSale} onStatusChange={handleLocalStatusChange} />
            </section>
          )}

          {/* ׳§׳‘׳•׳¦׳” 3: ׳‘׳׳›׳™׳¨׳” ׳₪׳•׳׳‘׳™׳× */}
          {groupedPlants.auction.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">🔥 מכרזים פעילים <span className="text-xs font-normal text-amber-600/60">({groupedPlants.auction.length})</span></h3>
              <CollectionGrid plants={groupedPlants.auction} onStatusChange={handleLocalStatusChange} />
            </section>
          )}
        </div>
      )}

    </div>
  );
}
