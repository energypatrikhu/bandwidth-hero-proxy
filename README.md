# Usage

- Docker (Recommended)
  1. [Install Docker](https://docs.docker.com/engine/install/)
  2. Spin up the image
     ```
     docker run --publish 80:80 energyhun24/bandwidth-hero-proxy:latest
     ```

- SystemD service
  1. Clone the repository
     ```
     https://github.com/energypatrikhu/bandwidth-hero-proxy.git /opt/bandwidth-hero-proxy
     ```
  2. cd into cloned repository
     ```
     cd /opt/bandwidth-hero-proxy
     ```
  3. Install dependencies
     ```
     npm install
     ```
  4. Build project
     ```
     npm run build
     ```
  5. Start service
     ```
     systemctl start bandwidth-hero-proxy-node.service
     ```
      - (Optional) Enable service to run at startup
         ```
         systemctl enable bandwidth-hero-proxy-node.service
         ```

- PM2
  1. Install PM2 globally
     ```
     npm install -g pm2
     ```
  2. Clone the repository
     ```
     https://github.com/energypatrikhu/bandwidth-hero-proxy.git /opt/bandwidth-hero-proxy
     ```
  3. cd into cloned repository
     ```
     cd /opt/bandwidth-hero-proxy
     ```
  4. Install dependencies
     ```
     npm install
     ```
  5. Build project
     ```
     npm run build
     ```
  6. Start pm2 script
     ```
     pm2 start ecosystem.config.cjs
     ```
     - (Optional) Save PM2 scripts
         > This is needed if PM2 autostart is enabled and you want to autostart currently running scripts
         ```
         pm2 save
         ```
     - (Optional) Enable PM2 to start at startup
         ```
         pm2 startup
         ```

# Environment Variables

- MAX_CLUSTER_SIZE
  - Maximum number of workers to spawn (ignored if CLUSTER_SIZE is set) (default: 4)

- CLUSTER_SIZE
  - Number of workers to spawn (default: 0 (number of CPU threads))

- SHARP_CONCURRENCY
  - Number of threads to use for image processing (default: number of CPU threads)

- USE_BEST_COMPRESSION_FORMAT
  - Use best format that achieves the best compression (default: false)

- ENABLE_ALTERNATIVE_FORMAT
  - Use alternative format if current format is larger than original (default: false)