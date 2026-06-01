import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const insert = mutation({
  args: {
    type: v.string(),
    sub_type: v.string(),
    type_en: v.optional(v.string()), // Added English type
    sub_type_en: v.optional(v.string()), // Added English sub-type
    size: v.union(v.literal("S"), v.literal("M"), v.literal("L"), v.literal("XL")),
    status: v.union(v.literal("personal"), v.literal("for-sale"), v.literal("auction")),
    estimated_value: v.number(),
    imageIds: v.optional(v.array(v.id("_storage"))),
    // New fields for sorting and filtering
    location: v.optional(v.string()),
    price: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in to add a plant.");

    // שליפת המשתמש מהטבלה שלנו
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found in database");

    if (args.imageIds && args.imageIds.length > 3) {
      throw new Error("ניתן להעלות עד 3 תמונות בלבד.");
    }

    const now = Date.now();
    const plantId = await ctx.db.insert("plants", {
      owner_id: user._id,
      type: args.type,
      sub_type: args.sub_type,
      type_en: args.type_en, // Save English type
      sub_type_en: args.sub_type_en, // Save English sub-type
      size: args.size,
      estimated_value: args.estimated_value,
      current_price: args.estimated_value, // Initial current price is estimated value
      imageIds: args.imageIds,
      status: args.status,
      location: args.location,
      price: args.price,
      wateringDate: now,
      timeline: [
        {
          id: `creation-${now}`,
          type: "creation",
          timestamp: now,
          note: "הצמח נוסף לאוסף 🌱",
        },
        ...(args.imageIds?.map(id => ({
          id: `photo-${id}`,
          type: "photo" as const,
          timestamp: now,
          storageId: id,
        })) || [])
      ],
    });

    // חיפוש משתמשים שמעוניינים בצמח (גם בעברית וגם באנגלית)
    const wishlistQueries = [
      ctx.db.query("wishlist")
        .withIndex("by_type_location", (q) => q.eq("plant_type", args.type))
        .collect()
    ];

    if (args.type_en) {
      wishlistQueries.push(
        ctx.db.query("wishlist")
          .withIndex("by_type_location", (q) => q.eq("plant_type", args.type_en!))
          .collect()
      );
    }

    const results = await Promise.all(wishlistQueries);
    const allInterested = results.flat();
    const uniqueUsers = Array.from(new Map(allInterested.map(u => [u.user_id, u])).values());

    // סינון משתמשים לפי מיקום (אם הוגדר) ושליחת התראה
    for (const entry of uniqueUsers) {
      if (entry.user_id !== user._id) {
        if (!entry.preferred_location || entry.preferred_location === args.location) {
          await ctx.db.insert("notifications", {
            user_id: entry.user_id,
            message: `צמח מסוג ${args.type} שחיפשת עלה כרגע באזור ${args.location || "הקרוב אליך"}!`,
            is_read: false,
            created_at: Date.now(),
          });
        }
      }
    }

    return plantId;
  },
});

export const identifyPlant = action({
  args: { imageId: v.id("_storage") },
  handler: async (ctx, args) => {
    // בנקודה זו, היינו שולחים את התמונה ל-API חיצוני לזיהוי צמחים.
    // לדוגמה, Plant.id API.
    // נצטרך להשיג את ה-URL של התמונה מ-Convex Storage.
    const imageUrl = await ctx.storage.getUrl(args.imageId);

    if (!imageUrl) {
      throw new Error("Could not get image URL from storage.");
    }

    // סימולציה של קריאה ל-API חיצוני וקבלת תוצאות
    await new Promise(resolve => setTimeout(resolve, 2000)); // מדמה זמן תגובה של API

    // תוצאות זיהוי מדומות
    return {
      type: "מונסטרה",
      sub_type: "וריגטה",
      type_en: "Monstera",
      sub_type_en: "Variegata",
    };
  },
});

export const getPlantWithTimeline = query({
  args: { plantId: v.id("plants") },
  handler: async (ctx, args) => {
    const plant = await ctx.db.get(args.plantId);
    if (!plant) return null;

    const timelineWithUrls = plant.timeline ? await Promise.all(
      plant.timeline.map(async (event) => {
        const url = event.storageId ? await ctx.storage.getUrl(event.storageId) : null;
        return { ...event, imageUrl: url };
      })
    ) : [];

    return { ...plant, timeline: timelineWithUrls };
  },
});

