import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

/**
 * פונקציית עזר לבדיקה אם המשתמש מחובר ושליפת הרשומה שלו מהטבלה שלנו.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated"); 
  }

  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}