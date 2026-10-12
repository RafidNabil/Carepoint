# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL=/api
ARG VITE_CURRENCY=BDT
ARG VITE_CLINIC_TIMEZONE=Asia/Dhaka

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CURRENCY=$VITE_CURRENCY
ENV VITE_CLINIC_TIMEZONE=$VITE_CLINIC_TIMEZONE

RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
