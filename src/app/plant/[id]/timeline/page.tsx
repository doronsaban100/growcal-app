"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";

export default function PlantTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const plantId = params?.id as Id<"plants">;
  
  const plant = useQuery(api.plants.getPlantWithTimeline, plantId ? { plantId } : "skip");

  // מפה של סוגי אירועים לאייקונים
  const eventIcons: Record<string, string> = {
    creation: '🌱', // צמח נוסף
    watering: '💧', // הושקה
    photo: '📸',    // תמונה
    note: '📝',     // הערה כללית
    repotting: '🪴',  // החלפת עציץ
    fertilizing: '🧪', // דישון
    care: '💚',     // טיפול כללי (אם יהיה שימוש)
  };

  // מפה של סוגי אירועים לצבעים
  const eventColors: Record<string, string> = {
    creation: 'bg-emerald-600',
    watering: 'bg-blue-400',
    photo: 'bg-purple-400',
    note: 'bg-yellow-400',
    repotting: 'bg-amber-600',
    fertilizing: 'bg-green-500',
    care: 'bg-pink-400',
  };

  const removeEvent = useMutation(api.plants.removeTimelineEvent);

  if (!plant) return <div className="p-8 text-center">טוען היסטוריה...</div>;

  const sortedTimeline = [...(plant.timeline || [])].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col h-full bg-white" dir="rtl">
      <header className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h1 className="text-xl font-bold text-stone-800">ציר זמן: {plant.type}</h1>
          <p className="text-xs text-stone-500">{plant.sub_type}</p>
        </div>
        <button onClick={() => router.back()} className="p-2 hover:bg-stone-50 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 rotate-180">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 relative">
        {/* קו ציר הזמן */}
        <div className="absolute right-[31px] top-6 bottom-6 w-0.5 bg-emerald-100" />

        <div className="space-y-8 relative">
          {sortedTimeline.map((event) => (
            <div key={event.id} className="relative flex gap-6 mr-2">
              {/* נקודת ציר הזמן */}
              <div className={`w-8 h-8 rounded-full mt-1.5 z-10 ring-4 ring-white flex items-center justify-center text-lg ${
                eventColors[event.type] || 'bg-gray-400'
              }`}>
                {eventIcons[event.type] || '✨'}
              </div>


              <div className="flex-1 bg-stone-50 rounded-2xl p-4 border border-stone-100 relative group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-stone-400">
                    {new Date(event.timestamp).toLocaleDateString('he-IL', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                  
                  {event.type !== 'creation' && (
                    <button 
                      onClick={() => {
                        if(confirm("האם למחוק את האירוע הזה מההיסטוריה?")) {
                          removeEvent({ plantId, eventId: event.id });
                        }
                      }}
                      className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.74 0-.34-6m9.26-2.43a18.72 18.72 0 0 0-3.01-.15h-15c-1.01 0-2.01.05-3.01.15m15 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-1.8c0-1.137-.889-2.067-2.022-2.149a48.11 48.11 0 0 0-3.478-.148c-1.134 0-2.022.083-2.022.164v1.8m7.5 0H9" />
                      </svg>
                    </button>
                  )}
                </div>

                {event.imageUrl && (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 border border-stone-200">
                    <Image src={event.imageUrl} alt="עדכון צמיחה" fill className="object-cover" />
                  </div>
                )}

                <p className="text-sm text-stone-700 font-medium leading-relaxed">
                  {event.note || (event.type === 'photo' ? "נוספה תמונה חדשה לעדכון מצב" : "")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-stone-100 bg-stone-50/50">
        <Link
          href={plantId ? `/new-timeline-photo/${plantId}` : "#"}
          className="w-full flex items-center justify-center gap-2 bg-emerald-800 text-white py-4 rounded-2xl font-bold hover:bg-emerald-900 transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          הוסף עדכון לציר הזמן
        </Link>
      </div>
    </div>
  );
}