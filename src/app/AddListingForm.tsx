"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export default function AddListingForm() {
  const [plantId, setPlantId] = useState("");
  const addListing = useMutation(api.listings.addListing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantId) return;

    await addListing({
      plant_id: plantId as Id<"plants">,
      type: "fixed",
    });

    setPlantId("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mt-4"
    >
      <input
        className="w-full p-2 mb-2 rounded-lg border border-stone-200"
        placeholder="Plant ID"
        value={plantId}
        onChange={(e) => setPlantId(e.target.value)}
      />
      <button
        type="submit"
        className="w-full bg-emerald-800 text-white p-2 rounded-lg"
      >
        הוסף למכירה
      </button>
    </form>
  );
}
