import React, { useState } from 'react';
import { FinancialInputs, CalculationResult, AdviceStatus } from '../types';
import { getFinancialAdvice } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface AiAdvisorProps {
  inputs: FinancialInputs;
  results: CalculationResult;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ inputs, results }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [status, setStatus] = useState<AdviceStatus>(AdviceStatus.IDLE);

  const handleGetAdvice = async () => {
    setStatus(AdviceStatus.LOADING);
    try {
      const adviceText = await getFinancialAdvice(inputs, results);
      setAdvice(adviceText);
      setStatus(AdviceStatus.SUCCESS);
    } catch (error) {
      setStatus(AdviceStatus.ERROR);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          AI Financial Coach
        </h3>
        {status === AdviceStatus.SUCCESS && (
          <button 
            onClick={handleGetAdvice}
            className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
        )}
      </div>

      {status === AdviceStatus.IDLE && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Want a personalized analysis of your numbers? I can help you understand if you're on track.
          </p>
          <button
            onClick={handleGetAdvice}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Analyze My Plan
          </button>
        </div>
      )}

      {status === AdviceStatus.LOADING && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-indigo-800 font-medium animate-pulse">Consulting the financial models...</p>
        </div>
      )}

      {status === AdviceStatus.ERROR && (
        <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Analysis Failed</p>
            <p className="text-sm mt-1">We couldn't reach the AI service right now. Please check your connection and try again.</p>
            <button 
                onClick={handleGetAdvice}
                className="mt-3 text-sm font-medium underline"
            >
                Try Again
            </button>
          </div>
        </div>
      )}

      {status === AdviceStatus.SUCCESS && advice && (
        <div className="prose prose-sm prose-indigo max-w-none bg-white/50 p-4 rounded-xl">
          <ReactMarkdown>{advice}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};