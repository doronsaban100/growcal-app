"use client";

export default function SupportPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="p-6 border-b border-stone-100">
        <h1 className="text-2xl font-bold text-stone-800">תמיכה ושירות</h1>
      </header>

      <div className="flex-1 p-6">
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
          <h2 className="font-bold text-lg mb-4">איך נוכל לעזור?</h2>
          <p className="text-sm text-stone-600 mb-6">
            נתקלת בבעיה? יש לך שאלה על צמח מסוים או על תהליך המכירה? צוות המומחים שלנו כאן בשבילך.
          </p>
          
          <div className="space-y-4">
            <button className="w-full p-4 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 transition-colors">
              פתיחת פנייה חדשה
            </button>
            <button className="w-full p-4 bg-white border border-emerald-800 text-emerald-800 rounded-xl font-bold hover:bg-emerald-50 transition-colors">
              שאלות נפוצות (FAQ)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}