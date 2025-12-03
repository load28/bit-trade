/**
 * BitChart - Grid Shaders
 * 차트 그리드 라인 GLSL 셰이더
 */

export const GRID_VERTEX_SHADER = `#version 300 es
precision highp float;

// ==========================================
// Attributes
// ==========================================
layout(location = 0) in vec2 a_position;        // 라인 시작/끝점
layout(location = 1) in float a_isHorizontal;   // 0: vertical, 1: horizontal

// ==========================================
// Uniforms
// ==========================================
uniform mat4 u_projection;
uniform mat4 u_view;
uniform vec4 u_color;          // 그리드 색상 (RGBA)
uniform float u_lineWidth;     // 라인 두께

// ==========================================
// Outputs
// ==========================================
out vec4 v_color;

void main() {
    // NDC 변환 (0~1 -> -1~1)
    vec2 ndcPos = a_position * 2.0 - 1.0;

    gl_Position = u_projection * u_view * vec4(ndcPos, 0.0, 1.0);
    v_color = u_color;
}
`;

export const GRID_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 fragColor;

void main() {
    fragColor = v_color;
}
`;

/**
 * 그리드 라인 지오메트리 생성
 */
export function createGridGeometry(
  horizontalLines: number[],  // 수평선 Y 위치 (0~1)
  verticalLines: number[],    // 수직선 X 위치 (0~1)
  lineWidth: number = 0.001
): {
  positions: Float32Array;
  isHorizontal: Float32Array;
  vertexCount: number;
} {
  const positions: number[] = [];
  const isHorizontal: number[] = [];

  // 수평선 생성 (가격 그리드)
  for (const y of horizontalLines) {
    // 두께가 있는 사각형으로 라인 표현 (2 triangles = 6 vertices)
    const halfWidth = lineWidth / 2;

    // Triangle 1
    positions.push(0, y - halfWidth);
    isHorizontal.push(1);
    positions.push(1, y - halfWidth);
    isHorizontal.push(1);
    positions.push(1, y + halfWidth);
    isHorizontal.push(1);

    // Triangle 2
    positions.push(0, y - halfWidth);
    isHorizontal.push(1);
    positions.push(1, y + halfWidth);
    isHorizontal.push(1);
    positions.push(0, y + halfWidth);
    isHorizontal.push(1);
  }

  // 수직선 생성 (시간 그리드)
  for (const x of verticalLines) {
    const halfWidth = lineWidth / 2;

    // Triangle 1
    positions.push(x - halfWidth, 0);
    isHorizontal.push(0);
    positions.push(x + halfWidth, 0);
    isHorizontal.push(0);
    positions.push(x + halfWidth, 1);
    isHorizontal.push(0);

    // Triangle 2
    positions.push(x - halfWidth, 0);
    isHorizontal.push(0);
    positions.push(x + halfWidth, 1);
    isHorizontal.push(0);
    positions.push(x - halfWidth, 1);
    isHorizontal.push(0);
  }

  return {
    positions: new Float32Array(positions),
    isHorizontal: new Float32Array(isHorizontal),
    vertexCount: (horizontalLines.length + verticalLines.length) * 6,
  };
}
