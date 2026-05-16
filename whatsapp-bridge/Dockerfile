FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    libglib2.0-0 libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Rewrite SSH GitHub URLs to HTTPS so npm can fetch deps without SSH keys
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" && \
    git config --global url."https://github.com/".insteadOf "git@github.com:"

COPY package.json .
RUN npm install --omit=dev

COPY . .

RUN mkdir -p sessions media

EXPOSE 3001

CMD ["node", "src/index.js"]
