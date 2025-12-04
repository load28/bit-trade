/**
 * BitChart - Render Worker
 * OffscreenCanvas + WebGL 2.0 기반 렌더링 워커
 *
 * Main Thread에서 Canvas 제어를 분리하여 UI 블로킹 방지
 */

import type {
  RenderWorkerMessage,
  RenderWorkerResponse,
  InitMessage,
  ResizeMessage,
  UpdateDataMessage,
  UpdateDataSharedMessage,
  SetViewportMessage,
  SetThemeMessage,
  SetSeriesVisibilityMessage,
} from '../types/worker';
import type { Viewport } from '../types/data';

// 분리된 모듈 import
import {
  CANDLESTICK_VERTEX_SHADER,
  CANDLESTICK_FRAGMENT_SHADER,
  VOLUME_VERTEX_SHADER,
  VOLUME_FRAGMENT_SHADER,
} from './shaders';
import { createCandlestickGeometry, createVolumeGeometry } from './geometry';
import { createProgram } from './utils';

// Worker 전역 상태
let gl: WebGL2RenderingContext | null = null;
let canvas: OffscreenCanvas | null = null;
let width = 0;
let height = 0;
let devicePixelRatio = 1;

// SharedArrayBuffer 관련
let sharedBuffer: SharedArrayBuffer | null = null;
let sharedMeta: Int32Array | null = null;
let sharedData: Float32Array | null = null;

// 데이터 버퍼 (Transferable 또는 SharedArrayBuffer에서 복사)
let dataBuffer: Float32Array | null = null;
let dataCount = 0;

// 뷰포트
let viewport: Viewport = {
  timeRange: { from: 0, to: 1 },
  priceRange: { min: 0, max: 1 },
  volumeRange: { min: 0, max: 1 },
  width: 0,
  height: 0,
};

// 테마 색상
let upColor: Float32Array = new Float32Array([0.22, 0.78, 0.45, 1.0]);
let downColor: Float32Array = new Float32Array([0.96, 0.26, 0.21, 1.0]);
let backgroundColor: Float32Array = new Float32Array([1.0, 1.0, 1.0, 1.0]);

// 렌더링 상태
let isInitialized = false;
let animationFrameId: number | null = null;
let lastFrameTime = 0;

// WebGL 리소스
let programs: Map<string, WebGLProgram> = new Map();
let buffers: Map<string, WebGLBuffer> = new Map();
let vaos: Map<string, WebGLVertexArrayObject> = new Map();

// 시리즈 가시성
let seriesVisibility: Map<string, boolean> = new Map([
  ['candlestick', true],
  ['volume', true],
]);

// 성능 통계
let stats = {
  frameTime: 0,
  drawCalls: 0,
  instances: 0,
};

/**
 * 메시지 핸들러
 */
self.onmessage = (event: MessageEvent<RenderWorkerMessage>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case 'init':
        handleInit(message);
        break;
      case 'resize':
        handleResize(message);
        break;
      case 'updateData':
        handleUpdateData(message);
        break;
      case 'updateDataShared':
        handleUpdateDataShared(message);
        break;
      case 'setViewport':
        handleSetViewport(message);
        break;
      case 'setTheme':
        handleSetTheme(message);
        break;
      case 'setSeriesVisibility':
        handleSetSeriesVisibility(message);
        break;
      case 'destroy':
        handleDestroy();
        break;
    }
  } catch (error) {
    postError(error instanceof Error ? error.message : 'Unknown error', message.id);
  }
};

/**
 * 초기화
 */
