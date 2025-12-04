/**
 * BitChart - Volume Shader
 * 볼륨 바 렌더링을 위한 WebGL 셰이더
 */

export const VOLUME_VERTEX_SHADER = `#version 300 es
precision highp float;

// 지오메트리 속성
in vec2 a_position;

// 인스턴스 속성
in float a_time;
in vec4 a_ohlc;
in float a_volume;

// Uniforms
uniform vec4 u_timeRange;
uniform vec4 u_volumeRange; // min, max, baseY, height
uniform vec4 u_upColor;
uniform vec4 u_downColor;
uniform float u_opacity;

// Outputs
out vec4 v_color;

void main() {
  float open = a_ohlc.x;
  float close = a_ohlc.w;
  bool isUp = close >= open;

  vec4 baseColor = isUp ? u_upColor : u_downColor;
  v_color = vec4(baseColor.rgb, baseColor.a * u_opacity);

  // 시간 → NDC X
  float timeNorm = (a_time - u_timeRange.x) / (u_timeRange.y - u_timeRange.x);
  float barWidth = u_timeRange.z;
  float x = timeNorm * 2.0 - 1.0;
  float xOffset = a_position.x * barWidth * 0.8;

  // 볼륨 → Y (화면 하단 영역)
  float volumeMin = u_volumeRange.x;
  float volumeMax = u_volumeRange.y;
  float baseY = u_volumeRange.z;
  float areaHeight = u_volumeRange.w;

  float volumeNorm = (a_volume - volumeMin) / (volumeMax - volumeMin);
  float y = (a_position.y + 1.0) * 0.5 * volumeNorm * areaHeight + baseY;
  y = y * 2.0 - 1.0; // NDC로 변환

  gl_Position = vec4(x + xOffset, y, 0.0, 1.0);
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
