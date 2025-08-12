FROM node:20-alpine
WORKDIR /usr/src/app

COPY frontend/package*.json ./

RUN npm ci --include=dev || npm install

COPY frontend/. .

EXPOSE 5173
CMD sh -lc "test -d node_modules || (npm ci --include=dev || npm install); npm run dev -- --host"
