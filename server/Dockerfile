FROM node:22.18.0

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install nodemon global
RUN npm install -g nodemon

COPY . .

EXPOSE 5000

# Jalankan backend dengan nodemon
CMD ["nodemon", "--legacy-watch", "server.ts"]
