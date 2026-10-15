# Etapa 1: Build de la aplicación React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor web ligero Nginx
FROM nginx:alpine
# Copiar configuración de Reverse Proxy con SSL
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiar certificados SSL al contenedor
COPY ssl/ /etc/nginx/ssl/
# Copiar el build compilado
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]

