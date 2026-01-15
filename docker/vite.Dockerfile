FROM node:24-bullseye-slim AS base

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy application source
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY frontend/ ./frontend/
