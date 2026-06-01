"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const dbUser = useQuery(api.users.getMe);
  const setPrivacy = useMutation(api.users.setCollectionPrivacy);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!clerkLoaded || dbUser === undefined) {
    return <div className="flex h-full items-center justify-center p-10">טוען פרופיל...</div>;
  }

  if (!clerkUser || !dbUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <p className="text-stone-500 mb-4">עליך להיות מחובר כדי לצפות בפרופיל.</p>
        <Link href="/" className="bg-emerald-800 text-white px-6 py-2 rounded-xl font-bold">חזרה לדף הבית</Link>
      </div>
    );
  }

  const handleTogglePrivacy = async () => {
    setIsUpdating(true);
    try {
      await setPrivacy({ isPublic: !dbUser.is_collection_public });
    } catch (err) {
      alert("שגיאה בעדכון הגדרות הפרטיות");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-full bg-stone-50">
      <header className="p-6 bg-white border-b border-stone-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-stone-800">הפרופיל שלי</h1>
      </header>

      <div className="p-6 space-y-6">
        {/* כרטיס משתמש ראשי */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-stone-100 flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src={clerkUser.imageUrl}
              alt={dbUser.name}
              fill
              className="rounded-full object-cover border-4 border-emerald-50 shadow-inner"
            />
          </div>
          <h2 className="text-xl font-bold text-stone-800">{dbUser.name}</h2>
          <p className="text-sm text-stone-400">{dbUser.email}</p>
        </div>

        {/* מדדי Reputation ו-Points */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 flex flex-col items-center justify-center">
            <span className="text-3xl mb-2">⭐</span>
            <span className="text-2xl font-black text-emerald-800">{dbUser.reputation_score}</span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">מוניטין</span>
          </div>
          
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 flex flex-col items-center justify-center">
            <span className="text-3xl mb-2">💎</span>
            <span className="text-2xl font-black text-blue-800">{dbUser.reward_points}</span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">נקודות זכות</span>
          </div>
        </div>

        {/* הגדרות פרטיות ואבטחה */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-stone-100 space-y-4">
          <h3 className="font-bold text-stone-800 mb-2">הגדרות חשבון</h3>
          
          <div className="flex items-center justify-between p-1">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-stone-700">אוסף ציבורי</span>
              <span className="text-[10px] text-stone-400">אפשר למשתמשים אחרים לראות את הצמחים שלך</span>
            </div>
            <button
              onClick={handleTogglePrivacy}
              disabled={isUpdating}
              className={`w-12 h-6 rounded-full transition-all relative ${dbUser.is_collection_public ? 'bg-emerald-600' : 'bg-stone-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${dbUser.is_collection_public ? 'right-7' : 'right-1'}`} />
            </button>
          </div>

          <div className="border-t border-stone-50 pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-stone-700">ניהול אבטחה</span>
              <span className="text-[10px] text-stone-400">שינוי סיסמה והגדרות אימות</span>
            </div>
            <UserButton />
          </div>
        </div>

        {/* קישורים נוספים */}
        <div className="flex flex-col gap-3">
          <Link href="/orders" className="flex items-center justify-between p-4 bg-white rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-colors border border-stone-100">
            <span>ההזמנות שלי</span>
            <span>📦</span>
          </Link>
          <Link href="/collection" className="flex items-center justify-between p-4 bg-white rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-colors border border-stone-100">
            <span>ניהול האוסף שלי</span>
            <span>🌱</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
