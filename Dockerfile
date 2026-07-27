# Why not node:26-bookworm-slim?
# better-sqlite3@13 ships a prebuild that needs GLIBC ≥ 2.38.
# node:26-bookworm-slim is Debian 12 with GLIBC 2.36, so
# `$ drizzle-kit migrate` failed loading the native binding.
#
# Fix: Switch the base image to node:26-slim
# (Debian 13 / Trixie, GLIBC 2.41)
FROM node:26-slim AS base

WORKDIR /app
ENV NODE_ENV="production"


FROM base AS build

# Install packages needed to build node modules (e.g. better-sqlite3) when
# prebuilds are unavailable for the current platform.
RUN apt-get update -qq && \
    apt-get install -y build-essential pkg-config python-is-python3

COPY --link package-lock.json package.json ./
RUN npm ci --include=dev
COPY --link . .
RUN npm run build
RUN npx drizzle-kit migrate
RUN npm prune --omit=dev


FROM base

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/package.json /app/package.json

CMD ["npm", "run", "start"]
