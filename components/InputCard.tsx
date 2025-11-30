
import React, { useState, useEffect } from 'react';
import { FinancialInputs, StockHolding, NewsItem } from '../types';
import { DollarSign, Percent, Calendar, LayoutDashboard, PieChart, Coins, Briefcase, Landmark, TrendingUp, Newspaper, Plus, Trash2, RefreshCw, ExternalLink, ArrowRightCircle, Search, Lock, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../utils/financials';
import { findStockDetails, getFinancialNews } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface InputCardProps {
  values: FinancialInputs;
  onChange: (key: keyof FinancialInputs, value: any) => void;
}

const CurrencyInput = ({ 
  value, 
  onChange, 
  className,
  placeholder,
  disabled = false
}: { 
  value: number, 
  onChange: (val: number) => void, 
  className?: string,
  placeholder?: string,
  disabled?: boolean
}) => {
  const [localStr, setLocalStr] = useState(value > 0 ? value.toLocaleString('en-US') : '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
        setLocalStr(value.toLocaleString('en-US'));
    }
  }, [value, isFocused]);

  const onFocus = () => {
    if (disabled) return;
    setIsFocused(true);
    const raw = value === 0 ? '' : value.toString();
    setLocalStr(raw);
  };

  const onBlur = () => {
    setIsFocused(false);
    setLocalStr(value.toLocaleString('en-US'));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const raw = e.target.value;
    if (/^[0-9.]*$/.test(raw)) {
        setLocalStr(raw);
        const parsed = parseFloat(raw);
        onChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  return (
    <input
        type="text"
        inputMode="decimal"
        className={`${className} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}`}
        value={localStr}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onInputChange}
        placeholder={placeholder}
        disabled={disabled}
    />
  );
};

