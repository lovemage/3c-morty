# Railway Deployment Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies after build
RUN npm ci --only=production && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup
RUN adduser -S appuser -u 1001 -G appgroup

# Change ownership of the app directory
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port (Railway will override this)
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 