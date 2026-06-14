"use client";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import EmptyState from "@/components/EmptyState";

/**
 * נתוני הדמיה (Mock Data) לצורך סנכרון עם שאר דפי האפליקציה
 */
const mockPlantsForAuction = [
  {
    _id: "mock3" as Id<"plants">,
    type: "סנסיוויריה",
    sub_type: "לאורנטי",
    status: "auction" as const,
    estimated_value: 80,
    current_price: 80,
    location: "אמבטיה",
    imageUrl: "https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=800&auto=format&fit=crop",
    wateringDate: Date.now() - 86400000 * 3, // לפני 3 ימים
    endTime: Date.now() + 1000 * 60 * 60 * 2.5, // דוגמה: מסתיים בעוד שעתיים וחצי
    defaultCareGuide: {
      lightNeeds: "צל מלא",
      wateringFrequency: 14
    }
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
    return "bg-red-50 border-red-100 text-red-700";
  } else if (frequency <= 7) {
    return "bg-amber-50 border-amber-100 text-amber-700";
  }
  return "bg-emerald-50/50 border-emerald-100/50 text-emerald-700";
};

/**
 * רכיב טיימר פנימי המחשב את הזמן הנותר לסיום המכרז
 */
function AuctionTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTime = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft("הסתיים");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return <span className="font-mono">{timeLeft}</span>;
}

export default function AuctionsPage() {
  // שליפת צמחים שהסטטוס שלהם הוא מכרז
  const realAuctions = useQuery(api.plants.getAuctionPlants);
  const placeBid = useMutation(api.offers.createOffer); // בהנחה שזה השם של ה-mutation החדש שלך
  const [error, setError] = useState<string | null>(null);

  const isLoading = realAuctions === undefined;

  const handleBid = async (listingId: Id<"listings">, currentPrice: number) => {
    const bidAmount = currentPrice + 10; // הצעה אוטומטית של +10 ש"ח לצורך הדוגמה
    setError(null);

    try {
      await placeBid({
        listing_id: listingId,
        offer_type: "cash",
        cash_amount: bidAmount,
      });
    } catch (err: any) {
      console.error("Bid failed:", err.message);
      setError(err.message || "חלה שגיאה בהגשת ההצעה. נסה שוב.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-6 border-b border-stone-100">
        <h1 className="text-2xl font-bold text-stone-800">מכירות PlantMates</h1>
      </header>

      {error && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-100">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          </div>
        ) : realAuctions.length === 0 ? (
          <EmptyState 
            icon="🔨"
            title="אין מכרזים פעילים"
            description="כרגע אין צמחים במכירה פומבית. שווה לחזור לבדוק בקרוב!"
            buttonText="חזרה לשוק"
            buttonHref="/"
          />
        ) : (
          realAuctions.map((plant) => (
          <div key={plant._id} className="p-4 mb-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex gap-4">
              {plant.imageUrl ? (
                <Image
                  src={plant.imageUrl}
                  alt={plant.type}
                  width={80}
                  height={80}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover border border-amber-100"
                />
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-amber-400 text-xs text-center p-2">
                  אין תמונה
                </div>
              )}
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-amber-900">{plant.type}</h3>
                  <p className="text-sm text-stone-600">{plant.sub_type}</p>
                </div>
                <span className="bg-amber-200 text-amber-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                  Live
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-amber-100 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {/* טיימר המכרז */}
                  <div className="text-[10px] text-amber-700 font-bold bg-white/50 px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <AuctionTimer endTime={(plant as any).endTime || (Date.now() + 86400000)} />
                  </div>

                  {/* אינדיקטורים לטיפול - נוסף עכשיו */}
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${getWateringStyle((plant as any).defaultCareGuide?.wateringFrequency)}`}>
                    {(plant as any).defaultCareGuide?.lightNeeds && (
                      <span title={(plant as any).defaultCareGuide.lightNeeds} className="text-xs">
                        {getLightIcon((plant as any).defaultCareGuide.lightNeeds)}
                      </span>
                    )}
                    {(plant as any).defaultCareGuide?.wateringFrequency && (
                      <span className="text-[10px] font-bold flex items-center gap-0.5">
                        💧 {(plant as any).defaultCareGuide.wateringFrequency}י'
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
              
              <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-stone-500">הצעה נוכחית:</span>
                <p className="font-bold text-lg text-amber-700">₪{plant.current_price ?? '---'}</p>
              </div>
              <button
                onClick={() => handleBid((plant as any).listingId, plant.current_price)}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700"
                disabled={plant.current_price === undefined || !(plant as any).listingId}
              >
                הצע ₪{(plant.current_price ?? 0) + 10}
              </button>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
