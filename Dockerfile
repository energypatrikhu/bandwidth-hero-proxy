FROM node:lts-alpine

ENV PORT=80

WORKDIR /opt/app

COPY package.json .
RUN npm install

COPY build .

CMD [ "node", "--expose-gc", "--max-old-space-size=128", "--jitless", "--no-opt", "--no-concurrent-recompilation", "--noexpose_wasm", "--max-semi-space-size=4", "index.js" ]