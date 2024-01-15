FROM node:current-alpine

WORKDIR /opt/app

COPY build .
COPY package.json .

RUN npm install

CMD [ "node", "--expose-gc", "--max-old-space-size=128", "--jitless", "--no-opt", "--no-concurrent-recompilation", "--noexpose_wasm", "--max-semi-space-size=4", "index.js" ]