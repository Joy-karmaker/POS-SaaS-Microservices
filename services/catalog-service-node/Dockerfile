FROM node:22-alpine

# Install libc6-compat & openssl for native dependencies and Prisma compatibility on Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./

# Configure npm for network resilience
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 5

# Install dependencies using a persistent cache mount for NPM
RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]

