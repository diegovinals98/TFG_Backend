# Backend de FAMILYSERIESTRACK

Este proyecto contiene el backend de la aplicación FamilySeriesTrack, que se encarga de gestionar las llamadas a la base de datos y servir los datos a los clientes.


## Estructura del proyecto

- `api-tfg`: Este directorio contiene todos los archivos relacionados con el backend de la aplicación, incluyendo el código fuente y las configuraciones necesarias para su despliegue.
  - `AuthKey_AAJC7S5F5Q.p8`: Clave de autenticación utilizada para...
  - `backend.js`: Archivo principal del backend, contiene la lógica de enrutamiento y manejo de las peticiones.
  - `Dockerfile`: Definición de Docker para construir la imagen del backend.
  - `package-lock.json` y `package.json`: Archivos de configuración de NPM para manejar las dependencias del proyecto.
- `cloudflared`: Contiene configuraciones específicas para el servicio Cloudflare.
- `docker-compose.yml`: Archivo de Docker Compose para facilitar el despliegue de los servicios.
- `htmlPrivacidad` y `htmlSoporte`: Directorios que contienen las páginas HTML de la política de privacidad y soporte, respectivamente.
- `initdb.sql`: Script SQL para inicializar la base de datos.
- `mariadb`: Directorio destinado a contener archivos relacionados con la base de datos MariaDB.
- `README.md`: Este archivo.
- `traefik`: Contiene la configuración del proxy inverso Traefik, usado para enrutar las peticiones.

## Pre-requisitos

- Docker y Docker Compose
- Node.js (especificar versión)

```bash
docker-compose up -d
