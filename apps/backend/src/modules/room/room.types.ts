import { Room, Player } from '@partygames/shared';

export interface RoomWithTimers extends Room {
  reconnectTimers?: Map<string, NodeJS.Timeout>;
  emptyRoomTimer?: NodeJS.Timeout;
}
