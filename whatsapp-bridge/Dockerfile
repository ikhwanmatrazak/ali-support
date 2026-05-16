FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates \
    libglib2.0-0 libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Write both insteadOf rules in one block so neither overwrites the other.
# npm resolves "github:owner/repo" to ssh://git@github.com/... which requires
# SSH keys — rewrite both SSH URL forms to HTTPS so no keys are needed.
RUN printf '[url "https://github.com/"]\n\tinsteadOf = ssh://git@github.com/\n\tinsteadOf = git@github.com:\n' \
    > /root/.gitconfig

COPY package.json .
RUN npm install --omit=dev

COPY . .

RUN mkdir -p sessions media

EXPOSE 3001

CMD ["node", "src/index.js"]
