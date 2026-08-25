FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    APP_HOST=0.0.0.0 \
    APP_PORT=4188

# Shared libraries required by Remotion's Chrome Headless Shell.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-noto-core \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libgbm-dev \
    libnss3 \
    libpango-1.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon-dev \
    libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npx remotion browser ensure && npm cache clean --force

COPY . .

RUN mkdir -p \
    output \
    public/audio/scenes \
    public/images/uploads \
    public/images/thumbnail

EXPOSE 4188

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4188/explainer/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npm", "run", "app"]
