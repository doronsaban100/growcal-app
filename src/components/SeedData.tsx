"use client";

import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function SeedData() {
  const { isLoaded, isSignedIn } = useAuth();
  const seedPlants = useMutation(api.plants.seedPlants);
  const seedCareGuides = useMutation(api.care_guides.seedCareGuides);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      // נזרק קודם את מדריכי הטיפול ואז את הצמחים
      await seedCareGuides();
      await seedPlants();
      alert("הנתונים הוזרקו בהצלחה! רענן את הדף כדי לראות את האוסף והשוק החדשים שלך.");
    } catch (err) {
      console.error(err);
      const isAuthError = err instanceof Error && err.message.toLowerCase().includes("not authenticated");
      alert(isAuthError ? "חובה להתחבר כדי להזריק נתוני Seed." : "חלה שגיאה בהזרקת הנתונים. וודא שאתה מחובר.");
    } finally {
      setLoading(false);
    }
  };

  // הגנה קשיחה: הכפתור יופיע *רק* אם אנחנו מריצים מקומית (localhost)
  // וגם אם המשתמש מחובר. ב-Vercel (Production) הוא לא ירונדר לעולם.
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  if (!isLocal || !isLoaded || !isSignedIn) return null;

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="fixed bottom-24 left-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl border border-white/20 transition-all active:scale-95 hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? "מזריק נתונים..." : "🌱 הזרק נתוני Seed"}
    </button>
  );
}