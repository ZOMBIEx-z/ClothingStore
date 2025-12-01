FROM node:25-slim
LABEL authors="froonn"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npx", "serve", "-s", "build", "-l", "3001"]
