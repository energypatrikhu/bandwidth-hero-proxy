Bun.unsafe.gcAggressionLevel(2);

import { Env } from "#/libs/env";
import { handleImageProxyRequest } from "#/libs/handle-image-proxy-request";
import { parseRequestParameters } from "#/libs/parse-request-parameters";
import { logger } from "@energypatrikhu/node-utils";
import sharp from "sharp";

sharp.concurrency(Env.SHARP_CONCURRENCY);
sharp.cache(Env.SHARP_CACHE);
sharp.simd(Env.SHARP_SIMD);

Bun.serve({
  idleTimeout: 0,
  port: Env.PORT,
  reusePort: true,
  maxRequestBodySize: 0,
  routes: {
    "/": {
      GET: async (request) => {
        const params = parseRequestParameters(request);
        if (typeof params === "string") {
          return new Response(params);
        }

        return await handleImageProxyRequest(request, params);
      },
    },
    "/favicon.ico": {
      GET: () => new Response(null, { status: 204 }),
    },
  },
});

logger("info", `Server #${process.pid} is listening on port ${Env.PORT}`);
