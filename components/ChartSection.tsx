
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CalculationResult } from '../types';
import { formatCurrency } from '../utils/financials';

interface ChartSectionProps {
  data: CalculationResult['projection'];
}

export const ChartSection: React.FC<ChartSectionProps> = ({ data }) => {
  // Infer retirement age from where the curve changes slope or simply use the input data if we had it.
  // Since we don't pass retirementAge prop explicitly, we can visually see it.
  // However, we can calculate the gradient offset based on min/max values to color negative values red.
  
  const gradientOffset = () => {
    const dataMax = Math.max(...data.map((i) => i.savingsCurrent));
    const dataMin = Math.min(...data.map((i) => i.savingsCurrent));
  
    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }
  
    return dataMax / (dataMax - dataMin);
  };
  
  const off = gradientOffset();

  // Find the age where we switch from accumulation to decumulation roughly? 
  // We can't easily detect it from data array alone without logic, but we can just render the curve.
  // The user can see the peak.

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <div>
           <h3 className="text-lg font-bold text-gray-800">Wealth Lifecycle Projection</h3>
           <p className="text-xs text-gray-500">Estimated Wealth up to Age 100 (Inflation Adjusted)</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#4f46e5" stopOpacity={0.8}/> {/* Indigo-600 */}
                <stop offset={off} stopColor="#ef4444" stopOpacity={0.8}/> {/* Red-500 */}
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="age" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              formatter={(value: number) => [
                formatCurrency(value), 
                'Net Wealth'
              ]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#1e293b', fontWeight: 600 }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
              labelFormatter={(age) => `Age ${age}`}
            />
            
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />

            {/* Projected Wealth Curve */}
            <Area 
              type="monotone" 
              dataKey="savingsCurrent" 
              name="Wealth"
              stroke="#4338ca" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#wealthGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
