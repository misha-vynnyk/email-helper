/**
 * Worker Pool Manager
 * Manages a pool of Web Workers for parallel image processing
 */

import { logger } from '../../utils/logger';
import { ConversionSettings } from '../types';

interface WorkerTask {
  id: string;
  file: File;
  settings: ConversionSettings;
  resolve: (blob: Blob) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface WorkerWithState {
  worker: Worker;
  busy: boolean;
}

export class WorkerPool {
  private workers: WorkerWithState[] = [];
  private queue: WorkerTask[] = [];
  private poolSize: number;
  private workerUrl: string;

  constructor(poolSize: number = 2) {
    this.poolSize = poolSize;

    // Create worker URL from worker file
    // In Vite, we use ?worker to import as a worker module
    this.workerUrl = new URL('./imageWorker.ts', import.meta.url).href;
  }

  /**
   * Initialize the worker pool
   */
  async init(): Promise<void> {
    if (this.workers.length > 0) return;

    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new Worker(this.workerUrl, { type: 'module' });
        this.workers.push({ worker, busy: false });
      } catch (error) {
        logger.error('WorkerPool', 'Failed to create worker', error);
        // Fall back to fewer workers
        if (this.workers.length === 0) {
          throw new Error('Failed to create any workers');
        }
        break;
      }
    }
  }

  /**
   * Process an image using a worker from the pool
   */
  async process(
    file: File,
    settings: ConversionSettings,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.init();

    return new Promise<Blob>((resolve, reject) => {
      const task: WorkerTask = {
        id: `task-${Date.now()}-${Math.random()}`,
        file,
        settings,
        resolve,
        reject,
        onProgress,
      };

      this.queue.push(task);
      this.processQueue();
    });
  }

  /**
   * Process queued tasks with available workers
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find((w) => !w.busy);
    if (!availableWorker) return;

    const task = this.queue.shift();
    if (!task) return;

    availableWorker.busy = true;

    try {
      await this.runTask(availableWorker.worker, task);
    } finally {
      availableWorker.busy = false;
      // Process next task
      this.processQueue();
    }
  }

  /**
   * Run a single task on a worker
   */
  private async runTask(worker: Worker, task: WorkerTask): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      const handleMessage = (e: MessageEvent) => {
        const response = e.data;

        if (response.id !== task.id) return;

        switch (response.type) {
          case 'progress':
            if (task.onProgress) {
              task.onProgress(response.progress);
            }
            break;

          case 'success':
            if (!resolved) {
              resolved = true;
              worker.removeEventListener('message', handleMessage);
              worker.removeEventListener('error', handleError);
              task.resolve(response.blob);
              resolve();
            }
            break;

          case 'error':
            if (!resolved) {
              resolved = true;
              worker.removeEventListener('message', handleMessage);
              worker.removeEventListener('error', handleError);
              task.reject(new Error(response.error || 'Worker error'));
              resolve(); // Resolve the promise to continue processing queue
            }
            break;
        }
      };

      const handleError = (error: ErrorEvent) => {
        if (!resolved) {
          resolved = true;
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          task.reject(new Error(error.message || 'Worker error'));
          resolve();
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      // Convert file to ArrayBuffer and send to worker
      const reader = new FileReader();
      reader.onload = () => {
        worker.postMessage({
          type: 'convert',
          id: task.id,
          fileData: reader.result,
          fileName: task.file.name,
          fileType: task.file.type,
          settings: task.settings,
        });
      };
      reader.onerror = () => {
        if (!resolved) {
          resolved = true;
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          task.reject(new Error('Failed to read file'));
          resolve();
        }
      };
      reader.readAsArrayBuffer(task.file);
    });
  }

  /**
   * Check if Web Workers are supported
   */
  static isSupported(): boolean {
    return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    this.workers.forEach(({ worker }) => worker.terminate());
    this.workers = [];
    this.queue = [];
  }
}

// Export singleton instance
let workerPool: WorkerPool | null = null;

export function getWorkerPool(): WorkerPool {
  if (!workerPool) {
    workerPool = new WorkerPool(3); // 3 workers by default
  }
  return workerPool;
}
