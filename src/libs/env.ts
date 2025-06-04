export class Env {
  /* Server configuration and environment variables */
  static PORT = Bun.env.PORT || 3333;
  static MAX_CLUSTER_SIZE = Bun.env.MAX_CLUSTER_SIZE || "4";
  static CPU_COUNT = Math.min(
    navigator.hardwareConcurrency,
    parseInt(Env.MAX_CLUSTER_SIZE, 10),
  );
  static CLUSTER_SIZE = Bun.env.CLUSTER_SIZE
    ? parseInt(Bun.env.CLUSTER_SIZE, 10)
    : Env.CPU_COUNT;

  /* Sharp configuration */
  static SHARP_CONCURRENCY = Bun.env.SHARP_CONCURRENCY
    ? parseInt(Bun.env.SHARP_CONCURRENCY, 10)
    : 0;
  static SHARP_CACHE = Bun.env.SHARP_CACHE
    ? Bun.env.SHARP_CACHE === "true"
    : true;
  static SHARP_SIMD = Bun.env.SHARP_SIMD ? Bun.env.SHARP_SIMD === "true" : true;

  /* Format settings */
  static FORCE_SELECTED_FORMAT = Bun.env.FORCE_SELECTED_FORMAT
    ? Bun.env.FORCE_SELECTED_FORMAT === "true"
    : false;
  static ENABLE_ALTERNATIVE_FORMAT = Bun.env.ENABLE_ALTERNATIVE_FORMAT
    ? Bun.env.ENABLE_ALTERNATIVE_FORMAT === "true"
    : false;
  static USE_BEST_COMPRESSION_FORMAT = Bun.env.USE_BEST_COMPRESSION_FORMAT
    ? Bun.env.USE_BEST_COMPRESSION_FORMAT === "true"
    : false;

  /* Request settings */
  static EXTERNAL_REQUEST_TIMEOUT = Bun.env.EXTERNAL_REQUEST_TIMEOUT
    ? parseInt(Bun.env.EXTERNAL_REQUEST_TIMEOUT, 10)
    : 60000;
  static EXTERNAL_REQUEST_RETRIES = Bun.env.EXTERNAL_REQUEST_RETRIES
    ? parseInt(Bun.env.EXTERNAL_REQUEST_RETRIES, 10)
    : 5;
  static EXTERNAL_REQUEST_REDIRECTS = Bun.env.EXTERNAL_REQUEST_REDIRECTS
    ? parseInt(Bun.env.EXTERNAL_REQUEST_REDIRECTS, 10)
    : 10;
  static EXTERNAL_REQUEST_OMIT_HEADERS = Bun.env.EXTERNAL_REQUEST_OMIT_HEADERS
    ? (Bun.env.EXTERNAL_REQUEST_OMIT_HEADERS.split(/\s|\n/)
        .map((pattern) => (pattern ? new RegExp(pattern, "i") : null))
        .filter(Boolean) as RegExp[])
    : [];
}
