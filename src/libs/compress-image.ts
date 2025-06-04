import type { RequestParameters } from "#/libs/parse-request-parameters";
import sharp from "sharp";

export async function compressImage(
  imageBuffer: Buffer,
  params: RequestParameters,
) {
  try {
    const imageProcessor = sharp(imageBuffer, {
      animated: params.format === "webp",
      limitInputPixels: false,
      failOn: "none",
      unlimited: true,
    }).grayscale(params.grayscale);

    const formatSpecificOptions = {
      webp: {
        quality: params.quality,
        effort: 6,
        lossless: false,
        force: true,
      },
      jpeg: {
        quality: params.quality,
        optimiseCoding: true,
        mozjpeg: true,
        force: true,
      },
    };

    if (params.format in formatSpecificOptions) {
      imageProcessor[params.format](formatSpecificOptions[params.format]);
    }

    return {
      format: params.format,
      image: await imageProcessor.toBuffer({ resolveWithObject: true }),
    };
  } catch (error) {
    throw (
      error ?? new Error("Unexpected error occurred during image compression")
    );
  }
}
