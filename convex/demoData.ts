import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createDemoData = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has demo data
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!existingProfile) throw new Error("Profile not found");

    if (args.role === "user") {
      // Create demo owner record if it doesn't exist
      const existingOwner = await ctx.db
        .query("owners")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      if (!existingOwner) {
        const ownerId = await ctx.db.insert("owners", {
          name: "Demo Pet Owner",
          email: "demo.owner@petcare.com",
          phone: "(555) 987-6543",
          address: "456 Pet Owner Lane, Pet City, PC 12345",
          userId,
        });

        // Create demo pets
        const pet1Id = await ctx.db.insert("pets", {
          name: "Buddy",
          species: "dog",
          breed: "Golden Retriever",
          age: 3,
          weight: 65,
          ownerId,
          medicalNotes: "Friendly and energetic. No known health issues.",
          allergies: ["chicken", "wheat"],
          currentMedications: [{
            medication: "Heartgard Plus",
            dosage: "1 tablet",
            frequency: "Monthly",
            startDate: Date.now() - (30 * 24 * 60 * 60 * 1000),
            endDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
          }],
          vaccinations: [{
            vaccine: "DHPP",
            dateGiven: Date.now() - (180 * 24 * 60 * 60 * 1000),
            nextDue: Date.now() + (185 * 24 * 60 * 60 * 1000),
            veterinarian: "Dr. Smith",
          }, {
            vaccine: "Rabies",
            dateGiven: Date.now() - (200 * 24 * 60 * 60 * 1000),
            nextDue: Date.now() + (165 * 24 * 60 * 60 * 1000),
            veterinarian: "Dr. Smith",
          }],
        });

        const pet2Id = await ctx.db.insert("pets", {
          name: "Whiskers",
          species: "cat",
          breed: "Persian",
          age: 2,
          weight: 8,
          ownerId,
          medicalNotes: "Indoor cat, very calm temperament.",
          allergies: ["fish"],
          vaccinations: [{
            vaccine: "FVRCP",
            dateGiven: Date.now() - (150 * 24 * 60 * 60 * 1000),
            nextDue: Date.now() + (215 * 24 * 60 * 60 * 1000),
            veterinarian: "Dr. Johnson",
          }],
        });

        // Create demo appointments
        await ctx.db.insert("appointments", {
          petId: pet1Id,
          appointmentDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
          appointmentTime: "10:00",
          service: "General Checkup",
          reason: "Annual wellness exam",
          status: "confirmed",
          veterinarian: "Dr. Smith",
          requestedBy: userId,
        });

        await ctx.db.insert("appointments", {
          petId: pet2Id,
          appointmentDate: Date.now() - (30 * 24 * 60 * 60 * 1000),
          appointmentTime: "14:30",
          service: "Vaccination",
          reason: "FVRCP booster",
          status: "completed",
          veterinarian: "Dr. Johnson",
          requestedBy: userId,
          diagnosis: "Healthy cat, vaccination administered successfully",
          treatment: "FVRCP vaccine given",
        });
      }
    } else if (args.role === "admin") {
      // Create demo inventory items for admin
      const existingInventory = await ctx.db.query("inventory").first();
      
      if (!existingInventory) {
        // Add sample inventory items
        await ctx.db.insert("inventory", {
          itemName: "Amoxicillin 500mg",
          category: "medication",
          currentStock: 45,
          minThreshold: 20,
          unitPrice: 2.50,
          supplier: "VetMed Supply Co.",
          expirationDate: Date.now() + (180 * 24 * 60 * 60 * 1000),
          batchNumber: "AMX2024001",
          storageRequirements: "Store at room temperature",
          lastRestocked: Date.now() - (10 * 24 * 60 * 60 * 1000),
        });

        await ctx.db.insert("inventory", {
          itemName: "Rabies Vaccine",
          category: "vaccines",
          currentStock: 12,
          minThreshold: 5,
          unitPrice: 15.00,
          supplier: "BioVet Pharmaceuticals",
          expirationDate: Date.now() + (90 * 24 * 60 * 60 * 1000),
          batchNumber: "RAB2024003",
          storageRequirements: "Refrigerate 2-8°C",
          lastRestocked: Date.now() - (5 * 24 * 60 * 60 * 1000),
        });

        await ctx.db.insert("inventory", {
          itemName: "Surgical Gloves",
          category: "supplies",
          currentStock: 8,
          minThreshold: 15,
          unitPrice: 0.25,
          supplier: "MedSupply Direct",
          lastRestocked: Date.now() - (20 * 24 * 60 * 60 * 1000),
        });

        await ctx.db.insert("inventory", {
          itemName: "Premium Dog Food",
          category: "food",
          currentStock: 25,
          minThreshold: 10,
          unitPrice: 45.99,
          supplier: "Pet Nutrition Plus",
          expirationDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
          batchNumber: "PDF2024012",
          storageRequirements: "Store in cool, dry place",
          lastRestocked: Date.now() - (15 * 24 * 60 * 60 * 1000),
        });
      }
    }

    return null;
  },
});
