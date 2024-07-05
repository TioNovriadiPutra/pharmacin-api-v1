FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./

RUN npm install

# Copy app source code
COPY . .

# Build AdonisJS application
RUN node ace build --ignore-ts-errors

# Expose the port the app runs on
EXPOSE 3333

# Run the AdonisJS application
CMD ["sh", "-c", "node ace migration:run && node ace db:seed && node server.js"]