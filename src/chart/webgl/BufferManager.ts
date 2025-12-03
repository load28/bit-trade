/**
 * BitChart - Buffer Manager
 * WebGL 버퍼 (VBO, VAO) 관리
 */

import type { AttributeDefinition, BufferUsage } from '../types/webgl';
import { getBufferUsage } from '../utils/webglUtils';

/** 버퍼 정보 */
interface BufferInfo {
  buffer: WebGLBuffer;
  usage: number;
  size: number; // bytes
  lastUpdate: number;
}

/** VAO 정보 */
interface VAOInfo {
  vao: WebGLVertexArrayObject;
  attributes: AttributeDefinition[];
  buffers: Map<string, WebGLBuffer>;
}

/**
 * 버퍼 매니저 클래스
 * VBO, VAO 생성 및 관리
 */
export class BufferManager {
  private gl: WebGL2RenderingContext;
  private buffers: Map<string, BufferInfo> = new Map();
  private vaos: Map<string, VAOInfo> = new Map();
  private totalMemory: number = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * 버퍼 생성
   */
  createBuffer(
    id: string,
    data: ArrayBufferView | null,
    usage: BufferUsage = 'static'
  ): WebGLBuffer | null {
    const gl = this.gl;

    // 기존 버퍼가 있으면 삭제
    if (this.buffers.has(id)) {
      this.deleteBuffer(id);
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      console.error('Failed to create buffer');
      return null;
    }

    const glUsage = getBufferUsage(gl, usage);
    const size = data ? data.byteLength : 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    if (data) {
      gl.bufferData(gl.ARRAY_BUFFER, data, glUsage);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.buffers.set(id, {
      buffer,
      usage: glUsage,
      size,
      lastUpdate: performance.now(),
    });

    this.totalMemory += size;
    return buffer;
  }

  /**
   * 버퍼 가져오기
   */
  getBuffer(id: string): WebGLBuffer | null {
    const info = this.buffers.get(id);
    return info ? info.buffer : null;
  }

  /**
   * 버퍼 데이터 업데이트
   */
  updateBuffer(id: string, data: ArrayBufferView, offset: number = 0): boolean {
    const gl = this.gl;
    const info = this.buffers.get(id);

    if (!info) {
      console.error(`Buffer not found: ${id}`);
      return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, info.buffer);

    // 버퍼 크기가 충분한지 확인
    const requiredSize = offset + data.byteLength;
    if (requiredSize > info.size) {
      // 버퍼 재할당 (Buffer Orphaning 패턴)
      this.totalMemory -= info.size;
      gl.bufferData(gl.ARRAY_BUFFER, requiredSize, info.usage);
      info.size = requiredSize;
      this.totalMemory += requiredSize;
    }

    // 데이터 업데이트
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, data);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    info.lastUpdate = performance.now();
    return true;
  }

  /**
   * 버퍼 전체 데이터 교체 (Buffer Orphaning)
   */
  replaceBufferData(id: string, data: ArrayBufferView): boolean {
    const gl = this.gl;
    const info = this.buffers.get(id);

    if (!info) {
      console.error(`Buffer not found: ${id}`);
      return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, info.buffer);

    // Buffer Orphaning: 이전 버퍼 해제, 새 버퍼 할당
    this.totalMemory -= info.size;
    gl.bufferData(gl.ARRAY_BUFFER, data, info.usage);
    info.size = data.byteLength;
    this.totalMemory += info.size;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    info.lastUpdate = performance.now();
    return true;
  }

  /**
   * 버퍼 삭제
   */
  deleteBuffer(id: string): void {
    const info = this.buffers.get(id);
    if (info) {
      this.gl.deleteBuffer(info.buffer);
      this.totalMemory -= info.size;
      this.buffers.delete(id);
    }
  }

  /**
   * VAO 생성
   */
  createVAO(id: string, attributes: AttributeDefinition[]): WebGLVertexArrayObject | null {
    const gl = this.gl;

    // 기존 VAO가 있으면 삭제
    if (this.vaos.has(id)) {
      this.deleteVAO(id);
    }

    const vao = gl.createVertexArray();
    if (!vao) {
      console.error('Failed to create VAO');
      return null;
    }

    this.vaos.set(id, {
      vao,
      attributes,
      buffers: new Map(),
    });

    return vao;
  }

  /**
   * VAO 가져오기
   */
  getVAO(id: string): WebGLVertexArrayObject | null {
    const info = this.vaos.get(id);
    return info ? info.vao : null;
  }

  /**
   * VAO에 버퍼 연결
   */
  setupVAOAttribute(
    vaoId: string,
    bufferId: string,
    attributeIndex: number,
    size: number,
    type: number,
    normalized: boolean = false,
    stride: number = 0,
    offset: number = 0,
    divisor: number = 0
  ): boolean {
    const gl = this.gl;
    const vaoInfo = this.vaos.get(vaoId);
    const buffer = this.getBuffer(bufferId);

    if (!vaoInfo || !buffer) {
      console.error('VAO or buffer not found');
      return false;
    }

    gl.bindVertexArray(vaoInfo.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(attributeIndex);
    gl.vertexAttribPointer(attributeIndex, size, type, normalized, stride, offset);

    if (divisor > 0) {
      gl.vertexAttribDivisor(attributeIndex, divisor);
    }

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    vaoInfo.buffers.set(bufferId, buffer);
    return true;
  }

  /**
   * VAO 바인딩
   */
  bindVAO(id: string): boolean {
    const vaoInfo = this.vaos.get(id);
    if (!vaoInfo) {
      console.error(`VAO not found: ${id}`);
      return false;
    }

    this.gl.bindVertexArray(vaoInfo.vao);
    return true;
  }

  /**
   * VAO 바인딩 해제
   */
  unbindVAO(): void {
    this.gl.bindVertexArray(null);
  }

  /**
   * VAO 삭제
   */
  deleteVAO(id: string): void {
    const info = this.vaos.get(id);
    if (info) {
      this.gl.deleteVertexArray(info.vao);
      this.vaos.delete(id);
    }
  }

  /**
   * 총 메모리 사용량 (bytes)
   */
  getTotalMemory(): number {
    return this.totalMemory;
  }

  /**
   * 버퍼 정보 가져오기
   */
  getBufferInfo(id: string): BufferInfo | undefined {
    return this.buffers.get(id);
  }

  /**
   * 모든 버퍼 정리
   */
  destroy(): void {
    // 모든 버퍼 삭제
    for (const [id] of this.buffers) {
      this.deleteBuffer(id);
    }

    // 모든 VAO 삭제
    for (const [id] of this.vaos) {
      this.deleteVAO(id);
    }
  }
}
