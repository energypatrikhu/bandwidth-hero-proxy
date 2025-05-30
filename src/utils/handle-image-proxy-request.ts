import { convertFileSize, logger } from "@energypatrikhu/node-utils";
import { Request, Response } from "express";
import superagent from "superagent";
import { beautifyObject } from "./beautify-object";
import { compressImage } from "./compress-image";
import { compressImageToBestFormat } from "./compress-image-to-best-format";
import { omitRegex } from "./omit";

const EXTERNAL_REQUEST_TIMEOUT = process.env.EXTERNAL_REQUEST_TIMEOUT
  ? parseInt(process.env.EXTERNAL_REQUEST_TIMEOUT, 10)
  : 60000;

const EXTERNAL_REQUEST_RETRIES = process.env.EXTERNAL_REQUEST_RETRIES
  ? parseInt(process.env.EXTERNAL_REQUEST_RETRIES, 10)
  : 5;

const EXTERNAL_REQUEST_REDIRECTS = process.env.EXTERNAL_REQUEST_REDIRECTS
  ? parseInt(process.env.EXTERNAL_REQUEST_REDIRECTS, 10)
  : 10;

const EXTERNAL_REQUEST_OMIT_HEADERS: RegExp[] = process.env
  .EXTERNAL_REQUEST_OMIT_HEADERS
  ? (process.env.EXTERNAL_REQUEST_OMIT_HEADERS.split(/\s|\n/)
      .map((pattern) => (pattern ? new RegExp(pattern, "i") : null))
      .filter(Boolean) as RegExp[])
  : [];

export async function handleImageProxyRequest(
  appRequest: Request,
  appResponse: Response,
  _next: () => void,
  tryAlternativeFormat = false,
) {
  const filteredRequestHeaders = {
    ...omitRegex(appRequest.headers, [
      /host/i,
      ...EXTERNAL_REQUEST_OMIT_HEADERS,
    ]),
    "accept-encoding": "*",
    "accept": "*/*",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "connection": "close",
  };

  appRequest.app.locals.format = tryAlternativeFormat
    ? appRequest.app.locals.format === "webp"
      ? "jpeg"
      : "webp"
    : appRequest.app.locals.format;

  const url = appRequest.app.locals.url;

  try {
    const externalImageResponse = await superagent
      .get(url)
      .set(filteredRequestHeaders)
      .timeout(EXTERNAL_REQUEST_TIMEOUT)
      .retry(EXTERNAL_REQUEST_RETRIES)
      .redirects(EXTERNAL_REQUEST_REDIRECTS)
      .withCredentials()
      .responseType("arraybuffer")
      .buffer(true);

    appResponse.set(externalImageResponse.headers);

    const compressedImageResult =
      process.env.USE_BEST_COMPRESSION_FORMAT === "true"
        ? await compressImageToBestFormat(
            externalImageResponse.body,
            appRequest.app.locals,
          )
        : await compressImage(
            externalImageResponse.body,
            appRequest.app.locals,
          );

    const compressedImageSizes =
      "sizes" in compressedImageResult
        ? { sizes: compressedImageResult.sizes as any }
        : {};

    const compressedImageSize = compressedImageResult.image.info.size;
    const originalImageSize = externalImageResponse.body.length;
    const savedImageSize = originalImageSize - compressedImageSize;

    const compressedSizePercentage =
      (compressedImageSize / originalImageSize) * 100;
    const savedSizePercentage = 100 - compressedSizePercentage;

    const originalImageSizeStr = convertFileSize(originalImageSize, 2);
    const compressedImageSizeStr = `${convertFileSize(
      compressedImageSize,
      2,
    )} ( ${compressedSizePercentage.toFixed(2)} % )`;
    const savedImageSizeStr = `${
      savedImageSize < 0 ? "-" : ""
    }${convertFileSize(
      Math.abs(savedImageSize),
      2,
    )} ( ${savedSizePercentage.toFixed(2)} % )`;

    appResponse.removeHeader("transfer-encoding");

    if (savedImageSize > 0) {
      appResponse.set({
        "content-encoding": "identity",
        "content-type": `image/${compressedImageResult.format}`,
        "content-length": compressedImageSize.toString(),
        "x-original-size": originalImageSize.toString(),
        "x-bytes-saved": savedImageSize.toString(),
      });
      appResponse.send(compressedImageResult.image.data);
    } else {
      if (
        !tryAlternativeFormat &&
        process.env.ENABLE_ALTERNATIVE_FORMAT === "true"
      ) {
        logger(
          "info",
          "\n" +
            beautifyObject({
              worker: process.pid,
              params: appRequest.app.locals,
              body: {
                ...compressedImageSizes,
                originalSize: originalImageSizeStr,
                compressedSize: compressedImageSizeStr,
                error: "Cannot compress!",
                reason: "No size reduction, trying alternative format",
              },
            }),
        );

        return handleImageProxyRequest(appRequest, appResponse, _next, true);
      }

      appResponse.redirect(url);
    }

    appResponse.on("close", () => {
      logger(
        "info",
        "\n" +
          beautifyObject({
            worker: process.pid,
            params: appRequest.app.locals,
            req_headers: filteredRequestHeaders,
            res_headers: appResponse.getHeaders(),
            body: {
              ...compressedImageSizes,
              originalSize: originalImageSizeStr,
              compressedSize: compressedImageSizeStr,
              savedSize: savedImageSizeStr,
            },
          }),
      );

      if (globalThis.gc) globalThis.gc();
    });
  } catch (error: any) {
    if (!appResponse.headersSent) {
      appResponse.redirect(url);
    }

    logger(
      "error",
      "\n" +
        beautifyObject({
          worker: process.pid,
          params: appRequest.app.locals,
          headers: filteredRequestHeaders,
          body: {
            error: "Cannot compress!",
            reason: error.message ?? error,
          },
        }),
    );

    if (globalThis.gc) globalThis.gc();
  }
}
