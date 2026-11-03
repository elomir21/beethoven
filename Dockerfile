# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS development
WORKDIR /game
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY --chown=node:node . .
RUN chown -R node:node /game
USER node
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM development AS test
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
RUN mkdir -p /game/test-results && chown node:node /game/test-results
USER node
CMD ["npm", "run", "verify"]

FROM development AS build
RUN npm run build

FROM node:24-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /game
COPY --from=build --chown=node:node /game/dist ./dist
COPY --chown=node:node scripts/serve.mjs ./scripts/serve.mjs
USER node
EXPOSE 5173
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:5173/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/serve.mjs", "dist"]
