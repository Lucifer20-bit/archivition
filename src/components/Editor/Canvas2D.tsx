/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Wall, Point } from '../../types';
import { Trash2 } from 'lucide-react';

export type Tool = 'wall' | 'measure' | 'select' | 'opening' | 'measure3d';

interface Canvas2DProps {
  walls: Wall[];
  tool: Tool;
  selectedWallId: string | null;
  metersPerUnit: number;
  onSelectWall: (id: string | null) => void;
  onAddWall: (wall: Wall) => void;
  onUpdateWall: (wall: Wall) => void;
  onDeleteWall: (id: string) => void;
  onAddOpening?: (wallId: string, position: number) => void;
}

export const Canvas2D = ({ walls, tool, selectedWallId, metersPerUnit, onSelectWall, onAddWall, onDeleteWall, onAddOpening }: Canvas2DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [lastMeasurement, setLastMeasurement] = useState<{ start: Point; end: Point; distance: number } | null>(null);

  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw existing walls
    walls.forEach(wall => {
      ctx.strokeStyle = wall.id === selectedWallId ? '#ef4444' : '#18181b';
      ctx.lineWidth = wall.id === selectedWallId ? 6 : 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();

      // Draw openings
      if (wall.openings && wall.openings.length > 0) {
        wall.openings.forEach(opening => {
          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const wallLen = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / wallLen;
          const unitY = dy / wallLen;

          const openingStartPos = opening.position - (opening.width / 2 / wallLen);
          const openingEndPos = opening.position + (opening.width / 2 / wallLen);

          const startX = wall.start.x + unitX * wallLen * openingStartPos;
          const startY = wall.start.y + unitY * wallLen * openingStartPos;
          const endX = wall.start.x + unitX * wallLen * openingEndPos;
          const endY = wall.start.y + unitY * wallLen * openingEndPos;

          ctx.strokeStyle = opening.type === 'door' ? '#92400e' : '#7dd3fc';
          ctx.lineWidth = wall.id === selectedWallId ? 8 : 6;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          
          // Add label for opening
          ctx.fillStyle = opening.type === 'door' ? '#92400e' : '#0369a1';
          ctx.font = '8px Inter, sans-serif';
          ctx.fillText(opening.type === 'door' ? 'D' : 'W', (startX + endX) / 2, (startY + endY) / 2 - 5);
        });
      }
    });

    // Draw current wall or measurement being drawn
    if (isDrawing && startPoint && currentPoint) {
      const dist = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2));
      
      if (tool === 'wall') {
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (tool === 'measure') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw measurement text
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        const midX = (startPoint.x + currentPoint.x) / 2;
        const midY = (startPoint.y + currentPoint.y) / 2;
        ctx.fillText(`${((dist / 20) * metersPerUnit).toFixed(2)}m`, midX, midY - 10);
      }
    }

    // Draw last measurement
    if (lastMeasurement && !isDrawing) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(lastMeasurement.start.x, lastMeasurement.start.y);
      ctx.lineTo(lastMeasurement.end.x, lastMeasurement.end.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      const midX = (lastMeasurement.start.x + lastMeasurement.end.x) / 2;
      const midY = (lastMeasurement.start.y + lastMeasurement.end.y) / 2;
      ctx.fillText(`${((lastMeasurement.distance / 20) * metersPerUnit).toFixed(2)}m`, midX, midY - 10);
    }
  };

  useEffect(() => {
    draw();
  }, [walls, isDrawing, startPoint, currentPoint, lastMeasurement, selectedWallId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    
    if (tool === 'select' || tool === 'opening') {
      // Find wall near click
      const clickedWall = walls.find(wall => {
        const d = distToSegment(pos, wall.start, wall.end);
        return d < 10;
      });
      
      if (tool === 'select') {
        onSelectWall(clickedWall?.id || null);
      } else if (tool === 'opening' && clickedWall && onAddOpening) {
        // Calculate position along wall (0 to 1)
        const dx = clickedWall.end.x - clickedWall.start.x;
        const dy = clickedWall.end.y - clickedWall.start.y;
        const l2 = dx * dx + dy * dy;
        let t = ((pos.x - clickedWall.start.x) * dx + (pos.y - clickedWall.start.y) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        onAddOpening(clickedWall.id, t);
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentPoint(pos);
    if (tool === 'measure') {
      setLastMeasurement(null);
    }
  };

  const distToSegment = (p: Point, v: Point, w: Point) => {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setCurrentPoint(getMousePos(e));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    const endPoint = getMousePos(e);
    const dist = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
    
    if (tool === 'wall') {
      // Only add if it has some length
      if (dist > 10) {
        onAddWall({
          id: crypto.randomUUID(),
          start: startPoint,
          end: endPoint,
          thickness: 10,
          height: 100,
        });
      }
    } else if (tool === 'measure') {
      if (dist > 5) {
        setLastMeasurement({
          start: startPoint,
          end: endPoint,
          distance: dist
        });
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  return (
    <div className="relative w-full h-full bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-inner">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        {selectedWallId && (
          <button
            onClick={() => {
              onDeleteWall(selectedWallId);
              onSelectWall(null);
            }}
            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete Selected Wall
          </button>
        )}
        <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-zinc-500 border border-zinc-200 shadow-sm">
          {tool === 'wall' ? 'Click and drag to draw walls' : tool === 'measure' ? 'Click and drag to measure' : tool === 'opening' ? 'Click a wall to add window/door' : 'Click a wall to select it'}
        </div>
      </div>
    </div>
  );
};
