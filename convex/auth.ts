import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * פונקציית עזר לבדיקה אם המשתמש מחובר ושליפת הרשומה שלו מהטבלה שלנו.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated"); 
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User record not found in database");
  }

  return user;
}