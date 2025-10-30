import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const listInventory = query({
  args: {
    category: v.optional(v.string()),
    lowStock: v.optional(v.boolean()),
    expiringSoon: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let items;
    
    if (args.category) {
      items = await ctx.db
        .query("inventory")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      items = await ctx.db.query("inventory").collect();
    }
    
    if (args.lowStock) {
      items = items.filter(item => item.currentStock <= item.minThreshold);
    }
    
    if (args.expiringSoon) {
      const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
      items = items.filter(item => 
        item.expirationDate && item.expirationDate <= thirtyDaysFromNow
      );
    }
    
    return items;
  },
});

export const addInventoryItem = mutation({
  args: {
    itemName: v.string(),
    category: v.string(),
    currentStock: v.number(),
    minThreshold: v.number(),
    unitPrice: v.number(),
    supplier: v.optional(v.string()),
    expirationDate: v.optional(v.number()),
    batchNumber: v.optional(v.string()),
    storageRequirements: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inventory", {
      ...args,
      lastRestocked: Date.now(),
    });
  },
});

export const updateStock = mutation({
  args: {
    itemId: v.id("inventory"),
    quantityChange: v.number(),
    reason: v.string(),
    appointmentId: v.optional(v.id("appointments")),
    expirationDate: v.optional(v.number()),
    batchNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    
    const newStock = item.currentStock + args.quantityChange;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }
    
    const updateData: any = {
      currentStock: newStock,
    };
    
    // Update expiration date and batch number if restocking
    if (args.quantityChange > 0) {
      updateData.lastRestocked = Date.now();
      if (args.expirationDate) {
        updateData.expirationDate = args.expirationDate;
      }
      if (args.batchNumber) {
        updateData.batchNumber = args.batchNumber;
      }
    }
    
    await ctx.db.patch(args.itemId, updateData);
    
    // Record usage if it's a decrease
    if (args.quantityChange < 0) {
      await ctx.db.insert("inventoryUsage", {
        itemId: args.itemId,
        quantityUsed: Math.abs(args.quantityChange),
        usageDate: Date.now(),
        reason: args.reason,
        appointmentId: args.appointmentId,
      });
    }
  },
});

export const getExpiryAlerts = query({
  args: {},
  handler: async (ctx) => {
    const allItems = await ctx.db.query("inventory").collect();
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    
    const expired = allItems.filter(item => 
      item.expirationDate && item.expirationDate < now
    );
    
    const expiringSoon = allItems.filter(item => 
      item.expirationDate && 
      item.expirationDate >= now && 
      item.expirationDate <= sevenDaysFromNow
    );
    
    const expiringThisMonth = allItems.filter(item => 
      item.expirationDate && 
      item.expirationDate > sevenDaysFromNow && 
      item.expirationDate <= thirtyDaysFromNow
    );
    
    return {
      expired,
      expiringSoon,
      expiringThisMonth,
      totalAlerts: expired.length + expiringSoon.length + expiringThisMonth.length,
    };
  },
});

export const markAsExpired = mutation({
  args: {
    itemId: v.id("inventory"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    
    // Record the expired stock
    await ctx.db.insert("inventoryWaste", {
      itemId: args.itemId,
      itemName: item.itemName,
      quantityWasted: item.currentStock,
      reason: args.reason || "Expired",
      wasteDate: Date.now(),
      unitPrice: item.unitPrice,
      totalValue: item.currentStock * item.unitPrice,
      expirationDate: item.expirationDate,
      batchNumber: item.batchNumber,
    });
    
    // Set stock to 0
    await ctx.db.patch(args.itemId, {
      currentStock: 0,
    });
  },
});

export const getWasteReport = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const wasteRecords = await ctx.db
      .query("inventoryWaste")
      .filter((q) => q.gte(q.field("wasteDate"), cutoffDate))
      .collect();
    
    const totalValue = wasteRecords.reduce((sum, record) => sum + record.totalValue, 0);
    const totalQuantity = wasteRecords.reduce((sum, record) => sum + record.quantityWasted, 0);
    
    // Group by category
    const wasteByCategory = new Map<string, { quantity: number; value: number }>();
    
    for (const record of wasteRecords) {
      const item = await ctx.db.get(record.itemId);
      const category = item?.category || "unknown";
      
      const existing = wasteByCategory.get(category) || { quantity: 0, value: 0 };
      wasteByCategory.set(category, {
        quantity: existing.quantity + record.quantityWasted,
        value: existing.value + record.totalValue,
      });
    }
    
    return {
      records: wasteRecords,
      summary: {
        totalValue,
        totalQuantity,
        recordCount: wasteRecords.length,
        wasteByCategory: Object.fromEntries(wasteByCategory),
      },
    };
  },
});

