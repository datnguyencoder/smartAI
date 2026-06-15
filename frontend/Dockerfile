# ==========================================
# RUNTIME ENVIRONMENT FOR REACT DEV SERVER
# ==========================================
FROM node:20-alpine
WORKDIR /app

ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

# Cache dependencies by copying package files first
COPY package.json package-lock.json* ./
RUN npm install --silent

# Copy the rest of the application code
COPY . .

# Expose Vite's default development port
EXPOSE 5173

# Start the Vite development server on host 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
