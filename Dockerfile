FROM node:lts-alpine

ENV PORT=80

WORKDIR /opt/app

COPY package*.json .
RUN npm ci --no-audit

COPY build .

ENTRYPOINT [ "node", "--expose-gc", "--max-old-space-size=128", "--max-semi-space-size=4", "index.js" ]