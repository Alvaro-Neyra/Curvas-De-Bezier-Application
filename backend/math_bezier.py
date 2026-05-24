import math

def nCr(n, r):
    """Calcula el coeficiente binomial nCr."""
    return math.comb(n, r)

def polinomio_bernstein(i, n, t):
    """Calcula el valor del polinomio de Bernstein B_{i,n}(t)."""
    return nCr(n, i) * (t ** i) * ((1.0 - t) ** (n - i))

def calcular_curva_y_pesos(puntos_control, resolucion):
    """
    Calcula las coordenadas de la curva de Bézier y la matriz de pesos (Bernstein).
    puntos_control: Lista de listas [[x, y], [x, y], ...]
    resolucion: Cantidad de pasos en el parámetro t entre 0 y 1.
    """
    n = len(puntos_control) - 1
    t_valores = [i / (resolucion - 1) for i in range(resolucion)]
    
    curva = []
    pesos_totales = []
    
    for t in t_valores:
        punto_t = [0.0, 0.0]
        pesos_t = []
        for i in range(len(puntos_control)):
            peso = polinomio_bernstein(i, n, t)
            pesos_t.append(peso)
            punto_t[0] += peso * puntos_control[i][0]
            punto_t[1] += peso * puntos_control[i][1]
        curva.append(punto_t)
        pesos_totales.append(pesos_t)
        
    return curva, pesos_totales, t_valores