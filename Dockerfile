FROM oven/bun:alpine

ENV PORT=80

WORKDIR /srv

COPY package.json bun.lock tsconfig.json ./
COPY src src

RUN bun install

ENTRYPOINT [ "bun", "src/cluster.ts" ]
