export type PlantStatus = "personal" | "for-sale" | "auction" | "collection" | "selling";

export type Plant = {
  id: string;
  type: string;
  subType: string;
  status: PlantStatus;
  estimatedValue: number;
  currentPrice: number;
  location: string;
  imageUrl: string;
  sellerName: string;
  wateringDate: number;
  size: "S" | "M" | "L" | "XL";
  care: {
    lightNeeds: string;
    wateringFrequency: number;
    humidityLevel?: number;
    soilType?: string;
    careTips?: string[];
  };
  listingId?: string;
  auctionEndTime?: number;
};

export type TabKey = "market" | "shop" | "new" | "auctions" | "collection" | "profile";
