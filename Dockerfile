FROM node:lts-alpine

ENV PORT=80

WORKDIR /opt/app

COPY package*.json .
RUN npm ci --no-audit

COPY build .

ENTRYPOINT [ "node", "--expose-gc", "index.js" ]