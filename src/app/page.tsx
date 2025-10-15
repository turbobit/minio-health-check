'use client';

import { useState, useEffect } from 'react';
import { HealthCheckResult } from '@/lib/minio-health';
import toast, { Toaster } from 'react-hot-toast';
import OTPAuth from '@/components/OTPAuth';
import OTPSetup from '@/components/OTPSetup';

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
  const [authStatus, setAuthStatus] = useState<{
    otpEnabled: boolean;
    otpSetupRequired: boolean;
    authenticated: boolean;
    requiresAuth: boolean;
    requiresSetup: boolean;
    setupCompleted?: boolean;
    showQrSetup?: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // 인증 상태 조회
  const fetchAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      
      if (data.success) {
        const authData = data.data;
        
        // OTP 설정이 필요하지만 이미 설정 완료된 경우 체크
        if (authData.requiresSetup) {
          const setupCompleted = localStorage.getItem('otp_setup_completed');
          const setupTimestamp = localStorage.getItem('otp_setup_timestamp');
          
          if (setupCompleted === 'true' && setupTimestamp) {
            // 설정 완료 후 5분 이내라면 설정 완료 안내 표시
            const setupTime = new Date(setupTimestamp);
            const now = new Date();
            const diffMinutes = (now.getTime() - setupTime.getTime()) / (1000 * 60);
            
            if (diffMinutes < 5) {
              // 설정 완료 안내 상태로 변경
              setAuthStatus({
                ...authData,
                requiresSetup: false,
                setupCompleted: true
              });
              setIsLoading(false);
              return;
            }
          }
        }
        
        setAuthStatus(authData);
      }
    } catch (error) {
      console.error('인증 상태 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthStatus(prev => prev ? { ...prev, authenticated: false } : null);
      toast.success('로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // OTP 인증 성공 처리
  const handleAuthSuccess = () => {
    setAuthStatus(prev => prev ? { ...prev, authenticated: true } : null);
    fetchHealthStatus();
    fetchNotificationStatus();
  };

  // OTP 설정 완료 처리
  const handleSetupComplete = () => {
    toast.success('OTP 설정이 완료되었습니다. 환경 변수를 설정하고 서버를 재시작해주세요.');
    // 설정 완료 후 인증 상태 다시 확인
    setTimeout(() => {
      fetchAuthStatus();
    }, 2000);
  };

  // 초기 로드 및 자동 새로고침
  useEffect(() => {
    fetchAuthStatus();
  }, []);

  useEffect(() => {
    if (authStatus?.authenticated) {
      fetchHealthStatus();
      fetchNotificationStatus();
      
      if (autoRefresh) {
        const interval = setInterval(() => {
          fetchHealthStatus();
          fetchNotificationStatus();
        }, 30000); // 30초마다
        return () => clearInterval(interval);
      }
    }
  }, [autoRefresh, authStatus?.authenticated]);

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

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">인증 상태를 확인하는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // OTP 설정이 필요한 경우
  if (authStatus?.requiresSetup) {
    // SHOW_QR_SETUP이 true인 경우에만 QR 코드 등록 페이지 표시
    if (authStatus?.showQrSetup) {
      return <OTPSetup onSetupComplete={handleSetupComplete} />;
    } else {
      // SHOW_QR_SETUP이 false인 경우 OTP 입력 페이지만 표시
      return <OTPAuth onAuthSuccess={handleAuthSuccess} />;
    }
  }

  // OTP 설정 완료 안내 화면
  if (authStatus?.setupCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
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
        
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              OTP 설정 완료!
            </h1>
            <p className="text-gray-600">
              환경 변수 설정 후 서버를 재시작해주세요
            </p>
          </div>

          <div className="space-y-6">
            {/* 설정 완료 안내 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">🎉 설정이 완료되었습니다!</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 환경 변수가 클립보드에 복사되었습니다</li>
                <li>• <code className="bg-green-100 px-1 rounded">.env.local</code> 파일에 붙여넣기하세요</li>
                <li>• 서버를 재시작하세요</li>
                <li>• 재시작 후 OTP 인증 화면이 표시됩니다</li>
              </ul>
            </div>

            {/* 환경 변수 설정 안내 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">📋 다음 단계</h3>
              <ol className="text-sm text-yellow-700 space-y-2">
                <li>1. <code className="bg-yellow-100 px-1 rounded">.env.local</code> 파일을 열어주세요</li>
                <li>2. 클립보드에 복사된 환경 변수를 붙여넣기하세요</li>
                <li>3. 개발 서버를 재시작하세요: <code className="bg-yellow-100 px-1 rounded">npm run dev</code></li>
                <li>4. OTP 앱(Google Authenticator 등)을 준비하세요</li>
              </ol>
            </div>

            {/* 새로고침 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  localStorage.removeItem('otp_setup_completed');
                  localStorage.removeItem('otp_setup_timestamp');
                  window.location.reload();
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                🔄 페이지 새로고침
              </button>
            </div>

            {/* 추가 도움말 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">ℹ️ 도움이 필요하신가요?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 환경 변수 설정이 어려우시면 README.md를 참고하세요</li>
                <li>• OTP 앱이 없다면 Google Authenticator를 설치하세요</li>
                <li>• 문제가 지속되면 브라우저 캐시를 삭제해보세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // OTP 인증이 필요하고 인증되지 않은 경우
  if (authStatus?.requiresAuth && !authStatus?.authenticated) {
    return <OTPAuth onAuthSuccess={handleAuthSuccess} skipSetup={!authStatus?.showQrSetup} />;
  }

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
              {authStatus?.authenticated && (
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  🚪 로그아웃
                </button>
              )}
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
            {authStatus?.authenticated && (
              <p>• <strong>OTP 인증</strong>이 활성화되어 있어 보안이 강화되었습니다.</p>
            )}
          </div>
        </div>

        {/* API 정보 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📚 API 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">헬스체크 API</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• <code className="bg-gray-100 px-1 rounded">GET /api/health-check</code> - 현재 상태 조회</li>
                <li>• <code className="bg-gray-100 px-1 rounded">POST /api/health-check</code> - 즉시 체크 실행</li>
                <li>• <code className="bg-gray-100 px-1 rounded">GET /api/cron</code> - Cron Job 엔드포인트</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">알림 & 인증 API</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• <code className="bg-gray-100 px-1 rounded">GET /api/notification-status</code> - 알림 상태</li>
                <li>• <code className="bg-gray-100 px-1 rounded">POST /api/test-webhook</code> - 웹훅 테스트</li>
                <li>• <code className="bg-gray-100 px-1 rounded">GET /api/auth/status</code> - 인증 상태</li>
                <li>• <code className="bg-gray-100 px-1 rounded">GET /api/docs</code> - API 문서</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-center">
            <a 
              href="/api/docs" 
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              📖 상세 API 문서 보기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

