import { Plant, PlantStatus } from "../types";

export function formatCurrency(value?: number) {
  return `₪${value ?? 0}`;
}

export function daysSince(timestamp: number) {
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
}

export function wateringTone(frequency?: number) {
  if (!frequency || frequency > 7) {
    return { backgroundColor: "#ecfdf5", borderColor: "#d1fae5", color: "#047857" };
  }
  if (frequency <= 3) {
    return { backgroundColor: "#fef2f2", borderColor: "#fee2e2", color: "#b91c1c" };
  }
  return { backgroundColor: "#fffbeb", borderColor: "#fef3c7", color: "#b45309" };
}

export function lightIcon(needs?: string) {
  if (!needs) return "◐";
  if (needs.includes("מלא")) return "☀";
  if (needs.includes("חצי") || needs.includes("חלקי") || needs.includes("לא ישיר")) return "◒";
  return "◐";
}

export function statusLabel(status: PlantStatus) {
  if (status === "personal" || status === "collection") return "באוסף";
  if (status === "auction") return "במכרז";
  return "למכירה";
}

export function marketPlants(plants: Plant[]) {
  return plants.filter((plant) => ["for-sale", "selling", "auction"].includes(plant.status));
}

export function getAverageNurseryPrice(type: string, size: string): number {
  const normalizedType = type.trim().toLowerCase();
  
  // Base prices for Medium (M) size
  let basePrice = 80; // default base price
  
  if (normalizedType.includes("סנסיוויריה") || normalizedType.includes("סנסווריה")) {
    basePrice = 90;
  } else if (normalizedType.includes("פילודנדרון")) {
    basePrice = 140;
  } else if (normalizedType.includes("פוטוס")) {
    basePrice = 45;
  } else if (normalizedType.includes("פיקוס")) {
    basePrice = 110;
  } else if (normalizedType.includes("מונסטרה")) {
    basePrice = 160;
  } else if (normalizedType.includes("זמיה") || normalizedType.includes("זאמיה")) {
    basePrice = 85;
  } else if (normalizedType.includes("אלוורה") || normalizedType.includes("אלוה")) {
    basePrice = 50;
  } else if (normalizedType.includes("קקטוס") || normalizedType.includes("סוקולנט")) {
    basePrice = 35;
  }
  
  // Size multipliers
  let multiplier = 1.0;
  switch (size.toUpperCase()) {
    case "S":
      multiplier = 0.5;
      break;
    case "M":
      multiplier = 1.0;
      break;
    case "L":
      multiplier = 1.7;
      break;
    case "XL":
      multiplier = 2.8;
      break;
    default:
      multiplier = 1.0;
  }
  
  return Math.round((basePrice * multiplier) / 5) * 5;
}
