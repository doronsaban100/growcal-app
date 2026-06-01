"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/shop", label: "החנות שלי", icon: "🏪" },
  { href: "/collection", label: "האוסף שלי", icon: "🌿" },
  { href: "/auctions", label: "מכירה פומבית", icon: "🔨" },
  { href: "/", label: "שוק", icon: "🏛️" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  const isActive = (path: string) =>
    pathname === path;

  return (
    <nav className="w-full bg-stone-50/95 backdrop-blur-md border-t border-stone-200 h-22 grid grid-cols-6 items-center shrink-0 px-2 shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
      {/* User Box Area */}
      <div className="flex flex-col items-center justify-center gap-1 transition-all">
        {isLoaded && isSignedIn && <UserButton />}
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg shadow-inner"
              aria-label="התחברות"
            >
              👤
            </button>
          </SignInButton>
        )}
        <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-tighter">פרופיל</span>
      </div>

      {navItems.slice(0, 2).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            isActive(item.href) ? "scale-110" : "opacity-70 hover:opacity-100"
          }`}
        >
          <span className="text-2xl">
            {item.icon}
          </span>
          <span className={`text-[11px] whitespace-nowrap transition-colors ${
            isActive(item.href) ? "text-emerald-800 font-bold" : "text-stone-600 font-medium"
          }`}>
            {item.label}
          </span>
        </Link>
      ))}

      <Link href="/new" className="flex justify-center">
        <span className="grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-emerald-700 text-2xl font-bold text-white shadow-lg active:scale-90 transition-transform">
          +
        </span>
      </Link>

      {navItems.slice(2).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            isActive(item.href) ? "scale-110" : "opacity-70 hover:opacity-100"
          }`}
        >
          <span className="text-2xl">
            {item.icon}
          </span>
          <span className={`text-[11px] whitespace-nowrap transition-colors ${
            isActive(item.href) ? "text-emerald-800 font-bold" : "text-stone-600 font-medium"
          }`}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
