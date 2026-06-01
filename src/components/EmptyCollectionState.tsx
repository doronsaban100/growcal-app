import Link from "next/link";

export default function EmptyCollectionState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center">
      <div className="bg-stone-50 p-6 rounded-full mb-4 text-3xl">🌱</div>
      <h2 className="text-xl font-bold text-stone-800">האוסף שלך ריק</h2>
      <p className="text-stone-500 mt-2 mb-6">זה הזמן להוסיף את הצמח הראשון שלך!</p>
      <Link
        href="/new"
        className="bg-emerald-700 text-white px-8 py-3 rounded-full font-semibold shadow-md shadow-emerald-900/10 transition-all hover:bg-emerald-800 active:scale-95"
      >
        הוסף צמח ראשון לאוסף
      </Link>
    </div>
  );
}