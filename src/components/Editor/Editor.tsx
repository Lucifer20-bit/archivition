/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Canvas2D, Tool } from './Canvas2D';
import { Canvas3D } from './Canvas3D';
import { MarketingStudio } from './MarketingStudio';
import { Wall, Plan } from '../../types';
import { Box, Layers, Save, Trash2, Eye, EyeOff, Share2, Megaphone, Ruler, PenTool, Undo2, Redo2, MousePointer2, Sparkles, Loader2, ImageIcon, Copy, Check, X, DoorOpen, Ruler as Ruler3d } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateFloorPlan, generateFloorPlanPreview } from '../../services/aiService';

interface EditorProps {
  user: User;
  onSave: (plan: Partial<Plan>) => Promise<string | undefined>;
  onShare: (planId: string) => Promise<string | undefined>;
  initialPlan?: Plan;
}

export const Editor = ({ user, onSave, onShare, initialPlan }: EditorProps) => {
  const isOwner = !initialPlan || initialPlan.authorId === user.uid;
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [tool, setTool] = useState<Tool>('wall');
  const [walls, setWalls] = useState<Wall[]>(initialPlan?.walls || []);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [metersPerUnit, setMetersPerUnit] = useState(1);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMarketingStudioOpen, setIsMarketingStudioOpen] = useState(false);
  const [openingModal, setOpeningModal] = useState<{ wallId: string; position: number } | null>(null);
  const [openingDetails, setOpeningDetails] = useState<{ type: 'window' | 'door'; width: number; height: number; bottomHeight: number }>({
    type: 'door',
    width: 90,
    height: 210,
    bottomHeight: 0
  });
  const [history, setHistory] = useState<Wall[][]>([initialPlan?.walls || []]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [planName, setPlanName] = useState(initialPlan?.name || 'Untitled Plan');

  const updateWallsWithHistory = (newWalls: Wall[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newWalls);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setWalls(newWalls);
  };

  const handleAddOpening = (wallId: string, position: number) => {
    setOpeningModal({ wallId, position });
  };

  const handleSaveOpening = () => {
    if (!openingModal) return;
    
    const newOpening = {
      id: crypto.randomUUID(),
      ...openingDetails,
      position: openingModal.position
    };

    const newWalls = walls.map(wall => {
      if (wall.id === openingModal.wallId) {
        return {
          ...wall,
          openings: [...(wall.openings || []), newOpening]
        };
      }
      return wall;
    });

    updateWallsWithHistory(newWalls);
    setOpeningModal(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setWalls(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setWalls(history[nextIndex]);
    }
  };

  const handleAddWall = (wall: Wall) => {
    updateWallsWithHistory([...walls, wall]);
  };

  const handleUpdateWall = (wall: Wall) => {
    updateWallsWithHistory(walls.map(w => w.id === wall.id ? wall : w));
  };

  const handleUpdateWallHeight = (height: number) => {
    if (selectedWallId) {
      const wall = walls.find(w => w.id === selectedWallId);
      if (wall) {
        handleUpdateWall({ ...wall, height });
      }
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiLoading(true);
    try {
      const [newWalls, previewUrl] = await Promise.all([
        generateFloorPlan(aiPrompt, walls),
        generateFloorPlanPreview(aiPrompt)
      ]);
      
      updateWallsWithHistory(newWalls);
      setAiPreviewUrl(previewUrl);
      setAiPrompt('');
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('AI generation failed. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteWall = (id: string) => {
    updateWallsWithHistory(walls.filter(w => w.id !== id));
  };

  const handleDeleteOpening = (wallId: string, openingId: string) => {
    const newWalls = walls.map(wall => {
      if (wall.id === wallId) {
        return {
          ...wall,
          openings: wall.openings?.filter(o => o.id !== openingId) || []
        };
      }
      return wall;
    });
    updateWallsWithHistory(newWalls);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all walls?')) {
      updateWallsWithHistory([]);
    }
  };

  const handleSave = async () => {
    return await onSave({
      name: planName,
      walls,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      let planId = initialPlan?.id;
      if (!planId) {
        // Must save first to get an ID
        planId = await handleSave();
      }
      
      if (planId) {
        const url = await onShare(planId);
        if (url) {
          setShareUrl(url);
        }
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      alert('Failed to generate share link.');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 w-64"
          />
          <div className="h-6 w-px bg-zinc-200" />
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('2d')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === '2d' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Layers size={16} />
              2D Plan
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === '3d' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Box size={16} />
              3D View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 p-1 rounded-lg mr-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className={cn(
                "p-1.5 rounded-md transition-all",
                historyIndex === 0 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-600 hover:bg-white hover:text-black hover:shadow-sm"
              )}
              title="Undo"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className={cn(
                "p-1.5 rounded-md transition-all",
                historyIndex === history.length - 1 ? "text-zinc-300 cursor-not-allowed" : "text-zinc-600 hover:bg-white hover:text-black hover:shadow-sm"
              )}
              title="Redo"
            >
              <Redo2 size={18} />
            </button>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
            Clear
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-lg shadow-black/10"
          >
            <Save size={18} />
            {isOwner ? 'Save Plan' : 'Save Copy'}
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <div className="flex-1 p-6 bg-zinc-50 overflow-hidden">
        <div className="w-full h-full relative">
          {viewMode === '2d' ? (
            <Canvas2D 
              walls={walls} 
              tool={tool}
              selectedWallId={selectedWallId}
              metersPerUnit={metersPerUnit}
              onSelectWall={setSelectedWallId}
              onAddWall={handleAddWall} 
              onUpdateWall={handleUpdateWall} 
              onDeleteWall={handleDeleteWall} 
              onAddOpening={handleAddOpening}
            />
          ) : (
            <Canvas3D 
              walls={walls} 
              tool={tool}
              metersPerUnit={metersPerUnit}
            />
          )}

          {/* Floating Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="bg-white p-2 rounded-xl border border-zinc-200 shadow-xl flex flex-col gap-1">
              <button 
                onClick={() => setTool('select')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  tool === 'select' ? "bg-black text-white" : "hover:bg-zinc-100 text-zinc-600"
                )} 
                title="Select Wall"
              >
                <MousePointer2 size={20} />
              </button>
              <button 
                onClick={() => setTool('wall')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  tool === 'wall' ? "bg-black text-white" : "hover:bg-zinc-100 text-zinc-600"
                )} 
                title="Draw Wall"
              >
                <PenTool size={20} />
              </button>
              <button 
                onClick={() => setTool('measure')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  tool === 'measure' ? "bg-black text-white" : "hover:bg-zinc-100 text-zinc-600"
                )} 
                title="Measure Distance"
              >
                <Ruler size={20} />
              </button>
              <button 
                onClick={() => setTool('opening')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  tool === 'opening' ? "bg-black text-white" : "hover:bg-zinc-100 text-zinc-600"
                )} 
                title="Add Window/Door"
              >
                <DoorOpen size={20} />
              </button>
              <button 
                onClick={() => setTool('measure3d')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  tool === 'measure3d' ? "bg-black text-white" : "hover:bg-zinc-100 text-zinc-600"
                )} 
                title="3D Measure"
              >
                <Ruler3d size={20} />
              </button>
              <div className="h-px bg-zinc-100 my-1" />
              <div className="p-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scale</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0.1"
                    value={metersPerUnit}
                    onChange={(e) => setMetersPerUnit(Number(e.target.value))}
                    className="w-12 px-1 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-black"
                    title="Meters per unit"
                  />
                  <span className="text-[10px] text-zinc-400 font-medium">m/u</span>
                </div>
              </div>
              <div className="h-px bg-zinc-100 my-1" />
              <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors" title="Toggle Grid">
                <Eye size={20} />
              </button>
              <button 
                onClick={handleShare}
                disabled={isSharing || !isOwner}
                className={cn(
                  "p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors",
                  (isSharing || !isOwner) && "opacity-50 cursor-not-allowed"
                )} 
                title={isOwner ? "Share Plan" : "You must save a copy to share this plan"}
              >
                {isSharing ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
              </button>
              <button 
                onClick={() => setIsMarketingStudioOpen(true)}
                className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors" 
                title="Marketing Studio"
              >
                <Megaphone size={20} />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xl flex flex-col gap-3 w-64">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Assistant</h3>
              </div>
              <div className="flex flex-col gap-2">
                <textarea 
                  placeholder="Describe your floor plan (e.g., 'Add a 2x2 room in the center')"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none h-20"
                />
                <button 
                  onClick={handleAiGenerate}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Designing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Plan
                    </>
                  )}
                </button>
              </div>
            </div>

            {aiPreviewUrl && (
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xl flex flex-col gap-3 w-64">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-zinc-400" />
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Visualization</h3>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden border border-zinc-100 bg-zinc-50 group/preview">
                  <img 
                    src={aiPreviewUrl} 
                    alt="AI Generated Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => window.open(aiPreviewUrl, '_blank')}
                      className="text-white text-xs font-medium bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/30 transition-colors"
                    >
                      View Full Size
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 italic leading-tight">
                  This is an AI-generated 3D visualization of your architectural prompt.
                </p>
              </div>
            )}

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xl flex flex-col gap-3 w-48">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Project Settings</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600">Meters per Unit</label>
                <input 
                  type="number"
                  step="0.1"
                  value={metersPerUnit}
                  onChange={(e) => setMetersPerUnit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                />
              </div>
            </div>

            {selectedWallId && (
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xl flex flex-col gap-3 w-48">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Wall Properties</h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600">Height (cm)</label>
                  <input 
                    type="number"
                    value={walls.find(w => w.id === selectedWallId)?.height || 100}
                    onChange={(e) => handleUpdateWallHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
                
                {walls.find(w => w.id === selectedWallId)?.openings?.length ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Openings</label>
                    <div className="flex flex-col gap-1">
                      {walls.find(w => w.id === selectedWallId)?.openings?.map(opening => (
                        <div key={opening.id} className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded-lg group">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-900 capitalize">{opening.type}</span>
                            <span className="text-[8px] text-zinc-500">{opening.width}x{opening.height}cm</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteOpening(selectedWallId, opening.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marketing Studio */}
      {isMarketingStudioOpen && (
        <MarketingStudio 
          walls={walls} 
          onClose={() => setIsMarketingStudioOpen(false)} 
        />
      )}

      {/* Share Modal */}
      {shareUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Share Plan</h3>
                  <p className="text-xs text-zinc-500">Anyone with this link can view this plan.</p>
                </div>
              </div>
              <button 
                onClick={() => setShareUrl(null)}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl}
                  className="flex-1 bg-transparent border-none text-sm text-zinc-600 focus:ring-0 p-0 overflow-hidden text-ellipsis"
                />
                <button 
                  onClick={copyToClipboard}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    copied ? "bg-green-600 text-white" : "bg-black text-white hover:bg-zinc-800"
                  )}
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 italic">
                <Sparkles size={10} />
                <span>Plan is now public and visible in the marketplace.</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button 
                onClick={() => setShareUrl(null)}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opening Configuration Modal */}
      {openingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600">
                  <DoorOpen size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Add Opening</h3>
                  <p className="text-xs text-zinc-500">Configure window or door details.</p>
                </div>
              </div>
              <button 
                onClick={() => setOpeningModal(null)}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex bg-zinc-100 p-1 rounded-lg">
                <button
                  onClick={() => setOpeningDetails({ ...openingDetails, type: 'door', height: 210, bottomHeight: 0 })}
                  className={cn(
                    "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                    openingDetails.type === 'door' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Door
                </button>
                <button
                  onClick={() => setOpeningDetails({ ...openingDetails, type: 'window', height: 120, bottomHeight: 90 })}
                  className={cn(
                    "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                    openingDetails.type === 'window' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Window
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600">Width (cm)</label>
                  <input 
                    type="number"
                    value={openingDetails.width}
                    onChange={(e) => setOpeningDetails({ ...openingDetails, width: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600">Height (cm)</label>
                  <input 
                    type="number"
                    value={openingDetails.height}
                    onChange={(e) => setOpeningDetails({ ...openingDetails, height: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600">Bottom Height (cm)</label>
                  <input 
                    type="number"
                    value={openingDetails.bottomHeight}
                    onChange={(e) => setOpeningDetails({ ...openingDetails, bottomHeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button 
                onClick={() => setOpeningModal(null)}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveOpening}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors"
              >
                Add to Wall
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
