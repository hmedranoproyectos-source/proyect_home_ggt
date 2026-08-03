FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

# Entrypoint por defecto del servicio API. El servicio "worker" (BullMQ)
# usa esta misma imagen con otro comando (ver docker-compose.yml).
CMD ["node", "src/index.js"]
