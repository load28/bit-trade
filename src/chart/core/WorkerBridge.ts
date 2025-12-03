/**
 * BitChart - Worker Bridge
 * Main Thread에서 Worker와의 통신을 관리
 *
 * Features:
 * - Worker 생성 및 생명주기 관리
 * - 메시지 송수신 추상화
 * - Promise 기반 요청-응답 패턴
 * - 에러 핸들링
 */

import type {
  RenderWorkerMessage,
  RenderWorkerResponse,
  ComputeWorkerMessage,
  ComputeWorkerResponse,
  Viewport,
} from '../types';

/** Worker 상태 */
export type WorkerState = 'idle' | 'initializing' | 'ready' | 'error' | 'destroyed';

/** Worker 이벤트 */
export interface WorkerEvent {
  type: 'stateChange' | 'frameComplete' | 'error';
  state?: WorkerState;
  data?: unknown;
  error?: Error;
}

/** Worker 이벤트 리스너 */
export type WorkerEventListener = (event: WorkerEvent) => void;

/** 대기 중인 요청 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Worker Bridge 베이스 클래스
 */
abstract class BaseWorkerBridge<TMessage, TResponse> {
  protected worker: Worker | null = null;
  protected state: WorkerState = 'idle';
  protected listeners: Set<WorkerEventListener> = new Set();
  protected pendingRequests: Map<string, PendingRequest> = new Map();
  protected requestIdCounter = 0;
  protected defaultTimeout = 30000;

  /**
   * Worker 초기화
   */
  protected async initWorker(
    workerFactory: () => Worker
  ): Promise<TResponse> {
    if (this.state !== 'idle') {
      throw new Error(`Cannot initialize worker in state: ${this.state}`);
    }

    this.setState('initializing');

    return new Promise((resolve, reject) => {
      try {
        this.worker = workerFactory();

        this.worker.onmessage = (event: MessageEvent<TResponse>) => {
          this.handleMessage(event.data);

          // 첫 메시지가 'ready'면 초기화 완료
          if ((event.data as { type: string }).type === 'ready') {
            this.setState('ready');
            resolve(event.data);
          }
        };

        this.worker.onerror = (event) => {
          this.handleError(new Error(event.message));
          reject(event);
        };

        this.worker.onmessageerror = () => {
          this.handleError(new Error('Message deserialization error'));
        };
      } catch (error) {
        this.setState('error');
        reject(error);
      }
    });
  }

  /**
   * 메시지 전송 (Fire and forget)
   */
  protected postMessage(message: TMessage, transfer?: Transferable[]): void {
    if (!this.worker || this.state !== 'ready') {
      console.warn('Worker not ready, message dropped');
      return;
    }

    if (transfer) {
      this.worker.postMessage(message, transfer);
    } else {
      this.worker.postMessage(message);
    }
  }

  /**
   * 요청-응답 패턴 메시지 전송
   */
  protected async sendRequest<T>(
    message: TMessage & { id?: string },
    timeout = this.defaultTimeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestIdCounter}`;
      (message as { id: string }).id = id;

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${id}`));
      }, timeout);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: timeoutHandle,
      });

      this.postMessage(message);
    });
  }

  /**
   * 메시지 핸들링
   */
  protected handleMessage(data: TResponse): void {
    const response = data as { type: string; id?: string };

    // 요청-응답 패턴 처리
    if (response.id && this.pendingRequests.has(response.id)) {
      const pending = this.pendingRequests.get(response.id)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.id);

      if (response.type === 'error') {
        pending.reject(new Error((response as { message?: string }).message));
      } else {
        pending.resolve(data);
      }
      return;
    }

    // 이벤트 타입별 처리
    switch (response.type) {
      case 'frameComplete':
        this.notifyListeners({
          type: 'frameComplete',
          data,
        });
        break;
      case 'error':
        this.handleError(
          new Error((response as { message?: string }).message || 'Unknown error')
        );
        break;
    }
  }

  /**
   * 에러 핸들링
   */
  protected handleError(error: Error): void {
    this.setState('error');
    this.notifyListeners({
      type: 'error',
      error,
    });
  }

  /**
   * 상태 변경
   */
  protected setState(state: WorkerState): void {
    this.state = state;
    this.notifyListeners({
      type: 'stateChange',
      state,
    });
  }

  /**
   * 리스너 알림
   */
  protected notifyListeners(event: WorkerEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Worker event listener error:', e);
      }
    });
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listener: WorkerEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(listener: WorkerEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 현재 상태
   */
  getState(): WorkerState {
    return this.state;
  }

  /**
   * Worker 종료
   */
  destroy(): void {
    // 대기 중인 요청 모두 reject
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker destroyed'));
    });
    this.pendingRequests.clear();

    // Worker 종료
    if (this.worker) {
      this.postMessage({ type: 'destroy' } as TMessage);
      this.worker.terminate();
      this.worker = null;
    }

    this.setState('destroyed');
    this.listeners.clear();
  }
}