function handleInit(message: InitMessage): void {
  canvas = message.canvas;
  width = message.width;
  height = message.height;
  devicePixelRatio = message.devicePixelRatio;

  // SharedArrayBuffer 설정
  if (message.sharedBuffer) {
    setupSharedBuffer(message.sharedBuffer);
  }

  // WebGL 2.0 컨텍스트 생성
  gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    desynchronized: true, // 낮은 지연 시간
  }) as WebGL2RenderingContext | null;

  if (!gl) {
    postError('WebGL 2.0 not supported');
    return;
  }

  // Canvas 크기 설정
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;

  // WebGL 초기 설정
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(
    backgroundColor[0],
    backgroundColor[1],
    backgroundColor[2],
    backgroundColor[3]
  );

  // 셰이더 프로그램 컴파일
  initShaders();

  // 버퍼 초기화
  initBuffers();

  isInitialized = true;

  // GPU 정보 수집
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : 'Unknown';

  // 준비 완료 응답
  const response: RenderWorkerResponse = {
    type: 'ready',
    webglVersion: 2,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    renderer,
  };
  self.postMessage(response);

  // 렌더 루프 시작
  startRenderLoop();
}

/**
 * SharedArrayBuffer 설정
 */
function setupSharedBuffer(buffer: SharedArrayBuffer): void {
  sharedBuffer = buffer;
  sharedMeta = new Int32Array(buffer, 0, 4);
  // 데이터 영역은 메타데이터 이후부터 시작 (16 bytes = 4 int32)
  const dataByteOffset = 4 * 4;
  const dataByteLength = buffer.byteLength - dataByteOffset;
  sharedData = new Float32Array(buffer, dataByteOffset, dataByteLength / 4);
}

/**
 * 리사이즈 처리
 */
function handleResize(message: ResizeMessage): void {
  if (!canvas || !gl) return;

  width = message.width;
  height = message.height;

  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;

  gl.viewport(0, 0, canvas.width, canvas.height);

  viewport.width = width;
  viewport.height = height;
}

/**
 * 데이터 업데이트 (Transferable)
 */
function handleUpdateData(message: UpdateDataMessage): void {
  dataBuffer = message.data;
  dataCount = dataBuffer.length / 6; // OHLCV = 6 floats

  // GPU 버퍼 업데이트
  updateGPUBuffers();
}

/**
 * SharedArrayBuffer 기반 데이터 업데이트
 */
function handleUpdateDataShared(message: UpdateDataSharedMessage): void {
  if (!sharedData) return;

  const { offset, count } = message;
  dataCount = count;

  // SharedArrayBuffer에서 직접 읽기 (zero-copy는 아니지만 메모리 효율적)
  if (!dataBuffer || dataBuffer.length < count * 6) {
    dataBuffer = new Float32Array(count * 6);
  }

  // 데이터 복사
  for (let i = 0; i < count * 6; i++) {
    dataBuffer[i] = sharedData[offset + i];
  }

  // GPU 버퍼 업데이트
  updateGPUBuffers();
}

/**
 * 뷰포트 업데이트
 */
function handleSetViewport(message: SetViewportMessage): void {
  viewport = message.viewport;
}

/**
 * 테마 변경
 */
function handleSetTheme(message: SetThemeMessage): void {
  if (message.colors) {
    upColor = new Float32Array(message.colors.up);
    downColor = new Float32Array(message.colors.down);
    backgroundColor = new Float32Array(message.colors.background);
  } else {
    // 기본 테마 색상
    if (message.theme === 'dark') {
      upColor = new Float32Array([0.22, 0.78, 0.45, 1.0]);
      downColor = new Float32Array([0.96, 0.26, 0.21, 1.0]);
      backgroundColor = new Float32Array([0.1, 0.1, 0.1, 1.0]);
    } else {
      upColor = new Float32Array([0.22, 0.78, 0.45, 1.0]);
      downColor = new Float32Array([0.96, 0.26, 0.21, 1.0]);
      backgroundColor = new Float32Array([1.0, 1.0, 1.0, 1.0]);
    }
  }

  if (gl) {
    gl.clearColor(
      backgroundColor[0],
      backgroundColor[1],
      backgroundColor[2],
      backgroundColor[3]
    );
  }
}

/**
 * 시리즈 가시성 변경
 */
function handleSetSeriesVisibility(message: SetSeriesVisibilityMessage): void {
  seriesVisibility.set(message.seriesId, message.visible);
}

/**
 * 종료 처리
 */
