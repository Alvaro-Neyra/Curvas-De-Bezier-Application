"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface BezierCanvasProps {
  puntos: [number, number][];
  setPuntos: React.Dispatch<React.SetStateAction<[number, number][]>>;
  curva: [number, number][];
  pesos: number[][];
  tValores: number[];
  tVal: number;
  setTVal: React.Dispatch<React.SetStateAction<number>>;
  resolucion: number;
  numNodos: number;
}

export default function BezierCanvas({
  puntos,
  setPuntos,
  curva,
  pesos,
  tValores,
  tVal,
  setTVal,
  resolucion,
  numNodos,
}: BezierCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Estados para el cursor virtual personalizado al estilo CAD de la app
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Estado para el menú contextual personalizado
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    pointIndex: number;
  } | null>(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const POINT_RADIUS = 8;
  const CLICK_TOLERANCE = 12;

  const isPlacing = puntos.length < numNodos;

  // Manejo de reproducción automática de la animación de t
  useEffect(() => {
    if (isPlaying) {
      const step = () => {
        setTVal((prev) => {
          if (prev >= 1.0) {
            setTimeout(() => setIsPlaying(false), 0);
            return 1.0;
          }
          return Math.min(1.0, prev + 0.005);
        });
        animationRef.current = requestAnimationFrame(step);
      };
      animationRef.current = requestAnimationFrame(step);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, setTVal]);

  // Dibujar todo en el Canvas (Estética Minimalista Azul)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Limpiar pantalla
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Dibujar rejilla de fondo (Grid minimalista y fino)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Índice correspondiente al valor actual de t
    let tIndex = 0;
    if (tValores.length > 0) {
      let minDiff = 999;
      for (let i = 0; i < tValores.length; i++) {
        const diff = Math.abs(tValores[i] - tVal);
        if (diff < minDiff) {
          minDiff = diff;
          tIndex = i;
        }
      }
    }

    const puntoActualCurva = curva[tIndex] || null;

    // 3. Dibujar "Líneas de Influencia" (Subtles en Azul Minimalista)
    if (puntoActualCurva && pesos[tIndex]) {
      puntos.forEach((p, idx) => {
        const peso = pesos[tIndex][idx] || 0.0;
        if (peso > 0.01) {
          ctx.beginPath();
          ctx.moveTo(puntoActualCurva[0], puntoActualCurva[1]);
          ctx.lineTo(p[0], p[1]);
          
          ctx.strokeStyle = `rgba(59, 130, 246, ${peso * 0.35})`;
          ctx.lineWidth = 1.0 * peso + 0.5;
          ctx.stroke();
        }
      });
    }

    // 4. Dibujar Polígono de Control (Dashed line ultra-fina)
    if (puntos.length > 1) {
      ctx.beginPath();
      ctx.moveTo(puntos[0][0], puntos[0][1]);
      for (let i = 1; i < puntos.length; i++) {
        ctx.lineTo(puntos[i][0], puntos[i][1]);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }

    // 5. Dibujar la Trayectoria Completa de la Curva (Fondo atenuado)
    if (curva.length > 1) {
      ctx.beginPath();
      ctx.moveTo(curva[0][0], curva[0][1]);
      for (let i = 1; i < curva.length; i++) {
        ctx.lineTo(curva[i][0], curva[i][1]);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // 6. Dibujar la Animación de la Curva (Trazado Azul Eléctrico Minimalista y Nítido)
    if (curva.length > 1 && tIndex > 0) {
      ctx.beginPath();
      ctx.moveTo(curva[0][0], curva[0][1]);
      for (let i = 1; i <= tIndex; i++) {
        ctx.lineTo(curva[i][0], curva[i][1]);
      }
      
      ctx.strokeStyle = "#3B82F6"; 
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 7. Dibujar los Puntos de Control (Nodos estilo CAD minimalista)
    puntos.forEach((p, idx) => {
      const isFirstOrLast = idx === 0 || idx === puntos.length - 1;
      
      ctx.beginPath();
      ctx.arc(p[0], p[1], POINT_RADIUS, 0, 2 * Math.PI);
      
      ctx.fillStyle = "#0F172A";
      ctx.fill();
      
      ctx.strokeStyle = isFirstOrLast ? "#3B82F6" : "#60A5FA";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "500 11px system-ui, sans-serif";
      ctx.fillText(`P${idx}`, p[0] - 8, p[1] - 14);
    });

  }, [puntos, curva, pesos, tValores, tVal]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (contextMenu) {
      setContextMenu(null);
    }

    if (e.button !== 0) return; // Solo click izquierdo
    const { x, y } = getCoordinates(e);
    
    if (isPlacing) {
      setPuntos((prev) => [...prev, [Math.round(x), Math.round(y)]]);
      return;
    }

    let foundIdx = -1;
    puntos.forEach((p, idx) => {
      const dist = Math.sqrt((p[0] - x) ** 2 + (p[1] - y) ** 2);
      if (dist <= CLICK_TOLERANCE) {
        foundIdx = idx;
      }
    });

    if (foundIdx !== -1) {
      setDraggedIndex(foundIdx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordinates(e);
    setMousePos([x, y]);

    // Buscar si estamos haciendo hover sobre un punto de control
    let foundHoverIdx = -1;
    puntos.forEach((p, idx) => {
      const dist = Math.sqrt((p[0] - x) ** 2 + (p[1] - y) ** 2);
      if (dist <= CLICK_TOLERANCE) {
        foundHoverIdx = idx;
      }
    });
    setHoveredIndex(foundHoverIdx !== -1 ? foundHoverIdx : null);

    if (draggedIndex === null) return;
    
    const boundedX = Math.max(POINT_RADIUS, Math.min(CANVAS_WIDTH - POINT_RADIUS, x));
    const boundedY = Math.max(POINT_RADIUS, Math.min(CANVAS_HEIGHT - POINT_RADIUS, y));

    setPuntos((prev) => {
      const next = [...prev];
      next[draggedIndex] = [Math.round(boundedX), Math.round(boundedY)];
      return next;
    });
  };

  const handleMouseUpOrLeave = () => {
    setDraggedIndex(null);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordinates(e);
    setMousePos([x, y]);
  };

  const handleMouseLeave = () => {
    setDraggedIndex(null);
    setMousePos(null);
    setHoveredIndex(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlacing) return;
    const { x, y } = getCoordinates(e);
    
    let clickedPoint = false;
    puntos.forEach((p) => {
      const dist = Math.sqrt((p[0] - x) ** 2 + (p[1] - y) ** 2);
      if (dist <= CLICK_TOLERANCE) {
        clickedPoint = true;
      }
    });

    if (!clickedPoint) {
      setPuntos((prev) => [...prev, [Math.round(x), Math.round(y)]]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); 
    if (isPlacing) return;

    const { x, y } = getCoordinates(e);

    let clickedIdx = -1;
    puntos.forEach((p, idx) => {
      const dist = Math.sqrt((p[0] - x) ** 2 + (p[1] - y) ** 2);
      if (dist <= CLICK_TOLERANCE) {
        clickedIdx = idx;
      }
    });

    if (clickedIdx !== -1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      setContextMenu({
        x: clickX,
        y: clickY,
        pointIndex: clickedIdx,
      });
    }
  };

  const handleEliminarNodo = (idx: number) => {
    if (puntos.length > 2) {
      setPuntos((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleReset = () => {
    setPuntos([]);
    setTVal(1.0);
    setIsPlaying(false);
  };

  // Determinar el cursor dinámico para el Canvas
  let currentCursor = "canvas-free";
  if (contextMenu !== null) {
    currentCursor = puntos.length > 2 ? "options-can-delete" : "options-cannot-delete";
  } else if (isPlacing) {
    currentCursor = "placing";
  } else if (draggedIndex !== null) {
    currentCursor = "grabbing";
  } else if (hoveredIndex !== null) {
    currentCursor = "grab";
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full relative">
      
      {/* Contenedor del Lienzo con Relación de Aspecto Fija (8:5) y Centrado */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/30 shadow-2xl max-w-4xl mx-auto w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          data-cursor={currentCursor}
          className="w-full h-auto block cursor-none"
        />
        
        {/* Indicaciones Rápidas contextuales */}
        <div className="absolute top-4 right-4 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md text-[10px] text-white/40 flex gap-4 pointer-events-none select-none">
          {isPlacing ? (
            <span className="text-blue-400 animate-pulse font-semibold">
              Ubica {numNodos - puntos.length} puntos haciendo clic en el plano
            </span>
          ) : (
            <>
              <span>🖱️ Arrastrar puntos</span>
              <span>🔘 Doble click: Añadir</span>
              <span>🖱️ Click derecho: Opciones</span>
            </>
          )}
        </div>

        {/* Menú Contextual Personalizado en HTML */}
        {contextMenu && (
          <div
            className="absolute bg-slate-900/90 border border-white/10 rounded-xl py-1 px-1 shadow-2xl z-50 text-[11px] flex flex-col backdrop-blur-lg animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: `${contextMenu.y + 10}px`,
              left: `${contextMenu.x + 10}px`,
            }}
          >
            <button
              onClick={() => {
                handleEliminarNodo(contextMenu.pointIndex);
                setContextMenu(null);
              }}
              disabled={puntos.length <= 2}
              className="w-full text-left px-3 py-1.5 hover:bg-red-600 hover:text-white rounded-lg transition duration-150 text-red-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-red-400 cursor-pointer"
            >
              Eliminar Nodo
            </button>
          </div>
        )}
      </div>

      {/* Controles del Slider de t y Animación */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 border border-white/5 rounded-2xl bg-slate-900/20 backdrop-blur-md max-w-4xl mx-auto w-full select-none">
        
        {/* Botones de reproducción */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isPlacing) return;
              if (tVal >= 1.0) {
                setTVal(0.0);
              }
              setIsPlaying(!isPlaying);
            }}
            disabled={isPlacing}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold transition duration-200 cursor-pointer shadow-lg shadow-blue-500/10"
            title={isPlaying ? "Pausar" : "Trazar trayectoria"}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          
          <button
            onClick={() => {
              setIsPlaying(false);
              setTVal(0.0);
            }}
            disabled={isPlacing}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/5 text-white transition duration-200 cursor-pointer"
            title="Reiniciar a t=0"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Deslizador del Parámetro t */}
        <div className="flex-1 w-full flex items-center gap-3 px-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={tVal}
            disabled={isPlacing}
            onChange={(e) => {
              setIsPlaying(false);
              setTVal(parseFloat(e.target.value));
            }}
            className="grow accent-blue-500 h-1 bg-white/10 disabled:opacity-30 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] text-white/40 font-mono">{`t = ${tVal}`}</span>
        </div>
      </div>
    </div>
  );
}
