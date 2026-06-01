"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SeedData } from "@/components/SeedData";
import EmptyState from "@/components/EmptyState";

type SortOption = "price_asc" | "price_desc" | "name" | "location" | "";

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

export default function HomePage() {
  const realPlants = useQuery(api.plants.getForSalePlants);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("");

  const isLoading = realPlants === undefined;

  const processedPlants = useMemo(() => {
    if (!realPlants) return [];
    
    let result = realPlants.filter((plant) => {
      const type = plant.type?.toLowerCase() || "";
      const subType = plant.sub_type?.toLowerCase() || "";
      const typeEn = plant.type_en?.toLowerCase() || "";
      const subTypeEn = plant.sub_type_en?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return type.includes(query) || subType.includes(query) || typeEn.includes(query) || subTypeEn.includes(query);
    });

    // 2. מיון
    const sortedResult = [...result]; // יצירת עותק למניעת מוטציה על המקור
    if (sortBy === "price_asc") {
      sortedResult.sort((a, b) => (a.current_price || 0) - (b.current_price || 0));
    } else if (sortBy === "price_desc") {
      sortedResult.sort((a, b) => (b.current_price || 0) - (a.current_price || 0));
    } else if (sortBy === "name") {
      sortedResult.sort((a, b) => (a.type || "").localeCompare(b.type || ""));
    } else if (sortBy === "location") {
      sortedResult.sort((a, b) => (a.location || "").localeCompare(b.location || ""));
    }

    return sortedResult;
  }, [realPlants, searchQuery, sortBy]);

  return (
    <div className="flex flex-col h-full min-h-full">
      <header className="p-6 border-b border-stone-100 bg-white">
        <h1 className="text-2xl font-bold text-stone-800">PlantMates - שוק הצמחים</h1>
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
                      <span className="text-lg font-bold text-emerald-800">₪{plant.current_price || "מחיר לא ידוע"}</span>
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
                          {plant.wateringDate && (
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
      </div>

      {/* כפתור הזרקת נתונים - מופיע רק בפיתוח */}
      <SeedData />
    </div>
  );
}
