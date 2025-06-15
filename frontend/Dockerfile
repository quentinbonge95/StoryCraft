# frontend/Dockerfile

### Stage 1: build Tailwind CSS
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tailwind.config.js postcss.config.js ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy source files
COPY src ./src
COPY public ./public

# Build CSS
RUN npm run build:css

### Stage 2: Serve with Node.js
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets and server file
COPY --from=builder /app/public ./public
COPY server.js .

# Create necessary directories
RUN mkdir -p /app/public/css /app/public/js

# Copy Font Awesome CSS
RUN cp -r /app/node_modules/@fortawesome/fontawesome-free/css /app/public/css/fontawesome
RUN cp -r /app/node_modules/@fortawesome/fontawesome-free/webfonts /app/public/webfonts

# Copy Flatpickr CSS
RUN mkdir -p /app/public/css/flatpickr
RUN cp /app/node_modules/flatpickr/dist/flatpickr.min.css /app/public/css/flatpickr/

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
