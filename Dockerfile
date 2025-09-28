FROM node:18-alpine AS builder
WORKDIR /app

# Instalar dependencias del sistema, incluyendo adb
RUN apk add --no-cache bash android-tools

# Copiar los archivos necesarios para dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

EXPOSE 3010

CMD ["node", "server.js"]
