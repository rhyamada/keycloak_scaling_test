FROM node:slim
RUN mkdir -p /app
WORKDIR /app
COPY . .
RUN npm install
CMD ["node","index.js"]