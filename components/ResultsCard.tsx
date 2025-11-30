
import React from 'react';
import { CalculationResult } from '../types';
import { formatCurrency } from '../utils/financials';
import { Target, Wallet, Clock, ArrowRight, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface ResultsCardProps {
  result: CalculationResult;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({ result }) => {
  const isGapPositive = result.savingsGap > 0;
  const gapPercentage = result.monthlyContributionRequired > 0 
    ? (result.savingsGap / result.monthlyContributionRequired) * 100 
    : 0;

  return (
    <div className="bg-indigo-600 rounded-2xl shadow-xl p-6 text-white h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-300" />
          The Goal
        </h2>
        <p className="text-indigo-100 text-sm mb-6">Comparison of your current path vs. target.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-700/50 p-4 rounded-xl border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-2 text-indigo-200 text-sm">
              <Wallet className="w-4 h-4" />
              Target Nest Egg (Benchmark)
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {formatCurrency(result.nestEggTarget)}
            </div>
            <div className="flex justify-between items-end mt-2">
               <p className="text-xs text-indigo-300">Projected (Current Path)</p>
               <p className={`text-sm font-semibold ${result.projectedNestEgg >= result.nestEggTarget ? 'text-green-300' : 'text-orange-300'}`}>
                  {formatCurrency(result.projectedNestEgg)}
               </p>
            </div>
          </div>

          <div className="bg-white text-indigo-900 p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-indigo-600 text-sm font-medium">
              <ArrowRight className="w-4 h-4" />
              Required Monthly
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {formatCurrency(result.monthlyContributionRequired)}
            </div>
             <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100">
               <p className="text-xs text-gray-500">Shortfall / Surplus</p>
               <p className={`text-sm font-bold ${isGapPositive ? 'text-red-500' : 'text-green-600'}`}>
                  {isGapPositive ? '-' : '+'}{formatCurrency(Math.abs(result.savingsGap))}
               </p>
            </div>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className={`rounded-lg p-3 flex items-start gap-3 ${isGapPositive ? 'bg-orange-500/20 border border-orange-400/30' : 'bg-green-500/20 border border-green-400/30'}`}>
            {isGapPositive ? (
                <AlertTriangle className="w-5 h-5 text-orange-200 flex-shrink-0" />
            ) : (
                <CheckCircle className="w-5 h-5 text-green-200 flex-shrink-0" />
            )}
            <div>
                <p className="text-sm font-medium text-white">
                    {isGapPositive ? 'Action Required' : 'On Track'}
                </p>
                <p className="text-xs text-indigo-100 mt-0.5">
                    {isGapPositive 
                        ? `You are ${Math.round(gapPercentage)}% short of your monthly savings goal.` 
                        : 'Great job! You are saving enough to hit your target.'}
                </p>
            </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-indigo-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/40 p-2 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-indigo-200">Time Horizon</p>
            <p className="font-semibold">{result.yearsToRetire} Years</p>
          </div>
        </div>
        
        <div className="text-right">
           <p className="text-sm text-indigo-200">Real Return Rate</p>
           <p className="font-semibold text-sm">Inflation Adjusted</p>
        </div>
      </div>
    </div>
  );
};
