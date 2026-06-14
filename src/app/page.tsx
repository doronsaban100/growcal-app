"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { SeedData } from "@/components/SeedData";
import EmptyState from "@/components/EmptyState";
import { useAuth, SignInButton } from "@clerk/nextjs";
import type { Id } from "@convex/_generated/dataModel";

type SortOption = "price_asc" | "price_desc" | "name" | "location" | "";
type PlantStatus = "personal" | "for-sale" | "auction" | "collection" | "selling";

interface PlantListing {
  _id: string;
  type: string;
  sub_type: string;
  status: PlantStatus | string;
  estimated_value: number;
  current_price: number;
  location: string;
  wateringDate: number;
  imageUrl: string;
  sellerName?: string;
  ownerId: Id<"users"> | string;
  type_en?: string;
  sub_type_en?: string;
  listingId?: string;
  displayPrice?: string | number;
  defaultCareGuide?: {
    lightNeeds?: string;
    wateringFrequency?: number;
  };
}

/**
 * נתוני דמה עבור דף הבית (השוק)
 */
const INITIAL_MOCK_PLANTS: PlantListing[] = [
  {
    _id: "mock1",
    type: "סנסיווריה",
    sub_type: "קלאסית",
    status: "personal",
    estimated_value: 1200,
    current_price: 1200,
    location: "תל אביב",
    wateringDate: Date.now() - 259200000,
    imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b",
    sellerName: "דורון (דמו)",
    ownerId: "mock-owner" as Id<"users">,
    defaultCareGuide: { lightNeeds: "אור חזק לא ישיר", wateringFrequency: 10 },
  },
  {
    _id: "mock2",
    type: "פילודנדרון",
    sub_type: "לימון",
    status: "for-sale",
    estimated_value: 450,
    current_price: 450,
    location: "חיפה",
    wateringDate: Date.now() - 86400000,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/31/Pink_princess_philodendron.jpg",
    sellerName: "דורון (דמו)",
    ownerId: "mock-owner" as Id<"users">,
    defaultCareGuide: { lightNeeds: "אור חזק לא ישיר", wateringFrequency: 7 },
  },
  {
    _id: "mock3",
    type: "פוטוס",
    sub_type: "זהב",
    status: "auction",
    estimated_value: 80,
    current_price: 80,
    location: "ירושלים",
    wateringDate: Date.now() - 604800000,
    imageUrl: "https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=800&auto=format&fit=crop",
    sellerName: "אנה (דמו)",
    ownerId: "mock-owner" as Id<"users">,
    defaultCareGuide: { lightNeeds: "חצי שמש", wateringFrequency: 7 },
  },
  {
    _id: "mock4",
    type: "פיקוס",
    sub_type: "סוקולנט",
    status: "personal",
    estimated_value: 120,
    current_price: 120,
    location: "באר שבע",
    wateringDate: Date.now() - 1209600000,
    imageUrl: "https://images.unsplash.com/photo-1554631221-f9603e6808be",
    sellerName: "יוסי (דמו)",
    ownerId: "mock-owner" as Id<"users">,
    defaultCareGuide: { lightNeeds: "אור חזק לא ישיר", wateringFrequency: 14 },
  },
];

/**
 * פונקציית עזר להצגת איקון תאורה
 */
const getLightIcon = (needs?: string) => {
  if (!needs) return null;
  if (needs.includes("שמש מלאה")) return "☀️";
  if (needs.includes("חצי שמש") || needs.includes("אור לא ישיר")) return "⛅";
  return "🌑"; // צל
};

/**
 * פונקציית עזר לקביעת צבעוניות ההשקיה לפי דחיפות
 */
const getWateringStyle = (frequency?: number) => {
  if (!frequency) return "bg-emerald-50/50 border-emerald-100/50 text-emerald-700";
  
  if (frequency <= 3) {
    return "bg-red-50 border-red-100 text-red-700"; // דחיפות גבוהה
  } else if (frequency <= 7) {
    return "bg-amber-50 border-amber-100 text-amber-700"; // דחיפות בינונית
  }
  return "bg-emerald-50/50 border-emerald-100/50 text-emerald-700"; // דחיפות נמוכה
};

/**
 * קומפוננטת דף הנחיתה למשתמשים לא מחוברים
 */
