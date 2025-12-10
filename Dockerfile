FROM oven/bun:alpine AS builder
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile --production
RUN bun build --compile --minify main.ts --outfile run

FROM alpine:3.22 AS server
RUN apk add --no-cache libgcc libstdc++
COPY --from=builder /app/run /usr/bin/run
ENV PORT=3300
ENV NODE_ENV=production
EXPOSE ${PORT}
CMD ["run"]