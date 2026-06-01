"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import PlantCareGuide from "@/components/PlantCareGuide";

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const listingId = typeof idParam === "string" ? (idParam as Id<"listings">) : undefined;
  const listing = useQuery(api.listings.get, listingId !== undefined ? { id: listingId } : "skip");

  if (listing === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" />
      </div>
    );
  }

  if (listing === null || !listing.plant) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-stone-800">המודעה לא נמצאה</h2>
        <Link href="/" className="mt-4 inline-block text-emerald-700 font-semibold">חזרה לשוק</Link>
      </div>
    );
  }

  const { plant } = listing;

  return (
    <div className="flex flex-col h-full bg-white" dir="rtl">
      {/* Top Navigation */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center px-6">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white p-2 text-stone-800 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Image Section */}
      <div className="relative h-72 w-full bg-stone-100">
        {plant.imageUrl ? (
          <Image
            src={plant.imageUrl}
            alt={plant.type}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">אין תמונה זמינה</div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative -mt-6 flex-1 overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-sm pb-32">
        <div className="mb-6 flex items-start justify-between gap-4 py-4">
          <div className="text-right">
            <h1 className="text-3xl font-semibold text-stone-800 leading-tight">
              {plant.type}
              {plant.type_en && <span className="block text-lg font-normal text-stone-400">{plant.type_en}</span>}
            </h1>
            <p className="mt-2 text-emerald-700 font-medium">{plant.sub_type} {plant.sub_type_en && `(${plant.sub_type_en})`}</p>
          </div>
          <div className="text-left shrink-0">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">מחיר</p>
            <p className="text-3xl font-semibold text-emerald-700">₪{plant.current_price}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-center shadow-sm">
            <p className="text-xs text-stone-400 mb-1">מידה</p>
            <p className="font-semibold text-stone-800 text-lg">{plant.size}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-center shadow-sm">
            <p className="text-xs text-stone-400 mb-1">סוג עסקה</p>
            <p className="font-semibold text-stone-800 text-lg">{listing.type === 'fixed' ? 'מכירה' : 'מכרז'}</p>
          </div>
        </div>

        <div className="space-y-4 text-right">
          <h2 className="text-lg font-semibold text-stone-800">פרטים נוספים</h2>
          <p className="text-stone-600 leading-relaxed">
            צמח מסוג {plant.type} במצב מצוין. נמכר על ידי חבר בקהילת PlantMates.
            השווי המוערך של הצמח בשוק הוא ₪{plant.estimated_value}.
          </p>
        </div>

        {/* Plant Care Guide */}
        <PlantCareGuide plant={plant as any} />

        {/* Sticky Action Button */}
        <div className="sticky bottom-6 mt-auto pt-4">
          <button 
            className="w-full rounded-full bg-emerald-700 py-5 text-lg font-semibold text-white shadow-lg shadow-emerald-900/10 transition-transform active:scale-95 hover:bg-emerald-800"
            onClick={() => alert('התחלת תהליך רכישה (ימומש בשלב הבא)')}
          >
            {listing.type === 'fixed' ? 'קנה עכשיו' : 'הגש הצעה למכרז'}
          </button>
        </div>
      </div>
    </div>
  );
}