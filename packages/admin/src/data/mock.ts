// Data types for admin dashboard

export interface User {
  id: string
  email: string
  name: string
  tier: "free" | "pro" | "unlimited"
  tokensUsed: number
  tokensLimit: number
  messagesCount: number
  status: "active" | "inactive" | "banned"
  createdAt: Date
  lastActiveAt: Date
}

export interface Transaction {
  id: string
  userId: string
  userEmail: string
  amount: number
  status: "succeeded" | "failed" | "pending"
  tier: "pro" | "unlimited"
  createdAt: Date
}

export interface DailyMetric {
  date: string
  value: number
}

// Tier configuration
export const tierConfig = {
  free: {
    name: "Free",
    price: 0,
    tokens: 250_000,
    color: "#71717a",
  },
  pro: {
    name: "Pro",
    price: 20,
    tokens: 2_000_000,
    color: "#6366f1",
  },
  unlimited: {
    name: "Unlimited",
    price: 200,
    tokens: 25_000_000,
    color: "#22c55e",
  },
}

// Empty data - will be populated from Supabase
export const users: User[] = []
export const transactions: Transaction[] = []
export const dailyUsage: DailyMetric[] = []
export const dailyRevenue: DailyMetric[] = []

// Stats calculation (returns zeros when no data)
export function getStats() {
  const freeUsers = users.filter(u => u.tier === "free").length
  const proUsers = users.filter(u => u.tier === "pro").length
  const unlimitedUsers = users.filter(u => u.tier === "unlimited").length
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === "active").length
  const totalTokens = users.reduce((sum, u) => sum + u.tokensUsed, 0)

  const mrr = (proUsers * tierConfig.pro.price) + (unlimitedUsers * tierConfig.unlimited.price)
  const arr = mrr * 12
  const estimatedCost = (totalTokens / 1_000_000) * 10

  return {
    freeUsers,
    proUsers,
    unlimitedUsers,
    totalUsers,
    activeUsers,
    totalTokens,
    mrr,
    arr,
    estimatedCost,
  }
}