function handleDestroy(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // WebGL 리소스 정리
  if (gl) {
    programs.forEach((program) => gl!.deleteProgram(program));
    buffers.forEach((buffer) => gl!.deleteBuffer(buffer));
    vaos.forEach((vao) => gl!.deleteVertexArray(vao));
  }

  programs.clear();
  buffers.clear();
  vaos.clear();

  gl = null;
  canvas = null;
  isInitialized = false;
}

/**
 * 셰이더 초기화
 */
function initShaders(): void {
  if (!gl) return;

  // 캔들스틱 셰이더
  const candlestickProgram = createProgram(
    gl,
    CANDLESTICK_VERTEX_SHADER,
    CANDLESTICK_FRAGMENT_SHADER
  );
  if (candlestickProgram) {
    programs.set('candlestick', candlestickProgram);
  }

  // 볼륨 셰이더
  const volumeProgram = createProgram(gl, VOLUME_VERTEX_SHADER, VOLUME_FRAGMENT_SHADER);
  if (volumeProgram) {
    programs.set('volume', volumeProgram);
  }
}

/**
 * 버퍼 초기화
 */
function initBuffers(): void {
  if (!gl) return;

  // 캔들스틱 지오메트리 버퍼
  const candleGeometry = createCandlestickGeometry();
  const candleGeomBuffer = gl.createBuffer();
  if (candleGeomBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, candleGeomBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, candleGeometry.positions, gl.STATIC_DRAW);
    buffers.set('candlestick_geometry', candleGeomBuffer);
  }

  const candleTypeBuffer = gl.createBuffer();
  if (candleTypeBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, candleTypeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, candleGeometry.vertexTypes, gl.STATIC_DRAW);
    buffers.set('candlestick_types', candleTypeBuffer);
  }

  // 캔들스틱 인스턴스 버퍼
  const candleInstanceBuffer = gl.createBuffer();
  if (candleInstanceBuffer) {
    buffers.set('candlestick_instances', candleInstanceBuffer);
  }

  // 볼륨 지오메트리 버퍼
  const volumeGeometry = createVolumeGeometry();
  const volumeGeomBuffer = gl.createBuffer();
  if (volumeGeomBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, volumeGeomBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, volumeGeometry, gl.STATIC_DRAW);
    buffers.set('volume_geometry', volumeGeomBuffer);
  }

  // 볼륨 인스턴스 버퍼
  const volumeInstanceBuffer = gl.createBuffer();
  if (volumeInstanceBuffer) {
    buffers.set('volume_instances', volumeInstanceBuffer);
  }

  // VAO 설정
  setupVAOs();
}

/**
 * VAO 설정
 */
function setupVAOs(): void {
  if (!gl) return;

  const candlestickProgram = programs.get('candlestick');
  const volumeProgram = programs.get('volume');

  // 캔들스틱 VAO
  if (candlestickProgram) {
    const vao = gl.createVertexArray();
    if (vao) {
      gl.bindVertexArray(vao);

      // 지오메트리 위치 (a_position)
      const posBuffer = buffers.get('candlestick_geometry');
      if (posBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        const posLoc = gl.getAttribLocation(candlestickProgram, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      }

      // 버텍스 타입 (a_vertexType)
      const typeBuffer = buffers.get('candlestick_types');
      if (typeBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer);
        const typeLoc = gl.getAttribLocation(candlestickProgram, 'a_vertexType');
        gl.enableVertexAttribArray(typeLoc);
        gl.vertexAttribPointer(typeLoc, 1, gl.FLOAT, false, 0, 0);
      }

      gl.bindVertexArray(null);
      vaos.set('candlestick', vao);
    }
  }

  // 볼륨 VAO
  if (volumeProgram) {
    const vao = gl.createVertexArray();
    if (vao) {
      gl.bindVertexArray(vao);

      // 지오메트리 위치 (a_position)
      const posBuffer = buffers.get('volume_geometry');
      if (posBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        const posLoc = gl.getAttribLocation(volumeProgram, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      }

      gl.bindVertexArray(null);
      vaos.set('volume', vao);
    }
  }
}

/**
 * GPU 버퍼 업데이트
 */
function updateGPUBuffers(): void {
  if (!gl || !dataBuffer) return;

  // 캔들스틱 인스턴스 데이터 업데이트
  const candleInstanceBuffer = buffers.get('candlestick_instances');
  if (candleInstanceBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, candleInstanceBuffer);
    // Buffer Orphaning 패턴
    gl.bufferData(gl.ARRAY_BUFFER, dataBuffer.byteLength, gl.STREAM_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, dataBuffer);
  }

  // 볼륨 인스턴스 데이터 업데이트 (동일한 데이터 사용)
  const volumeInstanceBuffer = buffers.get('volume_instances');
  if (volumeInstanceBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, volumeInstanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataBuffer.byteLength, gl.STREAM_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, dataBuffer);
  }

  // VAO에 인스턴스 속성 설정
  setupInstanceAttributes();
}

