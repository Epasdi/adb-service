FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3010
EXPOSE 3010

CMD ["node", "server.js"]
