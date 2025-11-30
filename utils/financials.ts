
import { FinancialInputs, CalculationResult, YearlyData } from '../types';

export const calculateRetirement = (inputs: FinancialInputs): CalculationResult => {
  const {
    currentAge,
    targetRetirementAge,
    currentSavings,
    currentMonthlySavings,
    monthlySpending,
    expectedAnnualReturn,
    inflationRate,
  } = inputs;

  const yearsToRetire = targetRetirementAge - currentAge;

  // Basic validation
  if (yearsToRetire <= 0) {
    return {
      nestEggTarget: 0,
      projectedNestEgg: currentSavings,
      monthlyContributionRequired: 0,
      savingsGap: 0,
      yearsToRetire: 0,
      projection: [],
      isPossible: false,
    };
  }

  // 1. Calculate Standard Metrics (Goal Targets) for ResultsCard
  const annualSpending = monthlySpending * 12;
  
  // Implied Withdrawal Rate Benchmark (Standard 4% Rule) for the "Goal" display reference
  const BENCHMARK_WITHDRAWAL_RATE = 0.04; 
  const nestEggTarget = annualSpending / BENCHMARK_WITHDRAWAL_RATE;

  // Real Rate of Return = (Expected - Inflation)
  const realAnnualReturn = (expectedAnnualReturn - inflationRate) / 100;
  const monthlyRealRate = realAnnualReturn / 12;
  const totalMonthsToRetire = yearsToRetire * 12;

  // Calculate Required Monthly Contribution (PMT) for Goal
  const growthFactorToRetire = Math.pow(1 + monthlyRealRate, totalMonthsToRetire);
  const futureValueExisting = currentSavings * growthFactorToRetire;
  
  let monthlyContributionRequired = 0;
  if (monthlyRealRate === 0) {
      monthlyContributionRequired = (nestEggTarget - currentSavings) / totalMonthsToRetire;
  } else {
      const numerator = nestEggTarget - futureValueExisting;
      const denominator = (growthFactorToRetire - 1) / monthlyRealRate;
      monthlyContributionRequired = numerator / denominator;
  }
  monthlyContributionRequired = Math.max(0, monthlyContributionRequired);
  const savingsGap = monthlyContributionRequired - currentMonthlySavings;

  // 2. Generate Lifecycle Projection (Age Now -> 100) for Chart
  const projection: YearlyData[] = [];
  const maxAge = 100;
  
  let currentWealth = currentSavings;

  for (let age = currentAge; age <= maxAge; age++) {
    projection.push({
      age: age,
      savingsRequired: 0, // Deprecated for chart visual, set to 0
      savingsCurrent: Math.round(currentWealth), // This is the Main Wealth Line
      totalContributedRequired: 0,
      totalContributedCurrent: 0,
    });

    // Simulate 12 months for this year
    for (let m = 0; m < 12; m++) {
      // Apply Growth (Simple Monthly Compounding on Balance)
      const monthlyGrowth = currentWealth * monthlyRealRate;
      
      if (age < targetRetirementAge) {
        // Accumulation Phase: Add Savings
        currentWealth = currentWealth + monthlyGrowth + currentMonthlySavings;
      } else {
        // Decumulation Phase: Subtract Spending
        // Spending is in today's dollars, and our rate is Real Return, so we subtract directly.
        // Returns (monthlyGrowth) are still added here.
        currentWealth = currentWealth + monthlyGrowth - monthlySpending;
      }
    }
  }

  // Extract Projected Nest Egg at the specific Retirement Age for the ResultsCard summary
  const retirementYearData = projection.find(p => p.age === targetRetirementAge);
  const projectedNestEgg = retirementYearData ? retirementYearData.savingsCurrent : 0;

  return {
    nestEggTarget,
    projectedNestEgg,
    monthlyContributionRequired,
    savingsGap,
    yearsToRetire,
    projection,
    isPossible: monthlyContributionRequired < 2000000,
  };
};

export const formatCurrency = (amount: number, currency: string = 'HKD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
};
