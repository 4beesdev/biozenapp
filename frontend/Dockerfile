# Frontend Dockerfile - React/Vite
FROM node:20-alpine AS build
WORKDIR /app

# Kopiraj package fajlove
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Kopiraj source kod i build
COPY . .
RUN npm run build

# Production image sa nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Kopiraj build fajlove
COPY --from=build /app/dist .

# Kopiraj nginx konfiguraciju
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

