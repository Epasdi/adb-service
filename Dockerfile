FROM node:18-slim

# Install adb
RUN apt-get update && apt-get install -y android-tools-adb && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package.json first for caching
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

EXPOSE 3000
CMD ["npm", "start"]

