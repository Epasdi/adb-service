FROM node:20-slim

# Instalar adb
RUN apt-get update && apt-get install -y adb && rm -rf /var/lib/apt/lists/*

# Crear app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
