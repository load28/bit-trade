/**
 * BitChart - Volume Bar Shaders
 * Instanced Rendering을 위한 볼륨 바 GLSL 셰이더
 */

export const VOLUME_VERTEX_SHADER = `#version 300 es
precision highp float;

// ==========================================
// 기본 지오메트리 (모든 인스턴스 공유)
// ==========================================
layout(location = 0) in vec2 a_basePosition;    // 단위 바 지오메트리 위치

// ==========================================
// 인스턴스별 데이터
// ==========================================
layout(location = 1) in float a_timestamp;      // 시간 (밀리초)
layout(location = 2) in vec4 a_ohlc;            // open, high, low, close
layout(location = 3) in float a_volume;         // 거래량

// ==========================================
// Uniforms
// ==========================================
uniform mat4 u_projection;
uniform mat4 u_view;
uniform vec4 u_timeRange;      // minTime, maxTime, candleWidth, gap
uniform vec4 u_volumeRange;    // minVolume, maxVolume, baseY, height
uniform vec4 u_upColor;        // 상승 색상 (RGBA)
uniform vec4 u_downColor;      // 하락 색상 (RGBA)
uniform float u_opacity;       // 투명도

// ==========================================
// Outputs
// ==========================================
out vec4 v_color;

void main() {
    float open = a_ohlc.x;
    float close = a_ohlc.w;

    // 상승/하락 판단
    bool isRising = close >= open;

    // 시간 정규화 (0 ~ 1)
    float minTime = u_timeRange.x;
    float maxTime = u_timeRange.y;
    float candleWidth = u_timeRange.z;

    float timeNorm = (a_timestamp - minTime) / (maxTime - minTime);

    // 볼륨 정규화 (0 ~ 1)
    float minVolume = u_volumeRange.x;
    float maxVolume = u_volumeRange.y;
    float baseY = u_volumeRange.z;      // 볼륨 차트 시작 Y (0 ~ 1)
    float height = u_volumeRange.w;     // 볼륨 차트 높이 (0 ~ 1)

    float volumeNorm = (a_volume - minVolume) / (maxVolume - minVolume);
    volumeNorm = clamp(volumeNorm, 0.0, 1.0);

    // 위치 계산
    vec2 position = vec2(
        timeNorm + a_basePosition.x * candleWidth * 0.4,
        baseY + a_basePosition.y * volumeNorm * height
    );

    // NDC 변환 (0~1 -> -1~1)
    vec2 ndcPos = position * 2.0 - 1.0;

    // 최종 위치
    gl_Position = u_projection * u_view * vec4(ndcPos, 0.0, 1.0);

    // 색상 설정 (투명도 적용)
    vec4 baseColor = isRising ? u_upColor : u_downColor;
    v_color = vec4(baseColor.rgb, baseColor.a * u_opacity);
}
`;

export const VOLUME_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 fragColor;

void main() {
    fragColor = v_color;
}
`;

/**
 * 볼륨 바 기본 지오메트리 생성
 * Bar: 6 vertices (2 triangles)
 */
export function createVolumeGeometry(): {
  positions: Float32Array;
  vertexCount: number;
} {
  const positions: number[] = [];

  // Bar (사각형) - 2 triangles
  // Triangle 1
  positions.push(-1, 0);  // bottom-left
  positions.push(1, 0);   // bottom-right
  positions.push(1, 1);   // top-right
  // Triangle 2
  positions.push(-1, 0);  // bottom-left
  positions.push(1, 1);   // top-right
  positions.push(-1, 1);  // top-left

  return {
    positions: new Float32Array(positions),
    vertexCount: 6,
  };
}
