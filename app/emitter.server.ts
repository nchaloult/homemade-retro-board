import { EventEmitter } from "node:events";

export const emitter = new EventEmitter();
emitter.setMaxListeners(50);