export const getPlant = query({
  args: { plantId: v.id("plants") },
  handler: async (ctx, args) => {
    const plant = await ctx.db.get(args.plantId);
    if (!plant) return null;

    const imageUrls = plant.imageIds 
      ? await Promise.all(plant.imageIds.map(id => ctx.storage.getUrl(id)))
      : [];

    const careGuide = await ctx.db
      .query("careGuides")
      .withIndex("by_plantType", (q) => q.eq("plantType", plant.type))
      .unique();

    return {
      ...plant,
      imageUrls: imageUrls.filter((url): url is string => url !== null),
      defaultCareGuide: careGuide ?? undefined,
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const plants = await ctx.db.query("plants").collect();
    
    return await Promise.all(
      plants.map(async (plant) => {
        const imageUrl = plant.imageIds && plant.imageIds.length > 0
          ? await ctx.storage.getUrl(plant.imageIds[0]) 
          : null;
        
        return { ...plant, imageUrl };
      })
    );
  },
});

export const getMyPlants = query({
  args: { 
    status: v.optional(v.union(v.literal("personal"), v.literal("for-sale"), v.literal("auction"))) 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    let plants = await ctx.db
      .query("plants")
      .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
      .collect();

    // Apply status filter if provided
    if (args.status) {
      plants = plants.filter(p => p.status === args.status);
    }

    // העשרת הנתונים ב-URL של תמונה ובמזהה מודעה פעילה
    return await Promise.all(
      plants.map(async (plant) => {
        const imageUrl = plant.imageIds && plant.imageIds.length > 0
          ? await ctx.storage.getUrl(plant.imageIds[0]) 
          : null;

        // חיפוש מודעה פעילה עבור הצמח הזה
        const listing = await ctx.db
          .query("listings")
          .withIndex("by_plant", (q) => q.eq("plant_id", plant._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .unique();

        // שליפת מדריך הטיפול האופטימלי לפי סוג הצמח
        const careGuide = await ctx.db
          .query("careGuides")
          .withIndex("by_plantType", (q) => q.eq("plantType", plant.type))
          .unique();

        return {
          ...plant,
          imageUrl,
          listingId: listing?._id,
          defaultCareGuide: careGuide ?? undefined,
        };
      })
    );
  },
});

/**
 * Query for getting plants with sorting and filtering options
 * Performs server-side sorting to avoid client-side processing
 */
export const getMyPlantsSorted = query({
  args: {
    sortBy: v.optional(v.union(
      v.literal("price_asc"),
      v.literal("price_desc"),
      v.literal("watering_date"),
      v.literal("type")
    )),
    status: v.optional(v.union(v.literal("personal"), v.literal("for-sale"), v.literal("auction"))),
    filterType: v.optional(v.string()),
    filterLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    // Fetch all plants for the owner first
    let plants = await ctx.db
      .query("plants")
      .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
      .collect();

    // Apply filters
    if (args.status) {
      plants = plants.filter(p => p.status === args.status);
    }
    if (args.filterType) {
      plants = plants.filter(p => p.type === args.filterType);
    }
    if (args.filterLocation) {
      plants = plants.filter(p => p.location === args.filterLocation);
    }

    // Server-side sorting
    switch (args.sortBy) {
      case "price_asc":
        plants.sort((a, b) => (a.price ?? a.estimated_value) - (b.price ?? b.estimated_value));
        break;
      case "price_desc":
        plants.sort((a, b) => (b.price ?? b.estimated_value) - (a.price ?? a.estimated_value));
        break;
      case "watering_date":
        // Sort by watering date - plants that need watering soonest come first
        // Plants without watering date are treated as needing watering (oldest)
        const now = Date.now();
        plants.sort((a, b) => {
          const aWatering = a.wateringDate ?? 0;
          const bWatering = b.wateringDate ?? 0;
          return aWatering - bWatering;
        });
        break;
      case "type":
        plants.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }

    // Enrich with image URLs and listing IDs
    return await Promise.all(
      plants.map(async (plant) => {
        const imageUrl = plant.imageIds && plant.imageIds.length > 0
          ? await ctx.storage.getUrl(plant.imageIds[0]) 
          : null;

        const listing = await ctx.db
          .query("listings")
          .withIndex("by_plant", (q) => q.eq("plant_id", plant._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .unique();

        const careGuide = await ctx.db
          .query("careGuides")
          .withIndex("by_plantType", (q) => q.eq("plantType", plant.type))
          .unique();

        return {
          ...plant,
          imageUrl,
          listingId: listing?._id,
          defaultCareGuide: careGuide ?? undefined,
        };
      })
    );
  },
});

/**
 * עדכון פרטי צמח (עריכת פרמטרים)
 */
export const updatePlant = mutation({
  args: {
    plantId: v.id("plants"),
    updates: v.object({
      type: v.optional(v.string()),
      sub_type: v.optional(v.string()),
      estimated_value: v.optional(v.number()),
      current_price: v.optional(v.number()),
      location: v.optional(v.string()),
      imageIds: v.optional(v.array(v.id("_storage"))),
      isTimelinePublic: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plant = await ctx.db.get(args.plantId);
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!plant || !user || plant.owner_id !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.plantId, args.updates);
    return args.plantId;
  },
});

/**
 * Update plant status
 */
export const updateStatus = mutation({
  args: {
    plantId: v.id("plants"),
    status: v.union(v.literal("personal"), v.literal("for-sale"), v.literal("auction")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plant = await ctx.db.get(args.plantId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!plant || !user || plant.owner_id !== user._id) {
      throw new Error("Unauthorized");
    }

    // If moving to 'personal', we might want to cancel active listings in a real app logic
    // Here we just update the SSOT status
    await ctx.db.patch(args.plantId, {
      status: args.status,
    });
    
    return args.status;
  },
});
/**
 * Get unique plant types for filter dropdown
 */
export const getPlantTypes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    const plants = await ctx.db
      .query("plants")
      .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
      .collect();

    // Extract unique types
    const types = [...new Set(plants.map(p => p.type))];
    return types.sort();
  },
});

/**
 * שאילתה לשליפת צמחים למכירה (Shop)
 */
export const getForSalePlants = query({
  args: {},
  handler: async (ctx) => {
    const plants = await ctx.db
      .query("plants")
      .filter((q) => q.and(
        q.not(q.eq(q.field("type"), "אלוקסיה")),
        q.or(
          q.eq(q.field("status"), "for-sale"),
          q.eq(q.field("status"), "selling")
        )
      ))
      .collect();

    return await Promise.all(
      plants.map(async (plant) => {
        const imageUrl = plant.imageIds && plant.imageIds.length > 0
          ? await ctx.storage.getUrl(plant.imageIds[0]) 
          : null;
        
        const listing = await ctx.db
          .query("listings")
          .withIndex("by_plant", (q) => q.eq("plant_id", plant._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .unique();
          
        // שליפת מדריך הטיפול עבור האיקונים בשוק
        const careGuide = await ctx.db
          .query("careGuides")
          .withIndex("by_plantType", (q) => q.eq("plantType", plant.type))
          .unique();

        return { 
          ...plant, 
          imageUrl, 
          listingId: listing?._id,
          defaultCareGuide: careGuide ?? undefined 
        };
      })
    );
  },
});

/**
 * שאילתה לשליפת צמחים למכרז (Auctions)
 */
export const getAuctionPlants = query({
  args: {},
  handler: async (ctx) => {
    const plants = await ctx.db
      .query("plants")
      .filter((q) => q.eq(q.field("status"), "auction"))
      .collect();

    return await Promise.all(
      plants.map(async (plant) => {
        const imageUrl = plant.imageIds && plant.imageIds.length > 0
          ? await ctx.storage.getUrl(plant.imageIds[0]) 
          : null;

        // חיפוש המודעה הפעילה עבור המכרז הזה
        const listing = await ctx.db
          .query("listings")
          .withIndex("by_plant", (q) => q.eq("plant_id", plant._id))
          .filter((q) => q.and(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("type"), "auction")
          ))
          .unique();

        // שליפת מדריך הטיפול עבור האיקונים
        const careGuide = await ctx.db
          .query("careGuides")
          .withIndex("by_plantType", (q) => q.eq("plantType", plant.type))
          .unique();

        return { 
          ...plant, 
          imageUrl, 
          listingId: listing?._id,
          endTime: listing?.auction_end_time,
          defaultCareGuide: careGuide ?? undefined 
        };
      })
    );
  },
});

/**
 * שליפת כל הצמחים שהמוכר מציע למכירה או למכרז
 * משמש לתיאום קנייה של מספר צמחים בבת אחת ב-InterestModal
 */
export const getSellerPlantsForSale = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const plants = await ctx.db
      .query("plants")
      .withIndex("by_owner", (q) => q.eq("owner_id", args.sellerId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "for-sale"),
          q.eq(q.field("status"), "auction")
        )
      )
      .collect();

    return await Promise.all(
      plants.map(async (plant) => {
        const imageUrl = plant.imageIds && plant.imageIds.length > 0
          ? await ctx.storage.getUrl(plant.imageIds[0])
          : null;

        return {
          _id: plant._id,
          type: plant.type,
          sub_type: plant.sub_type,
          imageUrl,
          current_price: plant.current_price,
        };
      })
    );
  },
});

/**
 * שאילתה לשליפת הצמחים שהמשתמש הנוכחי מציע למכירה או למכרז (החנות שלי)
 */
export const getMyListingPlants = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    const plants = await ctx.db
      .query("plants")
      .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
      .filter((q) => 
        q.and(
          q.not(q.eq(q.field("type"), "אלוקסיה")),
          q.or(
            q.eq(q.field("status"), "for-sale"),
            q.eq(q.field("status"), "selling"),
            q.eq(q.field("status"), "auction")
          )
        )
      )
      .collect();

    return await Promise.all(
      plants.map(async (plant) => {
        const imageUrl = plant.imageIds && plant.imageIds.length > 0
          ? await ctx.storage.getUrl(plant.imageIds[0]) 
          : null;
        
        // חיפוש מודעה פעילה עבור הקישורים בשוק
        const listing = await ctx.db
          .query("listings")
          .withIndex("by_plant", (q) => q.eq("plant_id", plant._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .unique();
          
        // שליפת מדריך הטיפול האופטימלי לפי סוג הצמח
        const careGuide = await ctx.db
          .query("careGuides")
          .withIndex("by_plantType", (q) => q.eq("plantType", plant.type))
          .unique();

        return { ...plant, imageUrl, listingId: listing?._id, defaultCareGuide: careGuide ?? undefined };
      })
    );
  },
});

