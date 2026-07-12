import type { Party, PartyServer, Connection } from "partykit/server";

export default class EMSPresenceServer implements PartyServer {
  constructor(readonly party: Party) {}

  onConnect(conn: Connection, ctx: any) {
    // A connection is made
    // Broadcast the new connection count to everyone
    this.party.broadcast(JSON.stringify({
      type: "connections",
      count: Array.from(this.party.getConnections()).length,
    }));
  }

  onMessage(message: string, sender: Connection) {
    // If a user sends a specific presence update (e.g. pulse, online status)
    // we can broadcast it to everyone
    this.party.broadcast(message, [sender.id]);
  }

  onClose(conn: Connection) {
    // When a user disconnects, broadcast the new count
    this.party.broadcast(JSON.stringify({
      type: "connections",
      count: Array.from(this.party.getConnections()).length,
    }));
  }
}
