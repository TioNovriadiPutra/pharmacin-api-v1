FROM node:20.12.2-alpine3.18 as base

# Create app directory
FROM base as deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci

# Run the AdonisJS application
CMD ["node", "./bin/server.js"]