/**
 * Update watering date for a plant
 */
export const updateWateringDate = mutation({
  args: {
    plantId: v.id("plants"),
    wateringDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in to update watering date.");
    }

    const plant = await ctx.db.get(args.plantId);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!plant || !user || plant.owner_id !== user._id) {
      throw new Error("Plant not found or unauthorized.");
    }

    await ctx.db.patch(args.plantId, {
      wateringDate: args.wateringDate,
      timeline: [
        ...(plant.timeline || []),
        {
          id: `watering-${args.wateringDate}`,
          type: "watering",
          timestamp: args.wateringDate,
          note: "הצמח הושקה 💧",
        }
      ]
    });
  },
});

/**
 * הוספת תמונה חדשה לציר הזמן
 */
export const addTimelinePhoto = mutation({
  args: {
    plantId: v.id("plants"),
    storageId: v.id("_storage"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plant = await ctx.db.get(args.plantId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!plant || !user || plant.owner_id !== user._id) {
      throw new Error("Unauthorized or plant not found");
    }

    const newTimeline = [
      ...(plant.timeline || []),
      {
        id: `photo-${args.storageId}-${Date.now()}`,
        type: "photo" as const,
        timestamp: Date.now(),
        storageId: args.storageId,
        note: args.note,
      }
    ];

    // עדכון גם של ה-imageIds הראשי (נשמור את ה-3 האחרונות)
    const newImageIds = [args.storageId, ...(plant.imageIds || [])].slice(0, 3);

    await ctx.db.patch(args.plantId, {
      timeline: newTimeline,
      imageIds: newImageIds,
    });
  },
});

/**
 * הוספת אירוע טקסטואלי כללי לציר הזמן
 */
export const addTimelineNote = mutation({
  args: {
    plantId: v.id("plants"),
    note: v.string(),
    type: v.optional(v.union(v.literal("note"), v.literal("repotting"), v.literal("fertilizing"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plant = await ctx.db.get(args.plantId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!plant || !user || plant.owner_id !== user._id) {
      throw new Error("Unauthorized or plant not found");
    }

    const newTimeline = [
      ...(plant.timeline || []),
      {
        id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: args.type || "note",
        timestamp: Date.now(),
        note: args.note,
      }
    ];

    await ctx.db.patch(args.plantId, { timeline: newTimeline });
  },
});

/**
 * מחיקת אירוע מציר הזמן
 */
export const removeTimelineEvent = mutation({
  args: {
    plantId: v.id("plants"),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plant = await ctx.db.get(args.plantId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!plant || !user || plant.owner_id !== user._id || !plant.timeline) {
      throw new Error("Unauthorized or plant not found");
    }

    const eventToDelete = plant.timeline.find(e => e.id === args.eventId);
    const newTimeline = plant.timeline.filter(e => e.id !== args.eventId);
    
    // עדכון מובנה במקום שימוש ב-any
    const updates: { timeline: typeof newTimeline; imageIds?: Id<"_storage">[] } = { 
      timeline: newTimeline 
    };

    // אם זו הייתה תמונה, נסיר אותה גם מהגלריה הראשית במידה והיא שם
    if (eventToDelete?.storageId) {
      updates.imageIds = plant.imageIds?.filter(id => id !== eventToDelete.storageId);
    }

    await ctx.db.patch(args.plantId, updates);
  },
});

/**
 * ניהול Wish List
 */
export const addToWishlist = mutation({
  args: { plant_type: v.string(), preferred_location: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("wishlist", {
      user_id: user._id,
      plant_type: args.plant_type,
      preferred_location: args.preferred_location,
    });
  },
});

export const getWishlist = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("wishlist")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();
  },
});

export const removeFromWishlist = mutation({
  args: { id: v.id("wishlist") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    const wishlistEntry = await ctx.db.get(args.id);
    if (!wishlistEntry || !user || wishlistEntry.user_id !== user._id) {
      throw new Error("Unauthorized or item not found");
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * התראות
 */
export const getNotifications = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("user_id", user._id).eq("is_read", false))
      .collect();
  },
});

/**
 * פונקציית Seed להוספת נתונים ראשוניים למשתמש מחובר
 */
export const seedPlants = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const mockData = [
      {
        type: "מונסטרה",
        sub_type: "אלבו וריגטה",
        size: "L" as const,
        estimated_value: 1200,
        current_price: 1200,
        status: "personal" as const,
        wateringDate: Date.now(),
      },
      {
        type: "פילודנדרון",
        sub_type: "פינק פרינסס",
        size: "M" as const,
        estimated_value: 450,
        current_price: 450,
        status: "for-sale" as const,
        wateringDate: Date.now(),
      },
    ];

    for (const plant of mockData) {
      await ctx.db.insert("plants", {
        ...plant,
        owner_id: user._id,
      });
    }
  },
});

/**
 * Update plant care preferences for a specific plant
 */
export const updatePlantCarePreferences = mutation({
  args: {
    plantId: v.id("plants"),
    careData: v.object({
      lightNeeds: v.optional(v.string()),
      wateringFrequency: v.optional(v.number()),
      humidityLevel: v.optional(v.number()),
      soilType: v.optional(v.string()),
      careTips: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const plant = await ctx.db.get(args.plantId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!plant || !user || plant.owner_id !== user._id) {
      throw new Error("Unauthorized or plant not found");
    }

    await ctx.db.patch(args.plantId, {
      lightNeeds: args.careData.lightNeeds,
      wateringFrequency: args.careData.wateringFrequency,
      humidityLevel: args.careData.humidityLevel,
      soilType: args.careData.soilType,
      careTips: args.careData.careTips,
    });
  },
});
