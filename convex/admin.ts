import { mutation } from "./_generated/server";
import { internal } from "./_generated/api"; // ייבוא פונקציות פנימיות

/**
 * פונקציה לניקוי כל נתוני הדמה מהמערכת לפני תחילת עבודה אמיתית
 */
export const wipeAllData = mutation({
  args: {},
  handler: async (ctx) => { // שימוש ב-Action כדי לקרוא למשתני סביבה
    const identity = await ctx.auth.getUserIdentity();
    // אבטחה בסיסית - רק משתמש עם המייל שהוגדר במשתנה סביבה יוכל להריץ את זה
    // יש להגדיר משתנה סביבה CONVEX_ADMIN_EMAIL ב-Convex Dashboard
    if (!identity || identity.email !== process.env.CONVEX_ADMIN_EMAIL) {
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