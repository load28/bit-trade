/**
 * BitChart - Workers Index
 */

// Worker 타입들은 별도 파일에서 import해서 사용
// 실제 Worker 인스턴스화는 new Worker() 또는 다이나믹 import 사용

export const RENDER_WORKER_PATH = './RenderWorker';
export const COMPUTE_WORKER_PATH = './ComputeWorker';
