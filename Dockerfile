FROM oven/bun:alpine

ENV PORT=80

WORKDIR /srv

COPY . .

RUN bun install

ENTRYPOINT [ "bun", "src/cluster.ts" ]
