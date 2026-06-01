import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * שליפת כל ההזמנות של המשתמש הנוכחי (כקונה או כמוכר)
 */
export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    // שליפת הזמנות בהן המשתמש הוא הקונה
    const ordersAsBuyer = await ctx.db
      .query("orders")
      .withIndex("by_buyer", (q) => q.eq("buyer_id", user._id))
      .collect();

    // שליפת הזמנות בהן המשתמש הוא המוכר
    const ordersAsSeller = await ctx.db
      .query("orders")
      .withIndex("by_seller", (q) => q.eq("seller_id", user._id))
      .collect();

    const allOrders = [
      ...ordersAsBuyer.map(o => ({ ...o, role: "buyer" as const })),
      ...ordersAsSeller.map(o => ({ ...o, role: "seller" as const }))
    ];

    // העשרת הנתונים בפרטי הצמח ותמונות
    return await Promise.all(
      allOrders.map(async (order) => {
        const listing = order.listing_id ? await ctx.db.get(order.listing_id) : null;
        // תמיכה בהזמנה מרובת צמחים או צמח בודד מ-listing
        const firstPlantId = order.plant_ids?.[0] ?? listing?.plant_id;
        const plant = firstPlantId ? await ctx.db.get(firstPlantId) : null;
        const counterParty = await ctx.db.get(order.role === "buyer" ? order.seller_id : order.buyer_id);
        
        let imageUrl = null;
        if (plant?.imageIds && plant.imageIds.length > 0) {
          imageUrl = await ctx.storage.getUrl(plant.imageIds[0]);
        }

        return {
          ...order,
          plantType: plant?.type ?? "צמח לא ידוע",
          plantSubType: plant?.sub_type ?? "",
          imageUrl,
          counterPartyName: counterParty?.name ?? "משתמש GrowCal",
          plantCount: order.plant_ids?.length ?? 1,
          expiresAt: order.expires_at,
        };
      })
    );
  },
});

/**
 * עדכון סטטוס משלוח או תשלום של הזמנה
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    shipping_status: v.optional(v.union(
      v.literal("pending"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("disputed")
    )),
    escrow_status: v.optional(v.union(
      v.literal("held"),
      v.literal("released_to_seller"),
      v.literal("refunded_to_buyer")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User record not found");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // בדיקה שרק הקונה או המוכר הקשורים להזמנה יכולים לעדכן אותה
    if (order.buyer_id !== user._id && order.seller_id !== user._id) {
      throw new Error("Unauthorized to update this order");
    }

    await ctx.db.patch(args.orderId, {
      ...(args.shipping_status ? { shipping_status: args.shipping_status } : {}),
      ...(args.escrow_status ? { escrow_status: args.escrow_status } : {}),
    });

    return args.orderId;
  },
});

/**
 * אימות סופי של המפגש הפיזי ומסירת הצמח
 */
