
export interface StockHolding {
  id: string;
  ticker: string;
  name: string; // Company Name
  quantity: number;
  entryPrice: number;
  currentPrice?: number;
  currency: string; // e.g., 'USD', 'HKD'
  exchangeRateToHKD: number; // Conversion rate to HKD
  fetchedAt?: string;
}

export interface FinancialInputs {
  currentAge: number;
  targetRetirementAge: number;
  currentSavings: number; // Total Sum
  // Asset Breakdown
  savingsCash: number;
  savingsStock: number;
  savingsBonds: number;
  savingsOther: number;
  
  // Stock Portfolio Detail
  stockHoldings: StockHolding[];

  currentMonthlySavings: number;
  monthlySpending: number;
  expectedAnnualReturn: number; // Percentage, e.g., 7 for 7%
  inflationRate: number; // Percentage, e.g., 2.5 for 2.5%
}

export interface YearlyData {
  age: number;
  savingsRequired: number; // The "Goal" path
  savingsCurrent: number; // The "Status Quo" path
  totalContributedRequired: number;
  totalContributedCurrent: number;
}

export interface CalculationResult {
  nestEggTarget: number;
  projectedNestEgg: number;
  monthlyContributionRequired: number;
  savingsGap: number; // Positive means need to save more, negative means surplus
  yearsToRetire: number;
  projection: YearlyData[];
  isPossible: boolean;
}

export enum AdviceStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface NewsItem {
  content: string;
  sources: { uri: string; title: string }[];
}
