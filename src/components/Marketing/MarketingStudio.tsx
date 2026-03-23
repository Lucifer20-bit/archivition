/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plan } from '../../types';
import { GoogleGenAI } from '@google/genai';
import { Megaphone, Sparkles, Loader2, Copy, Check, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarketingStudioProps {
  plan: Plan | null;
  onUpdatePlan: (plan: Partial<Plan>) => void;
}

export const MarketingStudio = ({ plan, onUpdatePlan }: MarketingStudioProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(plan?.marketingDescription || null);
  const [copied, setCopied] = useState(false);

  const generateMarketingCopy = async () => {
    if (!plan) return;
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a luxury real estate marketing expert. Generate a compelling, high-end marketing description for a new architectural plan named "${plan.name}". 
        The plan has ${plan.walls.length} structural elements. 
        Focus on the lifestyle, the architectural vision, and the investment value. 
        Format the output in professional Markdown with a catchy headline, key features list, and a persuasive call to action.`,
      });

      const text = response.text;
      setGeneratedContent(text);
      onUpdatePlan({ marketingDescription: text });
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
          <Megaphone size={40} className="text-zinc-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Select a Plan to Market</h2>
        <p className="text-zinc-500 max-w-md">Choose one of your architectural designs from the dashboard to start generating professional marketing materials.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-zinc-50 min-h-full">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Marketing Studio</h2>
            <p className="text-zinc-500">AI-powered marketing for your architectural vision.</p>
          </div>
          <button
            onClick={generateMarketingCopy}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {generatedContent ? 'Regenerate Copy' : 'Generate Marketing Copy'}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold text-zinc-900 mb-4">Plan Details</h3>
              <div className="aspect-video bg-zinc-100 rounded-xl mb-4 overflow-hidden relative group">
                {plan.thumbnailUrl ? (
                  <img src={plan.thumbnailUrl} alt={plan.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Name</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Elements</span>
                  <span className="font-medium">{plan.walls.length} Walls</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Created</span>
                  <span className="font-medium">{new Date(plan.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-2xl text-white shadow-xl shadow-black/20">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-400" />
                Pro Tip
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Use high-quality renders for your thumbnails. AI-generated descriptions work best when you provide specific architectural styles in the plan name.
              </p>
            </div>
          </div>

          {/* Generated Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <span className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Marketing Copy</span>
                {generatedContent && (
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors flex items-center gap-2 text-xs font-bold"
                  >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                )}
              </div>
              <div className="p-8 flex-1 overflow-auto prose prose-zinc max-w-none">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                    <Loader2 className="animate-spin text-zinc-400" size={40} />
                    <p className="text-zinc-500 font-medium italic">Gemini is crafting your architectural narrative...</p>
                  </div>
                ) : generatedContent ? (
                  <div className="markdown-body">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-zinc-400 space-y-4">
                    <Megaphone size={48} className="opacity-20" />
                    <p className="font-medium">Click generate to create your marketing copy.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
