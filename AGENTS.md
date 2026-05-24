# AGENTS.md: Especificación Final y Simplificada (Bézier Python + Web)
## Proyecto: Constructor y Visualizador Interactivo de Curvas de Bézier

Este documento define la arquitectura definitiva y simplificada de la aplicación. Se enfoca estrictamente en los requisitos del curso de **Álgebra Lineal** y en la integración de una interfaz web con el motor matemático programado en **Python**, respetando todas las especificaciones y simplificaciones del usuario.

---

## 1. Objetivos del Proyecto (Enfoque Híbrido Web-Python)

El propósito es migrar la visualización a una interfaz web interactiva premium utilizando **React** en el frontend, manteniendo el **motor matemático 100% en Python** en el backend para realizar los cálculos de la curva:
1. **Lógica de Bézier en Python**: Todo cálculo matemático de polinomios de Bernstein, combinación lineal y coordenadas de la curva se ejecuta en Python.
2. **Interfaz Web Interactiva**: Un plano 2D para interactuar y arrastrar puntos de control en tiempo real, permitiendo **agregar dinámicamente más puntos** para aumentar el grado de la curva.
3. **Representación Matricial e Ecuaciones**: Mostrar la ecuación paramétrica formal y el desglose de matrices ($C(t) = T \cdot M \cdot P$) del informe.

*Nota:* Se eliminan por completo el algoritmo de De Casteljau y el banco de presets de pruebas para simplificar al máximo el alcance y evitar complejidades.

---

## 2. Requisitos Funcionales Definitivos (Foco en el Objetivo)

| ID | Módulo / Requisito | Funcionalidad Clave |
| :--- | :--- | :--- |
| **RF-01** | **Plano 2D Interactivo** | Lienzo (Canvas) donde el usuario arrastra puntos existentes, **agrega nuevos puntos con doble clic** (ilimitados, incrementando el grado de la curva) y elimina puntos con clic derecho. |
| **RF-02** | **Motor de Cálculo (Backend Python)** | Un servidor liviano en Python (Flask o FastAPI) que recibe los puntos de control desde la web, calcula la curva con polinomios de Bernstein y devuelve los datos en JSON. |
| **RF-03** | **Simulador de Parámetro $t$** | Slider interactivo para explorar $t \in [0, 1]$ mostrando el punto móvil y las líneas de influencia hacia cada punto de control con opacidades dinámicas basadas en los pesos calculados en Python. |
| **RF-04** | **Ecuación Paramétrica Dinámica** | Deducción matemática y visualización en tiempo real de las ecuaciones paramétricas $x(t)$ e $y(t)$ usando KaTeX en la interfaz. |
| **RF-05** | **Área de Álgebra Lineal (Matricial)** | Visualización interactiva del cálculo de matrices $C(t) = T \cdot M \cdot P$ para grados 1, 2 y 3. |

---

## 3. Arquitectura del Software Híbrida

La aplicación interactúa a través de una API REST local ultra-rápida:

```text
[Frontend: React/Next.js] ──(Puntos de Control JSON)──> [Backend: Python (Flask)]
[                      ] <──(Curva y Pesos Bernstein)── [                      ]
```

### 3.1 Tecnologías Clave
*   **Frontend**: React (modo cliente) estilizado con Tailwind CSS (modo oscuro aeroespacial) y HTML5 Canvas para graficación fluida.
*   **Backend**: Python (Flask o FastAPI) que reutiliza y extiende las funciones matemáticas del script original `codigo_bezier.py`.
*   **Comunicación**: Fetch API / REST en formato JSON.

### 3.2 Estructura de Archivos
```text
curvas-de-bezier/
├── backend/
│   ├── app.py             # Servidor API Flask (Lógica de Bernstein en Python)
│   └── math_bezier.py     # Lógica matemática adaptada de codigo_bezier.py
├── src/
│   ├── app/
│   │   ├── layout.tsx     # Setup de fuentes y metadatos
│   │   └── page.tsx       # Dashboard e interactividad
│   ├── components/
│   │   ├── BezierCanvas.tsx # Canvas interactivo (eventos mouse, render de curvas)
│   │   └── MathPanel.tsx    # Panel de ecuaciones LaTeX y representación matricial
└── package.json
```

---

## 4. Plan de Trabajo Definitivo

*   **Paso 1: Backend en Python**:
    - Crear la API en Flask en `backend/app.py`.
    - Adaptar `codigo_bezier.py` para exponer un endpoint `/calculate` que reciba puntos de control y devuelva la curva y los pesos de Bernstein en JSON.
*   **Paso 2: Frontend y Lienzo Interactivo**:
    - Desarrollar el plano interactivo en React.
    - Implementar el soporte para arrastrar, añadir (doble clic) y remover (clic derecho) puntos de control de forma ilimitada.
    - Conectar el Canvas con el backend de Python para actualizar la curva al realizar cualquier cambio.
*   **Paso 3: Ecuaciones, Matrices y Animación**:
    - Añadir el slider de $t$ con las líneas de influencia dinámicas (opacidad según los pesos de Python).
    - Mostrar la ecuación analítica y el desglose de matrices en la interfaz con KaTeX.
