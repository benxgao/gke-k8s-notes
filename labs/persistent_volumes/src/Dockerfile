# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Install all dependencies (including devDependencies for building)
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine
WORKDIR /usr/src/app

RUN npm install -g typescript

# Install production dependencies only
# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /usr/src/app/lib ./lib

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]