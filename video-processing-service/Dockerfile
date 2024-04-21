# Stage 1
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2
FROM node:18

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start" , "serve"]

