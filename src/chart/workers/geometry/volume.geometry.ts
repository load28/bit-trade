/**
 * BitChart - Volume Geometry
 * 볼륨 바 지오메트리 데이터 생성
 */

/**
 * 볼륨 바 지오메트리 생성
 * 6 vertices: 1 quad = 2 triangles
 */
export function createVolumeGeometry(): Float32Array {
  return new Float32Array([
    -1, 0,  1, 0,  1, 1,
    -1, 0,  1, 1,  -1, 1,
  ]);
}
