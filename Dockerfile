FROM node:20-bullseye-slim as base

WORKDIR /app
ENV NODE_ENV="production"


FROM base as build

COPY --link package-lock.json package.json ./
RUN npm ci --include=dev
COPY --link . .
RUN npm run build
RUN npx drizzle-kit migrate
RUN npm prune --omit=dev


FROM base

COPY --from=build /app /app

CMD ["npm", "run", "start"]
