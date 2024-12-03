import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { Worker } from 'worker_threads';
import path from 'path';

interface WorkerWithAvailability extends Worker {
  isAvailable: boolean;
}

export class WorkerPool {
  private workers: WorkerWithAvailability[] = [];
  private taskQueue: { task: any, resolve: Function, reject: Function }[] = [];
  private readonly maxWorkers: number;

  constructor(maxWorkers = navigator.hardwareConcurrency) {
    this.maxWorkers = maxWorkers;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(path.join(__dirname, '../workers/scrapeWorker.js')) as WorkerWithAvailability;

      worker.on('message', (result) => {
        worker.isAvailable = true;
        this.processNextTask();
        this.taskQueue[0]?.resolve(result);
        this.taskQueue.shift();
      });
      worker.on('error', (error) => {
        console.error('Worker error:', error);
        worker.isAvailable = true;
        this.processNextTask();
        this.taskQueue[0]?.reject(error);
        this.taskQueue.shift();
      });
      worker.isAvailable = true;
      this.workers.push(worker);
      console.log(`Worker ${i} initialized`);
    }
  }

  private processNextTask() {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.find(w => w.isAvailable);
    if (!availableWorker) return;

    availableWorker.isAvailable = false;
    const { task } = this.taskQueue[0];
    availableWorker.postMessage(task);
  }

  runTask(scrapeType: string, handles: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ 
        task: { scrapeType, handles }, 
        resolve, 
        reject 
      });
      this.processNextTask();
    });
  }
}

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
const workerPool = new WorkerPool(5);

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
      const { scrapeType, handles } = message.payload;
      const success = await workerPool.runTask(scrapeType, handles);

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