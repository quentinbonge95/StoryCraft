# Stage 1: Build Tailwind
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY src/ ./src/
COPY tailwind.config.js postcss.config.js ./
RUN npx tailwindcss -i ./src/input.css -o ./public/output.css --minify

# Stage 2: Build final container
FROM nginx:alpine
COPY --from=builder /app/public /usr/share/nginx/html/
COPY public/ /usr/share/nginx/html/