/**
 * 인스턴스 속성 설정
 */
function setupInstanceAttributes(): void {
  if (!gl) return;

  const candlestickProgram = programs.get('candlestick');
  const volumeProgram = programs.get('volume');

  // 캔들스틱 인스턴스 속성
  if (candlestickProgram) {
    const vao = vaos.get('candlestick');
    const instanceBuffer = buffers.get('candlestick_instances');

    if (vao && instanceBuffer) {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);

      const stride = 6 * 4; // 6 floats per candle

      // a_time (time)
      const timeLoc = gl.getAttribLocation(candlestickProgram, 'a_time');
      gl.enableVertexAttribArray(timeLoc);
      gl.vertexAttribPointer(timeLoc, 1, gl.FLOAT, false, stride, 0);
      gl.vertexAttribDivisor(timeLoc, 1);

      // a_ohlc (open, high, low, close)
      const ohlcLoc = gl.getAttribLocation(candlestickProgram, 'a_ohlc');
      gl.enableVertexAttribArray(ohlcLoc);
      gl.vertexAttribPointer(ohlcLoc, 4, gl.FLOAT, false, stride, 4);
      gl.vertexAttribDivisor(ohlcLoc, 1);

      // a_volume
      const volumeLoc = gl.getAttribLocation(candlestickProgram, 'a_volume');
      gl.enableVertexAttribArray(volumeLoc);
      gl.vertexAttribPointer(volumeLoc, 1, gl.FLOAT, false, stride, 20);
      gl.vertexAttribDivisor(volumeLoc, 1);

      gl.bindVertexArray(null);
    }
  }

  // 볼륨 인스턴스 속성
  if (volumeProgram) {
    const vao = vaos.get('volume');
    const instanceBuffer = buffers.get('volume_instances');

    if (vao && instanceBuffer) {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);

      const stride = 6 * 4;

      // a_time
      const timeLoc = gl.getAttribLocation(volumeProgram, 'a_time');
      gl.enableVertexAttribArray(timeLoc);
      gl.vertexAttribPointer(timeLoc, 1, gl.FLOAT, false, stride, 0);
      gl.vertexAttribDivisor(timeLoc, 1);

      // a_ohlc (for up/down color)
      const ohlcLoc = gl.getAttribLocation(volumeProgram, 'a_ohlc');
      gl.enableVertexAttribArray(ohlcLoc);
      gl.vertexAttribPointer(ohlcLoc, 4, gl.FLOAT, false, stride, 4);
      gl.vertexAttribDivisor(ohlcLoc, 1);

      // a_volume
      const volumeLoc = gl.getAttribLocation(volumeProgram, 'a_volume');
      gl.enableVertexAttribArray(volumeLoc);
      gl.vertexAttribPointer(volumeLoc, 1, gl.FLOAT, false, stride, 20);
      gl.vertexAttribDivisor(volumeLoc, 1);

      gl.bindVertexArray(null);
    }
  }
}

/**
 * 렌더 루프 시작
 */
