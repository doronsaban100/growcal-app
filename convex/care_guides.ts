import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCareGuideByPlantType = query({
  args: { plantType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("careGuides")
      .withIndex("by_plantType", (q) => q.eq("plantType", args.plantType))
      .unique();
  },
});

export const seedCareGuides = mutation({
  args: {},
  handler: async (ctx) => {
    const guides = [
      {
        plantType: "מונסטרה",
        lightNeeds: "מפוזר",
        wateringFrequency: 7,
        humidityLevel: 60,
        soilType: "ארואידים",
        careTips: ["יש לנקות את העלים מאבק", "מומלץ להוסיף מוט טיפוס", "להימנע מהשקיית יתר"],
      },
      {
        plantType: "פילודנדרון",
        lightNeeds: "מפוזר",
        wateringFrequency: 10,
        humidityLevel: 50,
        soilType: "ארואידים",
        careTips: ["אוהב לחות גבוהה", "להימנע משמש ישירה"],
      },
      {
        plantType: "סנסיוויריה",
        lightNeeds: "צל",
        wateringFrequency: 21,
        humidityLevel: 30,
        soilType: "אדמה",
        careTips: ["עמיד מאוד", "להשקות רק כשהאדמה יבשה לחלוטין"],
      },
      {
        plantType: "קקטוס",
        lightNeeds: "ישיר",
        wateringFrequency: 30,
        humidityLevel: 10,
        soilType: "קקטוסים",
        careTips: ["הרבה אור שמש", "מעט מאוד מים"],
      },
      {
        plantType: "סחלב",
        lightNeeds: "מפוזר",
        wateringFrequency: 14,
        humidityLevel: 70,
        soilType: "אורכידים",
        careTips: ["השקיה בטבילה", "לשמור על זרימת אוויר"],
      },
    ];

    for (const guide of guides) {
      const existing = await ctx.db
        .query("careGuides")
        .withIndex("by_plantType", (q) => q.eq("plantType", guide.plantType))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, guide);
      } else {
        await ctx.db.insert("careGuides", guide);
      }
    }
  },
});