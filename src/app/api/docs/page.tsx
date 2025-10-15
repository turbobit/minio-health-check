'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OTPAuth from '@/components/OTPAuth';
import OTPSetup from '@/components/OTPSetup';

interface AuthStatus {
  otpEnabled: boolean;
  otpSetupRequired: boolean;
  authenticated: boolean;
  requiresAuth: boolean;
  requiresSetup: boolean;
  showQrSetup?: boolean;
}

export default function APIDocsPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 인증 상태 조회
  const fetchAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      
      if (data.success) {
        setAuthStatus(data.data);
      }
    } catch (error) {
      console.error('인증 상태 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP 인증 성공 처리
  const handleAuthSuccess = () => {
    setAuthStatus(prev => prev ? { ...prev, authenticated: true } : null);
  };

  // OTP 설정 완료 처리
  const handleSetupComplete = () => {
    // 설정 완료 후 인증 상태 다시 확인
    setTimeout(() => {
      fetchAuthStatus();
    }, 2000);
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

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
      return <OTPAuth onAuthSuccess={handleAuthSuccess} skipSetup={true} />;
    }
  }

  // OTP 인증이 필요하고 인증되지 않은 경우
  if (authStatus?.requiresAuth && !authStatus?.authenticated) {
    return <OTPAuth onAuthSuccess={handleAuthSuccess} skipSetup={!authStatus?.showQrSetup} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              📚 API 문서
            </h1>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              🏠 대시보드로 돌아가기
            </button>
          </div>
          <p className="text-gray-600">
            MinIO Health Monitor API의 상세한 사용법과 예시를 확인할 수 있습니다.
          </p>
        </div>

        {/* API 엔드포인트 목록 */}
        <div className="space-y-6">
          {/* 헬스체크 API */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🏥 헬스체크 API
            </h2>
            
            <div className="space-y-6">
              {/* GET /api/health-check */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">GET</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/health-check</code>
                </div>
                <p className="text-gray-600 mb-3">현재 저장된 헬스체크 결과를 조회합니다.</p>
                
                <div className="bg-gray-50 rounded p-4 mb-3">
                  <h4 className="font-semibold text-gray-700 mb-2">응답 예시:</h4>
                  <pre className="text-sm text-gray-600 overflow-x-auto">
{`{
  "success": true,
  "timestamp": "2024-01-15T10:30:45.123Z",
  "results": [
    {
      "server": "MinIO 1",
      "url": "http://minio1.closetoya.com:9000/minio/health/live",
      "status": "healthy",
      "statusCode": 200,
      "responseTime": 17,
      "timestamp": "2024-01-15T10:30:45.123Z"
    }
  ]
}`}
                  </pre>
                </div>
                
                <div className="bg-blue-50 rounded p-3">
                  <h4 className="font-semibold text-blue-800 mb-1">cURL 예시:</h4>
                  <code className="text-sm text-blue-700">curl http://localhost:3000/api/health-check</code>
                </div>
              </div>

              {/* POST /api/health-check */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">POST</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/health-check</code>
                </div>
                <p className="text-gray-600 mb-3">즉시 헬스체크를 실행합니다.</p>
                
                <div className="bg-blue-50 rounded p-3">
                  <h4 className="font-semibold text-blue-800 mb-1">cURL 예시:</h4>
                  <code className="text-sm text-blue-700">curl -X POST http://localhost:3000/api/health-check</code>
                </div>
              </div>

              {/* GET /api/cron */}
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-semibold">GET</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/cron</code>
                </div>
                <p className="text-gray-600 mb-3">Vercel Cron이 호출하는 엔드포인트입니다. (자동 실행)</p>
                
                <div className="bg-yellow-50 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> 이 엔드포인트는 Vercel Cron에 의해 자동으로 호출됩니다. 
                    수동으로 호출할 필요가 없습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 알림 API */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🔔 알림 API
            </h2>
            
            <div className="space-y-6">
              {/* GET /api/notification-status */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">GET</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/notification-status</code>
                </div>
                <p className="text-gray-600 mb-3">현재 알림 설정 상태를 조회합니다.</p>
                
                <div className="bg-gray-50 rounded p-4 mb-3">
                  <h4 className="font-semibold text-gray-700 mb-2">응답 예시:</h4>
                  <pre className="text-sm text-gray-600 overflow-x-auto">
{`{
  "success": true,
  "timestamp": "2024-01-15T10:30:45.123Z",
  "notifications": {
    "slack": false,
    "mattermost": true,
    "email": false,
    "total": 1
  },
  "message": "총 1개의 알림 채널이 활성화되어 있습니다."
}`}
                  </pre>
                </div>
              </div>

              {/* POST /api/test-webhook */}
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-semibold">POST</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/test-webhook</code>
                </div>
                <p className="text-gray-600 mb-3">실제 MinIO 서버 상태로 웹훅 알림 시스템을 테스트합니다.</p>
                
                <div className="bg-orange-50 rounded p-3">
                  <h4 className="font-semibold text-orange-800 mb-1">cURL 예시:</h4>
                  <code className="text-sm text-orange-700">curl -X POST http://localhost:3000/api/test-webhook</code>
                </div>
              </div>
            </div>
          </div>

          {/* 인증 API */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🔐 인증 API
            </h2>
            
            <div className="space-y-6">
              {/* GET /api/auth/status */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">GET</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/auth/status</code>
                </div>
                <p className="text-gray-600 mb-3">인증 상태를 확인합니다.</p>
              </div>

              {/* GET /api/auth/otp/setup - SHOW_QR_SETUP이 true일 때만 표시 */}
              {authStatus?.showQrSetup && (
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">GET</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/auth/otp/setup</code>
                  </div>
                  <p className="text-gray-600 mb-3">OTP 설정 정보를 조회합니다. (QR 코드 포함)</p>
                </div>
              )}

              {/* POST /api/auth/otp/verify */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">POST</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/auth/otp/verify</code>
                </div>
                <p className="text-gray-600 mb-3">OTP 토큰을 검증하고 세션을 생성합니다.</p>
                
                <div className="bg-gray-50 rounded p-4 mb-3">
                  <h4 className="font-semibold text-gray-700 mb-2">요청 본문:</h4>
                  <pre className="text-sm text-gray-600 overflow-x-auto">
{`{
  "token": "123456"
}`}
                  </pre>
                </div>
              </div>

              {/* POST /api/auth/logout */}
              <div className="border-l-4 border-red-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">POST</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/auth/logout</code>
                </div>
                <p className="text-gray-600 mb-3">로그아웃하고 세션을 삭제합니다.</p>
              </div>
            </div>
          </div>

          {/* 환경 변수 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              ⚙️ 환경 변수
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">변수명</th>
                    <th className="text-left py-2 px-3">설명</th>
                    <th className="text-left py-2 px-3">필수</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">SLACK_WEBHOOK_URL</td>
                    <td className="py-2 px-3">Slack 웹훅 URL</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">MATTERMOST_WEBHOOK_URL</td>
                    <td className="py-2 px-3">Mattermost 웹훅 URL</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">MATTERMOST_CHANNEL</td>
                    <td className="py-2 px-3">Mattermost 채널명</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">EMAIL_TO</td>
                    <td className="py-2 px-3">이메일 수신자</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">CRON_SECRET</td>
                    <td className="py-2 px-3">Cron Job 보안 키</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">OTP_SECRET</td>
                    <td className="py-2 px-3">OTP 시크릿 키 (32자리)</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">OTP_ISSUER</td>
                    <td className="py-2 px-3">OTP 앱 표시명</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">SESSION_SECRET</td>
                    <td className="py-2 px-3">세션 암호화 키 (32자리)</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono">SHOW_QR_SETUP</td>
                    <td className="py-2 px-3">QR 코드 등록 페이지 표시 여부 (true/false)</td>
                    <td className="py-2 px-3">선택</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
