
import React, { useState, useMemo, useEffect } from 'react';
import { FinancialInputs } from './types';
import { calculateRetirement } from './utils/financials';
import { InputCard } from './components/InputCard';
import { ResultsCard } from './components/ResultsCard';
import { ChartSection } from './components/ChartSection';
import { AiAdvisor } from './components/AiAdvisor';
import { WalletCards, Share2, Check, Link as LinkIcon } from 'lucide-react';

const App: React.FC = () => {
  // Default values
  const defaultInputs: FinancialInputs = {
    currentAge: 30,
    targetRetirementAge: 65,
    currentSavings: 50000,
    // Asset Breakdown Defaults
    savingsCash: 10000,
    savingsStock: 25000,
    savingsBonds: 10000,
    savingsOther: 5000,
    stockHoldings: [], // Init empty portfolio
    
    currentMonthlySavings: 500,
    monthlySpending: 4000,
    expectedAnnualReturn: 7.0,
    inflationRate: 2.5,
  };

  const [inputs, setInputs] = useState<FinancialInputs>(defaultInputs);
  const [isShared, setIsShared] = useState(false);

  // Load state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const config = params.get('config');
    if (config) {
      try {
        // Decode base64 utf-8 string
        const jsonStr = decodeURIComponent(escape(atob(config)));
        const parsedInputs = JSON.parse(jsonStr);
        setInputs({ ...defaultInputs, ...parsedInputs });
      } catch (e) {
        console.error("Failed to parse shared configuration", e);
      }
    }
  }, []);

  const handleInputChange = (key: keyof FinancialInputs, value: any) => {
    setInputs(prev => {
      const next = { ...prev, [key]: value };
      
      // Auto-calculate total if a breakdown field changes (but not stockHoldings list itself, that is manual sync)
      if (['savingsCash', 'savingsStock', 'savingsBonds', 'savingsOther'].includes(key)) {
        next.currentSavings = 
          (next.savingsCash || 0) + 
          (next.savingsStock || 0) + 
          (next.savingsBonds || 0) + 
          (next.savingsOther || 0);
      }
      
      return next;
    });
  };

  const handleShare = () => {
    try {
      // Encode state to base64 utf-8 safe string
      const jsonStr = JSON.stringify(inputs);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      
      // Construct the new query string
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('config', base64);
      const newSearch = searchParams.toString();
      
      // Construct the full URL manually to ensure we have something to copy 
      // even if pushState fails (common in sandbox environments)
      const newRelativePath = `${window.location.pathname}?${newSearch}`;
      const fullUrl = `${window.location.origin}${newRelativePath}`;
      
      try {
        window.history.pushState({ path: newRelativePath }, '', newRelativePath);
      } catch (err) {
        console.warn("Unable to update URL history (likely sandbox environment):", err);
      }
      
      navigator.clipboard.writeText(fullUrl).then(() => {
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      });
    } catch (e) {
      console.error("Failed to generate share link", e);
      alert("Configuration is too large to share via URL.");
    }
  };

  // Real-time calculation using useMemo
  const result = useMemo(() => calculateRetirement(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <WalletCards className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              RetireWise<span className="text-indigo-600">.AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleShare}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isShared ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isShared ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied Link!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share Snapshot
                </>
              )}
            </button>
            <div className="text-xs sm:text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full hidden sm:block">
              v1.4.0
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Section: Inputs and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <InputCard values={inputs} onChange={handleInputChange} />
          </div>
          <div className="lg:col-span-8">
            <ResultsCard result={result} />
          </div>
        </div>

        {/* Middle Section: Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <ChartSection data={result.projection} />
          </div>
          
          {/* AI Advisor Panel */}
          <div className="lg:col-span-4 h-full">
             <AiAdvisor inputs={inputs} results={result} />
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
