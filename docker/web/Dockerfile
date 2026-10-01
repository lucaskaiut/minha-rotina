FROM node:22-alpine

ENV NODE_ENV=development \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apk add --no-cache git wget

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

WORKDIR /app

EXPOSE 3000

CMD ["start.sh"]
