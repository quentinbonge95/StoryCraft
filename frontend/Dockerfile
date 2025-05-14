# frontend/Dockerfile

### Stage 1: build Tailwind CSS
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tailwind.config.js postcss.config.js ./
COPY src ./src
RUN npx tailwindcss -i ./src/input.css -o ./public/output.css --minify

### Stage 2: package into nginx
FROM nginx:alpine
# remove default content
RUN rm -rf /usr/share/nginx/html/*

# copy built assets
COPY --from=builder /app/public /usr/share/nginx/html/
# copy any static you have in frontend/public
COPY public/ /usr/share/nginx/html/

# expose port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
