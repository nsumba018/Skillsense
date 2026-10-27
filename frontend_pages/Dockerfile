FROM node:22-alpine AS build

WORKDIR /app
COPY frontend_pages/package.json frontend_pages/package-lock.json ./
RUN npm ci
COPY frontend_pages/ .

ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
