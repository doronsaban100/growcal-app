import { mutation } from "./_generated/server";

/**
 * פונקציה לניקוי כל נתוני הדמה מהמערכת לפני תחילת עבודה אמיתית
 */
export const wipeAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    // אבטחה בסיסית - רק אתה תוכל להריץ את זה (לפי המייל שלך)
    if (!identity || identity.email !== "your-email@example.com") {
      // שנה את המייל למייל האמיתי שלך ב-Clerk כדי להריץ את זה
      throw new Error("Unauthorized admin action");
    }

    const tables = ["plants", "listings", "offers", "notifications", "wishlist"] as const;
    
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    return "כל הטבלאות נוקו בהצלחה. המערכת מוכנה לנתונים אמיתיים!";
  },
});