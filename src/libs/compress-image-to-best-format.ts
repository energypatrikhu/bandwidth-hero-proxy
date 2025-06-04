import { compressImage } from "#/libs/compress-image";
import type { RequestParameters } from "#/libs/parse-request-parameters";
import { convertFileSize } from "@energypatrikhu/node-utils";

export async function compressImageToBestFormat(
  imageBuffer: Buffer,
  params: RequestParameters,
) {
  const compressedImageResults = await Promise.all([
    compressImage(imageBuffer, { ...params, format: "webp" }),
    compressImage(imageBuffer, { ...params, format: "jpeg" }),
  ]);

  const result = compressedImageResults.sort(
    (a, b) => a.image.info.size - b.image.info.size,
  )[0];
  const webpSize = compressedImageResults.find(
    (result) => result.format === "webp",
  )?.image.info.size!;
  const jpegSize = compressedImageResults.find(
    (result) => result.format === "jpeg",
  )?.image.info.size!;

  return {
    ...result,
    sizes: {
      webp:
        convertFileSize(webpSize, 2) +
        (result.format === "webp" ? " (best)" : ""),
      jpeg:
        convertFileSize(jpegSize, 2) +
        (result.format === "jpeg" ? " (best)" : ""),
    },
  };
}
