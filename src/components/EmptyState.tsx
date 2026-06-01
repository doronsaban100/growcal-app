import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
}

export default function EmptyState({ icon, title, description, buttonText, buttonHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="bg-stone-50 p-6 rounded-full mb-4 text-4xl shadow-sm border border-stone-100">{icon}</div>
      <h2 className="text-xl font-bold text-stone-800">{title}</h2>
      <p className="text-stone-500 mt-2 mb-8 max-w-[250px] leading-relaxed">{description}</p>
      {buttonText && buttonHref && (
        <Link
          href={buttonHref}
          className="bg-emerald-800 text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-900 active:scale-95"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}