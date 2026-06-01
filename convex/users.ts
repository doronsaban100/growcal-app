import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * מוטציה לסנכרון המשתמש מ-Clerk למסד הנתונים שלנו.
 * הפונקציה בודקת אם המשתמש קיים לפי ה-clerkId, ואם לא - יוצרת אותו.
 */
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("לא נמצאה זהות משתמש מחוברת");
    }

    // חיפוש המשתמש לפי ה-subject (המזהה הייחודי של Clerk)
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user !== null) {
      // אם המשתמש קיים, נעדכן פרטים בסיסיים אם השתנו ב-Clerk
      if (user.name !== identity.name || user.email !== identity.email) {
        await ctx.db.patch(user._id, {
          name: identity.name ?? "משתמש GrowCal",
          email: identity.email ?? "",
        });
      }
      return user._id;
    }

    // יצירת רשומה חדשה למשתמש חדש
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name ?? "משתמש GrowCal",
      email: identity.email ?? "",
      reputation_score: 100,
      is_verified: false,
      reward_points: 0,
      is_collection_public: false,
    });
  },
});

/**
 * פונקציה לשליפת נתוני המשתמש המחובר הנוכחי מהטבלה שלנו
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// פונקציה ליצירת משתמש חדש במערכת (למשל אחרי הרשמה ב-Clerk)
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // בדיקה קצרה אם המשתמש כבר קיים כדי למנוע כפילויות
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) return existingUser._id;

    // הכנסת המשתמש החדש לטבלה עם ערכי ברירת מחדל
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      reputation_score: 100, // כל אספן מתחיל עם 100 נקודות מוניטין
      is_verified: false,
      reward_points: 0,
      is_collection_public: false,
    });
  },
});

// פונקציה לשליפת נתוני משתמש לפי ה-Clerk ID שלו
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// פונקציה לשליפת הגדרת פרטיות האוסף של המשתמש הנוכחי
export const getMyCollectionPrivacy = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false; // Default to private if not authenticated
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // Return false as default if user not found or field is not set
    return user?.is_collection_public ?? false;
  },
});

// פונקציה לעדכון הגדרת פרטיות האוסף
export const setCollectionPrivacy = mutation({
  args: { isPublic: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to change collection privacy.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found.");
    }

    // Update the user's collection privacy setting
    await ctx.db.patch(user._id, {
      is_collection_public: args.isPublic,
    });
  },
});