/**
 * Render Worker Bridge
 */
export class RenderWorkerBridge extends BaseWorkerBridge<
  RenderWorkerMessage,
  RenderWorkerResponse
> {
  private canvas: HTMLCanvasElement | null = null;
  private offscreenCanvas: OffscreenCanvas | null = null;

  /**
   * 초기화
   */
  async init(
    canvas: HTMLCanvasElement,
    sharedBuffer?: SharedArrayBuffer
  ): Promise<RenderWorkerResponse> {
    this.canvas = canvas;

    // OffscreenCanvas 지원 확인
    if (!('transferControlToOffscreen' in canvas)) {
      throw new Error('OffscreenCanvas not supported');
    }

    // OffscreenCanvas 생성 및 Worker로 전송
    this.offscreenCanvas = canvas.transferControlToOffscreen();

    const response = await this.initWorker(() => {
      // Worker 파일은 빌드 시스템에 따라 경로 조정 필요
      return new Worker(new URL('../workers/RenderWorker.ts', import.meta.url), {
        type: 'module',
      });
    });

    // 초기화 메시지 전송
    const initMessage: RenderWorkerMessage = {
      type: 'init',
      canvas: this.offscreenCanvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      sharedBuffer,
    };

    this.worker!.postMessage(initMessage, [this.offscreenCanvas as unknown as Transferable]);

    return response;
  }

  /**
   * 리사이즈
   */
  resize(width: number, height: number): void {
    this.postMessage({
      type: 'resize',
      width,
      height,
    });
  }

  /**
   * 데이터 업데이트 (Transferable)
   */
  updateData(data: Float32Array): void {
    // 데이터 복사본 생성 (원본 유지)
    const copy = new Float32Array(data);
    this.postMessage(
      {
        type: 'updateData',
        data: copy,
      },
      [copy.buffer]
    );
  }

  /**
   * SharedArrayBuffer 기반 데이터 업데이트
   */
  updateDataShared(offset: number, count: number): void {
    this.postMessage({
      type: 'updateDataShared',
      offset,
      count,
    });
  }

  /**
   * 뷰포트 설정
   */
  setViewport(viewport: Viewport): void {
    this.postMessage({
      type: 'setViewport',
      viewport,
    });
  }

  /**
   * 테마 설정
   */
  setTheme(
    theme: 'light' | 'dark',
    colors?: {
      up: [number, number, number, number];
      down: [number, number, number, number];
      background: [number, number, number, number];
    }
  ): void {
    this.postMessage({
      type: 'setTheme',
      theme,
      colors,
    });
  }

  /**
   * 시리즈 가시성 설정
   */
  setSeriesVisibility(seriesId: string, visible: boolean): void {
    this.postMessage({
      type: 'setSeriesVisibility',
      seriesId,
      visible,
    });
  }
}

/**
 * Compute Worker Bridge
 */
export class ComputeWorkerBridge extends BaseWorkerBridge<
  ComputeWorkerMessage,
  ComputeWorkerResponse
> {
  /**
   * 초기화
   */
  async init(sharedBuffer?: SharedArrayBuffer): Promise<ComputeWorkerResponse> {
    const response = await this.initWorker(() => {
      return new Worker(new URL('../workers/ComputeWorker.ts', import.meta.url), {
        type: 'module',
      });
    });

    // 초기화 메시지 전송
    const initMessage: ComputeWorkerMessage = {
      type: 'init',
      canvas: null as unknown as OffscreenCanvas, // Compute Worker는 canvas 불필요
      width: 0,
      height: 0,
      devicePixelRatio: 1,
      sharedBuffer,
    };

    this.postMessage(initMessage);

    return response;
  }

  /**
   * 지표 계산 요청
   */
  async computeIndicator(
    indicator: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB',
    params: Record<string, number>,
    dataOffset: number,
    dataCount: number
  ): Promise<Float32Array> {
    const response = await this.sendRequest<ComputeWorkerResponse>({
      type: 'computeIndicator',
      indicator,
      params,
      dataOffset,
      dataCount,
    });

    if (response.type === 'indicatorResult') {
      return (response as { data: Float32Array }).data;
    }

    throw new Error('Unexpected response type');
  }

  /**
   * M4 데시메이션 요청
   */
  async decimate(
    dataOffset: number,
    dataCount: number,
    targetCount: number
  ): Promise<{ data: Float32Array; originalCount: number; decimatedCount: number }> {
    const response = await this.sendRequest<ComputeWorkerResponse>({
      type: 'decimate',
      dataOffset,
      dataCount,
      targetCount,
    });

    if (response.type === 'decimateResult') {
      const result = response as {
        data: Float32Array;
        originalCount: number;
        decimatedCount: number;
      };
      return {
        data: result.data,
        originalCount: result.originalCount,
        decimatedCount: result.decimatedCount,
      };
    }

    throw new Error('Unexpected response type');
  }
}
