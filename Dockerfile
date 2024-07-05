FROM node:20.12.2-alpine3.18 as base

# Install app dependencies
COPY package.json package-lock.json ./

RUN npm install

# Copy app source code
COPY . .

# Run the AdonisJS application
CMD ["sh", "-c", "node ace serve --watch"]