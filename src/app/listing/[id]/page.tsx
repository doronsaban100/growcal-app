"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function ListingPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  
  // שימוש ב-skip כדי לא להריץ את השאילתה אם ה-ID עדיין לא זמין מה-URL
  const displayData = useQuery(
    api.plants.getListingDetail, 
    typeof id === "string" ? { id } : "skip"
  );

  // בזמן טעינה
  if (!isLoaded || displayData === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  // רק אם הטעינה הסתיימה והנתונים חזרו כ-null (כלומר לא נמצא באמת)
  if (displayData === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-stone-50">
        <div className="text-6xl mb-4">🥀</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">הצמח לא נמצא</h1>
        <p className="text-stone-500 mb-8">יכול להיות שהמודעה כבר לא רלוונטית או שהוסרה.</p>
        <Link href="/" className="bg-emerald-800 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
          חזרה לשוק הצמחים
        </Link>
      </div>
    );
  }

  const getLightIcon = (needs?: string) => {
    if (!needs) return "🌱";
    if (needs.includes("שמש מלאה")) return "☀️";
    if (needs.includes("חצי שמש") || needs.includes("אור לא ישיר")) return "⛅";
    return "🌑";
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24">
      {/* כפתור חזרה צף */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-stone-100 active:scale-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-stone-800">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* תמונת הצמח - Hero */}
      <div className="relative w-full aspect-[4/5] bg-stone-100 overflow-hidden">
        <Image 
          src={displayData.imageUrls?.[0] || displayData.imageUrl || ""} 
          alt={displayData.type}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* פרטים מהירים בתחתית התמונה */}
        <div className="absolute bottom-12 right-8 left-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                זמין למסירה
            </div>
            <h1 className="text-4xl font-black mb-1">{displayData.type}</h1>
            <p className="text-xl opacity-90 font-medium">{displayData.sub_type}</p>
        </div>
      </div>

      {/* גוף הדף */}
      <div className="flex-1 bg-white rounded-t-[48px] -mt-8 relative z-10 px-8 pt-10">
        <div className="flex justify-between items-center mb-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">מחיר מבוקש</span>
            <div className="text-4xl font-black text-emerald-800">₪{displayData.current_price || displayData.displayPrice}</div>
          </div>
          
          <Link 
            href={`/user/${displayData.ownerId}`}
            className="flex flex-col items-end group"
          >
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">המוכר/ת</span>
            <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">{displayData.sellerName || "דורון"}</span>
                <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center text-sm font-bold text-stone-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-all italic">
                    {displayData.sellerName?.[0] || "G"}
                </div>
            </div>
          </Link>
        </div>

        {/* רשת מידע */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-6 rounded-[32px] bg-stone-50 border border-stone-100 flex flex-col gap-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">מיקום</span>
            <p className="font-bold text-stone-800 text-lg flex items-center gap-1.5">
                <span className="text-base">📍</span> {displayData.location || "מרכז"}
            </p>
          </div>
          <div className="p-6 rounded-[32px] bg-stone-50 border border-stone-100 flex flex-col gap-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">גודל צמח</span>
            <p className="font-bold text-stone-800 text-lg flex items-center gap-1.5">
                <span className="text-base">📏</span> {displayData.size || "M"} (בינוני)
            </p>
          </div>
        </div>

        {/* מדריך טיפול */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-stone-800 mb-6">איך מטפלים בי? 🌿</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-4 p-5 rounded-3xl bg-amber-50/50 border border-amber-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                {getLightIcon(displayData.defaultCareGuide?.lightNeeds)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">דרישות תאורה</p>
                <p className="font-bold text-stone-800">{displayData.defaultCareGuide?.lightNeeds || "אור חזק לא ישיר"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-3xl bg-blue-50/50 border border-blue-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">💧</div>
              <div>
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">תדירות השקיה</p>
                <p className="font-bold text-stone-800">פעם ב-{displayData.defaultCareGuide?.wateringFrequency || 7} ימים</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* כפתור הנעה לפעולה קבוע בתחתית */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-stone-100 z-50">
        <button 
          className="w-full bg-emerald-800 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span>אני מעוניין/ת בצמח!</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path d="m9.653 16.915 1.45-5.212-4.107-2.122a.458.458 0 0 1-.027-.803l9.53-4.122a.459.458 0 0 1 .59.59l-4.122 9.53a.458.458 0 0 1-.804-.027l-2.122-4.106-5.212 1.45a.458.458 0 0 1-.57-.596l.635-2.285c.045-.16.142-.303.275-.407l1.082-.848a.458.458 0 0 1 .57.014l2.122 2.121a.458.458 0 0 1-.014.662l-.848 1.082a.458.458 0 0 1-.407.275l-2.285.635a.458.458 0 0 1-.596-.57Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}