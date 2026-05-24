from flask import Flask, request, jsonify
from math_bezier import calcular_curva_y_pesos

app = Flask(__name__)

# Configuración manual de CORS para evitar dependencias de terceros (como flask-cors)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

@app.route('/calculate', methods=['POST', 'OPTIONS'])
def calculate():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200
        
    try:
        data = request.get_json()
        if not data or 'puntos' not in data:
            return jsonify({"error": "Falta el parámetro 'puntos' en la solicitud"}), 400
            
        puntos = data['puntos']
        resolucion = data.get('resolucion', 100)
        
        if not isinstance(puntos, list) or len(puntos) == 0:
            return jsonify({"error": "El parámetro 'puntos' debe ser una lista no vacía"}), 400
            
        # Calcular puntos de la curva y pesos de Bernstein en Python
        curva, pesos, t_valores = calcular_curva_y_pesos(puntos, resolucion)
        
        return jsonify({
            "curva": curva,
            "pesos": pesos,
            "t_valores": t_valores
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=== SERVIDOR MATEMÁTICO DE BÉZIER ACTIVO EN http://127.0.0.1:5000 ===")
    app.run(host='0.0.0.0', port=5000, debug=True)
