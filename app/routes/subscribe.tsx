import { eventStream } from "remix-utils/sse/server";
import type { Route } from "./+types/subscribe";
import { emitter } from "~/emitter.server";

export async function loader({ request }: Route.LoaderArgs) {
  return eventStream(request.signal, function setup(send, close) {
    function handleBoardUpdate() {
      try {
        // data field's contents don't matter; they aren't used anywhere. They
        // just need to be unique so clients treat each payload as a new event.
        send({ event: "board-update", data: new Date().toISOString() });
      } catch {
        // Proxies (e.g. Fly) can close the SSE stream without aborting
        // request.signal. remix-utils then still thinks the stream is open,
        // so send() throws "Controller is already closed". Because
        // EventEmitter.emit is synchronous, that exception would otherwise
        // escape into the board action and 500 the CUD request even though
        // the write already succeeded.
        emitter.off("boardUpdate", handleBoardUpdate);
        try {
          close();
        } catch {
          // Controller may already be closed.
        }
      }
    }

    emitter.on("boardUpdate", handleBoardUpdate);

    return function clear() {
      emitter.off("boardUpdate", handleBoardUpdate);
    };
  });
}
