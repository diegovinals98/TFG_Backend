#!/usr/bin/env python3
import requests
from datetime import datetime, timedelta

# Configuración
TAUTULLI_API_KEY = "60dc4934c98a42188d5ef12abf22025f"
TAUTULLI_URL = "http://localhost:8282/api/v2"

RADARR_API_KEY = "545099e6bc864702853c01c3a9bc005e"
RADARR_URL = "http://0.0.0.0:7878/api"

def get_tautulli_data():
    try:
        # Endpoint para obtener toda la información
        payload = {
            "apikey": TAUTULLI_API_KEY,
            "cmd": "get_users"  # Puedes cambiar el comando para otros datos
        }

        # Realiza la solicitud a la API
        response = requests.get(TAUTULLI_URL, params=payload)
        response.raise_for_status()

        # Procesa la respuesta
        data = response.json()
        if data["response"]["result"] == "success":
            print("Datos obtenidos de Tautulli:")
            print(data)
        else:
            print("Error en la API:", data["response"]["message"])
    except requests.exceptions.RequestException as e:
        print("Error al conectar con Tautulli:", e)

# Llama a la función
if __name__ == "__main__":
    get_tautulli_data()