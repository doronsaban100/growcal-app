"use client";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export default function BotanyPage() {
  const plants = useQuery(api.plants.list);

  return (
    <div className="flex flex-col h-full">
      <header className="p-6 border-b border-stone-100">
        <h1 className="text-2xl font-bold text-stone-800">בוטניקה</h1>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        {plants === undefined && <p className="text-stone-400">טוען אינציקלופדיה...</p>}
        {plants?.map((plant) => (
          <div key={plant._id} className="p-4 mb-4 bg-stone-50 rounded-2xl border border-stone-200">
            <h3 className="font-bold text-emerald-900">{plant.type}</h3>
            <p className="text-sm text-stone-600">סוג: {plant.sub_type}</p>
            <p className="text-xs text-stone-400 mt-2">ערך משוער: {plant.estimated_value}₪</p>
          </div>
        ))}
      </div>
    </div>
  );
}