export const verifyPhysicalDelivery = mutation({
  args: {
    orderId: v.id("orders"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User record not found");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // רק הקונה יכול להזין את הקוד שהמוכר מראה לו
    if (order.buyer_id !== user._id) {
      throw new Error("Only the buyer can verify delivery");
    }

    // בדיקת תוקף 72 השעות
    if (order.expires_at && Date.now() > order.expires_at) {
      throw new Error("תוקף ההזמנה פג (עברו 72 שעות). יש לפתוח בקשה חדשה.");
    }

    if (order.verification_code !== args.code.toUpperCase()) {
      throw new Error("קוד אימות שגוי. נסה שוב.");
    }

    // עדכון סטטוסים - הצמח נמסר והכסף משוחרר למוכר
    // עדכון סטטוסים
    await ctx.db.patch(args.orderId, {
      shipping_status: "delivered",
      escrow_status: "released_to_seller",
    });

    // העברת בעלות על כל הצמחים שבהזמנה
    const listing = order.listing_id ? await ctx.db.get(order.listing_id) : null;
    const plantIds = order.plant_ids ?? (listing ? [listing.plant_id] : []);

    for (const plantId of plantIds as Id<"plants">[]) {
      await ctx.db.patch(plantId, {
        owner_id: order.buyer_id,
        status: "personal",
      });
    }

    return true;
  },
});

/**
 * עדכון נקודת המפגש להזמנה
 */
export const updateMeetingPoint = mutation({
  args: {
    orderId: v.id("orders"),
    meetingPoint: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User record not found");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // רק המוכר יכול לקבוע את נקודת המפגש
    if (order.seller_id !== user._id) {
      throw new Error("Only the seller can set the meeting point");
    }

    await ctx.db.patch(args.orderId, {
      meeting_point: args.meetingPoint,
    });
  },
});

/**
 * הגשת דירוג עבור הזמנה שהושלמה
 */
export const submitOrderRating = mutation({
  args: {
    orderId: v.id("orders"),
    rating: v.number(), // 1 עד 5
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.rating < 1 || args.rating > 5) throw new Error("דירוג חייב להיות בין 1 ל-5");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.shipping_status !== "delivered") throw new Error("ניתן לדרג רק הזמנות שהושלמו");

    // בדיקה מי המדרג ומי המדורג
    const isBuyer = order.buyer_id === user._id;
    const isSeller = order.seller_id === user._id;
    if (!isBuyer && !isSeller) throw new Error("Unauthorized to rate this order");

    const targetId = isBuyer ? order.seller_id : order.buyer_id;

    // בדיקה אם המשתמש כבר דירג את ההזמנה הזו
    const existingRating = await ctx.db
      .query("ratings")
      .withIndex("by_order_poster", (q) => q.eq("order_id", args.orderId).eq("poster_id", user._id))
      .unique();
    if (existingRating) throw new Error("כבר דירגת את העסקה הזו");

    // שמירת הדירוג
    await ctx.db.insert("ratings", {
      order_id: args.orderId,
      poster_id: user._id,
      target_id: targetId,
      rating: args.rating,
      comment: args.comment,
      created_at: Date.now(),
    });

    // עדכון המוניטין של משתמש היעד
    const targetUser = await ctx.db.get(targetId);
    if (targetUser) {
      // חישוב השפעה על המוניטין (למשל: 5 כוכבים = +10 נקודות, 1 כוכב = -20 נקודות)
      const scoreImpact = 
        args.rating === 5 ? 10 :
        args.rating === 4 ? 5 :
        args.rating === 2 ? -10 :
        args.rating === 1 ? -25 : 0;

      await ctx.db.patch(targetId, {
        reputation_score: Math.max(0, targetUser.reputation_score + scoreImpact),
      });
    }
  },
});

/**
 * שליפת הודעות עבור הזמנה ספציפית
 */
export const getMessages = query({
  args: { 
    orderId: v.optional(v.id("orders")),
    chatRequestId: v.optional(v.id("chat_requests"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    if (args.orderId) {
      const order = await ctx.db.get(args.orderId);
      if (!order || (order.buyer_id !== user._id && order.seller_id !== user._id)) return [];
      
      return await ctx.db
        .query("messages")
        .withIndex("by_order", (q) => q.eq("order_id", args.orderId))
        .collect();
    } else if (args.chatRequestId) {
      const request = await ctx.db.get(args.chatRequestId);
      if (!request || (request.buyer_id !== user._id && request.seller_id !== user._id)) return [];

      return await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chat_request_id", args.chatRequestId))
        .collect();
    }
    return [];
  },
});

/**
 * שליחת הודעה חדשה בהזמנה
 */
export const sendMessage = mutation({
  args: { 
    orderId: v.optional(v.id("orders")), 
    chatRequestId: v.optional(v.id("chat_requests")),
    text: v.string() 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    let recipientId: Id<"users">;
    let contextName = "";

    if (args.orderId) {
      const order = await ctx.db.get(args.orderId);
      if (!order || (order.buyer_id !== user._id && order.seller_id !== user._id)) throw new Error("Unauthorized");
      recipientId = order.buyer_id === user._id ? order.seller_id : order.buyer_id;
      contextName = `לגבי הזמנה ${order._id.substring(0, 4)}`;
    } else if (args.chatRequestId) {
      const request = await ctx.db.get(args.chatRequestId);
      if (!request || (request.buyer_id !== user._id && request.seller_id !== user._id)) throw new Error("Unauthorized");
      recipientId = request.buyer_id === user._id ? request.seller_id : request.buyer_id;
    } else {
      throw new Error("Must provide orderId or chatRequestId");
    }

    await ctx.db.insert("messages", {
      order_id: args.orderId,
      chat_request_id: args.chatRequestId,
      sender_id: user._id,
      text: args.text,
    });

    await ctx.db.insert("notifications", {
      user_id: recipientId,
      message: `הודעה חדשה ${contextName}`,
      is_read: false,
      created_at: Date.now(),
    });
  },
});