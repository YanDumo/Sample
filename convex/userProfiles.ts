import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const createUserProfile = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("user")),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
    specialization: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      ...args,
    });

    // If user role, also create owner record
    if (args.role === "user") {
      await ctx.db.insert("owners", {
        name: `${args.firstName} ${args.lastName}`,
        email: args.email,
        phone: args.phone,
        address: args.address,
        userId,
      });
    }

    return profileId;
  },
});

export const updateUserProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    specialization: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, args);

    // Update owner record if user role
    if (profile.role === "user") {
      const owner = await ctx.db
        .query("owners")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      if (owner && (args.firstName || args.lastName || args.phone || args.address)) {
        const updateData: any = {};
        if (args.firstName || args.lastName) {
          updateData.name = `${args.firstName || profile.firstName} ${args.lastName || profile.lastName}`;
        }
        if (args.phone) updateData.phone = args.phone;
        if (args.address) updateData.address = args.address;

        await ctx.db.patch(owner._id, updateData);
      }
    }
  },
});

export const getAllAdmins = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Access denied");
    }

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
  },
});
