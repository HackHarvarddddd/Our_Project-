import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 16,
});

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useBroadcastEvent,
  useEventListener,
  useHistory,
  useCanUndo,
  useCanRedo,
  useMutation,
  useStorage,
  useUpdateMyPresence,
} = createRoomContext(client);
