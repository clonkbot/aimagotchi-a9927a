import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const CREATION_COST = 100;
const FEED_COST = 10;
const PLAY_ENERGY_COST = 20;
const HUNGER_DECAY_RATE = 2; // per hour
const HAPPINESS_DECAY_RATE = 1.5; // per hour
const ENERGY_REGEN_RATE = 5; // per hour
const COIN_EARN_RATE = 5; // per hour when happy > 50

const personalities = ["quirky", "brave", "lazy", "curious", "mischievous"];

// Helper to calculate current stats based on time elapsed
function calculateCurrentStats(pet: {
  hunger: number;
  happiness: number;
  energy: number;
  coins: number;
  lastFed: number;
  lastPlayed: number;
  lastEnergyRegen: number;
  isAlive: boolean;
}) {
  if (!pet.isAlive) return { ...pet, isDying: false };

  const now = Date.now();
  const hoursSinceLastFed = (now - pet.lastFed) / (1000 * 60 * 60);
  const hoursSinceLastPlayed = (now - pet.lastPlayed) / (1000 * 60 * 60);
  const hoursSinceEnergyRegen = (now - pet.lastEnergyRegen) / (1000 * 60 * 60);

  let hunger = Math.max(0, pet.hunger - hoursSinceLastFed * HUNGER_DECAY_RATE);
  let happiness = Math.max(0, pet.happiness - hoursSinceLastPlayed * HAPPINESS_DECAY_RATE);
  let energy = Math.min(100, pet.energy + hoursSinceEnergyRegen * ENERGY_REGEN_RATE);

  // Earn coins if happy
  const coinsEarned = happiness > 50 ? Math.floor(hoursSinceLastFed * COIN_EARN_RATE) : 0;
  const coins = pet.coins + coinsEarned;

  const isDying = hunger <= 0;

  return { hunger, happiness, energy, coins, isDying };
}

export const getUserAimagotchi = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const pet = await ctx.db
      .query("aimagotchis")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!pet) return null;

    const stats = calculateCurrentStats(pet);
    return { ...pet, ...stats };
  },
});

export const create = mutation({
  args: { name: v.string(), spriteIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has a living pet
    const existingPet = await ctx.db
      .query("aimagotchis")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isAlive"), true))
      .first();

    if (existingPet) {
      throw new Error("You already have a living AImagotchi!");
    }

    const now = Date.now();
    const personality = personalities[Math.floor(Math.random() * personalities.length)];

    const petId = await ctx.db.insert("aimagotchis", {
      userId,
      name: args.name,
      personality,
      spriteIndex: args.spriteIndex % 6,
      hunger: 100,
      happiness: 100,
      energy: 100,
      coins: 50, // Starting coins
      lastFed: now,
      lastPlayed: now,
      lastEnergyRegen: now,
      isAlive: true,
      createdAt: now,
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "created",
      userId,
      aimagotchiName: args.name,
      message: `${args.name} was born into the world!`,
      createdAt: now,
    });

    // Update user stats
    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalAimagotchisCreated: stats.totalAimagotchisCreated + 1,
      });
    } else {
      await ctx.db.insert("userStats", {
        userId,
        totalAimagotchisCreated: 1,
        totalCoinsEarned: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
    }

    return petId;
  },
});

export const feed = mutation({
  args: { petId: v.id("aimagotchis") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pet = await ctx.db.get(args.petId);
    if (!pet || pet.userId !== userId) throw new Error("Pet not found");
    if (!pet.isAlive) throw new Error("This AImagotchi has passed away");

    const stats = calculateCurrentStats(pet);
    if (stats.coins < FEED_COST) throw new Error("Not enough coins to feed");

    const now = Date.now();
    await ctx.db.patch(args.petId, {
      hunger: Math.min(100, stats.hunger + 30),
      coins: stats.coins - FEED_COST,
      lastFed: now,
      lastEnergyRegen: now,
      energy: stats.energy,
      happiness: stats.happiness,
    });

    await ctx.db.insert("activities", {
      type: "fed",
      userId,
      aimagotchiName: pet.name,
      message: `${pet.name} enjoyed a delicious meal!`,
      coinsInvolved: FEED_COST,
      createdAt: now,
    });
  },
});

