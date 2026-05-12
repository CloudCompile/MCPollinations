# Hugging Face Spaces requires port 7860 and a non-root user named "user"
FROM node:lts-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install --ignore-scripts

# Copy the rest of the application
COPY . .

# HF Spaces runs containers as non-root uid 1000
RUN addgroup -S user && adduser -S user -G user
USER user

# HF Spaces expects the app to listen on port 7860
EXPOSE 7860

ENV PORT=7860

CMD ["node", "server.js"]
