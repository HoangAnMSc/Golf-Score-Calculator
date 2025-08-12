FROM node:20-alpine
WORKDIR /usr/src/app

# copy file package* trước để cache layer deps
COPY frontend/package*.json ./

# CÀI cả dev deps (vite nằm ở devDependencies)
RUN npm ci --include=dev || npm install

# copy source
COPY frontend/. .

EXPOSE 5173
# nếu thiếu node_modules vì bind mount, tự cài lại trước khi chạy
CMD sh -lc "test -d node_modules || (npm ci --include=dev || npm install); npm run dev -- --host"
