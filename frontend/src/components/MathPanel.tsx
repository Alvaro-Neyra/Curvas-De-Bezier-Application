"use client";

import React from "react";
import katex from "katex";

interface MathPanelProps {
  puntos: [number, number][];
}

export default function MathPanel({ puntos }: MathPanelProps) {
  const n = puntos.length - 1;

  // Combinatoria en local nCr
  const nCr = (n: number, r: number): number => {
    if (r < 0 || r > n) return 0;
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = (res * (n - i + 1)) / i;
    }
    return Math.round(res);
  };

  // Renderizar LaTeX de forma segura usando KaTeX (Modo Bloque/Display)
  const renderLaTeX = (formula: string) => {
    try {
      const html = katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
      });
      return <div className="overflow-x-auto py-1.5" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
      return <div className="text-red-400 text-xs font-mono">Error al renderizar fórmula</div>;
    }
  };

  // Renderizar LaTeX en línea de forma segura (Modo Inline)
  const renderInlineLaTeX = (formula: string) => {
    try {
      const html = katex.renderToString(formula, {
        displayMode: false,
        throwOnError: false,
      });
      return <span className="inline-block align-middle px-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
      return <span className="text-red-400 text-xs font-mono">Error</span>;
    }
  };

  // Helper para generar los términos de Bernstein limpios
  const getBernsteinTerms = (i: number, n: number): string => {
    const comb = nCr(n, i);
    let term = "";
    
    if (comb > 1) {
      term += comb.toString();
    }
    if (i > 0) {
      term += i === 1 ? "t" : `t^{${i}}`;
    }
    if (n - i > 0) {
      const omt = n - i === 1 ? "(1-t)" : `(1-t)^{${n - i}}`;
      term += omt;
    }
    return term;
  };

  // 1. Ecuación Simbólica Total de la Curva: C(t) = P_0(1-t)^n + P_1(...)
  const buildSymbolicEquation = () => {
    const terms: string[] = [];
    for (let i = 0; i <= n; i++) {
      const b = getBernsteinTerms(i, n);
      terms.push(`P_{${i}} ${b}`);
    }
    return `C(t) = ${terms.join(" + ")}, \\quad t \\in [0, 1]`;
  };

  // 2. Ecuación Evaluada Total de la Curva: C(t) = (x0, y0)(1-t)^n + ...
  const buildEvaluatedEquation = () => {
    const terms: string[] = [];
    for (let i = 0; i <= n; i++) {
      const b = getBernsteinTerms(i, n);
      terms.push(`(${puntos[i][0]}, ${puntos[i][1]}) ${b}`);
    }
    return `C(t) = ${terms.join(" + ")}, \\quad t \\in [0, 1]`;
  };

  // Fórmula General de la Curva de Bézier
  const generalFormula = `C(t) = \\sum_{i=0}^{n} B_{i,n}(t) P_i = \\sum_{i=0}^{n} \\binom{n}{i} t^i (1-t)^{n-i} P_i`;

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Tarjeta 1: Ecuación Simbólica Total (con P_i y t) */}
      <div className="p-5 border border-white/5 rounded-2xl bg-slate-900/20 backdrop-blur-md flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            Ecuación Total Simbólica de la Curva
          </h3>
          <p className="text-[11px] text-white/50 mb-3 leading-relaxed">
            Representación vectorial de la curva para <span className="font-mono text-blue-400 font-bold">{puntos.length}</span> puntos de control, combinando las incógnitas físicas {renderInlineLaTeX("P_i")} con las funciones polinómicas de Bernstein correspondientes:
          </p>
        </div>
        <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex items-center justify-center">
          {renderLaTeX(buildSymbolicEquation())}
        </div>
      </div>

      {/* Tarjeta 2: Ecuación Evaluada Total (Coordenadas Reales de P_i) */}
      <div className="p-5 border border-white/5 rounded-2xl bg-slate-900/20 backdrop-blur-md flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            Ecuación Evaluada con Coordenadas Reales
          </h3>
          <p className="text-[11px] text-white/50 mb-3 leading-relaxed">
            La regla de correspondencia resuelta en tiempo real al sustituir las variables {renderInlineLaTeX("P_i")} por las coordenadas cartesianas {renderInlineLaTeX("(x, y)")} actuales de los nodos en el plano:
          </p>
        </div>
        <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex items-center justify-center">
          {renderLaTeX(buildEvaluatedEquation())}
        </div>
      </div>

      {/* Tarjeta 3: Fórmula de Definición General */}
      <div className="p-5 border border-white/5 rounded-2xl bg-slate-900/20 backdrop-blur-md flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            Fórmula de Definición General
          </h3>
          <p className="text-[11px] text-white/50 mb-3 leading-relaxed">
            Definición matemática formal de una curva de Bézier de grado {renderInlineLaTeX("n")} en el espacio:
          </p>
        </div>
        <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex items-center justify-center">
          {renderLaTeX(generalFormula)}
        </div>
      </div>

    </div>
  );
}
