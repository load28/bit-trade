/**
 * BitChart - Instanced Renderer
 * Instanced Rendering을 통한 대량 객체 렌더링
 */

import type { WebGLRenderer } from './WebGLRenderer';
import type { ShaderProgramInfo } from '../types/webgl';

/** Instanced 렌더링 설정 */
export interface InstancedRenderConfig {
  /** 인스턴스당 버텍스 수 */
  verticesPerInstance: number;
  /** 지오메트리 버퍼 ID */
  geometryBufferId: string;
  /** 인스턴스 데이터 버퍼 ID */
  instanceBufferId: string;
  /** VAO ID */
  vaoId: string;
}

/**
 * Instanced Renderer 클래스
 * GPU Instancing을 활용하여 대량의 동일 객체를 효율적으로 렌더링
 */
export class InstancedRenderer {
  private renderer: WebGLRenderer;
  private gl: WebGL2RenderingContext;
  private config: InstancedRenderConfig;
  private instanceCount: number = 0;
  private isReady: boolean = false;

  constructor(renderer: WebGLRenderer, config: InstancedRenderConfig) {
    this.renderer = renderer;
    this.gl = renderer.getGL();
    this.config = config;
  }

  /**
   * 지오메트리 버퍼 설정
   */
  setupGeometry(positions: Float32Array, vertexTypes?: Float32Array): void {
    const bufferManager = this.renderer.getBufferManager();
    const gl = this.gl;

    // 지오메트리 버퍼 생성
    bufferManager.createBuffer(
      this.config.geometryBufferId,
      positions,
      'static'
    );

    // VAO 생성
    bufferManager.createVAO(this.config.vaoId, []);

    // VAO에 지오메트리 속성 설정
    bufferManager.bindVAO(this.config.vaoId);

    // a_basePosition (location = 0)
    const geoBuffer = bufferManager.getBuffer(this.config.geometryBufferId);
    if (geoBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, geoBuffer);

      if (vertexTypes) {
        // positions와 vertexTypes가 분리된 경우
        const stride = 0;
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribDivisor(0, 0); // per vertex

        // vertexTypes 버퍼 별도 생성
        bufferManager.createBuffer(
          this.config.geometryBufferId + '_types',
          vertexTypes,
          'static'
        );

        const typesBuffer = bufferManager.getBuffer(this.config.geometryBufferId + '_types');
        if (typesBuffer) {
          gl.bindBuffer(gl.ARRAY_BUFFER, typesBuffer);
          gl.enableVertexAttribArray(1);
          gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
          gl.vertexAttribDivisor(1, 0); // per vertex
        }
      } else {
        // positions만 있는 경우 (볼륨 등)
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(0, 0);
      }
    }

    // 인스턴스 데이터 버퍼 생성 (초기에는 빈 버퍼)
    bufferManager.createBuffer(
      this.config.instanceBufferId,
      null,
      'dynamic'
    );

    bufferManager.unbindVAO();
  }

  /**
   * 인스턴스 데이터 업데이트
   * @param data - Float32Array [timestamp, open, high, low, close, volume, ...] 반복
   * @param floatsPerInstance - 인스턴스당 float 수 (기본 6)
   */
  updateInstanceData(data: Float32Array, floatsPerInstance: number = 6): void {
    const bufferManager = this.renderer.getBufferManager();
    const gl = this.gl;

    this.instanceCount = data.length / floatsPerInstance;

    // 인스턴스 데이터 버퍼 업데이트
    bufferManager.replaceBufferData(this.config.instanceBufferId, data);

    // VAO에 인스턴스 속성 바인딩
    bufferManager.bindVAO(this.config.vaoId);

    const instanceBuffer = bufferManager.getBuffer(this.config.instanceBufferId);
    if (instanceBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);

      const stride = floatsPerInstance * 4; // bytes

      // a_timestamp (location = 2)
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 0);
      gl.vertexAttribDivisor(2, 1); // per instance

      // a_ohlc (location = 3) - vec4
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 4, gl.FLOAT, false, stride, 4);
      gl.vertexAttribDivisor(3, 1); // per instance

      // a_volume (location = 4)
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 20);
      gl.vertexAttribDivisor(4, 1); // per instance
    }

    bufferManager.unbindVAO();
    this.isReady = true;
  }

  /**
   * 볼륨용 인스턴스 데이터 설정 (속성 위치가 다름)
   */
  setupVolumeInstanceAttributes(): void {
    const bufferManager = this.renderer.getBufferManager();
    const gl = this.gl;

    bufferManager.bindVAO(this.config.vaoId);

    const instanceBuffer = bufferManager.getBuffer(this.config.instanceBufferId);
    if (instanceBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);

      const stride = 6 * 4; // 6 floats per instance

      // a_timestamp (location = 1)
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 0);
      gl.vertexAttribDivisor(1, 1);

      // a_ohlc (location = 2) - vec4
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 4);
      gl.vertexAttribDivisor(2, 1);

      // a_volume (location = 3)
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 20);
      gl.vertexAttribDivisor(3, 1);
    }

    bufferManager.unbindVAO();
  }

  /**
   * 렌더링
   */
  render(): void {
    if (!this.isReady || this.instanceCount === 0) return;

    const bufferManager = this.renderer.getBufferManager();
    const gl = this.gl;

    bufferManager.bindVAO(this.config.vaoId);

    // Instanced 렌더링 - 모든 인스턴스를 1번의 draw call로!
    gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,
      this.config.verticesPerInstance,
      this.instanceCount
    );

    bufferManager.unbindVAO();

    // 통계 기록
    this.renderer.recordDrawCall(this.instanceCount);
  }

  /**
   * 인스턴스 수 가져오기
   */
  getInstanceCount(): number {
    return this.instanceCount;
  }

  /**
   * 준비 상태 확인
   */
  getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * 정리
   */
  destroy(): void {
    const bufferManager = this.renderer.getBufferManager();
    bufferManager.deleteBuffer(this.config.geometryBufferId);
    bufferManager.deleteBuffer(this.config.geometryBufferId + '_types');
    bufferManager.deleteBuffer(this.config.instanceBufferId);
    bufferManager.deleteVAO(this.config.vaoId);
    this.isReady = false;
    this.instanceCount = 0;
  }
}
