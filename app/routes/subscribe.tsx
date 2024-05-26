import { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { emitter } from "~/emitter.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return eventStream(request.signal, function setup(send) {
    function handleNewCard(newCardId: number) {
      send({ event: "new-entry", data: String(newCardId) });
    }

    emitter.on("entry", handleNewCard);

    return function clear() {
      emitter.off("entry", handleNewCard);
    };
  });
}
