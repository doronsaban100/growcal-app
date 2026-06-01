"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

export default function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full bg-stone-100 flex items-center justify-center text-stone-400 rounded-3xl">
        🌱 אין תמונות
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full aspect-square overflow-hidden bg-stone-100 rounded-3xl shadow-sm border border-stone-100">
      <Image
        src={images[currentIndex]}
        alt={`${alt} - תמונה ${currentIndex + 1}`}
        fill
        className="object-cover transition-opacity duration-500"
        priority
      />

      {images.length > 1 && (
        <>
          {/* כפתורי ניווט */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); prevImage(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg text-stone-800 hover:bg-white active:scale-90 transition-all z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); nextImage(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg text-stone-800 hover:bg-white active:scale-90 transition-all z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 rotate-180">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* מחווני נקודות */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => { e.preventDefault(); setCurrentIndex(index); }}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex ? "bg-white w-4 shadow-sm" : "bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}