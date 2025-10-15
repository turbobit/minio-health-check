'use client';

import { useState, useEffect } from 'react';
import { HealthCheckResult } from '@/lib/minio-health';
import toast, { Toaster } from 'react-hot-toast';

interface NotificationStatus {
  slack: boolean;
  mattermost: boolean;
  email: boolean;
  total: number;
}

export default function Home() {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>({
    slack: false,
    mattermost: false,
    email: false,
    total: 0,
  });

  // 헬스체크 결과 가져오기
  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health-check');
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
        setLastUpdate(new Date().toLocaleString('ko-KR'));
      }
    } catch (error) {
      console.error('헬스체크 조회 실패:', error);
    }
  };

  // 즉시 헬스체크 실행
  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health-check', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setLastUpdate(new Date().toLocaleString('ko-KR'));
        
        const healthyCount = data.results.filter((r: HealthCheckResult) => r.status === 'healthy').length;
        const totalCount = data.results.length;
        const problemCount = totalCount - healthyCount;
        
        if (problemCount === 0) {
          toast.success(
            <div>
              <div className="font-semibold">✅ 헬스체크 완료</div>
              <div className="text-sm mt-1">모든 서버가 정상입니다 ({healthyCount}/{totalCount})</div>
            </div>,
            { duration: 3000 }
          );
        } else {
          toast.error(
            <div>
              <div className="font-semibold">⚠️ 서버 문제 발견</div>
              <div className="text-sm mt-1">{problemCount}개 서버에 문제가 있습니다 ({healthyCount}/{totalCount})</div>
            </div>,
            { duration: 5000 }
          );
        }
      } else {
        toast.error(
          <div>
            <div className="font-semibold">❌ 헬스체크 실패</div>
            <div className="text-sm mt-1">{data.error}</div>
          </div>,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('헬스체크 실행 실패:', error);
      toast.error(
        <div>
          <div className="font-semibold">❌ 헬스체크 오류</div>
          <div className="text-sm mt-1">네트워크 오류가 발생했습니다.</div>
        </div>,
        { duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // 웹훅 테스트 실행
  const runWebhookTest = async () => {
    setWebhookLoading(true);
    try {
      const response = await fetch('/api/test-webhook', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        const summary = data.summary;
        
        // 성공 toast
        toast.success(
          <div>
            <div className="font-semibold">✅ 웹훅 테스트 완료!</div>
            <div className="text-sm mt-1">
              📊 서버 상태: 전체 {summary.total}개 (정상 {summary.healthy}개, 문제 {summary.unhealthy}개)
            </div>
            <div className="text-sm">
              📢 알림 전송: {data.notifications.total}개 채널로 전송됨
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(
          <div>
            <div className="font-semibold">❌ 웹훅 테스트 실패!</div>
            <div className="text-sm mt-1">{data.error}</div>
          </div>,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('웹훅 테스트 실패:', error);
      toast.error(
        <div>
          <div className="font-semibold">❌ 웹훅 테스트 오류</div>
          <div className="text-sm mt-1">네트워크 오류가 발생했습니다.</div>
        </div>,
        { duration: 5000 }
      );
    } finally {
      setWebhookLoading(false);
    }
  };

  // 알림 상태 조회
  const fetchNotificationStatus = async () => {
    try {
      const response = await fetch('/api/notification-status');
      const data = await response.json();
      
      if (data.success) {
        setNotificationStatus(data.notifications);
      }
    } catch (error) {
      console.error('알림 상태 조회 실패:', error);
    }
  };

  // 초기 로드 및 자동 새로고침
  useEffect(() => {
    fetchHealthStatus();
    fetchNotificationStatus();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchHealthStatus();
        fetchNotificationStatus();
      }, 30000); // 30초마다
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'unhealthy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'unhealthy':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return '정상';
      case 'unhealthy':
        return '비정상';
      case 'error':
        return '에러';
      default:
        return '알 수 없음';
    }
  };

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const totalCount = results.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              🗄️ MinIO Health Monitor
            </h1>
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                자동 새로고침 (30초)
              </label>
              <button
                onClick={runWebhookTest}
                disabled={webhookLoading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {webhookLoading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    테스트 중...
                  </>
                ) : (
                  <>
                    🧪 웹훅 테스트
                  </>
                )}
              </button>
              <button
                onClick={runHealthCheck}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    체크 중...
                  </>
                ) : (
                  <>
                    🔍 즉시 체크
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-600 font-semibold mb-1">전체 서버</div>
              <div className="text-3xl font-bold text-blue-900">{totalCount}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-600 font-semibold mb-1">정상 서버</div>
              <div className="text-3xl font-bold text-green-900">{healthyCount}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-600 font-semibold mb-1">문제 서버</div>
              <div className="text-3xl font-bold text-red-900">{totalCount - healthyCount}</div>
            </div>
          </div>

          {/* 알림 상태 표시 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🔔 알림 채널 상태
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${notificationStatus.slack ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-700">Slack</span>
                <span className={`text-xs px-2 py-1 rounded-full ${notificationStatus.slack ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {notificationStatus.slack ? '활성화' : '비활성화'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${notificationStatus.mattermost ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-700">Mattermost</span>
                <span className={`text-xs px-2 py-1 rounded-full ${notificationStatus.mattermost ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {notificationStatus.mattermost ? '활성화' : '비활성화'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${notificationStatus.email ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-700">이메일</span>
                <span className={`text-xs px-2 py-1 rounded-full ${notificationStatus.email ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {notificationStatus.email ? '활성화' : '비활성화'}
                </span>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              총 <span className="font-semibold text-indigo-600">{notificationStatus.total}</span>개의 알림 채널이 활성화되어 있습니다.
            </div>
          </div>

          {lastUpdate && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              마지막 업데이트: {lastUpdate}
            </div>
          )}
        </div>

        {/* 서버 상태 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {results.length > 0 ? (
            results.map((result, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-lg p-6 border-2 transition-all hover:shadow-xl ${getStatusColor(result.status)}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      {getStatusIcon(result.status)} {result.server}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 break-all">{result.url}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold`}>
                    {getStatusText(result.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {result.statusCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">상태 코드:</span>
                      <span className="font-semibold">{result.statusCode}</span>
                    </div>
                  )}
                  {result.responseTime !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">응답 시간:</span>
                      <span className="font-semibold">{result.responseTime}ms</span>
                    </div>
                  )}
                  {result.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                      <strong>에러:</strong> {result.error}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-3">
                    {new Date(result.timestamp).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="text-gray-400 text-lg mb-4">📊</div>
              <p className="text-gray-600">
                헬스체크 결과가 없습니다. &quot;즉시 체크&quot; 버튼을 눌러주세요.
              </p>
            </div>
          )}
        </div>

        {/* 설명 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ℹ️ 시스템 정보</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 이 시스템은 MinIO 서버들의 헬스체크를 주기적으로 수행합니다.</p>
            <p>• Vercel Cron을 통해 5분마다 자동으로 헬스체크가 실행됩니다.</p>
            <p>• 서버에 문제가 발생하면 설정된 알림 채널로 알림을 전송합니다.</p>
            <p>• 대시보드는 30초마다 자동으로 업데이트됩니다.</p>
            <p>• <strong>웹훅 테스트</strong> 버튼으로 알림 시스템을 테스트할 수 있습니다.</p>
            <p>• 환경 변수가 주석 처리(`#`)되어 있으면 해당 알림 채널은 자동으로 비활성화됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

