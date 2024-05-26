import { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { emitter } from "~/emitter.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return eventStream(request.signal, function setup(send) {
    function handleBoardUpdate() {
      // data field's contents don't matter; they aren't used anywhere. They
      // just need to be unique so the EventEmitter decides to fire off another
      // event to all subscribed clients.
      send({ event: "board-update", data: new Date().toISOString() });
    }

    emitter.on("boardUpdate", handleBoardUpdate);

    return function clear() {
      emitter.off("boardUpdate", handleBoardUpdate);
    };
  });
}
