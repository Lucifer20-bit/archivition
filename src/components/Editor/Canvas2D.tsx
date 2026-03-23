/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Wall, Point } from '../../types';

export type Tool = 'wall' | 'measure';

interface Canvas2DProps {
  walls: Wall[];
  tool: Tool;
  onAddWall: (wall: Wall) => void;
  onUpdateWall: (wall: Wall) => void;
  onDeleteWall: (id: string) => void;
}

export const Canvas2D = ({ walls, tool, onAddWall }: Canvas2DProps) => {
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
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    walls.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();
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
        ctx.fillText(`${(dist / 20).toFixed(2)}m`, midX, midY - 10);
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
      ctx.fillText(`${(lastMeasurement.distance / 20).toFixed(2)}m`, midX, midY - 10);
    }
  };

  useEffect(() => {
    draw();
  }, [walls, isDrawing, startPoint, currentPoint, lastMeasurement]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentPoint(pos);
    if (tool === 'measure') {
      setLastMeasurement(null);
    }
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
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-zinc-500 border border-zinc-200 shadow-sm">
        Click and drag to draw walls
      </div>
    </div>
  );
};
