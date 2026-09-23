FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM build AS build-v3
RUN npm run build:v3

FROM node:22-bookworm-slim AS api
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server ./server
COPY migrations ./migrations
CMD ["node", "server/index.js"]

FROM nginx:1.27-alpine AS web
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build-v3 /app/dist-v3 /usr/share/nginx/html/v3
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
