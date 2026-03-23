/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Canvas2D, Tool } from './Canvas2D';
import { Canvas3D } from './Canvas3D';
import { Wall, Plan } from '../../types';
import { Box, Layers, Save, Trash2, Eye, EyeOff, Share2, Megaphone, Ruler, PenTool } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EditorProps {
  onSave: (plan: Partial<Plan>) => void;
  initialPlan?: Plan;
}

export const Editor = ({ onSave, initialPlan }: EditorProps) => {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [tool, setTool] = useState<Tool>('wall');
  const [walls, setWalls] = useState<Wall[]>(initialPlan?.walls || []);
  const [planName, setPlanName] = useState(initialPlan?.name || 'Untitled Plan');

  const handleAddWall = (wall: Wall) => {
    setWalls([...walls, wall]);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all walls?')) {
      setWalls([]);
    }
  };

  const handleSave = () => {
    onSave({
      name: planName,
      walls,
      updatedAt: new Date().toISOString(),
    });
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
            Save Plan
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
              onAddWall={handleAddWall} 
              onUpdateWall={() => {}} 
              onDeleteWall={() => {}} 
            />
          ) : (
            <Canvas3D walls={walls} />
          )}

          {/* Floating Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="bg-white p-2 rounded-xl border border-zinc-200 shadow-xl flex flex-col gap-1">
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
              <div className="h-px bg-zinc-100 my-1" />
              <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors" title="Toggle Grid">
                <Eye size={20} />
              </button>
              <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors" title="Share Plan">
                <Share2 size={20} />
              </button>
              <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors" title="Marketing Studio">
                <Megaphone size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
