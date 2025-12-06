/**
 * Next.js 프록시
 * 라우트 보호 및 인증 검증
 */

import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth/auth';
import { PUBLIC_ROUTES, canAccessRoute } from '@/auth/config';
import type { Role } from '@/auth/types';

/**
 * 프록시 함수
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 라우트는 통과
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 세션 확인
  const session = await auth();

  // 인증 페이지 처리
  if (pathname.startsWith('/auth')) {
    if (session?.user) {
      // 이미 로그인된 사용자는 대시보드로 리다이렉트
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 보호된 라우트: 인증 필요
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  // 역할 기반 라우트 접근 제어
  const userRole = session.user.role as Role;
  if (!canAccessRoute(userRole, pathname)) {
    // 접근 권한이 없으면 대시보드로 리다이렉트
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  /**
   * 프록시가 적용될 경로
   */
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
