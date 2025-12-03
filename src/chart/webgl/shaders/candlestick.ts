/**
 * BitChart - Candlestick Shaders
 * Instanced Rendering을 위한 캔들스틱 GLSL 셰이더
 */

export const CANDLESTICK_VERTEX_SHADER = `#version 300 es
precision highp float;

// ==========================================
// 기본 지오메트리 (모든 인스턴스 공유)
// ==========================================
layout(location = 0) in vec2 a_basePosition;    // 단위 캔들 지오메트리 위치
layout(location = 1) in float a_vertexType;     // 0: body, 1: upper wick, 2: lower wick

// ==========================================
// 인스턴스별 데이터
// ==========================================
layout(location = 2) in float a_timestamp;      // 시간 (밀리초)
layout(location = 3) in vec4 a_ohlc;            // open, high, low, close
layout(location = 4) in float a_volume;         // 거래량

// ==========================================
// Uniforms
// ==========================================
uniform mat4 u_projection;
uniform mat4 u_view;
uniform vec4 u_timeRange;      // minTime, maxTime, candleWidth, gap
uniform vec4 u_priceRange;     // minPrice, maxPrice, padding, padding
uniform vec4 u_upColor;        // 상승 색상 (RGBA)
uniform vec4 u_downColor;      // 하락 색상 (RGBA)
uniform vec2 u_resolution;     // 캔버스 해상도

// ==========================================
// Outputs
// ==========================================
out vec4 v_color;
out vec2 v_localPos;

void main() {
    float open = a_ohlc.x;
    float high = a_ohlc.y;
    float low = a_ohlc.z;
    float close = a_ohlc.w;

    // 상승/하락 판단
    bool isRising = close >= open;
    float bodyTop = isRising ? close : open;
    float bodyBottom = isRising ? open : close;

    // 시간 정규화 (0 ~ 1)
    float minTime = u_timeRange.x;
    float maxTime = u_timeRange.y;
    float candleWidth = u_timeRange.z;
    float gap = u_timeRange.w;

    float timeNorm = (a_timestamp - minTime) / (maxTime - minTime);

    // 가격 정규화 (0 ~ 1)
    float minPrice = u_priceRange.x;
    float maxPrice = u_priceRange.y;

    vec2 position;

    // 버텍스 타입에 따른 위치 계산
    if (a_vertexType < 0.5) {
        // Body (몸통)
        float bodyTopNorm = (bodyTop - minPrice) / (maxPrice - minPrice);
        float bodyBottomNorm = (bodyBottom - minPrice) / (maxPrice - minPrice);

        // 몸통이 너무 작으면 최소 높이 보장
        float minBodyHeight = 0.001;
        if (bodyTopNorm - bodyBottomNorm < minBodyHeight) {
            float center = (bodyTopNorm + bodyBottomNorm) / 2.0;
            bodyTopNorm = center + minBodyHeight / 2.0;
            bodyBottomNorm = center - minBodyHeight / 2.0;
        }

        float priceNorm = mix(bodyBottomNorm, bodyTopNorm, a_basePosition.y);
        position = vec2(
            timeNorm + a_basePosition.x * candleWidth * 0.4,
            priceNorm
        );
    } else if (a_vertexType < 1.5) {
        // Upper Wick (위 심지)
        float highNorm = (high - minPrice) / (maxPrice - minPrice);
        float bodyTopNorm = (bodyTop - minPrice) / (maxPrice - minPrice);

        float priceNorm = mix(bodyTopNorm, highNorm, a_basePosition.y);
        position = vec2(
            timeNorm + a_basePosition.x * candleWidth * 0.08,
            priceNorm
        );
    } else {
        // Lower Wick (아래 심지)
        float lowNorm = (low - minPrice) / (maxPrice - minPrice);
        float bodyBottomNorm = (bodyBottom - minPrice) / (maxPrice - minPrice);

        float priceNorm = mix(lowNorm, bodyBottomNorm, a_basePosition.y);
        position = vec2(
            timeNorm + a_basePosition.x * candleWidth * 0.08,
            priceNorm
        );
    }

    // NDC 변환 (0~1 -> -1~1)
    vec2 ndcPos = position * 2.0 - 1.0;

    // 최종 위치
    gl_Position = u_projection * u_view * vec4(ndcPos, 0.0, 1.0);

    // 색상 설정
    v_color = isRising ? u_upColor : u_downColor;
    v_localPos = a_basePosition;
}
`;

export const CANDLESTICK_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_localPos;

out vec4 fragColor;

void main() {
    fragColor = v_color;
}
`;

/**
 * 캔들스틱 기본 지오메트리 생성
 * Body: 6 vertices (2 triangles)
 * Upper Wick: 6 vertices (2 triangles)
 * Lower Wick: 6 vertices (2 triangles)
 * Total: 18 vertices per candle
 */
export function createCandlestickGeometry(): {
  positions: Float32Array;
  vertexTypes: Float32Array;
  vertexCount: number;
} {
  const positions: number[] = [];
  const vertexTypes: number[] = [];

  // Body (몸통) - 사각형 (2 triangles)
  // Triangle 1
  positions.push(-1, 0); vertexTypes.push(0);  // bottom-left
  positions.push(1, 0);  vertexTypes.push(0);  // bottom-right
  positions.push(1, 1);  vertexTypes.push(0);  // top-right
  // Triangle 2
  positions.push(-1, 0); vertexTypes.push(0);  // bottom-left
  positions.push(1, 1);  vertexTypes.push(0);  // top-right
  positions.push(-1, 1); vertexTypes.push(0);  // top-left

  // Upper Wick (위 심지) - 사각형 (2 triangles)
  // Triangle 1
  positions.push(-1, 0); vertexTypes.push(1);  // bottom-left
  positions.push(1, 0);  vertexTypes.push(1);  // bottom-right
  positions.push(1, 1);  vertexTypes.push(1);  // top-right
  // Triangle 2
  positions.push(-1, 0); vertexTypes.push(1);  // bottom-left
  positions.push(1, 1);  vertexTypes.push(1);  // top-right
  positions.push(-1, 1); vertexTypes.push(1);  // top-left

  // Lower Wick (아래 심지) - 사각형 (2 triangles)
  // Triangle 1
  positions.push(-1, 0); vertexTypes.push(2);  // bottom-left
  positions.push(1, 0);  vertexTypes.push(2);  // bottom-right
  positions.push(1, 1);  vertexTypes.push(2);  // top-right
  // Triangle 2
  positions.push(-1, 0); vertexTypes.push(2);  // bottom-left
  positions.push(1, 1);  vertexTypes.push(2);  // top-right
  positions.push(-1, 1); vertexTypes.push(2);  // top-left

  return {
    positions: new Float32Array(positions),
    vertexTypes: new Float32Array(vertexTypes),
    vertexCount: 18,
  };
}
