export type PlanName = 'Free' | 'Starter' | 'Pro' | 'Business';

export interface PlanConfig {
  name: PlanName;
  price: number;
  monthlyTokens: number;
  dailyTokens: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  concurrentUsers: number;
  requestsPerMinute: number;
}

export const PLANS: Record<PlanName, PlanConfig> = {
  Free: {
    name: 'Free',
    price: 0,
    monthlyTokens: 10_000,
    dailyTokens: 1_000,
    maxInputTokens: 8_000,
    maxOutputTokens: 500,
    concurrentUsers: 1,
    requestsPerMinute: 10,
  },
  Starter: {
    name: 'Starter',
    price: 19,
    monthlyTokens: 100_000,
    dailyTokens: 5_000,
    maxInputTokens: 15_000,
    maxOutputTokens: 800,
    concurrentUsers: 1,
    requestsPerMinute: 20,
  },
  Pro: {
    name: 'Pro',
    price: 49,
    monthlyTokens: 500_000,
    dailyTokens: 20_000,
    maxInputTokens: 40_000,
    maxOutputTokens: 1_500,
    concurrentUsers: 3,
    requestsPerMinute: 30,
  },
  Business: {
    name: 'Business',
    price: 149,
    monthlyTokens: 1_000_000,
    dailyTokens: 50_000,
    maxInputTokens: 80_000,
    maxOutputTokens: 2_500,
    concurrentUsers: 10,
    requestsPerMinute: 60,
  },
};

export function getPlan(name: string): PlanConfig {
  return PLANS[name as PlanName] ?? PLANS.Free;
}
