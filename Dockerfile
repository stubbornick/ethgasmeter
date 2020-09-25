FROM node:lts

RUN npm install -g typescript

COPY package-lock.json package.json /app/
WORKDIR /app/
RUN npm install

COPY . /app/
RUN npm run build

VOLUME /app/data/

CMD ["npm", "run", "--silent", "start:prod"]
