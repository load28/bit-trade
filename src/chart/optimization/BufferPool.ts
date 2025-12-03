/**
 * BitChart - Buffer Pool
 * GPU 버퍼 재사용을 통한 메모리 최적화
 *
 * 버퍼 할당/해제 오버헤드 감소 및 메모리 단편화 방지
 */

/** 버퍼 풀 아이템 */
interface PooledBuffer<T> {
  /** 버퍼 객체 */
  buffer: T;
  /** 바이트 크기 */
  byteSize: number;
  /** 사용 중 여부 */
  inUse: boolean;
  /** 마지막 사용 시간 */
  lastUsed: number;
  /** 풀 ID */
  poolId: string;
}

/** 버퍼 풀 옵션 */
export interface BufferPoolOptions {
  /** 버킷별 최대 버퍼 개수 */
  maxBuffersPerBucket?: number;
  /** 전체 최대 메모리 (bytes) */
  maxTotalMemory?: number;
  /** 버퍼 만료 시간 (ms) */
  expirationTime?: number;
  /** 정리 주기 (ms) */
  cleanupInterval?: number;
}

/** 버퍼 풀 통계 */
export interface BufferPoolStats {
  /** 총 버퍼 개수 */
  totalBuffers: number;
  /** 사용 중인 버퍼 개수 */
  inUseBuffers: number;
  /** 사용 가능한 버퍼 개수 */
  availableBuffers: number;
  /** 총 메모리 사용량 (bytes) */
  totalMemory: number;
  /** 히트율 */
  hitRate: number;
  /** 버킷별 통계 */
  bucketStats: Map<number, { total: number; inUse: number }>;
}

/**
 * Float32Array Buffer Pool
 */
export class Float32BufferPool {
  private buckets: Map<number, PooledBuffer<Float32Array>[]> = new Map();
  private options: Required<BufferPoolOptions>;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  // 통계
  private hits = 0;
  private misses = 0;

  // 버킷 크기 (2의 거듭제곱)
  private static readonly BUCKET_SIZES = [
    64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072,
    262144, 524288, 1048576, 2097152, 4194304,
  ];

  constructor(options: BufferPoolOptions = {}) {
    this.options = {
      maxBuffersPerBucket: options.maxBuffersPerBucket ?? 10,
      maxTotalMemory: options.maxTotalMemory ?? 256 * 1024 * 1024, // 256MB
      expirationTime: options.expirationTime ?? 30000, // 30초
      cleanupInterval: options.cleanupInterval ?? 10000, // 10초
    };

    // 버킷 초기화
    for (const size of Float32BufferPool.BUCKET_SIZES) {
      this.buckets.set(size, []);
    }

    // 주기적 정리 시작
    this.startCleanup();
  }

  /**
   * 버퍼 요청 (최소 크기)
   */
  acquire(minLength: number): Float32Array {
    const bucketSize = this.findBucketSize(minLength);

    if (bucketSize === -1) {
      // 버킷보다 큰 경우 직접 할당
      this.misses++;
      return new Float32Array(minLength);
    }

    const bucket = this.buckets.get(bucketSize)!;

    // 사용 가능한 버퍼 찾기
    for (const pooled of bucket) {
      if (!pooled.inUse) {
        pooled.inUse = true;
        pooled.lastUsed = Date.now();
        this.hits++;
        return pooled.buffer;
      }
    }

    // 새 버퍼 생성
    if (bucket.length < this.options.maxBuffersPerBucket && this.canAllocate(bucketSize * 4)) {
      const buffer = new Float32Array(bucketSize);
      const pooled: PooledBuffer<Float32Array> = {
        buffer,
        byteSize: bucketSize * 4,
        inUse: true,
        lastUsed: Date.now(),
        poolId: `f32_${bucketSize}_${bucket.length}`,
      };
      bucket.push(pooled);
      this.misses++;
      return buffer;
    }

    // 풀 용량 초과 시 직접 할당
    this.misses++;
    return new Float32Array(minLength);
  }

  /**
   * 버퍼 반환
   */
  release(buffer: Float32Array): void {
    const bucketSize = this.findBucketSize(buffer.length);

    if (bucketSize === -1 || buffer.length !== bucketSize) {
      // 풀 외부 버퍼, 그냥 버림
      return;
    }

    const bucket = this.buckets.get(bucketSize);
    if (!bucket) return;

    for (const pooled of bucket) {
      if (pooled.buffer === buffer) {
        pooled.inUse = false;
        pooled.lastUsed = Date.now();
        return;
      }
    }
  }

  /**
   * 적절한 버킷 크기 찾기
   */
  private findBucketSize(length: number): number {
    for (const size of Float32BufferPool.BUCKET_SIZES) {
      if (size >= length) {
        return size;
      }
    }
    return -1;
  }

  /**
   * 할당 가능 여부 확인
   */
  private canAllocate(bytes: number): boolean {
    return this.getTotalMemory() + bytes <= this.options.maxTotalMemory;
  }

  /**
   * 총 메모리 사용량
   */
  private getTotalMemory(): number {
    let total = 0;
    for (const bucket of this.buckets.values()) {
      for (const pooled of bucket) {
        total += pooled.byteSize;
      }
    }
    return total;
  }

