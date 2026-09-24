FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM build AS build-v3
RUN npm run build:v3

FROM build AS build-admin
RUN npm run build:admin

FROM build AS build-performer
RUN npm run build:performer

FROM build AS build-earn
RUN npm run build:earn

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
COPY --from=build-admin /app/dist-admin /usr/share/nginx/html/admin
COPY --from=build-performer /app/dist-performer /usr/share/nginx/html/performer
COPY --from=build-earn /app/dist-earn /usr/share/nginx/html/earn
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
