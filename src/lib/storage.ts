import { HealthCheckResult } from './minio-health';

// 메모리 기반 간단한 저장소 (프로덕션에서는 DB 사용 권장)
let latestResults: HealthCheckResult[] = [];
let healthHistory: Array<{ timestamp: string; results: HealthCheckResult[] }> = [];

const MAX_HISTORY = 100; // 최근 100개 기록 유지

export function saveHealthCheckResults(results: HealthCheckResult[]): void {
  latestResults = results;
  
  healthHistory.push({
    timestamp: new Date().toISOString(),
    results: [...results],
  });

  // 최대 기록 수 유지
  if (healthHistory.length > MAX_HISTORY) {
    healthHistory = healthHistory.slice(-MAX_HISTORY);
  }
}

export function getLatestResults(): HealthCheckResult[] {
  return latestResults;
}

export function getHealthHistory(): Array<{ timestamp: string; results: HealthCheckResult[] }> {
  return healthHistory;
}