function LandingPage({ onPeek }: { onPeek: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="mb-8 p-4 bg-emerald-50 rounded-full text-5xl">🌱</div>
      <h1 className="text-4xl font-black text-stone-800 mb-4 tracking-tight">
        ברוכים הבאים ל-<span className="text-emerald-800">PlantMates</span>
      </h1>
      <p className="text-lg text-stone-600 mb-10 max-w-sm leading-relaxed">
        הקהילה שלך להחלפה, מכירה וניהול של האוסף הבוטני שלך.
      </p>
      
      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        <SignInButton mode="modal">
          <button className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
            התחברות או הרשמה
          </button>
        </SignInButton>
        
        <div className="flex items-center gap-4 my-2">
          <div className="h-px bg-stone-200 flex-1"></div>
          <span className="text-xs text-stone-400 font-bold uppercase">או</span>
          <div className="h-px bg-stone-200 flex-1"></div>
        </div>

        <button 
          onClick={onPeek}
          className="w-full bg-white border border-stone-200 text-stone-600 py-4 rounded-2xl font-bold active:scale-95 transition-all"
        >
          הצץ בשוק כמרחוק
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const realPlants = useQuery(api.plants.getForSalePlants);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mockPlants, setMockPlants] = useState<PlantListing[]>(INITIAL_MOCK_PLANTS);
  const [sortBy, setSortBy] = useState<SortOption>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "for-sale" | "auction">("all");

  // טעינת נתוני המוק מה-LocalStorage כדי לסנכרן עם שינויים שבוצעו באוסף/חנות
  useEffect(() => {
    setMounted(true);
  }, []);

  // טעינת נתוני המוק מה-LocalStorage כדי לסנכרן עם שינויים שבוצעו באוסף/חנות
  useEffect(() => {
    const stored = localStorage.getItem("mockPlants");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMockPlants(parsed);
      } catch (e) {
        setMockPlants(INITIAL_MOCK_PLANTS);
      }
    }
  }, [isDemoMode]);

  const isLoading = realPlants === undefined && !isDemoMode;

  const processedPlants = useMemo((): PlantListing[] => {
    // שילוב של צמחי הדמו עם הצמחים האמיתיים במידה ומצב דמו פעיל
    const allAvailablePlants: PlantListing[] = isDemoMode
      ? (mockPlants as PlantListing[]).map(p => ({
          ...p,
          displayPrice: p.current_price ?? p.estimated_value ?? 0, // הגדרת displayPrice מפורשת לצמחי דמו
        }))
      : (realPlants || []).map((p: any) => ({
          ...p,
          ownerId: p.owner_id || p.ownerId,
          displayPrice: p.current_price ?? p.price ?? 0, // הגדרת displayPrice מפורשת לצמחים אמיתיים
        })) as any[];
    
    let result = allAvailablePlants.filter((plant: PlantListing) => {
      const type = plant.type?.toLowerCase() || "";
      const subType = plant.sub_type?.toLowerCase() || "";
      const typeEn = plant.type_en?.toLowerCase() || "";
      const subTypeEn = plant.sub_type_en?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();

      const matchesSearch = type.includes(query) || subType.includes(query) || typeEn.includes(query) || subTypeEn.includes(query);

      // השוק מציג רק צמחים בסטטוס מכירה או מכרז
      const isMarketPlant = plant.status === "for-sale" || plant.status === "selling" || plant.status === "auction";
      const matchesStatus = isMarketPlant && (statusFilter === "all" || plant.status === statusFilter);

      return matchesSearch && matchesStatus;
    });

    const sortedResult = [...result];
    const getPrice = (p: any) => p.displayPrice ?? p.current_price ?? p.price ?? p.estimated_value ?? 0;
    if (sortBy === "price_asc") {
      sortedResult.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === "price_desc") {
      sortedResult.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === "name") {
      sortedResult.sort((a, b) => (a.type || "").localeCompare(b.type || ""));
    } else if (sortBy === "location") {
      sortedResult.sort((a, b) => (a.location || "").localeCompare(b.location || ""));
    }

    return sortedResult;
  }, [realPlants, searchQuery, sortBy, statusFilter, isDemoMode]);

  if (!mounted) {
    return null; // מונע שגיאות Hydration ברינדור הראשוני
  }

  return (
    <div className="flex flex-col h-full min-h-full">
      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (!isSignedIn && !isDemoMode) ? (
        <LandingPage onPeek={() => setIsDemoMode(true)} />
      ) : (
        <>
      <header className="p-6 border-b border-stone-100 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-stone-800">PlantMates - שוק הצמחים</h1>
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black uppercase tracking-tighter">
                מצב דמו
              </span>
            )}
            {isSignedIn ? (
              <button 
                onClick={() => setIsDemoMode(!isDemoMode)}
                className="text-xs font-bold text-stone-400 hover:text-emerald-700 transition-colors"
              >
                {isDemoMode ? "בטל דמו" : "הפעל דמו"}
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="text-xs bg-emerald-800 text-white px-3 py-1.5 rounded-xl font-bold shadow-lg shadow-emerald-900/10">
                  התחברות
                </button>
              </SignInButton>
            )}
          </div>
        </div>

        {!isDemoMode && (
          <div className="flex mt-2 p-1 bg-stone-100 rounded-2xl">
            {[
              { id: "all", label: "הכל" },
              { id: "for-sale", label: "חנות (מחיר קבוע)" },
              { id: "auction", label: "מכרזים" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === tab.id 
                    ? "bg-white text-emerald-800 shadow-sm" 
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 relative">
          <input
            type="text"
            aria-label="חפש צמחים לפי סוג או תת-סוג"
            placeholder="חפש לפי סוג או תת-סוג..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 pr-10 text-sm text-stone-900 outline-none focus:border-emerald-700 transition-colors"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600 outline-none focus:border-emerald-700"
          >
            <option value="">מיין לפי...</option>
            <option value="price_asc">מחיר: מהנמוך לגבוה</option>
            <option value="price_desc">מחיר: מהגבוה לנמוך</option>
            <option value="name">שם הצמח (א-ת)</option>
            <option value="location">רדיוס מרחק</option>
          </select>
        </div>
        
        {(searchQuery || sortBy) && (
          <button
            onClick={() => { setSearchQuery(""); setSortBy(""); }}
            className="mt-2 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline"
          >
            נקה סינונים
          </button>
        )}
      </header>

      <div className="flex-1 p-6">
        {/* מצב טעינה - Skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-100" />
            ))}
          </div>
        )}
        
        {/* שוק ריק לגמרי */}
        {!isLoading && realPlants?.length === 0 && (
          <EmptyState 
            icon="🏪"
            title="השוק כרגע במנוחה"
            description="עדיין לא הועלו צמחים למכירה. אולי תרצה להיות הראשון שמציע צמח למכירה?"
            buttonText="הוסף צמח למכירה"
            buttonHref="/new"
          />
        )}

        {/* אין תוצאות לחיפוש ספציפי */}
        {!isLoading && realPlants && realPlants.length > 0 && processedPlants?.length === 0 && (
          <div className="text-center py-10">
            <p className="text-stone-500">לא נמצאו צמחים התואמים לחיפוש "{searchQuery}"</p>
          </div>
        )}

        {statusFilter === "auction" ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-amber-50 p-6 rounded-full mb-4 text-3xl">⏳</div>
            <h2 className="text-xl font-bold text-stone-800">המכרזים יפתחו בקרוב!</h2>
            <p className="text-stone-500 mt-2 max-w-xs mx-auto leading-relaxed">
              אנחנו עובדים על מערכת המכרזים שלנו. בקרוב תוכלו להציע מחיר על צמחים נדירים בזמן אמת.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4">
          {processedPlants?.map((plant) => (
            <Link
              href={plant.listingId ? `/listing/${plant.listingId}` : `/listing/${plant._id}`}
              key={plant._id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex p-4 gap-4">
                {plant.imageUrl ? (
                  <Image
                    src={plant.imageUrl}
                    alt={plant.type}
                    width={96}
                    height={96}
                    className="h-24 w-24 shrink-0 rounded-xl object-cover border border-stone-100"
                  />
                ) : (
                  <div className="h-24 w-24 shrink-0 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-xs text-center p-2">
                    אין תמונה
                  </div>
                )}
                
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-stone-900 leading-tight">
                      {plant.type || "צמח לא ידוע"} 
                      {plant.type_en && (
                        <span className="text-sm font-normal text-stone-500 mr-1">({plant.type_en})</span>
                      )}
                    </h3>

                    {/* שם המוכר - לחיץ */}
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/user/${plant.ownerId}`);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer mt-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                      </svg>
                      <span>החנות של {plant.sellerName || "מוכר GrowCal"}</span>
                    </div>

                    <p className="text-sm text-stone-500">
                      {plant.sub_type || "לא צוין"} 
                      {plant.sub_type_en && (
                        <span className="text-xs text-stone-400 mr-1">({plant.sub_type_en})</span>
                      )}
                    </p>
                    {plant.location && (
                      <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {plant.location}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-800">₪{plant.displayPrice || plant.current_price || "0"}</span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold px-2 py-0.5 rounded-full bg-stone-50">
                        {plant.status === 'auction' ? 'מכרז' : 'מחיר'}
                      </span>
                    </div>
                    
                    {/* אינדיקטורים לטיפול */}
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${getWateringStyle(plant.defaultCareGuide?.wateringFrequency)}`}>
                      {plant.defaultCareGuide?.lightNeeds && (
                        <span title={plant.defaultCareGuide.lightNeeds} className="text-xs">{getLightIcon(plant.defaultCareGuide.lightNeeds)}</span>
                      )}
                      {plant.defaultCareGuide?.wateringFrequency && (
                        <span className="text-[10px] font-bold flex items-center gap-0.5">
                          💧 {plant.defaultCareGuide.wateringFrequency}י'
                          {plant.wateringDate && mounted && (
                            <span className="mr-1 opacity-70 font-normal">
                              ({Math.floor((Date.now() - plant.wateringDate) / 86400000) === 0 ? "היום" : `לפני ${Math.floor((Date.now() - plant.wateringDate) / 86400000)} י'`})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        )}
      </div>

      <SeedData />
        </>
      )}
    </div>
  );
}
