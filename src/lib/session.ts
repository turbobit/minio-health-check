import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'minio-auth-session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간

export interface SessionData {
  authenticated: boolean;
  timestamp: number;
  expiresAt: number;
}

/**
 * 세션 생성
 */
export function createSession(): SessionData {
  const now = Date.now();
  return {
    authenticated: true,
    timestamp: now,
    expiresAt: now + SESSION_DURATION
  };
}

/**
 * 세션 검증
 */
export function validateSession(sessionData: SessionData): boolean {
  const now = Date.now();
  return sessionData.authenticated && sessionData.expiresAt > now;
}

/**
 * 세션 쿠키 설정
 */
export function setSessionCookie(sessionData: SessionData): void {
  const cookieStore = cookies();
  const sessionString = JSON.stringify(sessionData);
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION / 1000, // 초 단위
    path: '/'
  });
}

/**
 * 세션 쿠키 가져오기
 */
export function getSessionCookie(): SessionData | null {
  try {
    const cookieStore = cookies();
    const sessionString = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionString) {
      return null;
    }
    
    const sessionData: SessionData = JSON.parse(sessionString);
    
    if (validateSession(sessionData)) {
      return sessionData;
    } else {
      // 만료된 세션 삭제
      clearSessionCookie();
      return null;
    }
  } catch (error) {
    console.error('세션 쿠키 파싱 오류:', error);
    clearSessionCookie();
    return null;
  }
}

/**
 * 세션 쿠키 삭제
 */
export function clearSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * 인증 상태 확인
 */
export function isAuthenticated(): boolean {
  const session = getSessionCookie();
  return session !== null;
}

/**
 * 클라이언트 사이드에서 세션 확인 (브라우저에서 사용)
 */
export function checkClientSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const sessionString = localStorage.getItem(SESSION_COOKIE_NAME);
    if (!sessionString) {
      return false;
    }
    
    const sessionData: SessionData = JSON.parse(sessionString);
    return validateSession(sessionData);
  } catch (error) {
    console.error('클라이언트 세션 확인 오류:', error);
    return false;
  }
}

/**
 * 클라이언트 사이드에서 세션 저장
 */
export function setClientSession(sessionData: SessionData): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem(SESSION_COOKIE_NAME, JSON.stringify(sessionData));
}

/**
 * 클라이언트 사이드에서 세션 삭제
 */
export function clearClientSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(SESSION_COOKIE_NAME);
}
