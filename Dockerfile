# Etapa 1: Build
FROM node:18-alpine AS builder

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json primero (mejora cache de npm install)
COPY package*.json ./

# Instalar adb en Alpine
RUN apk add --no-cache android-tools

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Etapa 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Copiar solo lo necesario desde builder
COPY --from=builder /app /app

# Aseguramos que el usuario no sea root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Exponer el puerto que usa la app
EXPOSE 3010

# Variable de entorno
ENV NODE_ENV=production
ENV PORT=3010

# Comando de arranque
CMD ["node", "server.js"]
