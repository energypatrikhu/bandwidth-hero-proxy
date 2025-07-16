import type { RequestParameters } from "#/libs/parse-request-parameters";

import { beautifyObject } from "#/libs/beautify-object";
import { compressImage } from "#/libs/compress-image";
import { compressImageToBestFormat } from "#/libs/compress-image-to-best-format";
import { Env } from "#/libs/env";
import { omitRegex } from "#/libs/omit";
import { convertFileSize, logger } from "@energypatrikhu/node-utils";
import superagent from "superagent";

export async function handleImageProxyRequest(request: Request, params: RequestParameters, tryAlternativeFormat = false) {
  const headers = request.headers.toJSON();
  const requestHeaders = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));

  const filteredRequestHeaders = {
    ...omitRegex(requestHeaders, [/host/i, ...Env.EXTERNAL_REQUEST_OMIT_HEADERS]),
    "accept-encoding": "*",
    "accept": "*/*",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "connection": "close",
  };

  params.format = tryAlternativeFormat ? (params.format === "webp" ? "jpeg" : "webp") : params.format;
  const url = params.url;

  try {
    const externalImageResponse = await superagent
      .get(url)
      .set(filteredRequestHeaders)
      .timeout(Env.EXTERNAL_REQUEST_TIMEOUT)
      .retry(Env.EXTERNAL_REQUEST_RETRIES)
      .redirects(Env.EXTERNAL_REQUEST_REDIRECTS)
      .withCredentials()
      .responseType("arraybuffer")
      .buffer(true);

    const compressedImageResult = Env.USE_BEST_COMPRESSION_FORMAT
      ? await compressImageToBestFormat(externalImageResponse.body, params)
      : await compressImage(externalImageResponse.body, params);

    const compressedImageSizes = "sizes" in compressedImageResult ? { sizes: compressedImageResult.sizes as any } : {};

    const compressedImageSize = compressedImageResult.image.info.size;
    const originalImageSize = externalImageResponse.body.length;
    const savedImageSize = originalImageSize - compressedImageSize;

    const compressedSizePercentage = (compressedImageSize / originalImageSize) * 100;
    const savedSizePercentage = 100 - compressedSizePercentage;

    const originalImageSizeStr = convertFileSize(originalImageSize, 2);
    const compressedImageSizeStr = convertFileSize(compressedImageSize, 2);
    const compressedImageSizePercentageStr = `${compressedImageSizeStr} ( ${compressedSizePercentage.toFixed(2)} % )`;
    const savedImageSizeStr = (savedImageSize < 0 ? "-" : "") + convertFileSize(Math.abs(savedImageSize), 2);
    const savedImageSizePercentageStr = `${savedImageSizeStr} ( ${savedSizePercentage.toFixed(2)} % )`;

    if (Env.FORCE_SELECTED_FORMAT || savedImageSize > 0) {
      delete externalImageResponse.headers["transfer-encoding"];
      const responseHeaders = {
        ...externalImageResponse.headers,
        "content-encoding": "identity",
        "content-type": `image/${compressedImageResult.format}`,
        "content-length": compressedImageSize.toString(),
        "x-original-size": originalImageSize.toString(),
        "x-bytes-saved": savedImageSize.toString(),
      };

      logger(
        "info",
        "\n" +
          beautifyObject({
            pid: process.pid,
            params,
            req_headers: filteredRequestHeaders,
            res_headers: responseHeaders,
            body: {
              ...compressedImageSizes,
              originalSize: originalImageSizeStr,
              compressedSize: compressedImageSizePercentageStr,
              savedSize: savedImageSizePercentageStr,
            },
          }),
      );

      return new Response(compressedImageResult.image.data, {
        headers: responseHeaders,
      });
    } else {
      if (!tryAlternativeFormat && Env.ENABLE_ALTERNATIVE_FORMAT) {
        logger(
          "info",
          "\n" +
            beautifyObject({
              pid: process.pid,
              params,
              body: {
                ...compressedImageSizes,
                originalSize: originalImageSizeStr,
                compressedSize: compressedImageSizePercentageStr,
                error: "Cannot compress!",
                reason: "No size reduction, trying alternative format",
              },
            }),
        );

        return handleImageProxyRequest(request, params, true);
      }

      throw new Error(
        "No size reduction (" + compressedImageSizeStr + " > " + originalImageSizeStr + "), redirecting to original image",
      );
    }
  } catch (error: any) {
    logger(
      "error",
      "\n" +
        beautifyObject({
          pid: process.pid,
          params,
          headers: filteredRequestHeaders,
          body: {
            error: "Cannot compress!",
            reason: error.response
              ? {
                  message: error.message,
                  status: error.status,
                  code: error.code,
                  response: error.response,
                }
              : error.message,
          },
        }),
    );

    return Response.redirect(url, 302);
  }
}
