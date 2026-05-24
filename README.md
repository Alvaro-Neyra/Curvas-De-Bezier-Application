# Bézier Curve Builder 🚀 (Next.js + Python/Flask)

Este es un constructor y visualizador interactivo de **Curvas de Bézier** de grado ilimitado, diseñado con una estética aeroespacial aero-glass y optimizado para el curso de **Álgebra Lineal** (UPC). 

El proyecto adopta una **arquitectura híbrida pura**: toda la lógica matemática de Bernstein y combinación lineal se ejecuta en tiempo real en un servidor en **Python (Flask)**, mientras que la interfaz gráfica interactiva 2D y el panel de análisis KaTeX se renderizan fluidamente en **React/Next.js (TypeScript)** a 60 FPS libres de lag mediante técnicas avanzadas de coalescencia de peticiones en red.

---

## 🎨 Características Destacadas

*   **100% Python Math Backend:** Desacoplamiento absoluto de la física y álgebra de la curva. Los cálculos de Bernstein se ejecutan exclusivamente en Python.
*   **Lienzo Cartesiano 2D Interactivo:**
    *   Arrastre de nodos de control con inercia física.
    *   **Doble Clic:** Añadir nuevos puntos de control de forma dinámica e ilimitada, incrementando el grado de la curva.
    *   **Clic Derecho:** Menú contextual para eliminar nodos existentes.
*   **Suite de Cursores CAD Globales:** El cursor del sistema se oculta en favor de un puntero vectorial de alta precisión diseñado por hardware con inercia por L.E.R.P. (Linear Interpolation). Cambia de estado dinámicamente según el contexto (libre, hover-agarre, arrastrando, colocando puntos, y opciones con click derecho).
*   **Análisis Matemático Dinámico (KaTeX):** Deduce y muestra en tiempo real tres representaciones de la curva:
    1.  **Fórmula General** de Bézier basada en sumatorias y polinomios.
    2.  **Ecuación Simbólica Resultante** desglosada dinámicamente en base a $P_i$ y $t$.
    3.  **Ecuación Evaluada en Tiempo Real** reemplazando las coordenadas $(x, y)$ de los puntos de control móviles.
*   **Slider de Parámetro $t$:** Explora $t \in [0, 1]$ con una animación fluida (`autotrazado` de la curva en azul neón) mostrando las **Líneas de Influencia** proyectadas hacia cada punto con opacidad dinámica según los pesos de Bernstein calculados en Python.
*   **Offline Connection Blocker:** Interfaz de bloqueo segura si el backend en Python está desconectado, reanudando de forma automática en cuanto detecta el servidor activo.

---

## 🏗️ Arquitectura del Software

```text
[Frontend: Next.js (Vercel)] ──(POST /calculate JSON)──> [Backend: Flask (Render / PythonAnywhere)]
[                          ] <──(Curva y Pesos Bernstein)── [                                   ]
```

*   **Frontend:** React 19 / Next.js 16 (Webpack Compiler), Tailwind CSS, KaTeX.
*   **Backend:** Python 3.10+, Flask, Gunicorn (servidor WSGI en producción).

---

## 🚀 Instalación y Ejecución Local

### 1. Iniciar el Backend (Python)
1.  Ingresa a la carpeta `backend`:
    ```bash
    cd backend
    ```
2.  Crea un entorno virtual (opcional pero recomendado) e instala las dependencias:
    ```bash
    python -m venv .venv
    # En Windows:
    .venv\Scripts\activate
    # En macOS/Linux:
    source .venv/bin/activate

    pip install -r requirements.txt
    ```
3.  Inicia el servidor Flask:
    ```bash
    python app.py
    ```
    *El servidor estará activo y escuchando en `http://127.0.0.1:5000`.*

### 2. Iniciar el Frontend (Next.js)
1.  Abre una nueva terminal e ingresa a la carpeta `frontend`:
    ```bash
    cd frontend
    ```
2.  Instala las dependencias de Node:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo en modo Webpack estable:
    ```bash
    npm run dev
    ```
4.  Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 🌐 Guía de Despliegue en Producción (100% Gratis)

Para subir el proyecto a la nube y compartirlo de forma pública:

### 1. Backend en Python (Render)
*   Crea una cuenta gratuita en [Render.com](https://render.com) enlazada a GitHub.
*   Crea un **Web Service**, selecciona el repositorio y define la carpeta raíz como `backend`.
*   **Build Command:** `pip install -r requirements.txt`
*   **Start Command:** `gunicorn app:app`
*   Selecciona el plan **Free** y presiona desplegar. Al finalizar, Render te dará una URL pública tipo `https://tu-backend.onrender.com`.

### 2. Frontend en React (Vercel)
*   Crea una cuenta gratuita en [Vercel.com](https://vercel.com) enlazada a GitHub.
*   Importa tu repositorio, define la carpeta raíz como `frontend`.
*   Despliega **Environment Variables** e introduce la siguiente variable de entorno:
    *   **Key:** `NEXT_PUBLIC_BACKEND_URL`
    *   **Value:** La URL de tu backend en Render (ej. `https://tu-backend.onrender.com`).
*   Haz clic en **Deploy** y tu aplicación estará publicada y enlazada automáticamente a nivel mundial con HTTPS.

---

## 👥 Autores
*   **Álgebra Lineal** - UPC (Grupo 4)
