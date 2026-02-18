
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Property } from '../types';

interface ComparisonToolProps {
  properties: Property[];
}

const ComparisonTool: React.FC<ComparisonToolProps> = ({ properties }) => {
  const data = properties.map(p => ({
    name: p.title.substring(0, 15) + '...',
    Price: p.price,
    Renovation: p.renovationCosts.reduce((acc, curr) => acc + curr.estimatedCost, 0)
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Cost Comparison Tool</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend verticalAlign="top" align="right" height={36}/>
            <Bar dataKey="Price" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} barSize={40} />
            <Bar dataKey="Renovation" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map(p => (
          <div key={p.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
            <h4 className="font-bold text-slate-800 mb-2 truncate">{p.title}</h4>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">$/m² (Base)</span>
              <span className="font-medium">${Math.round(p.price / p.sqft).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">$/m² (Total)</span>
              <span className="font-bold text-indigo-600">
                ${Math.round((p.price + p.renovationCosts.reduce((acc, curr) => acc + curr.estimatedCost, 0)) / p.sqft).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonTool;
