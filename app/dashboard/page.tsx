/**
 * 대시보드 페이지
 */

import { auth } from '@/auth/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>Bit Trade 대시보드</h1>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>사용자 정보</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div>
            <strong>이메일:</strong> {session.user.email}
          </div>
          <div>
            <strong>이름:</strong> {session.user.name || '미설정'}
          </div>
          <div>
            <strong>역할:</strong> {session.user.role}
          </div>
          <div>
            <strong>회사 ID:</strong> {session.user.companyId || '없음'}
          </div>
          <div>
            <strong>상태:</strong> {session.user.status}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>세션 정보</h2>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.875rem'
        }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem'
      }}>
        <a
          href="/api/auth/signout"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          로그아웃
        </a>

        <a
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          홈으로
        </a>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#d1ecf1',
        borderLeft: '4px solid #0c5460',
        borderRadius: '4px'
      }}>
        <p style={{ margin: 0, color: '#0c5460' }}>
          ✅ Supabase 인증 연동이 성공적으로 완료되었습니다!
        </p>
      </div>
    </div>
  );
}
