FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the NestJS application
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