export const InputCard: React.FC<InputCardProps> = ({ values, onChange }) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'portfolio' | 'stocks' | 'news'>('plan');
  
  // Stocks State
  const [searchQuery, setSearchQuery] = useState('');
  const [foundStock, setFoundStock] = useState<{symbol: string, name: string, price: number, currency: string, exchangeRateToHKD: number} | null>(null);
  const [newQty, setNewQty] = useState('');
  const [newEntryPrice, setNewEntryPrice] = useState('');
  const [isSearchingStock, setIsSearchingStock] = useState(false);

  // News State
  const [news, setNews] = useState<NewsItem | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  const handleChange = (key: keyof FinancialInputs, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(key, isNaN(val) ? 0 : val);
  };

  const handleCurrencyChange = (key: keyof FinancialInputs, val: number) => {
    onChange(key, val);
  };

  // --- Stock Logic ---
  const handleSearchStock = async () => {
    if (!searchQuery) return;
    setIsSearchingStock(true);
    setFoundStock(null);
    setNewEntryPrice('');
    
    const result = await findStockDetails(searchQuery);
    
    if (result) {
        setFoundStock(result);
        setNewEntryPrice(result.price.toString()); // Default entry price to current price
    } else {
        alert("Could not find stock details. Please try a different name or ticker.");
    }
    setIsSearchingStock(false);
  };

  const handleAddStock = () => {
    if (!foundStock || !newQty || !newEntryPrice) return;
    
    const newStock: StockHolding = {
        id: Date.now().toString(),
        ticker: foundStock.symbol,
        name: foundStock.name,
        quantity: parseFloat(newQty),
        entryPrice: parseFloat(newEntryPrice),
        currentPrice: foundStock.price,
        currency: foundStock.currency,
        exchangeRateToHKD: foundStock.exchangeRateToHKD,
        fetchedAt: new Date().toISOString()
    };

    const updatedHoldings = [...values.stockHoldings, newStock];
    onChange('stockHoldings', updatedHoldings);
    
    // Reset form
    setSearchQuery('');
    setFoundStock(null);
    setNewQty('');
    setNewEntryPrice('');
  };

  const removeStock = (id: string) => {
    const updated = values.stockHoldings.filter(s => s.id !== id);
    onChange('stockHoldings', updated);
  };

  const syncStocksToAsset = () => {
    const totalMarketValueHKD = values.stockHoldings.reduce((sum, stock) => {
        const marketValueLocal = stock.quantity * (stock.currentPrice || stock.entryPrice);
        return sum + (marketValueLocal * stock.exchangeRateToHKD);
    }, 0);
    
    onChange('savingsStock', totalMarketValueHKD);
    alert(`Updated Stocks / Equities asset value to ${formatCurrency(totalMarketValueHKD, 'HKD')}`);
  };

  const totalUnrealizedPLHKD = values.stockHoldings.reduce((sum, stock) => {
      const marketValLocal = stock.quantity * (stock.currentPrice || 0);
      const costBasisLocal = stock.quantity * stock.entryPrice;
      
      const marketValHKD = marketValLocal * stock.exchangeRateToHKD;
      const costBasisHKD = costBasisLocal * stock.exchangeRateToHKD;
      
      return sum + (marketValHKD - costBasisHKD);
  }, 0);

  // --- News Logic ---
  useEffect(() => {
    if (activeTab === 'news' && !news && !isNewsLoading) {
        setIsNewsLoading(true);
        getFinancialNews().then(data => {
            setNews(data);
            setIsNewsLoading(false);
        }).catch(() => setIsNewsLoading(false));
    }
  }, [activeTab]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-full flex flex-col">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 min-w-[80px] py-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${
            activeTab === 'plan' ? 'text-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden sm:inline">Plan</span>
          {activeTab === 'plan' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 min-w-[80px] py-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${
            activeTab === 'portfolio' ? 'text-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="hidden sm:inline">Assets</span>
          {activeTab === 'portfolio' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 min-w-[80px] py-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${
            activeTab === 'stocks' ? 'text-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Stocks</span>
          {activeTab === 'stocks' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 min-w-[80px] py-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${
            activeTab === 'news' ? 'text-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span className="hidden sm:inline">News</span>
          {activeTab === 'news' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto min-h-[400px]">
        {activeTab === 'plan' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Age</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={values.currentAge}
                    onChange={(e) => handleChange('currentAge', e)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retire Age</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={values.targetRetirementAge}
                    onChange={(e) => handleChange('targetRetirementAge', e)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cash Flow (HKD)</h3>
               <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-sm font-medium text-gray-700">Current Monthly Savings</label>
                    <div className="group relative flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-gray-900/95 text-white text-[11px] leading-relaxed rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center backdrop-blur-sm border border-gray-700/50">
                        Amount you save monthly <strong>before</strong> retirement. This stops once you reach your retirement age.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <CurrencyInput
                      value={values.currentMonthlySavings}
                      onChange={(val) => handleCurrencyChange('currentMonthlySavings', val)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retirement Monthly Spending</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <CurrencyInput
                      value={values.monthlySpending}
                      onChange={(val) => handleCurrencyChange('monthlySpending', val)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Desired income in today's dollars.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
               <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Exp. Return % (Inflation Adjusted)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="number"
                    step="0.1"
                    value={values.expectedAnnualReturn}
                    onChange={(e) => handleChange('expectedAnnualReturn', e)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                  />
                </div>
              </div>
               {/* Inflation rate was here, but we can keep it hidden or expose it. Let's expose just Inflation for completeness as it was in previous design */}
               <div className="hidden"> 
                  {/* Hidden field for Inflation if needed, but for now we kept Exp Return. 
                      Actually, let's keep Inflation visible to be safe as it's in the types. */}
                  <input value={values.inflationRate} readOnly />
               </div>
            </div>
            
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Inflation %</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="number"
                        step="0.1"
                        value={values.inflationRate}
                        onChange={(e) => handleChange('inflationRate', e)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                      />
                    </div>
                  </div>
             </div>

          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-50 p-4 rounded-xl text-center border border-indigo-100 mb-4">
               <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Total Nest Egg (HKD)</p>
               <p className="text-2xl font-bold text-indigo-700">{formatCurrency(values.currentSavings, 'HKD')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash & Equivalents</label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <CurrencyInput
                  value={values.savingsCash}
                  onChange={(val) => handleCurrencyChange('savingsCash', val)}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stocks / Equities (Linked to Stocks Tab)</label>
              <div className="relative group">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <CurrencyInput
                  value={values.savingsStock}
                  onChange={(val) => handleCurrencyChange('savingsStock', val)}
                  placeholder="0"
                  disabled={true} // Read-only
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 opacity-50" />
                <p className="text-xs text-gray-400 mt-1 ml-1">Value is managed in the 'Stocks' tab.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonds / Fixed Income</label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <CurrencyInput
                  value={values.savingsBonds}
                  onChange={(val) => handleCurrencyChange('savingsBonds', val)}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retirement Funds / Other</label>
              <div className="relative">
                <PieChart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <CurrencyInput
                  value={values.savingsOther}
                  onChange={(val) => handleCurrencyChange('savingsOther', val)}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stocks' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             {/* Add Stock Section */}
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search & Add Stock</label>
                
                {/* Search Bar */}
                <div className="flex gap-2 mb-3">
                   <div className="relative flex-1">
                      <input 
                          type="text" 
                          className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Search ticker or company (e.g. Tencent)"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchStock()}
                      />
                      <button 
                         onClick={handleSearchStock}
                         disabled={isSearchingStock}
                         className="absolute right-1 top-1 bottom-1 px-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                      >
                         {isSearchingStock ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                   </div>
                </div>

                {/* Found Result + Inputs */}
                {foundStock && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 mb-3 flex justify-between items-center">
                           <div>
                              <p className="text-sm font-bold text-indigo-900">{foundStock.symbol}</p>
                              <p className="text-xs text-indigo-600">{foundStock.name}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-semibold text-indigo-700">{formatCurrency(foundStock.price, foundStock.currency)}</p>
                             <p className="text-[10px] text-indigo-400">1 {foundStock.currency} ≈ {foundStock.exchangeRateToHKD} HKD</p>
                           </div>
                        </div>

                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900"
                                    placeholder="100"
                                    value={newQty}
                                    onChange={(e) => setNewQty(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Entry ({foundStock.currency})</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900"
                                    placeholder={foundStock.price.toString()}
                                    value={newEntryPrice}
                                    onChange={(e) => setNewEntryPrice(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleAddStock}
                                disabled={!newQty}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg flex-shrink-0"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
             </div>

             {/* Holdings List */}
             <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {values.stockHoldings.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">No stocks added yet.</p>
                )}
                {values.stockHoldings.map((stock) => {
                    const marketValue = stock.quantity * (stock.currentPrice || stock.entryPrice);
                    const profit = marketValue - (stock.quantity * stock.entryPrice);
                    const isProfit = profit >= 0;

                    return (
                        <div key={stock.id} className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-gray-800 truncate">{stock.ticker}</span>
                                    <a 
                                        href={`https://finance.yahoo.com/quote/${stock.ticker}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-gray-400 hover:text-indigo-600"
                                        title="View on Yahoo Finance"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <div className="text-xs text-gray-500 truncate" title={stock.name}>{stock.name}</div>
                                <div className="text-[10px] text-gray-400 mt-1">
                                    {stock.quantity} @ {formatCurrency(stock.entryPrice, stock.currency)}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-sm font-medium">{formatCurrency(marketValue, stock.currency)}</div>
                                <div className={`text-xs font-semibold ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                                    {isProfit ? '+' : ''}{formatCurrency(profit, stock.currency)}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                    curr: {formatCurrency(stock.currentPrice || 0, stock.currency)}
                                </div>
                            </div>
                            <button 
                                onClick={() => removeStock(stock.id)}
                                className="ml-3 text-gray-300 hover:text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
             </div>

             {values.stockHoldings.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                         <span className="text-xs text-gray-500">Unrealized P/L (Total HKD)</span>
                         <span className={`text-sm font-bold ${totalUnrealizedPLHKD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalUnrealizedPLHKD >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPLHKD, 'HKD')}
                         </span>
                    </div>
                    <button 
                        onClick={syncStocksToAsset}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition"
                    >
                        <ArrowRightCircle className="w-4 h-4" />
                        Sync Total to Portfolio (HKD)
                    </button>
                </div>
             )}
          </div>
        )}

        {activeTab === 'news' && (
           <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                   <Newspaper className="w-4 h-4 text-indigo-600" />
                   Weekly Market Pulse
               </h3>
               
               {isNewsLoading ? (
                   <div className="flex flex-col items-center justify-center py-10">
                       <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                       <p className="text-xs text-gray-400">Scanning financial headlines...</p>
                   </div>
               ) : news ? (
                   <div className="space-y-4">
                       <div className="prose prose-sm prose-indigo max-w-none text-xs text-gray-600">
                           <ReactMarkdown>{news.content}</ReactMarkdown>
                       </div>
                       
                       {news.sources.length > 0 && (
                           <div className="pt-3 border-t border-gray-100">
                               <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Sources</p>
                               <div className="flex flex-wrap gap-2">
                                   {news.sources.map((source, idx) => (
                                       <a 
                                         key={idx} 
                                         href={source.uri} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="flex items-center gap-1 text-[10px] bg-gray-50 text-indigo-600 px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-100 truncate max-w-[150px]"
                                       >
                                           <ExternalLink className="w-3 h-3" />
                                           <span className="truncate">{source.title}</span>
                                       </a>
                                   ))}
                               </div>
                           </div>
                       )}
                   </div>
               ) : (
                   <p className="text-sm text-gray-400 text-center py-10">
                       Unable to load news at this time.
                   </p>
               )}
           </div>
        )}

      </div>
    </div>
  );
};
