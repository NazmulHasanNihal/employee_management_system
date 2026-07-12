import { useEffect, useState } from 'react';

interface PartySocketOptions {
  host: string;
  room: string;
  onMessage?: (e: MessageEvent) => void;
}

export default function usePartySocket({ room, onMessage }: PartySocketOptions) {
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    console.warn("Real-time sockets are mocked since migrating away from Supabase.");
    // Return a dummy object with send method
    setSocket({ send: () => {} });
    return () => {};
  }, [room, onMessage]);

  return socket;
}
