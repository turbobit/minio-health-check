export interface MinioServer {
  name: string;
  url: string;
}

export interface HealthCheckResult {
  server: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'error';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  timestamp: string;
}

// MinIO 서버 목록
export const MINIO_SERVERS: MinioServer[] = [
  { name: 'MinIO 1', url: 'http://minio1.closetoya.com:9000/minio/health/live' },
  { name: 'MinIO 2', url: 'http://minio2.closetoya.com:9000/minio/health/live' },
  { name: 'MinIO 3', url: 'http://minio3.closetoya.com:9000/minio/health/live' },
  { name: 'MinIO 4', url: 'http://minio4.closetoya.com:9000/minio/health/live' },
];

/**
 * 단일 MinIO 서버 헬스체크
 */
export async function checkMinioHealth(server: MinioServer): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    const response = await fetch(server.url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      server: server.name,
      url: server.url,
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      server: server.name,
      url: server.url,
      status: 'error',
      responseTime,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 모든 MinIO 서버 헬스체크
 */
export async function checkAllMinioServers(): Promise<HealthCheckResult[]> {
  const results = await Promise.all(
    MINIO_SERVERS.map(server => checkMinioHealth(server))
  );
  
  return results;
}

