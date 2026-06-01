"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Plant {
  _id: Id<"plants">;
  type: string;
  sub_type: string;
}

interface InterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: Id<"users">;
  sellerName: string;
  sellerPlants: Plant[];
  initialPlantId: Id<"plants">;
}

const INQUIRY_OPTIONS = [
  "תמונות עדכניות?",
  "שעות נוחות לתיאום לבדיקה?",
  "מצב בריאותי של הצמח?",
  "גמישות במחיר?",
];

export default function InterestModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  sellerPlants,
  initialPlantId,
}: InterestModalProps) {
  const [selectedPlants, setSelectedPlants] = useState<Id<"plants">[]>([initialPlantId]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createRequest = useMutation(api.chat_requests.createRequest);

  if (!isOpen) return null;

  const togglePlant = (id: Id<"plants">) => {
    setSelectedPlants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async () => {
    if (selectedPlants.length === 0) {
      alert("יש לבחור לפחות צמח אחד");
      return;
    }
    setIsSubmitting(true);
    try {
      await createRequest({
        sellerId,
        plantIds: selectedPlants,
        inquiryTopics: selectedTopics,
      });
      alert("הבקשה נשלחה! המוכר קיבל התראה ויוכל לפתוח איתך צ'אט.");
      onClose();
    } catch (err: any) {
      alert("חלה שגיאה בשליחת הבקשה: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-stone-800">מעוניין בצמחים של {sellerName}?</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <section>
            <h3 className="text-xs font-bold text-stone-400 mb-3 uppercase tracking-widest">בחר צמחים מהאוסף של {sellerName}:</h3>
            <div className="space-y-2">
              {sellerPlants.map((plant) => (
                <label key={plant._id} className="flex items-center gap-3 p-3 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPlants.includes(plant._id)}
                    onChange={() => togglePlant(plant._id)}
                    className="w-5 h-5 accent-emerald-800 rounded-md"
                  />
                  <div>
                    <p className="text-sm font-bold text-stone-800">{plant.type}</p>
                    <p className="text-[10px] text-stone-400">{plant.sub_type}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-stone-400 mb-3 uppercase tracking-widest">מה תרצה לדעת לפני ביצוע ההזמנה?</h3>
            <div className="grid grid-cols-1 gap-2">
              {INQUIRY_OPTIONS.map((topic) => (
                <label key={topic} className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                    className="w-5 h-5 accent-emerald-800 rounded-md"
                  />
                  <span className="text-sm text-stone-700 font-medium">{topic}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedPlants.length === 0}
            className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? "שולח בקשה..." : "שלח בקשת התעניינות"}
          </button>
          <p className="text-[10px] text-stone-400 text-center mt-3">
            שליחת הבקשה אינה מחייבת רכישה. העסקה תנעל רק לאחר אישור המיקום על ידי שני הצדדים.
          </p>
        </div>
      </div>
    </div>
  );
}