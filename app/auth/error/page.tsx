/**
 * 인증 에러 페이지
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: '서버 설정 오류가 발생했습니다.',
    AccessDenied: '접근이 거부되었습니다.',
    Verification: '인증 토큰이 만료되었거나 이미 사용되었습니다.',
    Default: '인증 중 오류가 발생했습니다.',
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '1rem', color: '#c33' }}>
          인증 오류
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          {errorMessage}
        </p>
        <Link
          href="/auth/login"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          로그인 페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
}
