// src/components/hooks/useWebSocket.js
import { useEffect, useRef } from 'react';

/**
 * Custom React hook to manage a WebSocket connection.
 * 
 * @param {Function} onMessage - Callback for incoming messages (JSON parsed).
 * @returns {Object} wsRef - Reference to the active WebSocket connection.
 */
export default function useWebSocket(onMessage) {
  const wsRef = useRef(null);

  useEffect(() => {
    // Decide between ws:// and wss:// based on current page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = process.env.REACT_APP_WS_HOST || '127.0.0.1';
    const port = process.env.REACT_APP_WS_PORT || '8000';

    // Django Channels route → /ws/reports/
    const url = `${protocol}://${host}:${port}/ws/reports/`;

    // Create WebSocket connection
    const ws = new WebSocket(url);

    ws.onopen = () => console.log(`✅ WebSocket connected: ${url}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data);
        }
      } catch (err) {
        console.error('❌ WebSocket JSON parse error:', err);
      }
    };

    ws.onclose = () => console.log('⚠️ WebSocket disconnected');
    ws.onerror = (err) => console.error('❌ WebSocket error:', err);

    wsRef.current = ws;

    // Cleanup on component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onMessage]);

  return wsRef;
}
