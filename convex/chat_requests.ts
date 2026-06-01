import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * קונה מגיש בקשה לפתיחת צ'אט עם שאלות מובנות
 */
export const createRequest = mutation({
  args: {
    sellerId: v.id("users"),
    plantIds: v.array(v.id("plants")),
    inquiryTopics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const requestId = await ctx.db.insert("chat_requests", {
      buyer_id: user._id,
      seller_id: args.sellerId,
      plant_ids: args.plantIds,
      inquiry_topics: args.inquiryTopics,
      status: "pending",
    });

    // יצירת הודעת מערכת ראשונה עם השאלות
    const questionsText = "שלום! אני מתעניין בצמחים האלו. אשמח לדעת לגבי: " + 
      args.inquiryTopics.join(", ");
    
    await ctx.db.insert("messages", {
      chat_request_id: requestId,
      sender_id: user._id,
      text: questionsText,
    });

    return requestId;
  },
});

/**
 * המוכר מעדכן נקודת מפגש לתיאום
 */
export const proposeMeetingPoint = mutation({
  args: { requestId: v.id("chat_requests"), meetingPoint: v.string() },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    
    await ctx.db.patch(args.requestId, { 
      meeting_point: args.meetingPoint,
      status: "active" 
    });
  },
});

/**
 * הקונה מאשר את ההסכמה - הופך להזמנה ופותח חלון 72 שעות
 */
export const confirmAgreement = mutation({
  args: { requestId: v.id("chat_requests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || !request.meeting_point) throw new Error("Meeting point must be set");

    const now = Date.now();
    const expiresAt = now + (72 * 60 * 60 * 1000); // 72 שעות

    // חישוב סכום כולל (סימולציה לפי שווי מוערך של הצמחים)
    let totalAmount = 0;
    for (const pid of request.plant_ids) {
      const p = await ctx.db.get(pid);
      totalAmount += p?.current_price ?? 0;
    }

    // יצירת ההזמנה הסופית
    const orderId = await ctx.db.insert("orders", {
      buyer_id: request.buyer_id,
      seller_id: request.seller_id,
      plant_ids: request.plant_ids,
      final_amount: totalAmount,
      escrow_status: "held",
      shipping_status: "pending",
      meeting_point: request.meeting_point,
      expires_at: expiresAt,
      verification_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    await ctx.db.patch(args.requestId, { status: "converted" });

    return orderId;
  },
});

export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("chat_requests")
      .filter(q => q.or(q.eq(q.field("buyer_id"), user._id), q.eq(q.field("seller_id"), user._id)))
      .collect();
  }
});
