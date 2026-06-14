import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    reputation_score: v.number(),
    is_verified: v.boolean(),
    tax_classification: v.optional(v.string()),
    trading_ban_until: v.optional(v.number()),
    reward_points: v.number(),
    is_collection_public: v.optional(v.boolean()),
  }).index("by_clerkId", ["clerkId"]),

  plants: defineTable({
    owner_id: v.union(v.id("users"), v.string()), 
    type: v.string(),
    sub_type: v.string(),
    type_en: v.optional(v.string()), // New field for English type
    sub_type_en: v.optional(v.string()), // New field for English sub-type
    estimated_value: v.optional(v.number()),
    current_price: v.optional(v.number()),
    imageId: v.optional(v.string()), // הוספת תמיכה בשדה היחיד הקיים בנתוני הדמה
    imageIds: v.optional(v.array(v.id("_storage"))),
    size: v.union(v.literal("S"), v.literal("M"), v.literal("L"), v.literal("XL")),
    status: v.union(
      v.literal("personal"),
      v.literal("for-sale"),
      v.literal("auction"),
      v.literal("collection"),
      v.literal("selling")
    ),
    location: v.optional(v.string()), // חדר שינה/סלון/אמבטיה
    wateringDate: v.optional(v.number()), // Timestamp of last watering
    price: v.optional(v.number()), // Price for sorting
    lightNeeds: v.optional(v.string()),
    wateringFrequency: v.optional(v.number()),
    humidityLevel: v.optional(v.number()),
    careTips: v.optional(v.array(v.string())),
    soilType: v.optional(v.string()),
    timeline: v.optional(v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("creation"), 
        v.literal("photo"), 
        v.literal("care"), 
        v.literal("watering"), 
        v.literal("note"), 
        v.literal("repotting"), 
        v.literal("fertilizing")
      ),
      timestamp: v.number(),
      storageId: v.optional(v.id("_storage")),
      note: v.optional(v.string()),
    }))),
  }).index("by_owner", ["owner_id"])
    .index("by_status", ["status"]),

  listings: defineTable({
    plant_id: v.id("plants"),
    seller_id: v.id("users"),
    type: v.union(v.literal("fixed"), v.literal("auction")),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    auction_min_price: v.optional(v.number()),
    auction_end_time: v.optional(v.number()),
  }).index("by_status", ["status"])
    .index("by_plant", ["plant_id"]),

  careGuides: defineTable({
    plantType: v.string(),
    lightNeeds: v.string(),
    wateringFrequency: v.number(),
    humidityLevel: v.number(),
    soilType: v.string(),
    careTips: v.array(v.string()),
  }).index("by_plantType", ["plantType"]),

  offers: defineTable({
    listing_id: v.id("listings"),
    buyer_id: v.id("users"),
    offer_type: v.union(v.literal("cash"), v.literal("trade")),
    cash_amount: v.optional(v.number()),
    trade_plant_ids: v.optional(v.array(v.id("plants"))),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
  }).index("by_listing", ["listing_id"]),

  orders: defineTable({
    listing_id: v.optional(v.id("listings")),
    plant_ids: v.optional(v.array(v.id("plants"))),
    buyer_id: v.id("users"),
    seller_id: v.id("users"),
    final_amount: v.number(),
    escrow_status: v.union(
      v.literal("held"),
      v.literal("released_to_seller"),
      v.literal("refunded_to_buyer")
    ),
    shipping_status: v.union(
      v.literal("pending"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("disputed")
    ),
    verification_code: v.optional(v.string()),
    meeting_point: v.optional(v.string()),
    expires_at: v.optional(v.number()), // חלון 72 השעות
  }).index("by_buyer", ["buyer_id"])
    .index("by_seller", ["seller_id"]),

  chat_requests: defineTable({
    buyer_id: v.id("users"),
    seller_id: v.id("users"),
    plant_ids: v.array(v.id("plants")),
    inquiry_topics: v.array(v.string()), // תחומי עניין (תמונות, שעות וכו')
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("agreed"), v.literal("converted"), v.literal("cancelled")),
    meeting_point: v.optional(v.string()),
  }).index("by_buyer", ["buyer_id"])
    .index("by_seller", ["seller_id"]),

  messages: defineTable({
    order_id: v.optional(v.id("orders")),
    chat_request_id: v.optional(v.id("chat_requests")),
    sender_id: v.id("users"),
    text: v.string(),
  }).index("by_order", ["order_id"])
    .index("by_chat", ["chat_request_id"]),

  delivery_routes: defineTable({
    order_id: v.id("orders"),
    courier_id: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("assigned"),
      v.literal("picked_up"),
      v.literal("delivered")
    ),
    estimated_delivery: v.optional(v.number()),
  }),

  valuation_appeals: defineTable({
    reporter_id: v.string(),
    listing_id: v.id("listings"),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("resolved")),
  }),

  reports: defineTable({
    reporter_id: v.string(),
    reported_id: v.string(),
    listing_id: v.id("listings"),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("resolved")),
  }),

  wishlist: defineTable({
    user_id: v.id("users"),
    plant_type: v.string(),
    preferred_location: v.optional(v.string()),
  }).index("by_user", ["user_id"])
    .index("by_type_location", ["plant_type", "preferred_location"]),

  notifications: defineTable({
    user_id: v.id("users"),
    message: v.string(),
    is_read: v.boolean(),
    created_at: v.number(),
  }).index("by_user_unread", ["user_id", "is_read"]),

  ratings: defineTable({
    order_id: v.id("orders"),
    poster_id: v.id("users"), // מי שנותן את הדירוג
    target_id: v.id("users"), // מי שמקבל את הדירוג
    rating: v.number(),       // 1-5 כוכבים
    comment: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_target", ["target_id"])
    .index("by_order_poster", ["order_id", "poster_id"]),
});
