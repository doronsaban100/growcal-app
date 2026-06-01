import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const get = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    
    if (!listing) {
      return null;
    }

    const plant = await ctx.db.get(listing.plant_id);
    
    if (!plant) {
      return { ...listing, plant: null };
    }

    // המרת imageIds ל-URLs נגישים
    const imageUrls = plant?.imageIds 
      ? await Promise.all(plant.imageIds.map(id => ctx.storage.getUrl(id)))
      : [];

    const imageUrl = imageUrls.length > 0 ? imageUrls[0] : null;

    // Get care guide if available
    const careGuide = await ctx.db
      .query("careGuides")
      .withIndex("by_plantType", (q) => q.eq("plantType", plant.type))
      .unique();

    return {
      ...listing,
      plant: { 
        ...plant, 
        imageUrl,
        imageUrls: imageUrls.filter((url): url is string => url !== null),
        defaultCareGuide: careGuide 
      },
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      // שימוש באינדקס החדש שהוספת ב-schema
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // נחזיר רשימה שכוללת את פרטי הצמח לכל listing
    return await Promise.all(
      listings.map(async (listing) => {
        const plant = await ctx.db.get(listing.plant_id);
        
        if (!plant) {
          return { ...listing, plant: null };
        }

        // המרת imageIds ל-URL נגיש
        const imageUrl = plant.imageIds && plant.imageIds.length > 0
          ? await ctx.storage.getUrl(plant.imageIds[0]) 
          : null;

        const careGuide = await ctx.db
          .query("careGuides")
          .withIndex("by_plantType", (q) => q.eq("plantType", plant.type))
          .unique();

        return {
          ...listing,
          plant: { ...plant, imageUrl, defaultCareGuide: careGuide ?? undefined },
        };
      })
    );
  },
});

export const addListing = mutation({
  args: { 
    plant_id: v.id("plants"),
    type: v.union(v.literal("fixed"), v.literal("auction")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("You must be signed in to add a listing.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User record not found.");

    const plant = await ctx.db.get(args.plant_id);

    if (!plant) throw new Error("Plant not found.");

    if (plant.owner_id !== user._id) {
      throw new Error("You can only list plants that belong to you.");
    }

    if (plant.status !== "personal") {
      throw new Error("Only plants in your collection can be listed for sale.");
    }

    const endTime = args.type === "auction" 
      ? Date.now() + (24 * 60 * 60 * 1000) // 24 שעות מהרגע הנוכחי
      : undefined;

    const listingId = await ctx.db.insert("listings", {
      plant_id: args.plant_id,
      seller_id: user._id,
      type: args.type,
      status: "active",
      auction_end_time: endTime,
    });

    await ctx.db.patch(args.plant_id, {
      status: args.type === "auction" ? "auction" : "for-sale",
    });

    // תזמון סגירת המכרז באופן אוטומטי
    if (args.type === "auction" && endTime) {
      await ctx.scheduler.runAt(endTime, internal.listings.closeAuction, { listingId });
    }

    return listingId;
  },
});

/**
 * מוטציה פנימית לסגירת מכרז ויצירת הזמנה
 */
export const closeAuction = internalMutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.status !== "active") return;

    // מציאת ההצעה הגבוהה ביותר
    const highestOffer = await ctx.db
      .query("offers")
      .withIndex("by_listing", (q) => q.eq("listing_id", args.listingId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc") // הגבוה ביותר לפי ה-timestamp (כי המחיר מעדכן את הצמח)
      .first();

    if (highestOffer) {
      // יש זוכה!
      await ctx.db.patch(args.listingId, { status: "completed" });
      await ctx.db.patch(highestOffer._id, { status: "accepted" });

      const plant = await ctx.db.get(listing.plant_id);

      // יצירת קוד אימות ייחודי (6 תווים) למפגש הפיזי
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // יצירת הזמנה
      await ctx.db.insert("orders", {
        listing_id: args.listingId,
        buyer_id: highestOffer.buyer_id,
        seller_id: listing.seller_id,
        final_amount: highestOffer.cash_amount ?? plant?.current_price ?? 0,
        escrow_status: "held",
        shipping_status: "pending",
        verification_code: verificationCode,
      });

      // עדכון הצמח - העברת בעלות או סטטוס נמכר
      await ctx.db.patch(listing.plant_id, {
        status: "selling", // מחכה לאישור משלוח
        // בגרסה מתקדמת נעביר את ה-owner_id רק בסיום ההזמנה
      });

      // התראות
      await ctx.db.insert("notifications", {
        user_id: highestOffer.buyer_id,
        message: `מזל טוב! זכית במכרז על הצמח.`,
        is_read: false,
        created_at: Date.now(),
      });

      await ctx.db.insert("notifications", {
        user_id: listing.seller_id,
        message: `המכרז שלך הסתיים בהצלחה! יש זוכה לצמח.`,
        is_read: false,
        created_at: Date.now(),
      });
    } else {
      // אין הצעות - המכרז מבוטל
      await ctx.db.patch(args.listingId, { status: "cancelled" });
      await ctx.db.patch(listing.plant_id, { status: "personal" });
      
      await ctx.db.insert("notifications", {
        user_id: listing.seller_id,
        message: `המכרז הסתיים ללא הצעות. הצמח הוחזר לאוסף האישי.`,
        is_read: false,
        created_at: Date.now(),
      });
    }
  },
});