export const play = mutation({
  args: { petId: v.id("aimagotchis") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pet = await ctx.db.get(args.petId);
    if (!pet || pet.userId !== userId) throw new Error("Pet not found");
    if (!pet.isAlive) throw new Error("This AImagotchi has passed away");

    const stats = calculateCurrentStats(pet);
    if (stats.energy < PLAY_ENERGY_COST) throw new Error("Not enough energy to play");

    const now = Date.now();
    const coinsEarned = Math.floor(Math.random() * 10) + 5;

    await ctx.db.patch(args.petId, {
      happiness: Math.min(100, stats.happiness + 25),
      energy: stats.energy - PLAY_ENERGY_COST,
      coins: stats.coins + coinsEarned,
      lastPlayed: now,
      lastEnergyRegen: now,
      hunger: stats.hunger,
      lastFed: pet.lastFed,
    });

    await ctx.db.insert("activities", {
      type: "played",
      userId,
      aimagotchiName: pet.name,
      message: `${pet.name} had a blast playing and earned ${coinsEarned} coins!`,
      coinsInvolved: coinsEarned,
      createdAt: now,
    });
  },
});

export const checkAndProcessDeath = mutation({
  args: { petId: v.id("aimagotchis") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pet = await ctx.db.get(args.petId);
    if (!pet || !pet.isAlive) return false;

    const stats = calculateCurrentStats(pet);
    if (!stats.isDying) return false;

    const now = Date.now();

    // Pet dies - coins go to the pool
    await ctx.db.patch(args.petId, {
      isAlive: false,
      deathTime: now,
      hunger: 0,
      happiness: 0,
      coins: 0,
    });

    // Add coins to pool
    const pool = await ctx.db.query("coinPool").first();
    if (pool) {
      await ctx.db.patch(pool._id, {
        totalCoins: pool.totalCoins + stats.coins,
      });
    } else {
      await ctx.db.insert("coinPool", {
        totalCoins: stats.coins,
        lastDistribution: now,
      });
    }

    await ctx.db.insert("activities", {
      type: "died",
      userId,
      aimagotchiName: pet.name,
      message: `${pet.name} passed away from neglect. ${stats.coins} coins returned to the pool.`,
      coinsInvolved: stats.coins,
      createdAt: now,
    });

    return true;
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const pets = await ctx.db
      .query("aimagotchis")
      .withIndex("by_alive")
      .filter((q) => q.eq(q.field("isAlive"), true))
      .collect();

    // Calculate current coins for each pet
    const petsWithStats = pets.map((pet) => ({
      ...pet,
      ...calculateCurrentStats(pet),
    }));

    // Sort by coins
    return petsWithStats
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 10);
  },
});

export const getCoinPool = query({
  args: {},
  handler: async (ctx) => {
    const pool = await ctx.db.query("coinPool").first();
    return pool?.totalCoins ?? 0;
  },
});

export const getRecentActivities = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_time")
      .order("desc")
      .take(20);
  },
});

export const claimFromPool = mutation({
  args: { petId: v.id("aimagotchis") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pet = await ctx.db.get(args.petId);
    if (!pet || pet.userId !== userId) throw new Error("Pet not found");
    if (!pet.isAlive) throw new Error("Dead pets can't claim");

    const stats = calculateCurrentStats(pet);
    if (stats.happiness < 80) throw new Error("Your AImagotchi needs to be very happy (80+) to claim from the pool!");

    const pool = await ctx.db.query("coinPool").first();
    if (!pool || pool.totalCoins < 10) throw new Error("Not enough coins in the pool");

    const claimAmount = Math.min(Math.floor(pool.totalCoins * 0.1), 50); // Claim 10% up to 50
    const now = Date.now();

    await ctx.db.patch(pool._id, {
      totalCoins: pool.totalCoins - claimAmount,
      lastDistribution: now,
    });

    await ctx.db.patch(args.petId, {
      coins: stats.coins + claimAmount,
      hunger: stats.hunger,
      happiness: stats.happiness,
      energy: stats.energy,
      lastFed: pet.lastFed,
      lastPlayed: pet.lastPlayed,
      lastEnergyRegen: now,
    });

    await ctx.db.insert("activities", {
      type: "distributed",
      userId,
      aimagotchiName: pet.name,
      message: `${pet.name} claimed ${claimAmount} coins from the pool!`,
      coinsInvolved: claimAmount,
      createdAt: now,
    });

    return claimAmount;
  },
});
