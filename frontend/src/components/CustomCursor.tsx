"use client";

import React, { useState, useEffect, useRef } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [cursorType, setCursorType] = useState<string>("default");
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mousePosRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Activar cursor e invisibilizar nativo al montar
    setIsVisible(true);
    document.body.classList.add("custom-cursor-active");

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Detección de Canvas Bézier y herencia de data-cursor
      const customCursorEl = target.closest("[data-cursor]");
      if (customCursorEl) {
        const type = customCursorEl.getAttribute("data-cursor");
        setCursorType(type || "default");
        return;
      }

      // 2. Detección de Inputs de Texto o Textareas
      const isTextInput =
        (target.tagName === "INPUT" &&
          ["text", "number", "email", "password", "search", "tel", "url"].includes(
            (target as HTMLInputElement).type
          )) ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTextInput) {
        setCursorType("text");
        return;
      }

      // 3. Detección de Botones y Elementos Interactivos
      const isInteractive =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "SELECT" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest('[role="button"]') ||
        target.classList.contains("cursor-pointer") ||
        (target as HTMLInputElement).type === "range" ||
        window.getComputedStyle(target).cursor === "pointer";

      if (isInteractive) {
        setCursorType("pointer");
        return;
      }

      setCursorType("default");
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);
    const handleMouseLeaveWindow = () => setIsVisible(false);
    const handleMouseEnterWindow = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeaveWindow);
    document.addEventListener("mouseenter", handleMouseEnterWindow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeaveWindow);
      document.removeEventListener("mouseenter", handleMouseEnterWindow);
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  // Interpolación suave del seguidor (Trail)
  useEffect(() => {
    let animId: number;
    const updateTrail = () => {
      setTrailPos((prev) => {
        const dx = mousePosRef.current.x - prev.x;
        const dy = mousePosRef.current.y - prev.y;
        return {
          x: prev.x + dx * 0.18,
          y: prev.y + dy * 0.18,
        };
      });
      animId = requestAnimationFrame(updateTrail);
    };
    animId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!isVisible) return null;

  // Renderizado del cursor dependiendo del tipo
  return (
    <>
      {/* Estilos CSS globales inyectados dinámicamente para forzar cursor-none de manera controlada */}
      <style jsx global>{`
        @media (pointer: fine) {
          .custom-cursor-active,
          .custom-cursor-active * {
            cursor: none !important;
          }
        }
      `}</style>

      {/* 1. Punto Central Instantáneo (Seguidor directo del Mouse sin retraso) */}
      {cursorType !== "options-can-delete" && cursorType !== "options-cannot-delete" && (
        <div
          className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            transform: `translate(-50%, -50%) scale(${isClicked ? 0.7 : 1})`,
          }}
        >
          {cursorType === "text" ? (
            // I-Beam text cursor
            <div className="flex flex-col items-center select-none">
              <div className="w-1.5 h-[1px] bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
              <div className="w-[1.5px] h-4 bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
              <div className="w-1.5 h-[1px] bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
            </div>
          ) : (
            // Dot cursor standard
            <div
              className={`rounded-full transition-all duration-200 ${
                cursorType === "pointer"
                  ? "w-2.5 h-2.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  : cursorType === "grabbing"
                  ? "w-2 h-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                  : "w-1.5 h-1.5 bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"
              }`}
            />
          )}
        </div>
      )}

      {/* 2. Anillo Exterior con Interpolación Suave (Trail con inercia de lerp) */}
      <div
        className="fixed pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center select-none"
        style={{
          left: `${trailPos.x}px`,
          top: `${trailPos.y}px`,
        }}
      >
        {/* Renderizado condicional del aro / retícula externa */}
        {cursorType === "default" && (
          <div
            className={`border border-blue-500/30 rounded-full transition-all duration-200 ${
              isClicked ? "w-4 h-4 border-blue-400/50 bg-blue-500/5" : "w-6 h-6"
            }`}
          />
        )}

        {cursorType === "pointer" && (
          <div
            className={`border border-cyan-400/50 rounded-full bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 ${
              isClicked ? "w-6 h-6 border-cyan-300" : "w-10 h-10 animate-pulse"
            }`}
          />
        )}

        {cursorType === "canvas-free" && (
          <div className="relative w-8 h-8 border border-white/10 rounded-full flex items-center justify-center transition-all duration-200">
            {/* Pequeñas guías cardinales estilo CAD */}
            <div className="absolute w-[2px] h-[6px] bg-white/20 top-0 left-1/2 -translate-x-1/2" />
            <div className="absolute w-[2px] h-[6px] bg-white/20 bottom-0 left-1/2 -translate-x-1/2" />
            <div className="absolute w-[6px] h-[2px] bg-white/20 left-0 top-1/2 -translate-y-1/2" />
            <div className="absolute w-[6px] h-[2px] bg-white/20 right-0 top-1/2 -translate-y-1/2" />
          </div>
        )}

        {cursorType === "placing" && (
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Concentric rings */}
            <div className="absolute w-10 h-10 border border-blue-400/20 rounded-full animate-spin [animation-duration:10s]" />
            <div className="absolute w-6 h-6 border border-blue-400/40 rounded-full" />
            {/* Ticks cardinales */}
            <div className="absolute w-[1.5px] h-[5px] bg-blue-400/60 top-[1px] left-1/2 -translate-x-1/2" />
            <div className="absolute w-[1.5px] h-[5px] bg-blue-400/60 bottom-[1px] left-1/2 -translate-x-1/2" />
            <div className="absolute w-[5px] h-[1.5px] bg-blue-400/60 left-[1px] top-1/2 -translate-y-1/2" />
            <div className="absolute w-[5px] h-[1.5px] bg-blue-400/60 right-[1px] top-1/2 -translate-y-1/2" />
            {/* Text tooltip */}
            <span className="absolute left-7 text-[8px] font-mono font-black tracking-widest text-blue-400 drop-shadow-md select-none bg-slate-900/60 px-1 py-0.5 rounded border border-blue-500/10">
              +ADD
            </span>
          </div>
        )}

        {cursorType === "grab" && (
          <div className="relative w-9 h-9 flex items-center justify-center transition-transform duration-200">
            {/* Círculo central */}
            <div className="w-6 h-6 border-2 border-blue-500 rounded-full bg-blue-500/10" />
            <div className="absolute w-8 h-8 border border-white/5 rounded-full border-dashed" />
            
            {/* 4 cardinal arrows */}
            <svg
              className="absolute w-9 h-9 text-blue-400 animate-in fade-in zoom-in-50 duration-200"
              viewBox="0 0 36 36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              {/* Norte */}
              <path d="M18 10L18 3 M15 6L18 3L21 6" />
              {/* Sur */}
              <path d="M18 26L18 33 M15 30L18 33L21 30" />
              {/* Oeste */}
              <path d="M10 18L3 18 M6 15L3 18L6 21" />
              {/* Este */}
              <path d="M26 18L33 18 M30 15L33 18L30 21" />
            </svg>
            <span className="absolute left-8 text-[8px] font-mono font-black tracking-wider text-blue-400 drop-shadow-md bg-slate-900/60 px-1 py-0.5 rounded border border-blue-500/10">
              GRAB
            </span>
          </div>
        )}

        {cursorType === "grabbing" && (
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Shockwave ripple */}
            <div className="absolute w-10 h-10 border border-blue-500/50 bg-blue-500/10 rounded-full animate-ping [animation-duration:1.5s]" />
            <div className="absolute w-8 h-8 border-2 border-blue-400 rounded-full bg-blue-600/20" />
            
            {/* Locked grip arrows (pointing inward) */}
            <svg
              className="absolute w-8 h-8 text-blue-300"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              {/* Norte */}
              <path d="M16 3L16 8 M13 6L16 8L19 6" />
              {/* Sur */}
              <path d="M16 29L16 24 M13 26L16 24L19 26" />
              {/* Oeste */}
              <path d="M3 16L8 16 M6 13L8 16L6 19" />
              {/* Este */}
              <path d="M29 16L24 16 M26 13L24 16L26 19" />
            </svg>
            <span className="absolute left-9 text-[8px] font-mono font-black tracking-wider text-blue-400 drop-shadow-md bg-slate-900/60 px-1 py-0.5 rounded border border-blue-500/10">
              DRAG
            </span>
          </div>
        )}

        {(cursorType === "options-can-delete" || cursorType === "options-cannot-delete") && (
          <div className="relative select-none flex items-start">
            {/* Custom high-tech precision arrow */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="drop-shadow-lg filter"
            >
              <path
                d="M4 3l3.5 16.5 3.5-5.5 5.5 5.5 2-2-5.5-5.5 5.5-3.5z"
                fill="#3B82F6"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Action bubble beside the arrow */}
            <div className="absolute left-5 top-5 flex items-center justify-center">
              {cursorType === "options-can-delete" ? (
                // Trash icon or deletion indicator bubble
                <div className="w-5 h-5 rounded-full bg-red-500 border border-white flex items-center justify-center shadow-lg animate-in zoom-in duration-150">
                  <div className="w-2.5 h-[2px] bg-white rounded" />
                </div>
              ) : (
                // Restricted bubble
                <div className="w-5 h-5 rounded-full bg-slate-800 border border-red-500 flex items-center justify-center shadow-lg animate-in zoom-in duration-150">
                  <svg
                    className="w-3.5 h-3.5 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M18.3 5.7L5.7 18.3" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
