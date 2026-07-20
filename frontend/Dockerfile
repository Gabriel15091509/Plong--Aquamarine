FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# npm ci refuse ce lock file (dédup ajv/picomatch hoisted signalé "invalid"
# par npm mais inoffensif à l'exécution — voir ci.yml) ; npm install l'accepte.
RUN npm install
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
