# ==========================================
# RUNTIME ENVIRONMENT FOR REACT DEV SERVER
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Cache dependencies by copying package files first
COPY package.json package-lock.json* ./
RUN npm install --silent

# Copy the rest of the application code
COPY . .

# Expose Vite's default development port
EXPOSE 5173

# Start the Vite development server on host 0.0.0.0
CMD ["npm", "run", "dev"]
