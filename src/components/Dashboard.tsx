/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plan } from '../types';
import { Plus, Clock, FileText, ArrowRight, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  plans: Plan[];
  onNewPlan: () => void;
  onEditPlan: (plan: Plan) => void;
}

const StatCard = ({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string, trend: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        {icon}
      </div>
      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
        <TrendingUp size={12} />
        {trend}
      </span>
    </div>
    <p className="text-zinc-500 text-sm font-medium mb-1">{label}</p>
    <h4 className="text-2xl font-bold text-zinc-900">{value}</h4>
  </div>
);

export const Dashboard = ({ plans, onNewPlan, onEditPlan }: DashboardProps) => {
  return (
    <div className="p-8 bg-zinc-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Welcome Back, Architect</h2>
            <p className="text-zinc-500 text-lg">Your architectural studio is ready for your next vision.</p>
          </div>
          <button 
            onClick={onNewPlan}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
          >
            <Plus size={20} />
            New Design Plan
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            icon={<FileText size={20} className="text-blue-600" />} 
            label="Total Plans" 
            value={plans.length.toString()} 
            trend="+12%" 
            color="bg-blue-50"
          />
          <StatCard 
            icon={<Users size={20} className="text-purple-600" />} 
            label="Market Views" 
            value="1.2k" 
            trend="+8%" 
            color="bg-purple-50"
          />
          <StatCard 
            icon={<DollarSign size={20} className="text-emerald-600" />} 
            label="Total Sales" 
            value="$4,250" 
            trend="+15%" 
            color="bg-emerald-50"
          />
          <StatCard 
            icon={<BarChart3 size={20} className="text-orange-600" />} 
            label="Conversion" 
            value="3.2%" 
            trend="+2%" 
            color="bg-orange-50"
          />
        </div>

        {/* Recent Plans */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Clock size={20} className="text-zinc-400" />
              Recent Designs
            </h3>
            <button className="text-sm font-semibold text-zinc-500 hover:text-black flex items-center gap-1">
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/5 transition-all duration-300 cursor-pointer"
                onClick={() => onEditPlan(plan)}
              >
                <div className="aspect-video bg-zinc-100 relative overflow-hidden">
                  {plan.thumbnailUrl ? (
                    <img src={plan.thumbnailUrl} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <FileText size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                      Edit Plan
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-zinc-900 mb-1 group-hover:text-black transition-colors">{plan.name}</h4>
                  <p className="text-zinc-500 text-xs font-medium mb-3">
                    Last updated {new Date(plan.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      plan.isPublic ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"
                    )}>
                      {plan.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {plans.length === 0 && (
              <button 
                onClick={onNewPlan}
                className="aspect-video border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-all group"
              >
                <div className="p-3 bg-zinc-50 rounded-full group-hover:bg-zinc-100 transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-bold text-sm">Create your first design</span>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
