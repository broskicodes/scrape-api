import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { TwitterScraperService } from '../services/twitterScraperService';

export enum ClientMessageType {
    Scrape = "scrape",
}

export enum WebSocketMessageType {
    Ready = "ready",
    Success = "success",
    Error = "error",
}

interface ClientMessage {
  id?: string;
  type: ClientMessageType;
  payload: any;
}

interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}

// Store active connections
const connections = new Set<WebSocket>();

export const broadcast = (message: WebSocketMessage) => {
  connections.forEach(socket => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  });
};

export default fp(async (fastify: FastifyInstance) => {
  // Register the websocket plugin first
  await fastify.register(websocket);

  fastify.get('/ws', { websocket: true }, (socket, req) => {
    connections.add(socket);

    socket.on('message', (rawMessage: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(rawMessage.toString());
        handleMessage(socket, message);
      } catch (error) {
        socket.send(JSON.stringify({
          type: 'ERROR',
          payload: 'Invalid message format'
        }));
      }
    });

    socket.on('close', () => {
      connections.delete(socket);
    });

    socket.send(JSON.stringify({
      type: WebSocketMessageType.Ready,
      payload: 'Connected to WebSocket server'
    }));
  });
}, {
  name: 'websocket-plugin'
});

async function handleMessage(socket: WebSocket, message: ClientMessage) {
  console.log('Received message:', message);
  switch (message.type) {
    case ClientMessageType.Scrape:
      const twitterScraperService = new TwitterScraperService();
      const { scrapeType, handles } = message.payload;
      const success = await twitterScraperService.runScrapeJob(scrapeType, handles);

      if (success) {
        socket.send(JSON.stringify({
          messageId: message.id,
          type: WebSocketMessageType.Success,
          payload: 'Tweets scraped successfully'
        }));
      } else {
        socket.send(JSON.stringify({
          messageId: message.id,
          type: WebSocketMessageType.Error,
          payload: 'Error scraping tweets'
        }));
      }
      
      // Handle job status request
      break;
    default:
      socket.send(JSON.stringify({
        message: "Unknown message type"
      }));
  }
} 