import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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

type PlantStatus = "personal" | "for-sale" | "auction" | "collection" | "selling";

export default function CollectionGrid({ 
  plants, 
  isEditable = false,
  onStatusChange,
}: { 
  plants: any[],
  isEditable?: boolean,
  onStatusChange?: (plantId: string, newStatus: PlantStatus) => void,
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPlantId, setUploadingPlantId] = useState<Id<"plants"> | null>(null);

  // Local copy so demo/mock data can be updated client-side
  const [localPlants, setLocalPlants] = useState<any[]>(plants || []);

  useEffect(() => {
    setLocalPlants(plants || []);
  }, [plants]);

  const generateUploadUrl = useMutation(api.plants.generateUploadUrl);
  const updateStatus = useMutation(api.plants.updateStatus);
  const updatePlant = useMutation(api.plants.updatePlant);
  const updateWateringDate = useMutation(api.plants.updateWateringDate);

  const handleWatered = async (plantId: Id<"plants">) => {
    const now = Date.now();

    // Optimistically update local state for UI
    setLocalPlants((prev) => prev.map((p) => (p._id === plantId ? { ...p, wateringDate: now, timeline: [...(p.timeline || []), { id: `watering-${now}`, type: 'watering', timestamp: now, note: 'הצמח הושקה 💧' }] } : p)));

    // Skip server mutations for mock/demo items
    if (typeof plantId === "string" && plantId.startsWith("mock")) {
      console.info("Skipping watering update for mock item", plantId);
      return;
    }

    try {
      await updateWateringDate({ 
        plantId, 
        wateringDate: now,
      });
    } catch (error) {
      console.error("Failed to update watering date:", error);
    }
  };

  const handleStatusChange = async (plantId: Id<"plants">, newStatus: PlantStatus) => {
    // Optimistic local update so UI reflects the change immediately
    setLocalPlants((prev) => prev.map((p) => (p._id === plantId ? { ...p, status: newStatus } : p)));

    // Notify parent (if provided) so it can move the plant between groups
    try {
      if (onStatusChange) onStatusChange(String(plantId), newStatus);
    } catch (e) {
      /* ignore */
    }

    // If this is a mock/demo item, don't call the server
    if (typeof plantId === "string" && plantId.startsWith("mock")) {
      console.info("Skipping status update for mock item", plantId, newStatus);
      return;
    }

    try {
      await updateStatus({ 
        plantId,
        status: newStatus as "personal" | "for-sale" | "auction",
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert local optimistic update on error
      setLocalPlants((prev) => prev.map((p) => (p._id === plantId ? { ...p, status: p.status } : p)));
    }
  };

  const handlePriceUpdate = async (plantId: Id<"plants">, value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    // Optimistic local update
    setLocalPlants((prev) => prev.map((p) => (p._id === plantId ? { ...p, current_price: numValue, estimated_value: numValue } : p)));

    // Skip server update for mock/demo items
    if (typeof plantId === "string" && plantId.startsWith("mock")) {
      console.info("Skipping price update for mock item", plantId, numValue);
      return;
    }

    try {
      await updatePlant({
        plantId,
        updates: { 
          current_price: numValue,
          estimated_value: numValue // נסנכרן גם את השווי המוערך
        }
      });
    } catch (error) {
      console.error("Failed to update price:", error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingPlantId) return;

    // Don't attempt to upload for mock/demo items
    if (typeof uploadingPlantId === "string" && uploadingPlantId.startsWith("mock")) {
      console.info("Skipping image upload for mock item", uploadingPlantId);
      setUploadingPlantId(null);
      return;
    }

    try {
      // 1. קבלת URL להעלאה
      const postUrl = await generateUploadUrl();

      // 2. העלאת התמונה לסטורג'
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // 3. עדכון הצמח עם ה-ID החדש (נחליף את התמונה הראשונה)
      await updatePlant({
        plantId: uploadingPlantId,
        updates: { imageIds: [storageId] }
      });
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setUploadingPlantId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 pb-20">
      {/* Hidden input for image picking */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />

      {localPlants.map((plant) => (
        <div
          key={plant._id}
          className="flex flex-col gap-3 bg-stone-50 border border-stone-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
        >
          <Link href={plant.listingId ? `/listing/${plant.listingId}` : "#"} className="flex items-center gap-4">
          <div className="relative group aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200">
            {plant.imageUrl ? (
              <Image src={plant.imageUrl} alt={plant.type} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-stone-400">🌱</div>
            )}
            
            {isEditable && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUploadingPlantId(plant._id);
                  fileInputRef.current?.click();
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploadingPlantId === plant._id ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-800 truncate">{plant.type}</h3>
            <p className="text-sm text-stone-500 truncate">{plant.sub_type}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                plant.status === 'personal' ? 'bg-stone-100 text-stone-600' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {plant.status === 'personal' ? 'באוסף' : plant.status === 'for-sale' ? 'למכירה' : 'במכרז'}
              </span>
              {isEditable ? (
                <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-lg px-2 py-0.5" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs font-bold text-emerald-800">₪</span>
                  <input 
                    type="number"
                    defaultValue={plant.current_price || plant.estimated_value}
                    onBlur={(e) => handlePriceUpdate(plant._id, e.target.value)}
                    className="w-16 text-xs font-black text-emerald-800 outline-none bg-transparent"
                  />
                </div>
              ) : (
                <span className="text-xs font-black text-emerald-800">₪{plant.estimated_value}</span>
              )}
            </div>
            {/* אינדיקטורים לטיפול */}
            <div className={`flex items-center gap-2 mt-2 px-2 py-0.5 rounded-lg border w-fit ${getWateringStyle(plant.defaultCareGuide?.wateringFrequency)}`}>
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
          <div className="text-stone-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </div>
          </Link>
          
          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
            <button
              onClick={() => handleWatered(plant._id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
              title="עדכן השקיה להיום"
            >
              <span className="text-sm">🚿</span>
              <span className="text-xs font-bold">השקיתי</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-400 font-bold uppercase">סטטוס:</span>
              <select 
                value={plant.status}
                onChange={(e) => handleStatusChange(plant._id, e.target.value as PlantStatus)}
                className="text-xs bg-white border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-600 font-medium text-stone-600"
              >
                <option value="personal">באוסף</option>
                <option value="for-sale">למכירה</option>
                <option value="auction">במכרז</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}