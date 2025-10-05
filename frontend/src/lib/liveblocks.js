import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks/auth",
  throttle: 16,
});

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
  useHistory,
  useCanUndo,
  useCanRedo,
  useBatch,
} = createRoomContext(client);
