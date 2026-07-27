import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("boards/create", "routes/createBoard.tsx"),
  route("boards/:externalId/subscribe", "routes/subscribe.tsx"),
  layout("routes/layout.tsx", [
    route("boards", "routes/boards.tsx"),
    route("boards/:externalId", "routes/board.tsx"),
  ]),
] satisfies RouteConfig;
