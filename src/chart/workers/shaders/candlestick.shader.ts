/**
 * BitChart - Candlestick Shader
 * 캔들스틱 렌더링을 위한 WebGL 셰이더
 */

export const CANDLESTICK_VERTEX_SHADER = `#version 300 es
precision highp float;

// 지오메트리 속성
in vec2 a_position;
in float a_vertexType; // 0=body, 1=upper wick, 2=lower wick

// 인스턴스 속성
in float a_time;
in vec4 a_ohlc; // open, high, low, close
in float a_volume;

// Uniforms
uniform vec4 u_timeRange; // from, to, candleWidth, _
uniform vec4 u_priceRange; // min, max, _, _
uniform vec2 u_viewport;

// Outputs
out vec4 v_color;

uniform vec4 u_upColor;
uniform vec4 u_downColor;

void main() {
  float open = a_ohlc.x;
  float high = a_ohlc.y;
  float low = a_ohlc.z;
  float close = a_ohlc.w;

  bool isUp = close >= open;
  v_color = isUp ? u_upColor : u_downColor;

  // 시간 → NDC X
  float timeNorm = (a_time - u_timeRange.x) / (u_timeRange.y - u_timeRange.x);
  float candleWidth = u_timeRange.z;
  float x = timeNorm * 2.0 - 1.0;

  // 가격 → NDC Y
  float priceMin = u_priceRange.x;
  float priceMax = u_priceRange.y;

  float y = 0.0;
  float xOffset = a_position.x * candleWidth;

  int vertexType = int(a_vertexType);

  if (vertexType == 0) {
    // Body
    float bodyTop = max(open, close);
    float bodyBottom = min(open, close);
    float priceNorm = mix(bodyBottom, bodyTop, (a_position.y + 1.0) * 0.5);
    y = ((priceNorm - priceMin) / (priceMax - priceMin)) * 2.0 - 1.0;
    xOffset *= 0.8; // Body는 약간 좁게
  } else if (vertexType == 1) {
    // Upper wick
    float bodyTop = max(open, close);
    float priceNorm = mix(bodyTop, high, (a_position.y + 1.0) * 0.5);
    y = ((priceNorm - priceMin) / (priceMax - priceMin)) * 2.0 - 1.0;
    xOffset *= 0.1; // Wick는 매우 얇게
  } else {
    // Lower wick
    float bodyBottom = min(open, close);
    float priceNorm = mix(low, bodyBottom, (a_position.y + 1.0) * 0.5);
    y = ((priceNorm - priceMin) / (priceMax - priceMin)) * 2.0 - 1.0;
    xOffset *= 0.1;
  }

  gl_Position = vec4(x + xOffset, y, 0.0, 1.0);
}
`;

export const CANDLESTICK_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
}
`;
