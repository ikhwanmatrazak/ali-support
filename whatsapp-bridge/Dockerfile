FROM node:20-slim

WORKDIR /app

# Baileys needs these for native crypto and media processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json .
RUN npm install --omit=dev

COPY . .

RUN mkdir -p sessions media

EXPOSE 3001

CMD ["node", "src/index.js"]
