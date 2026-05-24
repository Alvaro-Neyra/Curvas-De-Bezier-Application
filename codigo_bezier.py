import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import numpy as np
import math


# --- FUNCIONES MATEMÁTICAS ---

def nCr(n, r):
    return math.comb(n, r)


def polinomio_bernstein(i, n, t):

    return nCr(n, i) * (t ** i) * (1 - t) ** (n - i)


def calcular_con_pesos(puntos_control, t_valores):

    n = len(puntos_control) - 1
    curva = []
    pesos_totales = []

    for t in t_valores:
        punto_t = np.array([0.0, 0.0])
        pesos_t = []
        for i in range(len(puntos_control)):
            peso = polinomio_bernstein(i, n, t)
            pesos_t.append(peso)
            punto_t += peso * np.array(puntos_control[i])
        curva.append(punto_t)
        pesos_totales.append(pesos_t)

    return np.array(curva), np.array(pesos_totales)


# --- MENÚ ---
print("=== GENERADOR ANIMADO DE BÉZIER (TEORÍA DE BERNSTEIN) ===")
print("Graficación de la curva a través de pesos obtenidos")

try:
    n_puntos = int(input("\nDefine la cantidad de puntos de control: "))
    puntos = []
    for i in range(n_puntos):
        x = float(input(f"  Coordenada X del punto P{i}: "))
        y = float(input(f"  Coordenada Y del punto P{i}: "))
        puntos.append([x, y])

    resolucion = int(input("¿Resolución de la curva? (pasos de t): "))
except ValueError:
    print("Error: Ingresa números válidos.")
    exit()

# Pre-cálculo de datos
t_valores = np.linspace(0, 1, resolucion)
curva, pesos = calcular_con_pesos(puntos, t_valores)

# --- CONFIGURACIÓN DE LA ANIMACIÓN ---
fig, ax = plt.subplots(figsize=(10, 7))
ax.grid(True, linestyle=':', alpha=0.6)
ax.set_title(f"Influencia de Vectores de Control (Bézier Grado {n_puntos - 1})")

# Elementos estáticos (el fondo)
px, py = zip(*puntos)
ax.plot(px, py, '--', color='gray', alpha=0.3, label='Polígono de Control')
for i, p in enumerate(puntos):
    ax.text(p[0], p[1] + 0.3, f'P{i}', fontweight='bold')

# Elementos que se actualizarán (la animación)
linea_curva, = ax.plot([], [], color='red', linewidth=3, label='Curva de Bézier')
punto_actual, = ax.plot([], [], 'ro', markersize=8)

# Creamos una lista para guardar las "líneas de influencia" (rubber bands)
# Usaremos colores distintos para identificar qué vector está 'jalando'
colores_influencia = plt.cm.tab10(np.linspace(0, 1, n_puntos))
lineas_influencia = []
for i in range(n_puntos):
    ln, = ax.plot([], [], color=colores_influencia[i], linestyle='-', linewidth=1, alpha=0)
    lineas_influencia.append(ln)

ax.legend(loc='upper left')


# Función de inicialización
def init():
    linea_curva.set_data([], [])
    punto_actual.set_data([], [])
    for ln in lineas_influencia:
        ln.set_data([], [])
        ln.set_alpha(0)  # Invisible al inicio
    return [linea_curva, punto_actual] + lineas_influencia


# Función que actualiza cada frame (cuadro)
def update(frame):
    # Punto actual sobre la curva B(t)
    bx, by = curva[frame, 0], curva[frame, 1]
    punto_actual.set_data([bx], [by])

    # Dibujar el rastro de la curva hasta este punto
    linea_curva.set_data(curva[:frame + 1, 0], curva[:frame + 1, 1])

    # Visualizar el 'proceso de combinación lineal' de Bernstein
    pesos_frame = pesos[frame]
    n = len(puntos) - 1

    # Actualizar las rubber bands (líneas de influencia)
    for i in range(len(puntos)):
        px_vector, py_vector = puntos[i][0], puntos[i][1]

        # Línea del punto en la curva B(t) hacia el vector P_i
        lineas_influencia[i].set_data([bx, px_vector], [by, py_vector])

        # El peso B_{i,n}(t) controla la opacidad (alpha) de la línea
        # Si el peso es alto, la línea es muy visible. Si es bajo, desaparece.
        lineas_influencia[i].set_alpha(pesos_frame[i])

    return [linea_curva, punto_actual] + lineas_influencia


# Crear la animación
anim = FuncAnimation(fig, update, frames=resolucion, init_func=init, blit=True, interval=50)

print("\n[INFO] Animación generada. Cierra la ventana para continuar.")
plt.show()
