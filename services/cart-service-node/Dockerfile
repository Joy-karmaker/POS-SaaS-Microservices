FROM node:22-alpine

# Install libc6-compat for native dependency compatibility on Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./

# Configure npm for network resilience
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 5

# Install dependencies using a persistent cache mount for NPM
RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

# Build the NestJS application
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]

