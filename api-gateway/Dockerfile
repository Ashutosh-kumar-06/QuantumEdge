FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add --no-cache python3 && npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
