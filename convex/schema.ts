import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with roles
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")), // admin = vet/staff, user = pet owner
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
    specialization: v.optional(v.string()), // for vets
    licenseNumber: v.optional(v.string()), // for vets
  }).index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_email", ["email"]),

  owners: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
    userId: v.optional(v.id("users")), // Link to auth user
  }).index("by_email", ["email"])
    .index("by_user", ["userId"]),

  pets: defineTable({
    name: v.string(),
    species: v.string(),
    breed: v.optional(v.string()),
    age: v.number(),
    weight: v.optional(v.number()),
    ownerId: v.id("owners"),
    medicalNotes: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    currentMedications: v.optional(v.array(v.object({
      medication: v.string(),
      dosage: v.string(),
      frequency: v.string(),
      startDate: v.number(),
      endDate: v.optional(v.number()),
    }))),
    vaccinations: v.optional(v.array(v.object({
      vaccine: v.string(),
      dateGiven: v.number(),
      nextDue: v.optional(v.number()),
      veterinarian: v.string(),
    }))),
  }).index("by_owner", ["ownerId"]),

  appointments: defineTable({
    petId: v.id("pets"),
    appointmentDate: v.number(),
    appointmentTime: v.string(),
    service: v.string(),
    veterinarian: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"), 
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("declined")
    ),
    notes: v.optional(v.string()),
    requestedBy: v.optional(v.id("users")), // Pet owner who requested
    handledBy: v.optional(v.id("users")), // Admin who handled
    reason: v.optional(v.string()), // Reason for visit
    diagnosis: v.optional(v.string()), // Post-appointment diagnosis
    treatment: v.optional(v.string()), // Treatment provided
    followUpDate: v.optional(v.number()),
  }).index("by_date", ["appointmentDate"])
    .index("by_pet", ["petId"])
    .index("by_status", ["status"])
    .index("by_requested_by", ["requestedBy"]),

  inventory: defineTable({
    itemName: v.string(),
    category: v.string(),
    currentStock: v.number(),
    minThreshold: v.number(),
    unitPrice: v.number(),
    supplier: v.optional(v.string()),
    expirationDate: v.optional(v.number()),
    batchNumber: v.optional(v.string()),
    storageRequirements: v.optional(v.string()),
    lastRestocked: v.number(),
  }).index("by_category", ["category"])
    .index("by_expiration", ["expirationDate"])
    .index("by_batch", ["batchNumber"]),

  inventoryUsage: defineTable({
    itemId: v.id("inventory"),
    quantityUsed: v.number(),
    usageDate: v.number(),
    reason: v.string(),
    appointmentId: v.optional(v.id("appointments")),
  }).index("by_item", ["itemId"])
    .index("by_date", ["usageDate"])
    .index("by_appointment", ["appointmentId"]),

  inventoryWaste: defineTable({
    itemId: v.id("inventory"),
    itemName: v.string(),
    quantityWasted: v.number(),
    reason: v.string(),
    wasteDate: v.number(),
    unitPrice: v.number(),
    totalValue: v.number(),
    expirationDate: v.optional(v.number()),
    batchNumber: v.optional(v.string()),
  }).index("by_date", ["wasteDate"])
    .index("by_item", ["itemId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
