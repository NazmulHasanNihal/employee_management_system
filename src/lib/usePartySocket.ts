import { useEffect, useState } from 'react';

interface PartySocketOptions {
  host: string;
  room: string;
  onMessage?: (e: MessageEvent) => void;
}

export default function usePartySocket({ room, onMessage }: PartySocketOptions) {
  return { send: (data: string) => {} };
}
