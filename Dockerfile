# frontend/Dockerfile
# ============================================
# FRONTEND - Angular + Nginx
# Build multi-etapa
# ============================================

# ============================================
# ETAPA 1: Compilar Angular
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (incluye dev para poder compilar)
RUN npm install

# Copiar todo el codigo del frontend
COPY . .

# Argumento que se pasa desde docker-compose
# Ej: https://tudominio.com/api
ARG API_URL=http://localhost:3000/api
ENV API_URL=$API_URL

# Compilar Angular en modo produccion
# Antes de compilar, reemplaza la URL del API en environment.prod.ts
RUN echo "export const environment = { production: true, apiUrl: '${API_URL}' };" > src/environments/environment.prod.ts
RUN npm run build -- --configuration production

# ============================================
# ETAPA 2: Servir con Nginx
# ============================================
FROM nginx:alpine

# Copiar la configuracion custom de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados de Angular
# La ruta depende del nombre de tu proyecto en angular.json
# Asumimos que genera dist/polleria-yacki/browser
COPY --from=builder /app/dist/*/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]