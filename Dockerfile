FROM node:18-alpine AS builder
WORKDIR /app

# Instalar dependencias del sistema, incluyendo adb
RUN apk add --no-cache bash android-tools

# Copiar solo los archivos necesarios para instalar dependencias primero
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# Exponer el puerto que usa tu app
EXPOSE 3010

# Comando por defecto
CMD ["node", "server.js"]