export const getVaccineSchedule = query({
  args: {},
  handler: async (ctx) => {
    const vaccines = await ctx.db
      .query("inventory")
      .withIndex("by_category", (q) => q.eq("category", "vaccines"))
      .collect();
    
    const now = Date.now();
    const sixMonthsFromNow = now + (180 * 24 * 60 * 60 * 1000);
    
    return vaccines
      .filter(vaccine => vaccine.expirationDate)
      .map(vaccine => ({
        ...vaccine,
        daysUntilExpiry: vaccine.expirationDate ? 
          Math.ceil((vaccine.expirationDate - now) / (24 * 60 * 60 * 1000)) : null,
        isExpired: vaccine.expirationDate ? vaccine.expirationDate < now : false,
        isExpiringSoon: vaccine.expirationDate ? 
          vaccine.expirationDate <= (now + (30 * 24 * 60 * 60 * 1000)) : false,
      }))
      .sort((a, b) => (a.expirationDate || 0) - (b.expirationDate || 0));
  },
});

// Machine Learning Forecasting Functions (keeping existing ML code)
function calculateMovingAverage(data: number[], window: number): number {
  if (data.length === 0) return 0;
  const relevantData = data.slice(-window);
  return relevantData.reduce((sum, val) => sum + val, 0) / relevantData.length;
}

function calculateExponentialSmoothing(data: number[], alpha: number = 0.3): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];
  
  let smoothed = data[0];
  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i] + (1 - alpha) * smoothed;
  }
  return smoothed;
}

function calculateLinearTrend(data: number[]): { slope: number; intercept: number; r2: number } {
  if (data.length < 2) return { slope: 0, intercept: 0, r2: 0 };
  
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
  
  return { slope, intercept, r2 };
}

function detectSeasonality(data: number[], period: number = 7): { seasonal: boolean; pattern: number[] } {
  if (data.length < period * 2) return { seasonal: false, pattern: [] };
  
  const seasonalSums = new Array(period).fill(0);
  const seasonalCounts = new Array(period).fill(0);
  
  data.forEach((value, index) => {
    const seasonIndex = index % period;
    seasonalSums[seasonIndex] += value;
    seasonalCounts[seasonIndex]++;
  });
  
  const seasonalAverages = seasonalSums.map((sum, i) => 
    seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0
  );
  
  const overallAverage = data.reduce((a, b) => a + b, 0) / data.length;
  const seasonalVariance = seasonalAverages.reduce((sum, avg) => 
    sum + Math.pow(avg - overallAverage, 2), 0
  ) / period;
  
  const dataVariance = data.reduce((sum, val) => 
    sum + Math.pow(val - overallAverage, 2), 0
  ) / data.length;
  
  const seasonal = seasonalVariance > (dataVariance * 0.1);
  
  return { seasonal, pattern: seasonalAverages };
}

function calculateConfidenceInterval(predictions: number[], historicalErrors: number[]): { lower: number; upper: number } {
  if (historicalErrors.length === 0) return { lower: 0, upper: 0 };
  
  const meanError = historicalErrors.reduce((a, b) => a + b, 0) / historicalErrors.length;
  const stdError = Math.sqrt(
    historicalErrors.reduce((sum, error) => sum + Math.pow(error - meanError, 2), 0) / historicalErrors.length
  );
  
  const lastPrediction = predictions[predictions.length - 1] || 0;
  const margin = 1.96 * stdError; // 95% confidence interval
  
  return {
    lower: Math.max(0, lastPrediction - margin),
    upper: lastPrediction + margin
  };
}