function startRenderLoop(): void {
  const render = (timestamp: number): void => {
    if (!isInitialized) return;

    const frameStart = performance.now();

    // 렌더링
    renderFrame();

    // 프레임 시간 계산
    stats.frameTime = performance.now() - frameStart;
    lastFrameTime = timestamp;

    // 프레임 완료 응답 (필요시에만)
    if (stats.frameTime > 16) {
      const response: RenderWorkerResponse = {
        type: 'frameComplete',
        timestamp,
        frameTime: stats.frameTime,
        drawCalls: stats.drawCalls,
        instances: dataCount,
      };
      self.postMessage(response);
    }

    animationFrameId = requestAnimationFrame(render);
  };

  animationFrameId = requestAnimationFrame(render);
}

/**
 * 프레임 렌더링
 */
function renderFrame(): void {
  if (!gl || dataCount === 0) {
    // 데이터 없으면 배경만 클리어
    if (gl) {
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    return;
  }

  stats.drawCalls = 0;

  // 배경 클리어
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 볼륨 렌더링 (먼저, 뒤에)
  if (seriesVisibility.get('volume')) {
    renderVolume();
    stats.drawCalls++;
  }

  // 캔들스틱 렌더링 (나중에, 앞에)
  if (seriesVisibility.get('candlestick')) {
    renderCandlestick();
    stats.drawCalls++;
  }

  stats.instances = dataCount;
}

/**
 * 캔들스틱 렌더링
 */
function renderCandlestick(): void {
  if (!gl) return;

  const program = programs.get('candlestick');
  const vao = vaos.get('candlestick');

  if (!program || !vao) return;

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  // Uniforms 설정
  const timeRangeLoc = gl.getUniformLocation(program, 'u_timeRange');
  const priceRangeLoc = gl.getUniformLocation(program, 'u_priceRange');
  const upColorLoc = gl.getUniformLocation(program, 'u_upColor');
  const downColorLoc = gl.getUniformLocation(program, 'u_downColor');
  const viewportLoc = gl.getUniformLocation(program, 'u_viewport');

  // 시간 범위
  gl.uniform4f(
    timeRangeLoc,
    viewport.timeRange.from,
    viewport.timeRange.to,
    0.8 / dataCount, // 캔들 너비
    0
  );

  // 가격 범위
  gl.uniform4f(
    priceRangeLoc,
    viewport.priceRange.min,
    viewport.priceRange.max,
    0,
    0
  );

  // 색상
  gl.uniform4fv(upColorLoc, upColor);
  gl.uniform4fv(downColorLoc, downColor);

  // 뷰포트
  gl.uniform2f(viewportLoc, viewport.width, viewport.height);

  // Instanced 렌더링 (18 vertices per candle)
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 18, dataCount);

  gl.bindVertexArray(null);
}

/**
 * 볼륨 렌더링
 */
function renderVolume(): void {
  if (!gl) return;

  const program = programs.get('volume');
  const vao = vaos.get('volume');

  if (!program || !vao) return;

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  // 블렌딩 활성화
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Uniforms 설정
  const timeRangeLoc = gl.getUniformLocation(program, 'u_timeRange');
  const volumeRangeLoc = gl.getUniformLocation(program, 'u_volumeRange');
  const upColorLoc = gl.getUniformLocation(program, 'u_upColor');
  const downColorLoc = gl.getUniformLocation(program, 'u_downColor');
  const opacityLoc = gl.getUniformLocation(program, 'u_opacity');

  // 시간 범위
  gl.uniform4f(
    timeRangeLoc,
    viewport.timeRange.from,
    viewport.timeRange.to,
    0.8 / dataCount,
    0
  );

  // 볼륨 범위 (baseY=0, height=0.2)
  gl.uniform4f(
    volumeRangeLoc,
    viewport.volumeRange.min,
    viewport.volumeRange.max,
    0.0, // baseY
    0.2  // height
  );

  // 색상
  gl.uniform4fv(upColorLoc, upColor);
  gl.uniform4fv(downColorLoc, downColor);
  gl.uniform1f(opacityLoc, 0.5);

  // Instanced 렌더링 (6 vertices per volume bar)
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, dataCount);

  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
}

/**
 * 에러 응답 전송
 */
function postError(message: string, id?: string): void {
  const response: RenderWorkerResponse = {
    type: 'error',
    message,
    id,
  };
  self.postMessage(response);
}
