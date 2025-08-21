FROM node:lts-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install nodemon global
RUN npm install 

COPY . .

EXPOSE 5000

# Jalankan backend dengan nodemon
CMD [ "npm", "run", "dev" ]
# CMD ["nodemon", "--legacy-watch", "server.js"]
