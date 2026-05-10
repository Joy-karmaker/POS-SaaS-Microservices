FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
