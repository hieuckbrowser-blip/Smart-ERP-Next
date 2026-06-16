FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3456
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
SHELL ["/bin/sh", "-o", "pipefail", "-c"]
RUN npm install -g pnpm@10.33.0 \
  && apk add --no-cache curl
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY apps/api/ ./apps/api/
COPY scripts/ ./scripts/
COPY apps/web/public/ ./apps/web/public/
RUN set -eux; \
    pnpm install --no-frozen-lockfile; \
    pnpm -r run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=build /app/packages /app/packages
COPY --from=build /app/apps /app/apps
COPY --from=build /app/scripts /app/scripts
COPY --from=build /app/apps/web/public /app/apps/web/public
COPY --from=build /app/node_modules /app/node_modules
RUN set -eux; \
    if [ -d /app/packages ]; then \
      cd /app/packages; \
      for d in */ ; do \
        name="${d%/}"; \
        target="/app/packages/${name}"; \
        link="/app/node_modules/@smart-erp/${name}"; \
        mkdir -p "$(dirname "$link")"; \
        rm -rf "$link"; \
        ln -s "$target" "$link" || cp -R "$target" "$link"; \
      done; \
    fi; \
    true
EXPOSE 3000
WORKDIR /app/apps/web
HEALTHCHECK CMD curl -f http://127.0.0.1:3000/login || exit 1
CMD ["node", "../../scripts/run-web-start.js"]
