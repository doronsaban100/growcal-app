"use client";

import { FormEvent, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type PlantSize = "S" | "M" | "L" | "XL";

const sizeOptions: PlantSize[] = ["S", "M", "L", "XL"];

// רשימת יישובים לדוגמה (מומלץ להרחיב או למשוך מ-API חיצוני בעתיד)
const ISRAEL_CITIES = [
  "תל אביב - יפו", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע", 
  "חולון", "בני ברק", "רמת גן", "רחובות", "אשקלון", "בת ים", "בית שמש", "כפר סבא", "הרצליה", 
  "חדרה", "מודיעין-מכבים-רעות", "רעננה", "הוד השרון", "גבעתיים", "קריית גת", "נהריה", "עפולה", 
  "אילת", "נס ציונה", "כרמיאל", "יבנה", "טבריה", "קרית שמונה", "אור יהודה", "מעלה אדומים", 
  "צפת", "דימונה", "שדרות", "רמת השרון", "טייבה", "מודיעין עילית", "קריית אתא", "קריית מוצקין"
];

const statusOptions = [
  { value: "personal", label: "אוסף אישי" },
  { value: "for-sale", label: "מכירה" },
];

// הוצאת המיפוי החוצה כדי שיהיה נגיש לכל הפונקציות
const PLANT_MAPPING: Record<string, string> = {
  "מונסטרה": "Monstera", "monstera": "מונסטרה",
  "וריגטה": "Variegata", "variegata": "וריגטה",
  "אלבו": "Albo", "albo": "אלבו",
  "פילודנדרון": "Philodendron", "philodendron": "פילודנדרון",
  "פינק פרינסס": "Pink Princess", "pink princess": "פינק פרינסס",
  "סנסיוויריה": "Sansevieria", "sansevieria": "סנסיוויריה",
  "פוטוס": "Pothos", "pothos": "פוטוס"
};

export default function NewPlantPage() {
  const router = useRouter();
  const insertPlant = useMutation(api.plants.insert);
  const generateUploadUrl = useMutation(api.plants.generateUploadUrl);
  const identifyPlantAction = useAction(api.plants.identifyPlant); // שימוש ב-Action החדש
  const [isSaving, setIsSaving] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<{ file: File; preview: string; storageId?: Id<"_storage"> }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [plantData, setPlantData] = useState({
    type: "",
    sub_type: "",
    type_en: "", // New state for English type
    sub_type_en: "", // New state for English sub-type
    size: "S" as PlantSize,
    estimated_value: "",
    location: "", // New field: location
    status: "personal" as "personal" | "for-sale" | "auction",
    price: "", // New field: price
  });
  const [displayType, setDisplayType] = useState("");
  const [displaySubType, setDisplaySubType] = useState("");
  const [displayLocation, setDisplayLocation] = useState("");

  // סטייט לניהול רשימת ההצעות
  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([]);
  const [subTypeSuggestions, setSubTypeSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);

  const updatePlantData = (updates: Partial<typeof plantData>) => {
    setPlantData(prev => ({ ...prev, ...updates }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  // פונקציית תרגום והשלמה אוטומטית (סימולציה)
  const autoFillLanguage = (field: 'type' | 'sub_type', value: string) => {
    if (field === 'type') setDisplayType(value);
    else setDisplaySubType(value);

    if (!value) {
      if (field === 'type') updatePlantData({ type: "", type_en: "" });
      else updatePlantData({ sub_type: "", sub_type_en: "" });
      field === 'type' ? setTypeSuggestions([]) : setSubTypeSuggestions([]);
      return;
    }

    // סינון הצעות להצגה בחלונית
    const suggestions = Object.keys(PLANT_MAPPING).filter(k => 
      k.toLowerCase().startsWith(value.toLowerCase().trim())
    );
    field === 'type' ? setTypeSuggestions(suggestions) : setSubTypeSuggestions(suggestions);

    const hasHebrew = /[\u0590-\u05FF]/.test(value);
    const translation = PLANT_MAPPING[value.toLowerCase().trim()] || "";

    if (field === 'type') {
      if (hasHebrew) updatePlantData({ type: value, type_en: translation });
      else updatePlantData({ type_en: value, type: translation });
    } else {
      if (hasHebrew) updatePlantData({ sub_type: value, sub_type_en: translation });
      else updatePlantData({ sub_type_en: value, sub_type: translation });
    }
  };

  const handleLocationSearch = (value: string) => {
    setDisplayLocation(value);
    updatePlantData({ location: value });

    if (value.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const filtered = ISRAEL_CITIES.filter(city => city.includes(value)).slice(0, 5);
    setLocationSuggestions(filtered);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("GPS אינו נתמך בדפדפן זה.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=he`
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.settlement || data.address.city_district;
          
          if (city) {
            handleLocationSearch(city);
            setSuccess(`המיקום "${city}" זוהה בהצלחה!`);
            setTimeout(() => setSuccess(null), 4000); // העלמת ההודעה לאחר 4 שניות
          } else {
            setError("לא הצלחנו לזהות את שם העיר המדויקת.");
          }
        } catch (err) {
          setError("חלה שגיאה בזיהוי העיר.");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError("הגישה למיקום נדחתה. ודא שה-GPS מופעל.");
        setIsLocating(false);
      }
    );
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) return;

    if (images.length >= 3) {
      setError("ניתן להעלות עד 3 תמונות בלבד.");
      return;
    }

    // יצירת תצוגה מקדימה והוספה לרשימה
    const preview = URL.createObjectURL(file);
    const newImage = { file, preview };
    setImages(prev => [...prev, newImage]);
    
    // הפעלת זיהוי אוטומטי - שלב 1: העלאת התמונה ל-Convex Storage
    setIsIdentifying(true);
    
    try {
      // 1. קבלת URL להעלאה
      const postUrl = await generateUploadUrl();

      // 2. העלאת התמונה
      const uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResult.ok) {
        throw new Error("Image upload failed.");
      }

      const { storageId } = (await uploadResult.json()) as {
        storageId: Id<"_storage">;
      };

      // עדכון ה-storageId במערך עבור התמונה הספציפית
      setImages(prev => prev.map(img => img.file === file ? { ...img, storageId } : img));

      // 3. קריאה ל-Convex Action לזיהוי הצמח
      const identificationResult = await identifyPlantAction({ imageId: storageId });
      
      const identifiedType = identificationResult.type;
      const identifiedSubType = identificationResult.sub_type;

      updatePlantData({
        type: identifiedType,
        sub_type: identifiedSubType,
        type_en: identificationResult.type_en,
        sub_type_en: identificationResult.sub_type_en,
      });
      setDisplayType(identifiedType);
      setDisplaySubType(identifiedSubType);
      // במידה וה-AI מזהה גם מיקום בעתיד, אפשר לעדכן פה
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const item = images[index];
    if (item) URL.revokeObjectURL(item.preview);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // ולידציות בסיסיות לפני הכל
    if (!plantData.type.trim() && !plantData.type_en.trim()) {
      setError("יש להזין סוג צמח (עברית או אנגלית).");
      return;
    }

    const estimatedValue = Number(plantData.estimated_value);
    if (!Number.isFinite(estimatedValue) || estimatedValue <= 0) {
      setError("יש להזין שווי מוערך גדול מאפס.");
      return;
    }

    if (plantData.status !== "personal" && images.length === 0) {
      setError("יש להעלות לפחות תמונה אחת של הצמח כדי להמשיך.");
      return;
    }

    // בדיקה לאוסף אישי: הצגת התראת אישור אם אין תמונות
    if (plantData.status === "personal" && images.length === 0) {
      setShowConfirmModal(true);
      return;
    }

    await executeSave();
  };

  const executeSave = async () => {
    const estimatedValue = Number(plantData.estimated_value);
    // Validate price if provided
    const priceValue = plantData.price ? Number(plantData.price) : undefined;
    if (plantData.price && (!Number.isFinite(priceValue!) || priceValue! < 0)) {
      setError("מחיר חייב להיות מספר חיובי.");
      return;
    }

    setIsSaving(true);

    // הבטחת קיום ערכים עבור שדות החובה במידה ומולאה רק שפה אחת
    const rawType = plantData.type.trim();
    const rawTypeEn = plantData.type_en.trim();
    const finalType = rawType || rawTypeEn || "צמח חדש";
    const finalSubType = plantData.sub_type.trim() || plantData.sub_type_en.trim() || "כללי";
    const finalTypeEn = rawTypeEn || undefined;
    const finalSubTypeEn = plantData.sub_type_en.trim() || undefined;

    try {
      // איסוף כל ה-IDs שהועלו בהצלחה
      const imageIdsToSave = images.map(img => img.storageId).filter((id): id is Id<"_storage"> => !!id);

      await insertPlant({
        type: finalType,
        sub_type: finalSubType,
        type_en: finalTypeEn,
        sub_type_en: finalSubTypeEn,
        size: plantData.size,
        estimated_value: estimatedValue,
        status: plantData.status,
        imageIds: imageIdsToSave.length > 0 ? imageIdsToSave : undefined,
        location: plantData.location || undefined,
        price: priceValue,
      });

      router.push("/collection");
    } catch (saveError) {
      console.error("Failed to add plant:", saveError);
      setError("לא הצלחנו להוסיף את הצמח. ודא שאתה מחובר ונסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-6 border-b border-stone-100">
        <p className="text-xs font-medium text-emerald-700">PlantMates</p>
        <h1 className="text-2xl font-bold text-stone-800">הוספת צמח</h1>
        <p className="mt-1 text-sm text-stone-500">
          שמור צמח חדש באוסף האישי שלך.
        </p>
      </header>

      <form
        onSubmit={handleSave}
        className="flex-1 p-6 space-y-4"
      >
        <label className="block">
          <span className="mb-3 block text-sm font-bold text-stone-700">תמונה</span>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={images.length >= 3 || isIdentifying}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">📸</span>
              <span className="text-xs font-bold text-stone-600">צילום לייב</span>
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 3 || isIdentifying}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">🖼️</span>
              <span className="text-xs font-bold text-stone-600">מהאלבום</span>
            </button>
          </div>

          {/* Inputs חבויים לשליטה מלאה בחוויית המשתמש */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          />

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {images.map((img, index) => (
                <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                  <img src={img.preview} className="object-cover w-full h-full" alt={`תמונה ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {!img.storageId && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isIdentifying && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-emerald-600 animate-pulse font-bold">מזהה את הצמח ב-AI...</p>
            </div>
          )}
        </label>

        <div className="block relative">
          <span className="mb-2 block text-sm font-bold text-stone-700">
            סוג הצמח
          </span>
          <input
            required
            value={displayType}
            placeholder="הזן סוג בעברית או באנגלית..."
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-900 outline-none focus:border-emerald-700"
            onChange={(event) =>
              autoFillLanguage('type', event.target.value)
            }
            onBlur={() => setTimeout(() => setTypeSuggestions([]), 200)}
          />
          {typeSuggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-stone-100 rounded-xl shadow-xl overflow-hidden">
              {typeSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full text-right p-3 hover:bg-emerald-50 text-stone-800 text-sm border-b border-stone-50 last:border-0"
                  onClick={() => {
                    autoFillLanguage('type', suggestion);
                    setTypeSuggestions([]);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="block relative">
          <span className="mb-2 block text-sm font-bold text-stone-700">
            תת-סוג
          </span>
          <input
            value={displaySubType}
            placeholder="הזן תת-סוג בעברית או באנגלית..."
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-900 outline-none focus:border-emerald-700"
            onChange={(event) =>
              autoFillLanguage('sub_type', event.target.value)
            }
            onBlur={() => setTimeout(() => setSubTypeSuggestions([]), 200)}
          />
          {subTypeSuggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-stone-100 rounded-xl shadow-xl overflow-hidden">
              {subTypeSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full text-right p-3 hover:bg-emerald-50 text-stone-800 text-sm border-b border-stone-50 last:border-0"
                  onClick={() => {
                    autoFillLanguage('sub_type', suggestion);
                    setSubTypeSuggestions([]);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-stone-700">
            סטטוס הצמח
          </span>
          <select
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-900 outline-none focus:border-emerald-700"
            value={plantData.status}
            onChange={(event) =>
              updatePlantData({ status: event.target.value as any })
            }
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-stone-700">
            מידה
          </span>
          <select
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-900 outline-none focus:border-emerald-700"
            value={plantData.size}
            onChange={(event) =>
              updatePlantData({
                size: event.target.value as PlantSize,
              })
            }
          >
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-stone-700">
            שווי מוערך
          </span>
          <input
            required
            inputMode="numeric"
            min="1"
            type="number"
            value={plantData.estimated_value}
            placeholder="₪"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-900 outline-none focus:border-emerald-700"
            onChange={(event) =>
              updatePlantData({
                estimated_value: event.target.value,
              })
            }
          />
        </label>

        <div className="block relative">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-stone-700">
              עיר המגורים (עבור השוק)
            </span>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 hover:text-emerald-800 transition-colors disabled:opacity-50"
            >
              {isLocating ? (
                <div className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              )}
              זהה את המיקום שלי
            </button>
          </div>
          <input
            value={displayLocation}
            placeholder="הקלד שם עיר או יישוב..."
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-900 outline-none focus:border-emerald-700"
            onChange={(e) => handleLocationSearch(e.target.value)}
            onBlur={() => setTimeout(() => setLocationSuggestions([]), 200)}
          />
          {locationSuggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-stone-100 rounded-xl shadow-xl overflow-hidden">
              {locationSuggestions.map(city => (
                <button
                  key={city}
                  type="button"
                  className="w-full text-right p-3 hover:bg-emerald-50 text-stone-800 text-sm border-b border-stone-50 last:border-0"
                  onClick={() => {
                    handleLocationSearch(city);
                    setLocationSuggestions([]);
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-stone-700">
            מחיר (אופציונלי)
          </span>
          <input
            inputMode="numeric"
            min="0"
            type="number"
            value={plantData.price}
            placeholder="₪ (אופציונלי)"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-900 outline-none focus:border-emerald-700"
            onChange={(event) =>
              updatePlantData({
                price: event.target.value,
              })
            }
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="w-full rounded-2xl bg-emerald-800 py-4 font-bold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "שומר..." : "שמור לאוסף"}
        </button>
      </form>

      {/* מודאל אישור שמירה ללא תמונה */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" 
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative w-full max-w-xs bg-white rounded-[32px] p-6 shadow-2xl border border-stone-100 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="text-4xl mb-4 text-emerald-800">🌱</div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">לשמור ללא תמונה?</h3>
              <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                הוספת תמונה עוזרת לך לעקוב אחרי הצמיחה והטיפול בצורה טובה יותר. בטוח שברצונך להמשיך?
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setShowConfirmModal(false); executeSave(); }}
                className="w-full py-3 bg-emerald-800 text-white rounded-2xl font-bold hover:bg-emerald-900 transition-colors"
              >
                כן, שמור ללא תמונה
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 bg-stone-50 text-stone-600 rounded-2xl font-bold hover:bg-stone-100 transition-colors"
              >
                חזור להעלאת תמונה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
