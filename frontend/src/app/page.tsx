"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Terminal, CheckCircle2, AlertTriangle, Network, Play, Plus, Minus, Loader2 } from "lucide-react";
import BezierCanvas from "../components/BezierCanvas";
import MathPanel from "../components/MathPanel";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

export default function Home() {
  // Protector de hidratación de Next.js (SSR Guard)
  // Evita que el navegador muestre HTML estático pre-renderizado en el servidor
  // si es que los scripts de hidratación del cliente fallan.
  const [mounted, setMounted] = useState<boolean>(false);

  // Modal de control
  const [showModal, setShowModal] = useState<boolean>(true);
  const [modalExiting, setModalExiting] = useState<boolean>(false);
  const [contentVisible, setContentVisible] = useState<boolean>(false);

  // Cantidad de nodos elegida
  const [numNodos, setNumNodos] = useState<number>(4);
  const [inputNodos, setInputNodos] = useState<number>(4);

  const [puntos, setPuntos] = useState<[number, number][]>([]);
  const [tVal, setTVal] = useState<number>(1.0); 
  const [resolucion] = useState<number>(100);

  // Estados para almacenar el cálculo matemático devuelto por Python
  const [curva, setCurva] = useState<[number, number][]>([]);
  const [pesos, setPesos] = useState<number[][]>([]);
  const [tValores, setTValores] = useState<number[]>([]);

  // Estado unificado de la conexión con el servidor Python
  const [serverState, setServerState] = useState<"loading" | "online" | "offline">("loading");

  // Refs para control de concurrencia y coalescencia de peticiones Fetch
  const isFetchingRef = useRef<boolean>(false);
  const pendingPointsRef = useRef<[number, number][] | null>(null);

  // Registrar el montaje del componente del lado del cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- FETCH DE DATOS DESDE PYTHON BACKEND (COALESCENCIA DE PETICIONES) ---
  const fetchMathFromBackend = useCallback(async (pts: [number, number][]) => {
    if (pts.length < 2) return;
    
    if (isFetchingRef.current) {
      pendingPointsRef.current = pts;
      return;
    }
    
    isFetchingRef.current = true;

    // AbortController para evitar que la petición de cálculo se quede colgada
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    try {
      const response = await fetch(`${BACKEND_URL}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          puntos: pts,
          resolucion: resolucion,
        }),
        cache: "no-store",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setCurva(data.curva);
        setPesos(data.pesos);
        setTValores(data.t_valores);
        setServerState("online");
      } else {
        throw new Error("API Error");
      }
    } catch (e) {
      clearTimeout(timeoutId);
      setServerState("offline");
    } finally {
      isFetchingRef.current = false;
      
      if (pendingPointsRef.current) {
        const nextPts = pendingPointsRef.current;
        pendingPointsRef.current = null;
        fetchMathFromBackend(nextPts);
      }
    }
  }, [resolucion]);

  // Ejecutar petición al cambiar los puntos
  useEffect(() => {
    if (puntos.length >= 2) {
      fetchMathFromBackend(puntos);
    }
  }, [puntos, fetchMathFromBackend]);

  // Comprobar estado de conexión del backend de Python de forma constante (con cache: "no-store" y timeout)
  useEffect(() => {
    const checkConnection = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos de timeout para evitar cuelgues

      try {
        const response = await fetch(`${BACKEND_URL}/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ puntos: [[0, 0], [100, 100]], resolucion: 10 }),
          cache: "no-store",
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setServerState("online");
        } else {
          setServerState("offline");
        }
      } catch (e) {
        clearTimeout(timeoutId);
        setServerState("offline");
      }
    };

    checkConnection();

    // Verificación constante cada 3 segundos
    const connInterval = setInterval(checkConnection, 3000);
    return () => clearInterval(connInterval);
  }, []);

  // Función para generar puntos aleatorios distribuidos a lo largo de X
  const generarPuntosRandom = (total: number) => {
    const pts: [number, number][] = [];
    const minX = 150;
    const maxX = 650;
    const spacing = (maxX - minX) / (total - 1);

    for (let i = 0; i < total; i++) {
      const x = Math.round(minX + i * spacing);
      const y = Math.round(150 + Math.random() * 230);
      pts.push([x, y]);
    }
    return pts;
  };

  // Inicializar el simulador
  const handleGenerate = () => {
    if (inputNodos < 2 || inputNodos > 12) {
      alert("Por favor, ingresa una cantidad de nodos válida entre 2 y 12.");
      return;
    }

    setNumNodos(inputNodos);
    
    const nuevosPuntos = generarPuntosRandom(inputNodos);
    setPuntos(nuevosPuntos);
    setTVal(1.0); // Ver trayectoria completa

    // Iniciar animación suave de salida del modal
    setModalExiting(true);
    setTimeout(() => {
      setShowModal(false);
      setModalExiting(false);
      // Iniciar animación suave de entrada del contenido
      setTimeout(() => {
        setContentVisible(true);
      }, 50);
    }, 300);
  };

  // --- RENDERIZADO CONDICIONAL DE PÁGINAS (FLUJO SPA) ---

  // 0. Si el componente aún no se monta en el navegador, mostramos el cargador básico
  // Esto previene que el SSR de Next.js nos deje atascados en el HTML del servidor si el cliente falla
  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0F19] text-white gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // 1. ESTADO "LOADING" (Carga e inicialización de conexión)
  if (serverState === "loading") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0F19] text-white gap-4 animate-in fade-in duration-200">
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <Network className="absolute w-4 h-4 text-blue-400" />
        </div>
        <span className="text-[10px] text-white/40 tracking-widest uppercase font-bold animate-pulse">
          Esperando conexión con el Servidor Python...
        </span>
      </div>
    );
  }

  // 2. ESTADO "OFFLINE" (Pantalla de bloqueo de servidor inactivo)
  if (serverState === "offline") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0F19] px-4 animate-in fade-in duration-300">
        <div className="max-w-md w-full border border-red-500/10 rounded-2xl bg-red-500/5 p-6 shadow-2xl flex flex-col gap-5 text-center text-red-200">
          <div className="mx-auto bg-red-500/10 border border-red-500/20 p-3 rounded-full w-fit animate-bounce">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Servidor Desconectado</h2>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              Esperando conexión para empezar el flujo de la app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. ESTADO "ONLINE" (Conexión exitosa, renderizar visualizador)
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 relative min-h-screen">
      
      {/* MODAL INICIAL DE SELECCIÓN DE NODOS (Botones +/- de diseño minimalista) */}
      {showModal && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md transition-opacity duration-300 ease-out ${
            modalExiting ? "opacity-0" : "opacity-100"
          }`}
        >
          <div 
            className={`bg-slate-900 border border-white/5 p-6 rounded-2xl w-full max-w-xs shadow-2xl transition-all duration-300 ease-out flex flex-col gap-5 ${
              modalExiting ? "scale-90 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            <div className="text-center flex flex-col items-center gap-3">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/40 p-1.5 flex items-center justify-center shadow-lg select-none">
                <img 
                  src="/Curvas-De-Bezier-Logo.png" 
                  alt="Logo Curvas de Bézier" 
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Puntos de Control</h2>
                <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                  Define la cantidad de puntos iniciales para generar la curva de Bézier.
                </p>
              </div>
            </div>

            {/* Selector +/- CAD minimalista libre de flechas del navegador */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider text-center">Cantidad de Nodos</span>
              <div className="flex items-center justify-between border border-white/5 bg-slate-950/40 rounded-xl px-3 py-2">
                <button
                  type="button"
                  onClick={() => setInputNodos((prev) => Math.max(2, prev - 1))}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition cursor-pointer select-none active:scale-95 animate-in fade-in"
                >
                  <Minus size={12} />
                </button>
                <span className="font-mono text-white text-base font-bold select-none">{inputNodos}</span>
                <button
                  type="button"
                  onClick={() => setInputNodos((prev) => Math.min(12, prev + 1))}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition cursor-pointer select-none active:scale-95 animate-in fade-in"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-white text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition duration-200 flex items-center justify-center gap-1.5"
            >
              <Play size={10} fill="currentColor" />
              <span>Generar Plano</span>
            </button>
          </div>
        </div>
      )}

      {/* Cabecera / Header Minimalista */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/40 p-1.5 flex items-center justify-center shadow-lg select-none">
            <img 
              src="/Curvas-De-Bezier-Logo.png" 
              alt="Logo Curvas de Bézier" 
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-0.5 rounded-full border border-blue-500/20 font-semibold tracking-wider uppercase">
                Álgebra Lineal - UPC
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1 text-white">
              Constructor de Curvas de Bézier
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 max-w-2xl">
              Visualizador interactivo de Curvas de Bézier
            </p>
          </div>
        </div>

        {/* Indicador de Estado de Cómputo en Python */}
        {!showModal && (
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Network size={14} className="text-blue-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] text-white/40 uppercase font-bold tracking-wider leading-none">Motor de Cómputo</span>
                <span className="text-[11px] font-semibold leading-tight text-blue-400">
                  Python (Flask) Conectado
                </span>
              </div>
            </div>
            <CheckCircle2 size={16} className="text-blue-400" />
          </div>
        )}
      </div>

      {/* DISEÑO PRINCIPAL APILADO - ANIMACIÓN DE ENTRADA SUAVE */}
      {!showModal && (
        <div 
          className={`flex flex-col gap-6 transition-all duration-500 ease-out transform ${
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Alerta informativa de éxito */}
          <div className="flex gap-3 bg-green-500/10 border border-green-500/15 p-3 rounded-xl text-green-300 items-center justify-between text-[11px] animate-in fade-in duration-300">
            <span>Puntos iniciales generados en Python. ¡Ya puedes arrastrar nodos, añadir con doble click o hacer click derecho para opciones!</span>
            <button
              onClick={() => {
                setShowModal(true);
                setContentVisible(false);
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 text-white text-[10px] px-2.5 py-1 rounded transition cursor-pointer"
            >
              Cambiar Nodos
            </button>
          </div>

          {/* 1. Visualizador Gráfico 2D */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1 max-w-4xl mx-auto w-full">
              <h2 className="text-sm font-bold text-white/90 uppercase tracking-wider">Plano Cartesiano 2D</h2>
              <div className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-lg font-mono">
                Nodos: <span className="text-blue-400 font-bold">{puntos.length}</span>
              </div>
            </div>
            
            <BezierCanvas
              puntos={puntos}
              setPuntos={setPuntos}
              curva={curva}
              pesos={pesos}
              tValores={tValores}
              tVal={tVal}
              setTVal={setTVal}
              resolucion={resolucion}
              numNodos={numNodos}
            />
          </div>

          {/* 2. Análisis Matemático en la parte inferior */}
          {puntos.length >= 2 && (
            <div className="flex flex-col gap-2 mt-2">
              <h2 className="text-sm font-bold text-white/90 px-1 uppercase tracking-wider max-w-4xl mx-auto w-full">Análisis Matemático</h2>
              <div className="max-w-4xl mx-auto w-full">
                <MathPanel puntos={puntos} />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Pie de Página */}
      <footer className="border-t border-white/5 pt-5 pb-1 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3 mt-auto">
        <span>© 2026 Álgebra Lineal - Grupo 4 - UPC</span>
      </footer>

    </main>
  );
}