export const getInventoryForecast = action({
  args: {
    itemId: v.id("inventory"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const days: number = args.days || 30;
    const item: any = await ctx.runQuery(api.inventory.getInventoryItem, {
      itemId: args.itemId,
    });
    
    if (!item) {
      throw new Error("Item not found");
    }
    
    const usage: any = await ctx.runQuery(api.inventory.getUsageHistory, {
      itemId: args.itemId,
      days: 60, // Look at last 60 days for better pattern detection
    });
    
    // Prepare daily usage data
    const dailyUsage = new Map<string, number>();
    usage.forEach((u: any) => {
      const date = new Date(u.usageDate).toISOString().split('T')[0];
      dailyUsage.set(date, (dailyUsage.get(date) || 0) + u.quantityUsed);
    });
    
    // Create time series array (fill missing days with 0)
    const timeSeries: number[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    for (let i = 0; i < 60; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      timeSeries.push(dailyUsage.get(dateStr) || 0);
    }
    
    // Apply machine learning algorithms
    const movingAvg7 = calculateMovingAverage(timeSeries, 7);
    const movingAvg14 = calculateMovingAverage(timeSeries, 14);
    const exponentialSmoothed = calculateExponentialSmoothing(timeSeries);
    const trendAnalysis = calculateLinearTrend(timeSeries);
    const seasonalAnalysis = detectSeasonality(timeSeries, 7);
    
    // Calculate prediction accuracy metrics
    const recentData = timeSeries.slice(-14);
    const predictions = recentData.map((_, i) => {
      const basePredict = exponentialSmoothed;
      const trendAdjust = trendAnalysis.slope * (timeSeries.length + i);
      return Math.max(0, basePredict + trendAdjust);
    });
    
    const errors = recentData.map((actual, i) => Math.abs(actual - (predictions[i] || 0)));
    const confidence = calculateConfidenceInterval(predictions, errors);
    
    // Generate forecast
    const dailyUsageRate = Math.max(movingAvg7, exponentialSmoothed);
    const adjustedDailyRate = seasonalAnalysis.seasonal ? 
      dailyUsageRate * 1.1 : dailyUsageRate; // Adjust for seasonality
    
    const daysUntilDepletion = adjustedDailyRate > 0 ? 
      Math.floor(item.currentStock / adjustedDailyRate) : Infinity;
    
    const depletionDate = daysUntilDepletion !== Infinity ? 
      new Date(Date.now() + daysUntilDepletion * 24 * 60 * 60 * 1000) : null;
    
    // Calculate recommended reorder quantity
    const leadTimeDays = 7; // Assume 7-day lead time
    const safetyStock = Math.ceil(adjustedDailyRate * 3); // 3 days safety stock
    const reorderQuantity = Math.ceil(adjustedDailyRate * (leadTimeDays + days)) + safetyStock;
    
    // Determine confidence level
    const confidenceLevel = trendAnalysis.r2 > 0.7 ? "High" : 
                           trendAnalysis.r2 > 0.4 ? "Medium" : "Low";
    
    // Generate insights
    const insights = [];
    if (seasonalAnalysis.seasonal) {
      insights.push("Seasonal usage pattern detected");
    }
    if (trendAnalysis.slope > 0.1) {
      insights.push("Increasing usage trend");
    } else if (trendAnalysis.slope < -0.1) {
      insights.push("Decreasing usage trend");
    }
    if (dailyUsageRate > movingAvg14 * 1.5) {
      insights.push("Recent spike in usage");
    }
    
    // Add expiry warning if applicable
    if (item.expirationDate) {
      const daysUntilExpiry = Math.ceil((item.expirationDate - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysUntilExpiry < daysUntilDepletion && daysUntilExpiry > 0) {
        insights.push(`Item expires in ${daysUntilExpiry} days (before depletion)`);
      }
    }
    
    return {
      item: item.itemName,
      currentStock: item.currentStock,
      expirationDate: item.expirationDate,
      forecast: {
        method: "Machine Learning (Moving Average + Exponential Smoothing + Trend Analysis)",
        dailyUsageRate: `${adjustedDailyRate.toFixed(2)} units/day`,
        depletionDate: depletionDate ? 
          `${depletionDate.toLocaleDateString()} (${daysUntilDepletion} days)` : 
          "Stock sufficient for forecast period",
        recommendedReorder: `${reorderQuantity} units`,
        confidence: `${confidenceLevel} (R² = ${trendAnalysis.r2.toFixed(3)})`,
        patterns: insights.join(", ") || "Stable usage pattern",
        confidenceInterval: `${confidence.lower.toFixed(1)} - ${confidence.upper.toFixed(1)} units/day`,
        seasonality: seasonalAnalysis.seasonal ? "Weekly pattern detected" : "No clear seasonal pattern",
        trendStrength: Math.abs(trendAnalysis.slope) > 0.1 ? "Strong" : "Weak",
        algorithms: {
          movingAverage7Days: movingAvg7.toFixed(2),
          movingAverage14Days: movingAvg14.toFixed(2),
          exponentialSmoothing: exponentialSmoothed.toFixed(2),
          trendSlope: trendAnalysis.slope.toFixed(4),
          seasonalFactor: seasonalAnalysis.seasonal ? "Applied" : "None"
        }
      },
      generatedAt: Date.now(),
    };
  },
});

export const getInventoryItem = query({
  args: { itemId: v.id("inventory") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.itemId);
  },
});

export const getUsageHistory = query({
  args: {
    itemId: v.id("inventory"),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.days * 24 * 60 * 60 * 1000);
    
    return await ctx.db
      .query("inventoryUsage")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .filter((q) => q.gte(q.field("usageDate"), cutoffDate))
      .collect();
  },
});

export const getLowStockAlerts = query({
  args: {},
  handler: async (ctx) => {
    const allItems = await ctx.db.query("inventory").collect();
    return allItems.filter(item => item.currentStock <= item.minThreshold);
  },
});
