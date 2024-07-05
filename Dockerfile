FROM node:20.12.2-alpine3.18 as base

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json ./

RUN npm install

# Copy app source code
COPY . .

# Build AdonisJS application
RUN node ace build --ignore-ts-errors

WORKDIR /build

RUN npm ci --production

# Run the AdonisJS application
CMD ["sh", "-c", "node ace migration:run && node ace db:seed && node server.js"]