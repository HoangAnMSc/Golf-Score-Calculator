FROM node:20-alpine

# nên đồng bộ với working_dir trong compose
WORKDIR /usr/src/app

# vì context là ".", phải copy từ ./frontend
COPY ./frontend/package*.json ./
RUN npm install

# copy toàn bộ source frontend
COPY ./frontend/ .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
