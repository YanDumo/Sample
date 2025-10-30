import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listAppointments = query({
  args: {
    date: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    let appointments;
    
    if (args.date) {
      const startOfDay = new Date(args.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(args.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_date", (q) => 
          q.gte("appointmentDate", startOfDay.getTime())
           .lte("appointmentDate", endOfDay.getTime())
        )
        .collect();
    } else {
      appointments = await ctx.db.query("appointments").collect();
    }

    // Filter by status if provided
    if (args.status) {
      appointments = appointments.filter(apt => apt.status === args.status);
    }

    // Filter based on user role
    if (userProfile.role === "user") {
      // Pet owners only see their own appointments
      appointments = appointments.filter(apt => apt.requestedBy === userId);
    }
    // Admins see all appointments

    // Get pet and owner details for each appointment
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const pet = await ctx.db.get(appointment.petId);
        const owner = pet ? await ctx.db.get(pet.ownerId) : null;
        return {
          ...appointment,
          pet,
          owner,
        };
      })
    );
    
    return appointmentsWithDetails.sort((a, b) => {
      if (a.appointmentDate !== b.appointmentDate) {
        return a.appointmentDate - b.appointmentDate;
      }
      return a.appointmentTime.localeCompare(b.appointmentTime);
    });
  },
});

export const createAppointment = mutation({
  args: {
    petId: v.id("pets"),
    appointmentDate: v.number(),
    appointmentTime: v.string(),
    service: v.string(),
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    veterinarian: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pet = await ctx.db.get(args.petId);
    if (!pet) throw new Error("Pet not found");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    // Check if user owns this pet (for regular users)
    if (userProfile.role === "user") {
      const owner = await ctx.db.get(pet.ownerId);
      if (!owner || owner.userId !== userId) {
        throw new Error("You can only book appointments for your own pets");
      }
    }

    return await ctx.db.insert("appointments", {
      petId: args.petId,
      appointmentDate: args.appointmentDate,
      appointmentTime: args.appointmentTime,
      service: args.service,
      reason: args.reason,
      status: userProfile.role === "admin" ? "confirmed" : "pending",
      notes: args.notes,
      veterinarian: args.veterinarian,
      requestedBy: userId,
    });
  },
});

export const updateAppointmentStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"), 
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("declined")
    ),
    notes: v.optional(v.string()),
    diagnosis: v.optional(v.string()),
    treatment: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) throw new Error("User profile not found");

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    // Check permissions
    if (userProfile.role === "user") {
      // Pet owners can only cancel their own appointments
      if (appointment.requestedBy !== userId) {
        throw new Error("You can only modify your own appointments");
      }
      if (args.status !== "cancelled") {
        throw new Error("Pet owners can only cancel appointments");
      }
    }

    const updateData: any = {
      status: args.status,
      handledBy: userId,
    };

    if (args.notes) updateData.notes = args.notes;
    if (args.diagnosis) updateData.diagnosis = args.diagnosis;
    if (args.treatment) updateData.treatment = args.treatment;
    if (args.followUpDate) updateData.followUpDate = args.followUpDate;

    await ctx.db.patch(args.appointmentId, updateData);
  },
});

export const getAvailableTimeSlots = query({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_date", (q) => 
        q.gte("appointmentDate", startOfDay.getTime())
         .lte("appointmentDate", endOfDay.getTime())
      )
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .filter((q) => q.neq(q.field("status"), "declined"))
      .collect();
    
    const bookedTimes = appointments.map(apt => apt.appointmentTime);
    
    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const allTimeSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return allTimeSlots.filter(time => !bookedTimes.includes(time));
  },
});

export const getPendingAppointments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Access denied");
    }

    const pendingAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const appointmentsWithDetails = await Promise.all(
      pendingAppointments.map(async (appointment) => {
        const pet = await ctx.db.get(appointment.petId);
        const owner = pet ? await ctx.db.get(pet.ownerId) : null;
        const requester = appointment.requestedBy ? 
          await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", appointment.requestedBy!))
            .unique() : null;
        
        return {
          ...appointment,
          pet,
          owner,
          requester,
        };
      })
    );

    return appointmentsWithDetails.sort((a, b) => a.appointmentDate - b.appointmentDate);
  },
});
