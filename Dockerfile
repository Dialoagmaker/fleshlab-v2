FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN node scripts/generate-seo-nginx-policy.js /app/seo-policy.generated.conf
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
# Existing payout encryption code is part of the API contract; keep its
# Azure Key Vault runtime dependencies present even for older release locks.
RUN npm install --omit=dev --ignore-scripts --no-save @azure/identity@4.13.3 @azure/keyvault-secrets@4.11.2
COPY server ./server
COPY src/lib/seoConfig.js ./src/lib/seoConfig.js
COPY shared ./shared
COPY migrations ./migrations
# The contract renderer embeds the approved FLESHLAB mark directly into PDFs.
# Keep this public brand asset in the lean API image rather than substituting text.
COPY v3/src/assets/brand/fleshlab-amateur-wins-approved.png ./v3/src/assets/brand/fleshlab-amateur-wins-approved.png
CMD ["node", "server/index.js"]

FROM nginx:1.27-alpine AS web
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build-v3 /app/dist-v3 /usr/share/nginx/html/v3
COPY --from=build-admin /app/dist-admin /usr/share/nginx/html/admin
COPY --from=build-performer /app/dist-performer /usr/share/nginx/html/performer
COPY --from=build-earn /app/dist-earn /usr/share/nginx/html/earn
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/seo-policy.generated.conf /etc/nginx/conf.d/00-seo-policy.conf
