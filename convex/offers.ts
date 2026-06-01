import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createOffer = mutation({
  args: {
    listing_id: v.id("listings"),
    offer_type: v.union(v.literal("cash"), v.literal("trade")),
    cash_amount: v.optional(v.number()),
    // trade_plant_ids: v.optional(v.array(v.id("plants"))), // Not implemented in frontend yet
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in to place an offer.");

    // שליפת המשתמש הפנימי מהטבלה שלנו
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User record not found.");

    const listing = await ctx.db.get(args.listing_id);
    if (!listing) {
      throw new Error("Listing not found.");
    }

    if (listing.status !== "active") {
      throw new Error("This listing is not active.");
    }

    const plant = await ctx.db.get(listing.plant_id);
    if (!plant) {
      throw new Error("Plant associated with listing not found.");
    }

    // בדיקה שהקונה הוא לא המוכר
    if (listing.seller_id === user._id) {
      throw new Error("You cannot place an offer on your own listing.");
    }

    if (args.offer_type === "cash") {
      if (args.cash_amount === undefined || args.cash_amount <= (plant.current_price || 0)) {
        throw new Error("Cash offer must be higher than the current price.");
      }

      // Update the plant's current_price
      await ctx.db.patch(plant._id, {
        current_price: args.cash_amount,
      });
    }
    // else if (args.offer_type === "trade") {
    //   // Logic for trade offers
    // }

    const offerId = await ctx.db.insert("offers", {
      listing_id: args.listing_id,
      buyer_id: user._id,
      offer_type: args.offer_type,
      cash_amount: args.cash_amount,
      status: "pending",
    });

    return offerId;
  },
});