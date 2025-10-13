# server/Dockerfile

FROM node:lts-alpine AS base

# [TAMBAHKAN BARIS INI] Install curl untuk kebutuhan healthcheck
RUN apk add --no-cache curl

# Update Alpine packages to fix vulnerabilities
RUN apk update && apk upgrade

# Mengatur direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Install dependensi yang dibutuhkan untuk produksi
RUN npm install --omit=dev

# Salin semua file proyek ke dalam direktori kerja
COPY . .

# Expose port yang digunakan oleh aplikasi
EXPOSE 5000

# Install PM2 secara global di dalam container
RUN npm install -g pm2

# Jalankan aplikasi menggunakan PM2
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]

# FROM node:lts-alpine

# WORKDIR /app

# # Install dependencies
# COPY package*.json ./


# # Install nodemon global
# RUN npm install 

# COPY . .

# EXPOSE 5000

# RUN npm install -g pm2

# # Jalankan backend dengan nodemon
# CMD [ "npm", "run", "dev" ]
# # CMD ["nodemon", "--legacy-watch", "server.js"]
