/**
 * BitChart - Line Shaders
 * 라인 차트 및 지표용 GLSL 셰이더
 */

export const LINE_VERTEX_SHADER = `#version 300 es
precision highp float;

// ==========================================
// Attributes
// ==========================================
layout(location = 0) in vec2 a_position;        // 포인트 위치 (time, value)
layout(location = 1) in vec2 a_normal;          // 라인 두께를 위한 법선
layout(location = 2) in float a_side;           // -1 또는 1 (라인 양쪽)

// ==========================================
// Uniforms
// ==========================================
uniform mat4 u_projection;
uniform mat4 u_view;
uniform vec4 u_timeRange;      // minTime, maxTime, padding, padding
uniform vec4 u_valueRange;     // minValue, maxValue, padding, padding
uniform vec4 u_color;          // 라인 색상 (RGBA)
uniform float u_lineWidth;     // 라인 두께 (픽셀)
uniform vec2 u_resolution;     // 캔버스 해상도

// ==========================================
// Outputs
// ==========================================
out vec4 v_color;
out float v_side;

void main() {
    // 시간/값 정규화 (0 ~ 1)
    float minTime = u_timeRange.x;
    float maxTime = u_timeRange.y;
    float minValue = u_valueRange.x;
    float maxValue = u_valueRange.y;

    float timeNorm = (a_position.x - minTime) / (maxTime - minTime);
    float valueNorm = (a_position.y - minValue) / (maxValue - minValue);

    // NDC 변환 (0~1 -> -1~1)
    vec2 ndcPos = vec2(timeNorm, valueNorm) * 2.0 - 1.0;

    // 라인 두께 오프셋 계산 (픽셀 -> NDC)
    vec2 offset = a_normal * (u_lineWidth / u_resolution) * a_side;

    gl_Position = u_projection * u_view * vec4(ndcPos + offset, 0.0, 1.0);
    v_color = u_color;
    v_side = a_side;
}
`;

export const LINE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 v_color;
in float v_side;

out vec4 fragColor;

void main() {
    // 안티앨리어싱을 위한 부드러운 가장자리
    float alpha = 1.0 - abs(v_side) * 0.2;
    fragColor = vec4(v_color.rgb, v_color.a * alpha);
}
`;

/**
 * 라인 지오메트리 생성 (두께가 있는 라인)
 * @param points - [time, value] 포인트 배열
 * @param lineWidth - 라인 두께 (픽셀)
 */
export function createLineGeometry(
  points: Array<[number, number]>
): {
  positions: Float32Array;
  normals: Float32Array;
  sides: Float32Array;
  vertexCount: number;
} {
  if (points.length < 2) {
    return {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      sides: new Float32Array(0),
      vertexCount: 0,
    };
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const sides: number[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    // 라인 방향
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) continue;

    // 법선 벡터 (라인에 수직)
    const nx = -dy / len;
    const ny = dx / len;

    // 두 점에 대해 각각 위/아래 두 개의 버텍스 생성
    // Triangle 1
    positions.push(p0[0], p0[1]);
    normals.push(nx, ny);
    sides.push(-1);

    positions.push(p0[0], p0[1]);
    normals.push(nx, ny);
    sides.push(1);

    positions.push(p1[0], p1[1]);
    normals.push(nx, ny);
    sides.push(1);

    // Triangle 2
    positions.push(p0[0], p0[1]);
    normals.push(nx, ny);
    sides.push(-1);

    positions.push(p1[0], p1[1]);
    normals.push(nx, ny);
    sides.push(1);

    positions.push(p1[0], p1[1]);
    normals.push(nx, ny);
    sides.push(-1);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    sides: new Float32Array(sides),
    vertexCount: positions.length / 2,
  };
}
