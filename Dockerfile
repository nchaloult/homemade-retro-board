FROM node:20-bullseye-slim as base

WORKDIR /app
ENV NODE_ENV="production"


FROM base as build

# Install packages needed to build node modules. Seems to be a Vite-only
# necessity.
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
