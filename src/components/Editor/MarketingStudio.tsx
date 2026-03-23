/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Loader2, X, Megaphone, Copy, Check } from 'lucide-react';
import { Wall } from '../../types';
import { generateMarketingCopy, MarketingCopy } from '../../services/aiService';
import { cn } from '../../lib/utils';

interface MarketingStudioProps {
  walls: Wall[];
  onClose: () => void;
}

export const MarketingStudio = ({ walls, onClose }: MarketingStudioProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copy, setCopy] = useState<MarketingCopy | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateMarketingCopy(walls);
      setCopy(result);
    } catch (error) {
      console.error('Marketing copy generation failed:', error);
      alert('Failed to generate marketing copy. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Marketing Studio</h3>
              <p className="text-xs text-zinc-500">AI-powered marketing copy for your floor plans.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {!copy && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 animate-bounce">
                <Sparkles size={32} />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 mb-2">Ready to sell?</h4>
              <p className="text-zinc-500 max-w-sm mb-8">
                Our AI will analyze your floor plan's layout, dimensions, and features to craft the perfect marketing message.
              </p>
              <button 
                onClick={handleGenerate}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
              >
                <Sparkles size={20} />
                Generate Marketing Copy
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
              <h4 className="text-xl font-bold text-zinc-900 mb-2">Analyzing Floor Plan...</h4>
              <p className="text-zinc-500">Crafting the perfect pitch for your design.</p>
            </div>
          ) : copy ? (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-2 group">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Catchy Title</label>
                  <button 
                    onClick={() => copyToClipboard(copy.title, 'title')}
                    className="text-zinc-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                  >
                    {copiedField === 'title' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'title' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 leading-tight">{copy.title}</h2>
              </div>

              <div className="flex flex-col gap-2 group">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Compelling Description</label>
                  <button 
                    onClick={() => copyToClipboard(copy.description, 'description')}
                    className="text-zinc-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                  >
                    {copiedField === 'description' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'description' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-zinc-600 leading-relaxed text-lg italic serif">"{copy.description}"</p>
              </div>

              <div className="flex flex-col gap-2 group">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Call to Action</label>
                  <button 
                    onClick={() => copyToClipboard(copy.callToAction, 'cta')}
                    className="text-zinc-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                  >
                    {copiedField === 'cta' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'cta' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-zinc-900 text-white px-6 py-4 rounded-xl font-bold text-center shadow-xl shadow-zinc-900/20">
                  {copy.callToAction}
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 flex justify-center">
                <button 
                  onClick={handleGenerate}
                  className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  Regenerate with different tone
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-8 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
