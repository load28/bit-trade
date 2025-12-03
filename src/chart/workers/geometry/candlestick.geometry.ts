/**
 * BitChart - Candlestick Geometry
 * 캔들스틱 지오메트리 데이터 생성
 */

export interface CandlestickGeometry {
  positions: Float32Array;
  vertexTypes: Float32Array;
}

/**
 * 캔들스틱 지오메트리 생성
 * 18 vertices: body(6) + upper wick(6) + lower wick(6)
 */
export function createCandlestickGeometry(): CandlestickGeometry {
  const positions = new Float32Array([
    // Body (quad = 2 triangles)
    -1, -1,  1, -1,  1, 1,
    -1, -1,  1, 1,  -1, 1,
    // Upper wick
    -1, -1,  1, -1,  1, 1,
    -1, -1,  1, 1,  -1, 1,
    // Lower wick
    -1, -1,  1, -1,  1, 1,
    -1, -1,  1, 1,  -1, 1,
  ]);

  const vertexTypes = new Float32Array([
    // Body
    0, 0, 0, 0, 0, 0,
    // Upper wick
    1, 1, 1, 1, 1, 1,
    // Lower wick
    2, 2, 2, 2, 2, 2,
  ]);

  return { positions, vertexTypes };
}
