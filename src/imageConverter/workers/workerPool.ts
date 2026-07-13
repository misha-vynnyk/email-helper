/**
 * Worker Pool Manager
 * Manages a pool of Web Workers for parallel image processing
 */

import { logger } from '../../utils/logger';
import { TIMING } from '../constants/limits';
import { ConversionSettings, ImageFormat, ResizeOptions } from '../types';
// Import worker - Vite will handle this correctly in production
// Using ?worker suffix tells Vite to bundle this as a worker
import WorkerConstructor from './imageWorker.ts?worker';

export interface QualityEstimate {
  quality: number;
  ssim: number;
  estimatedSize: number;
}

interface ConvertTask {
  kind: 'convert';
  id: string;
  file: File;
  settings: ConversionSettings;
  resolve: (blob: Blob) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface EstimateTask {
  kind: 'estimate';
  id: string;
  file: File;
  format: ImageFormat;
  resize: ResizeOptions;
  backgroundColor: string;
  targetSimilarity: number;
  resolve: (result: QualityEstimate) => void;
  reject: (error: Error) => void;
}

type WorkerTask = ConvertTask | EstimateTask;

interface WorkerWithState {
  worker: Worker;
  busy: boolean;
}

export class WorkerPool {
  private workers: WorkerWithState[] = [];
  private queue: WorkerTask[] = [];
  private poolSize: number;
  private WorkerClass: typeof WorkerConstructor;

  constructor(poolSize: number = 2) {
    this.poolSize = poolSize;
    // Use imported Worker class - Vite handles this correctly in production
    // Vite's ?worker returns a Worker class with different constructor signature
    this.WorkerClass = WorkerConstructor;
  }

  /**
   * Initialize the worker pool
   */
  async init(): Promise<void> {
    if (this.workers.length > 0) return;

    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new this.WorkerClass();
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
      const task: ConvertTask = {
        kind: 'convert',
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
   * Binary-search the lowest quality that's still perceptually indistinguishable
   * (by SSIM) from the original, for the "Auto" quality mode.
   */
  async estimateQuality(
    file: File,
    format: ImageFormat,
    resize: ResizeOptions,
    backgroundColor: string,
    targetSimilarity: number
  ): Promise<QualityEstimate> {
    await this.init();

    return new Promise<QualityEstimate>((resolve, reject) => {
      const task: EstimateTask = {
        kind: 'estimate',
        id: `task-${Date.now()}-${Math.random()}`,
        file,
        format,
        resize,
        backgroundColor,
        targetSimilarity,
        resolve,
        reject,
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
    return new Promise<void>((resolve) => {
      let resolved = false;

      const cleanup = () => {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        clearTimeout(timeoutId);
      };

      const handleMessage = (e: MessageEvent) => {
        const response = e.data;

        if (response.id !== task.id) return;

        switch (response.type) {
          case 'progress':
            if (task.kind === 'convert' && task.onProgress) {
              task.onProgress(response.progress);
            }
            break;

          case 'success':
            if (!resolved && task.kind === 'convert') {
              resolved = true;
              cleanup();
              task.resolve(response.blob);
              resolve();
            }
            break;

          case 'quality-estimated':
            if (!resolved && task.kind === 'estimate') {
              resolved = true;
              cleanup();
              task.resolve({ quality: response.quality, ssim: response.ssim, estimatedSize: response.estimatedSize });
              resolve();
            }
            break;

          case 'error':
            if (!resolved) {
              resolved = true;
              cleanup();
              task.reject(new Error(response.error || 'Worker error'));
              resolve(); // Resolve the promise to continue processing queue
            }
            break;
        }
      };

      const handleError = (error: ErrorEvent) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          task.reject(new Error(error.message || 'Worker error'));
          resolve();
        }
      };

      // A worker that never posts back (stuck WASM encode, dropped message) would
      // otherwise keep `busy` true forever and shrink the pool one task at a time.
      // Terminate and replace it so the rest of the queue can keep moving.
      const timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        this.replaceWorker(worker);
        task.reject(new Error(`Conversion timed out after ${TIMING.CONVERSION_TIMEOUT_MS / 1000}s`));
        resolve();
      }, TIMING.CONVERSION_TIMEOUT_MS);

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      // Convert file to ArrayBuffer and send to worker
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result as ArrayBuffer;
        if (task.kind === 'convert') {
          worker.postMessage({
            type: 'convert',
            id: task.id,
            fileData,
            fileName: task.file.name,
            fileType: task.file.type,
            settings: task.settings,
          }, [fileData]);
        } else {
          worker.postMessage({
            type: 'estimate-quality',
            id: task.id,
            fileData,
            fileType: task.file.type,
            format: task.format,
            resize: task.resize,
            backgroundColor: task.backgroundColor,
            targetSimilarity: task.targetSimilarity,
          }, [fileData]);
        }
      };
      reader.onerror = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          task.reject(new Error('Failed to read file'));
          resolve();
        }
      };
      reader.readAsArrayBuffer(task.file);
    });
  }

  /**
   * Terminate a worker that timed out and replace it in the pool so capacity
   * isn't permanently lost.
   */
  private replaceWorker(oldWorker: Worker): void {
    const idx = this.workers.findIndex((w) => w.worker === oldWorker);

    try {
      oldWorker.terminate();
    } catch {
      // ignore
    }

    if (idx === -1) return;

    try {
      this.workers[idx] = { worker: new this.WorkerClass(), busy: false };
    } catch (error) {
      logger.error('WorkerPool', 'Failed to recreate worker after timeout', error);
      this.workers.splice(idx, 1);
    }
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
