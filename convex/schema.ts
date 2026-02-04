import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // AImagotchi virtual pets
  aimagotchis: defineTable({
    userId: v.id("users"),
    name: v.string(),
    personality: v.string(), // quirky, brave, lazy, curious, mischievous
    spriteIndex: v.number(), // 0-5 for different visual styles
    hunger: v.number(), // 0-100, dies at 0
    happiness: v.number(), // 0-100, affects drops
    energy: v.number(), // 0-100, needed for play
    coins: v.number(), // accumulated coins/bags
    lastFed: v.number(),
    lastPlayed: v.number(),
    lastEnergyRegen: v.number(),
    isAlive: v.boolean(),
    createdAt: v.number(),
    deathTime: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_alive", ["isAlive"])
    .index("by_coins", ["coins"]),

  // Coin pool from dead AImagotchis
  coinPool: defineTable({
    totalCoins: v.number(),
    lastDistribution: v.number(),
  }),

  // Activity log for the feed
  activities: defineTable({
    type: v.string(), // "created", "fed", "played", "died", "earned", "distributed"
    userId: v.id("users"),
    aimagotchiName: v.string(),
    message: v.string(),
    coinsInvolved: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_time", ["createdAt"]),

  // User stats
  userStats: defineTable({
    userId: v.id("users"),
    totalAimagotchisCreated: v.number(),
    totalCoinsEarned: v.number(),
    currentStreak: v.number(), // days in a row caring for pet
    longestStreak: v.number(),
  }).index("by_user", ["userId"]),
});
