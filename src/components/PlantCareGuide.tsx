"use client";

interface CareGuideProps {
  plant: {
    type: string;
    lightNeeds?: string;
    wateringFrequency?: number;
    humidityLevel?: number;
    soilType?: string;
    careTips?: string[];
    defaultCareGuide?: {
      lightNeeds: string;
      wateringFrequency: number;
      humidityLevel: number;
      soilType: string;
      careTips: string[];
    };
  };
}

export default function PlantCareGuide({ plant }: CareGuideProps) {
  const care = {
    light: plant.lightNeeds || plant.defaultCareGuide?.lightNeeds || "לא צוין",
    watering: plant.wateringFrequency || plant.defaultCareGuide?.wateringFrequency || "לא צוין",
    humidity: plant.humidityLevel || plant.defaultCareGuide?.humidityLevel || "לא צוין",
    soil: plant.soilType || plant.defaultCareGuide?.soilType || "לא צוין",
    tips: plant.careTips || plant.defaultCareGuide?.careTips || [],
  };

  return (
    <div className="mt-8 space-y-4 text-right" dir="rtl">
      <h2 className="text-lg font-semibold text-stone-800">מדריך טיפול אופטימלי</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3">
          <span className="text-xl">☀️</span>
          <div className="text-sm"><p className="text-stone-400 text-xs font-medium">תאורה</p><p className="font-semibold text-stone-800">{care.light}</p></div>
        </div>
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3">
          <span className="text-xl">💧</span>
          <div className="text-sm"><p className="text-stone-400 text-xs font-medium">השקיה</p><p className="font-semibold text-stone-800">כל {care.watering} ימים</p></div>
        </div>
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3">
          <span className="text-xl">💨</span>
          <div className="text-sm"><p className="text-stone-400 text-xs font-medium">לחות</p><p className="font-semibold text-stone-800">{care.humidity}%</p></div>
        </div>
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center gap-3">
          <span className="text-xl">🌱</span>
          <div className="text-sm"><p className="text-stone-400 text-xs font-medium">מצע</p><p className="font-semibold text-stone-800">{care.soil}</p></div>
        </div>
      </div>
      {care.tips.length > 0 && (
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
          <p className="text-xs text-stone-400 mb-2 font-medium">📝 טיפים לגידול מוצלח:</p>
          <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
            {care.tips.map((tip, idx) => <li key={idx} className="leading-relaxed">{tip}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}