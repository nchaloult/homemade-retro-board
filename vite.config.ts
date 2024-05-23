import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig({
  plugins: [
    remix({
      routes(defineRoutes) {
        return defineRoutes((route) => {
          route("/", "routes/landing.tsx");
          route("boards", "routes/boards.tsx");
          route("boards/create", "routes/createBoard.tsx");
          route("boards/:externalId", "routes/board.tsx");
        });
      },
    }),
    tsconfigPaths(),
  ],
});