  /**
   * 만료된 버퍼 정리
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [size, bucket] of this.buckets) {
      // 만료된 버퍼 필터링
      const validBuffers = bucket.filter((pooled) => {
        if (pooled.inUse) return true;
        return now - pooled.lastUsed < this.options.expirationTime;
      });

      this.buckets.set(size, validBuffers);
    }
  }

  /**
   * 주기적 정리 시작
   */
  private startCleanup(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * 통계 가져오기
   */
  getStats(): BufferPoolStats {
    let totalBuffers = 0;
    let inUseBuffers = 0;
    let totalMemory = 0;
    const bucketStats = new Map<number, { total: number; inUse: number }>();

    for (const [size, bucket] of this.buckets) {
      let bucketInUse = 0;
      for (const pooled of bucket) {
        totalBuffers++;
        totalMemory += pooled.byteSize;
        if (pooled.inUse) {
          inUseBuffers++;
          bucketInUse++;
        }
      }
      bucketStats.set(size, { total: bucket.length, inUse: bucketInUse });
    }

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      totalBuffers,
      inUseBuffers,
      availableBuffers: totalBuffers - inUseBuffers,
      totalMemory,
      hitRate,
      bucketStats,
    };
  }

  /**
   * 모든 버퍼 클리어
   */
  clear(): void {
    for (const [size] of this.buckets) {
      this.buckets.set(size, []);
    }
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 정리
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

/**
 * WebGL Buffer Pool
 * GPU 버퍼 재사용
 */
export class WebGLBufferPool {
  private gl: WebGL2RenderingContext;
  private buffers: Map<string, PooledBuffer<WebGLBuffer>[]> = new Map();
  private options: Required<BufferPoolOptions>;

  private hits = 0;
  private misses = 0;

  constructor(gl: WebGL2RenderingContext, options: BufferPoolOptions = {}) {
    this.gl = gl;
    this.options = {
      maxBuffersPerBucket: options.maxBuffersPerBucket ?? 5,
      maxTotalMemory: options.maxTotalMemory ?? 128 * 1024 * 1024, // 128MB
      expirationTime: options.expirationTime ?? 60000, // 60초
      cleanupInterval: options.cleanupInterval ?? 30000, // 30초
    };
  }

  /**
   * GPU 버퍼 요청
   */
  acquire(
    byteSize: number,
    target: number = this.gl.ARRAY_BUFFER,
    usage: number = this.gl.DYNAMIC_DRAW
  ): WebGLBuffer | null {
    const key = `${target}_${usage}_${this.roundToNearestPowerOfTwo(byteSize)}`;

    if (!this.buffers.has(key)) {
      this.buffers.set(key, []);
    }

    const bucket = this.buffers.get(key)!;

    // 사용 가능한 버퍼 찾기
    for (const pooled of bucket) {
      if (!pooled.inUse && pooled.byteSize >= byteSize) {
        pooled.inUse = true;
        pooled.lastUsed = Date.now();
        this.hits++;
        return pooled.buffer;
      }
    }

    // 새 버퍼 생성
    if (bucket.length < this.options.maxBuffersPerBucket) {
      const buffer = this.gl.createBuffer();
      if (!buffer) {
        this.misses++;
        return null;
      }

      const allocSize = this.roundToNearestPowerOfTwo(byteSize);
      this.gl.bindBuffer(target, buffer);
      this.gl.bufferData(target, allocSize, usage);

      const pooled: PooledBuffer<WebGLBuffer> = {
        buffer,
        byteSize: allocSize,
        inUse: true,
        lastUsed: Date.now(),
        poolId: `gl_${key}_${bucket.length}`,
      };

      bucket.push(pooled);
      this.misses++;
      return buffer;
    }

    this.misses++;
    return null;
  }

  /**
   * GPU 버퍼 반환
   */
  release(buffer: WebGLBuffer): void {
    for (const bucket of this.buffers.values()) {
      for (const pooled of bucket) {
        if (pooled.buffer === buffer) {
          pooled.inUse = false;
          pooled.lastUsed = Date.now();
          return;
        }
      }
    }
  }

  /**
   * 가장 가까운 2의 거듭제곱으로 반올림
   */
  private roundToNearestPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 1))));
  }

  /**
   * 모든 버퍼 삭제
   */
  clear(): void {
    for (const bucket of this.buffers.values()) {
      for (const pooled of bucket) {
        this.gl.deleteBuffer(pooled.buffer);
      }
    }
    this.buffers.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 통계 가져오기
   */
  getStats(): BufferPoolStats {
    let totalBuffers = 0;
    let inUseBuffers = 0;
    let totalMemory = 0;
    const bucketStats = new Map<number, { total: number; inUse: number }>();

    for (const [key, bucket] of this.buffers) {
      const size = parseInt(key.split('_')[2]) || 0;
      let bucketInUse = 0;

      for (const pooled of bucket) {
        totalBuffers++;
        totalMemory += pooled.byteSize;
        if (pooled.inUse) {
          inUseBuffers++;
          bucketInUse++;
        }
      }

      bucketStats.set(size, { total: bucket.length, inUse: bucketInUse });
    }

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      totalBuffers,
      inUseBuffers,
      availableBuffers: totalBuffers - inUseBuffers,
      totalMemory,
      hitRate,
      bucketStats,
    };
  }

  /**
   * 정리
   */
  destroy(): void {
    this.clear();
  }
}

// 싱글톤 Float32 버퍼 풀
let globalFloat32Pool: Float32BufferPool | null = null;

export function getGlobalFloat32Pool(): Float32BufferPool {
  if (!globalFloat32Pool) {
    globalFloat32Pool = new Float32BufferPool();
  }
  return globalFloat32Pool;
}

export function destroyGlobalFloat32Pool(): void {
  if (globalFloat32Pool) {
    globalFloat32Pool.destroy();
    globalFloat32Pool = null;
  }
}
