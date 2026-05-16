FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    && rm -rf /var/lib/apt/lists/*

COPY package.json .
RUN npm install --omit=dev

COPY . .

RUN mkdir -p sessions media

EXPOSE 3001

CMD ["node", "src/index.js"]
