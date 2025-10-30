import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listOwners = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("owners").collect();
  },
});

export const createOwner = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("owners", args);
  },
});

export const getOwnerByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("owners")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});
