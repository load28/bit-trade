/**
 * BitChart - Shader Manager
 * 셰이더 프로그램 생성 및 관리
 */

import type { ShaderProgramInfo } from '../types/webgl';
import { compileShader, createProgram, getProgramInfo } from '../utils/webglUtils';
import {
  CANDLESTICK_VERTEX_SHADER,
  CANDLESTICK_FRAGMENT_SHADER,
} from './shaders/candlestick';
import {
  VOLUME_VERTEX_SHADER,
  VOLUME_FRAGMENT_SHADER,
} from './shaders/volume';
import {
  GRID_VERTEX_SHADER,
  GRID_FRAGMENT_SHADER,
} from './shaders/grid';
import {
  LINE_VERTEX_SHADER,
  LINE_FRAGMENT_SHADER,
} from './shaders/line';

/** 셰이더 프로그램 타입 */
export type ShaderProgramType = 'candlestick' | 'volume' | 'grid' | 'line';

/** 셰이더 프로그램 정의 */
interface ShaderDefinition {
  vertex: string;
  fragment: string;
  attributes: string[];
  uniforms: string[];
}

/** 셰이더 정의 맵 */
const SHADER_DEFINITIONS: Record<ShaderProgramType, ShaderDefinition> = {
  candlestick: {
    vertex: CANDLESTICK_VERTEX_SHADER,
    fragment: CANDLESTICK_FRAGMENT_SHADER,
    attributes: [
      'a_basePosition',
      'a_vertexType',
      'a_timestamp',
      'a_ohlc',
      'a_volume',
    ],
    uniforms: [
      'u_projection',
      'u_view',
      'u_timeRange',
      'u_priceRange',
      'u_upColor',
      'u_downColor',
      'u_resolution',
    ],
  },
  volume: {
    vertex: VOLUME_VERTEX_SHADER,
    fragment: VOLUME_FRAGMENT_SHADER,
    attributes: [
      'a_basePosition',
      'a_timestamp',
      'a_ohlc',
      'a_volume',
    ],
    uniforms: [
      'u_projection',
      'u_view',
      'u_timeRange',
      'u_volumeRange',
      'u_upColor',
      'u_downColor',
      'u_opacity',
    ],
  },
  grid: {
    vertex: GRID_VERTEX_SHADER,
    fragment: GRID_FRAGMENT_SHADER,
    attributes: [
      'a_position',
      'a_isHorizontal',
    ],
    uniforms: [
      'u_projection',
      'u_view',
      'u_color',
      'u_lineWidth',
    ],
  },
  line: {
    vertex: LINE_VERTEX_SHADER,
    fragment: LINE_FRAGMENT_SHADER,
    attributes: [
      'a_position',
      'a_normal',
      'a_side',
    ],
    uniforms: [
      'u_projection',
      'u_view',
      'u_timeRange',
      'u_valueRange',
      'u_color',
      'u_lineWidth',
      'u_resolution',
    ],
  },
};

/**
 * 셰이더 매니저 클래스
 * 셰이더 프로그램의 생성, 캐싱, 관리를 담당
 */
export class ShaderManager {
  private gl: WebGL2RenderingContext;
  private programs: Map<ShaderProgramType, ShaderProgramInfo> = new Map();
  private currentProgram: ShaderProgramType | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * 셰이더 프로그램 생성 또는 캐시에서 가져오기
   */
  getProgram(type: ShaderProgramType): ShaderProgramInfo | null {
    // 캐시에서 확인
    if (this.programs.has(type)) {
      return this.programs.get(type)!;
    }

    // 새로 생성
    const definition = SHADER_DEFINITIONS[type];
    if (!definition) {
      console.error(`Unknown shader program type: ${type}`);
      return null;
    }

    const program = createProgram(
      this.gl,
      definition.vertex,
      definition.fragment
    );

    if (!program) {
      console.error(`Failed to create shader program: ${type}`);
      return null;
    }

    const programInfo = getProgramInfo(
      this.gl,
      program,
      definition.attributes,
      definition.uniforms
    );

    this.programs.set(type, programInfo);
    return programInfo;
  }

  /**
   * 셰이더 프로그램 사용
   */
  useProgram(type: ShaderProgramType): ShaderProgramInfo | null {
    if (this.currentProgram === type) {
      return this.programs.get(type) || null;
    }

    const programInfo = this.getProgram(type);
    if (!programInfo) return null;

    this.gl.useProgram(programInfo.program);
    this.currentProgram = type;
    return programInfo;
  }

  /**
   * 현재 사용 중인 프로그램 정보
   */
  getCurrentProgram(): ShaderProgramInfo | null {
    if (!this.currentProgram) return null;
    return this.programs.get(this.currentProgram) || null;
  }

  /**
   * 모든 프로그램 미리 컴파일
   */
  precompileAll(): boolean {
    const types: ShaderProgramType[] = ['candlestick', 'volume', 'grid', 'line'];
    let success = true;

    for (const type of types) {
      const program = this.getProgram(type);
      if (!program) {
        console.error(`Failed to precompile shader: ${type}`);
        success = false;
      }
    }

    return success;
  }

  /**
   * Uniform 값 설정 헬퍼
   */
  setUniform(
    programInfo: ShaderProgramInfo,
    name: string,
    value: number | Float32Array | number[]
  ): void {
    const location = programInfo.uniformLocations[name];
    if (!location) return;

    const gl = this.gl;

    if (typeof value === 'number') {
      gl.uniform1f(location, value);
    } else if (value.length === 2) {
      gl.uniform2fv(location, value);
    } else if (value.length === 3) {
      gl.uniform3fv(location, value);
    } else if (value.length === 4) {
      gl.uniform4fv(location, value);
    } else if (value.length === 9) {
      gl.uniformMatrix3fv(location, false, value);
    } else if (value.length === 16) {
      gl.uniformMatrix4fv(location, false, value);
    }
  }

  /**
   * 정리
   */
  destroy(): void {
    for (const [, programInfo] of this.programs) {
      this.gl.deleteProgram(programInfo.program);
    }
    this.programs.clear();
    this.currentProgram = null;
  }
}
