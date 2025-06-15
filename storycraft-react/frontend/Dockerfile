# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create a .env.production file to override any local .env files
# This ensures the build inside Docker uses the correct relative paths for the APIs
RUN echo "VITE_API_URL=/api/v1" > .env.production
RUN echo "VITE_OLLAMA_URL=/ollama" >> .env.production

# Build the app for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
