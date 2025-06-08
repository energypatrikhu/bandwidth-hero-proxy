# Welcome

- [Usage](#usage)
- [Environment Variables](#environment-variables)

# Usage
> Note: The app may consume a lot of memory based on usage, for this it is built using `Bun` and using the `--smol` argument.

- Docker (Recommended)

  1. [Install Docker](https://docs.docker.com/engine/install/)
  2. Spin up the image
     - With docker run
       ```
       docker run --publish 80:80 energyhun24/bandwidth-hero-proxy:latest
       ```
     - Or with docker compose
       ```yml
       services:
         bandwidth-hero-proxy:
           container_name: bandwidth-hero-proxy
           image: docker.io/energyhun24/bandwidth-hero-proxy:latest
           network_mode: bridge
           restart: unless-stopped
           environment:
             USE_BEST_COMPRESSION_FORMAT: true
             # SHARP_CONCURRENCY: 1 # Optional, set to 0 for auto
           ports:
             - 80:80/tcp
       ```
       - Then run compose up
         ```
          docker compose up -d
         ```

# Environment Variables

- `PORT`
  - Port to listen on (default: 80)

- `MAX_CLUSTER_SIZE`
  - Maximum number of workers to spawn (ignored if `CLUSTER_SIZE` is set) (default: 4)

- `CLUSTER_SIZE`
  - Number of workers to spawn (default: 0 (number of CPU cores))

- `SHARP_CONCURRENCY`
  - Number of threads to use for image processing (default: 0 (auto))

- `SHARP_CACHE`
  - Enable sharp cache (default: true)

- `SHARP_SIMD`
  - Enable sharp SIMD (default: true)

- `FORCE_SELECTED_FORMAT`
  - Force requested format for images even if it is bigger than original (default: false)

- `ENABLE_ALTERNATIVE_FORMAT`
  - Try alternative format if current format is larger after compression than original (default: false)

- `USE_BEST_COMPRESSION_FORMAT`
  - Use format that achieves the best compression (default: false)

- `EXTERNAL_REQUEST_TIMEOUT`
  - Timeout for external requests (ms) (default: 60000)

- `EXTERNAL_REQUEST_RETRIES`
  - Number of retries for external requests (default: 5)

- `EXTERNAL_REQUEST_REDIRECTS`
  - Number of redirects to follow for external requests (default: 10)

- `EXTERNAL_REQUEST_OMIT_HEADERS`
  > Info: `Host` header is always omitted
  - Headers to omit from external requests using regex, separated by spaces or newlines
    - Example: `^x-.*` will omit all headers starting with `x-`
