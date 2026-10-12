FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy Prisma schema and configuration to generate client
COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npx prisma generate

# Copy the rest of the backend source code
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
