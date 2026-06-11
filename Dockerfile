FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && \
    mkdir -p .output/server/chunks && \
    cp -r .output/public .output/server/chunks/public

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]
