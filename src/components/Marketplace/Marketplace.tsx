/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plan } from '../../types';
import { Search, Filter, ShoppingCart, ExternalLink, Heart, ShoppingBag } from 'lucide-react';

interface MarketplaceProps {
  plans: Plan[];
  onViewPlan: (plan: Plan) => void;
  onBuyPlan: (plan: Plan) => void;
}

export const Marketplace = ({ plans, onViewPlan, onBuyPlan }: MarketplaceProps) => {
  return (
    <div className="p-8 bg-zinc-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Architectural Marketplace</h2>
          <p className="text-zinc-500 text-lg">Discover and purchase professional building plans from top architects.</p>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search plans, styles, or architects..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-xl font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm">
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-zinc-100 relative overflow-hidden">
                {plan.thumbnailUrl ? (
                  <img 
                    src={plan.thumbnailUrl} 
                    alt={plan.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <ExternalLink size={48} />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <button className="p-2 bg-white/80 backdrop-blur-md rounded-full text-zinc-600 hover:text-red-500 transition-colors shadow-sm">
                    <Heart size={20} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Premium Plan
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-zinc-900 group-hover:text-black transition-colors">{plan.name}</h3>
                  <span className="text-lg font-bold text-zinc-900">${plan.price || '0.00'}</span>
                </div>
                <p className="text-zinc-500 text-sm line-clamp-2 mb-6 flex-1">
                  {plan.marketingDescription || plan.description || 'No description available for this architectural masterpiece.'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <button 
                    onClick={() => onViewPlan(plan)}
                    className="text-sm font-semibold text-zinc-900 hover:underline"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => onBuyPlan(plan)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-zinc-800 transition-colors shadow-lg shadow-black/10"
                  >
                    <ShoppingCart size={16} />
                    Purchase
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-20 bg-white border border-dashed border-zinc-300 rounded-3xl">
            <ShoppingBag className="mx-auto text-zinc-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No plans found</h3>
            <p className="text-zinc-500">Be the first to list a plan in the marketplace!</p>
          </div>
        )}
      </div>
    </div>
  );
};
