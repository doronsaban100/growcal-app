import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlantMates",
    short_name: "PlantMates",
    description: "ניהול אוסף צמחים אישי, מכירה וקנייה בקהילה.",
    start_url: "/collection",
    scope: "/",
    display: "standalone",
    background_color: "#f5f5f4",
    theme_color: "#065f46",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
