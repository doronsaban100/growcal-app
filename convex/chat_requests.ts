import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

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
    const user = await getAuthenticatedUser(ctx);

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
    const user = await getAuthenticatedUser(ctx);
    const request = await ctx.db.get(args.requestId);
    
    if (!request) throw new Error("Request not found");
    if (request.seller_id !== user._id) throw new Error("Only the seller can propose a meeting point");
    
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
    const user = await getAuthenticatedUser(ctx);
    const request = await ctx.db.get(args.requestId);

    if (!request || !request.meeting_point) throw new Error("Meeting point must be set");
    if (request.buyer_id !== user._id) throw new Error("Only the buyer can confirm the agreement");

    const now = Date.now();
    const expiresAt = now + (72 * 60 * 60 * 1000); // 72 שעות

    // חישוב סכום כולל במקביל לביצועים טובים יותר
    const plants = await Promise.all(
      request.plant_ids.map((pid) => ctx.db.get(pid))
    );
    const totalAmount = plants.reduce((sum, p) => sum + (p?.current_price ?? 0), 0);

    // יצירת קוד אימות מאובטח יותר (6 תווים אלפאנומריים)
    const verificationCode = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => (b % 36).toString(36))
      .join("").toUpperCase();

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
      verification_code: verificationCode,
    });

    await ctx.db.patch(args.requestId, { status: "converted" });

    // עדכון סטטוס הצמחים ל-'selling' (ממתינים למסירה/אימות)
    await Promise.all(
      request.plant_ids.map((pid) =>
        ctx.db.patch(pid, { status: "selling" })
      )
    );

    return orderId;
  },
});

export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // שימוש ב-getAuthenticatedUser רק אם אנחנו בטוחים שיש זהות
    const user = await getAuthenticatedUser(ctx);

    // שימוש באינדקסים לביצועים אופטימליים במקום .filter
    const [asBuyer, asSeller] = await Promise.all([
      ctx.db
        .query("chat_requests")
        .withIndex("by_buyer", (q) => q.eq("buyer_id", user._id))
        .collect(),
      ctx.db
        .query("chat_requests")
        .withIndex("by_seller", (q) => q.eq("seller_id", user._id))
        .collect(),
    ]);

    // איחוד תוצאות ומיון לפי זמן יצירה (מהחדש לישן)
    return [...asBuyer, ...asSeller].sort((a, b) => b._creationTime - a._creationTime);
  }
});
