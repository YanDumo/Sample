import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listPets = query({
  args: {
    ownerId: v.optional(v.id("owners")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    let pets;

    if (userProfile.role === "admin") {
      // Admins can see all pets or filter by owner
      if (args.ownerId) {
        pets = await ctx.db
          .query("pets")
          .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId!))
          .collect();
      } else {
        pets = await ctx.db.query("pets").collect();
      }
    } else {
      // Pet owners only see their own pets
      const owner = await ctx.db
        .query("owners")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      if (!owner) throw new Error("Owner profile not found");

      pets = await ctx.db
        .query("pets")
        .withIndex("by_owner", (q) => q.eq("ownerId", owner._id))
        .collect();
    }

    // Get owner details for each pet
    const petsWithOwners = await Promise.all(
      pets.map(async (pet) => {
        const owner = await ctx.db.get(pet.ownerId);
        return { ...pet, owner };
      })
    );

    return petsWithOwners;
  },
});

export const createPet = mutation({
  args: {
    name: v.string(),
    species: v.string(),
    breed: v.optional(v.string()),
    age: v.number(),
    weight: v.optional(v.number()),
    medicalNotes: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    ownerId: v.optional(v.id("owners")), // Optional for admins
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    let ownerId = args.ownerId;

    // If user is a pet owner, use their owner record
    if (userProfile.role === "user") {
      const owner = await ctx.db
        .query("owners")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      if (!owner) throw new Error("Owner profile not found");
      ownerId = owner._id;
    } else if (!ownerId) {
      throw new Error("Owner ID is required for admin users");
    }

    return await ctx.db.insert("pets", {
      name: args.name,
      species: args.species,
      breed: args.breed,
      age: args.age,
      weight: args.weight,
      ownerId: ownerId!,
      medicalNotes: args.medicalNotes,
      allergies: args.allergies,
    });
  },
});

export const updatePet = mutation({
  args: {
    petId: v.id("pets"),
    name: v.optional(v.string()),
    species: v.optional(v.string()),
    breed: v.optional(v.string()),
    age: v.optional(v.number()),
    weight: v.optional(v.number()),
    medicalNotes: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    const pet = await ctx.db.get(args.petId);
    if (!pet) throw new Error("Pet not found");

    // Check permissions for pet owners
    if (userProfile.role === "user") {
      const owner = await ctx.db.get(pet.ownerId);
      if (!owner || owner.userId !== userId) {
        throw new Error("You can only update your own pets");
      }
    }

    const { petId, ...updateData } = args;
    await ctx.db.patch(petId, updateData);
  },
});

export const addVaccination = mutation({
  args: {
    petId: v.id("pets"),
    vaccine: v.string(),
    dateGiven: v.number(),
    nextDue: v.optional(v.number()),
    veterinarian: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Only veterinarians can add vaccinations");
    }

    const pet = await ctx.db.get(args.petId);
    if (!pet) throw new Error("Pet not found");

    const currentVaccinations = pet.vaccinations || [];
    const newVaccination = {
      vaccine: args.vaccine,
      dateGiven: args.dateGiven,
      nextDue: args.nextDue,
      veterinarian: args.veterinarian,
    };

    await ctx.db.patch(args.petId, {
      vaccinations: [...currentVaccinations, newVaccination],
    });
  },
});

export const addMedication = mutation({
  args: {
    petId: v.id("pets"),
    medication: v.string(),
    dosage: v.string(),
    frequency: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Only veterinarians can add medications");
    }

    const pet = await ctx.db.get(args.petId);
    if (!pet) throw new Error("Pet not found");

    const currentMedications = pet.currentMedications || [];
    const newMedication = {
      medication: args.medication,
      dosage: args.dosage,
      frequency: args.frequency,
      startDate: args.startDate,
      endDate: args.endDate,
    };

    await ctx.db.patch(args.petId, {
      currentMedications: [...currentMedications, newMedication],
    });
  },
});

export const getPetHistory = query({
  args: {
    petId: v.id("pets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    const pet = await ctx.db.get(args.petId);
    if (!pet) throw new Error("Pet not found");

    // Check permissions for pet owners
    if (userProfile.role === "user") {
      const owner = await ctx.db.get(pet.ownerId);
      if (!owner || owner.userId !== userId) {
        throw new Error("You can only view your own pets' history");
      }
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_pet", (q) => q.eq("petId", args.petId))
      .collect();

    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const handler = appointment.handledBy ? 
          await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", appointment.handledBy!))
            .unique() : null;
        
        return {
          ...appointment,
          handler,
        };
      })
    );

    return {
      pet: { ...pet, owner: await ctx.db.get(pet.ownerId) },
      appointments: appointmentsWithDetails.sort((a, b) => b.appointmentDate - a.appointmentDate),
    };
  },
});
