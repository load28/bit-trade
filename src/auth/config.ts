/**
 * Auth.js v5 설정
 * 인증 프로바이더 및 콜백 설정
 */

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { ROLES, type Role, type User as AppUser } from './types';
import { defineAbilityFor, packAbilityRules } from './ability';

// ============================================================================
// 타입 확장 (Auth.js 타입 확장)
// ============================================================================

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string | null;
    image?: string | null;
    role: Role;
    companyId?: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
  }

  interface Session {
    user: User;
    accessToken: string;
    packedRules: import('./types').PackedRule[];
  }
}

// JWT 타입 (내부 사용)
interface ExtendedJWT {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  role: Role;
  companyId?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  accessToken?: string;
}

// ============================================================================
// 인증 설정
// ============================================================================

/**
 * Auth.js 설정 객체
 * 미들웨어에서 사용되는 설정 (adapter 없음)
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/auth/welcome',
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // TODO: 실제 인증 로직으로 교체
        // 현재는 개발용 더미 인증
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 개발용 테스트 계정
        const testUsers: Record<
          string,
          { password: string; role: Role; name: string }
        > = {
          'admin@bittrade.com': {
            password: 'admin123',
            role: ROLES.SUPER_ADMIN,
            name: '슈퍼 관리자',
          },
          'company@bittrade.com': {
            password: 'company123',
            role: ROLES.COMPANY_ADMIN,
            name: '회사 관리자',
          },
          'risk@bittrade.com': {
            password: 'risk123',
            role: ROLES.RISK_MANAGER,
            name: '리스크 관리자',
          },
          'trader@bittrade.com': {
            password: 'trader123',
            role: ROLES.TRADER,
            name: '트레이더',
          },
          'analyst@bittrade.com': {
            password: 'analyst123',
            role: ROLES.ANALYST,
            name: '애널리스트',
          },
          'viewer@bittrade.com': {
            password: 'viewer123',
            role: ROLES.VIEWER,
            name: '뷰어',
          },
          'auditor@bittrade.com': {
            password: 'auditor123',
            role: ROLES.AUDITOR,
            name: '감사자',
          },
        };

        const testUser = testUsers[email];
        if (!testUser || testUser.password !== password) {
          return null;
        }

        return {
          id: `user-${email.split('@')[0]}`,
          email,
          name: testUser.name,
          role: testUser.role,
          companyId: 'company-1',
          status: 'active' as const,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * JWT 콜백: 토큰에 사용자 정보 추가
     */
    async jwt({ token, user, trigger, session }) {
      const extToken = token as unknown as ExtendedJWT;

      if (user) {
        // 최초 로그인 시 사용자 정보를 토큰에 저장
        extToken.id = user.id;
        extToken.email = user.email!;
        extToken.name = user.name ?? null;
        extToken.image = user.image;
        extToken.role = user.role;
        extToken.companyId = user.companyId;
        extToken.status = user.status;
      }

      // 세션 업데이트 시
      if (trigger === 'update' && session) {
        if (session.role) extToken.role = session.role;
        if (session.name) extToken.name = session.name;
        if (session.image) extToken.image = session.image;
      }

      return token;
    },

    /**
     * 세션 콜백: 클라이언트에 전달할 세션 정보 구성
     */
    async session({ session, token }) {
      const extToken = token as unknown as ExtendedJWT;

      if (extToken) {
        // 사용자 정보 (타입 단언 사용)
        (session.user as any) = {
          id: extToken.id,
          email: extToken.email,
          name: extToken.name,
          image: extToken.image,
          role: extToken.role,
          companyId: extToken.companyId,
          status: extToken.status,
        };

        // CASL 권한 규칙 생성 및 패킹
        const appUser: AppUser = {
          id: extToken.id,
          email: extToken.email,
          name: extToken.name,
          role: extToken.role,
          companyId: extToken.companyId,
          status: extToken.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const ability = defineAbilityFor(appUser);
        session.packedRules = packAbilityRules(ability);

        // 액세스 토큰 (실제로는 JWT를 사용하거나 별도 생성)
        session.accessToken = extToken.accessToken || '';
      }

      return session;
    },

    /**
     * 라우트 보호 콜백
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/auth');
      const isApiRoute = nextUrl.pathname.startsWith('/api');
      const isPublicRoute = PUBLIC_ROUTES.some(
        (route) =>
          nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
      );

      // 공개 라우트는 항상 허용
      if (isPublicRoute) {
        return true;
      }

      // API 라우트는 별도 처리
      if (isApiRoute) {
        return true;
      }

      // 인증 페이지 처리
      if (isAuthPage) {
        if (isLoggedIn) {
          // 이미 로그인된 사용자는 대시보드로 리다이렉트
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      // 보호된 라우트
      if (!isLoggedIn) {
        // 로그인 페이지로 리다이렉트 (원래 URL 저장)
        const callbackUrl = encodeURIComponent(
          nextUrl.pathname + nextUrl.search
        );
        return Response.redirect(
          new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl)
        );
      }

      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24시간
  },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// 라우트 설정
// ============================================================================

/**
 * 공개 라우트 (인증 불필요)
 */
export const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify',
  '/auth/error',
];

/**
 * 역할별 허용 라우트 매핑
 */
export const ROLE_ROUTES: Record<Role, string[]> = {
  [ROLES.SUPER_ADMIN]: ['*'], // 모든 라우트 접근 가능
  [ROLES.COMPANY_ADMIN]: [
    '/dashboard',
    '/users',
    '/settings',
    '/accounts',
    '/api-keys',
    '/audit-logs',
  ],
  [ROLES.RISK_MANAGER]: [
    '/dashboard',
    '/risk',
    '/orders',
    '/positions',
    '/alerts',
  ],
  [ROLES.TRADER]: [
    '/dashboard',
    '/trading',
    '/orders',
    '/positions',
    '/portfolio',
    '/market',
  ],
  [ROLES.ANALYST]: [
    '/dashboard',
    '/analysis',
    '/reports',
    '/market',
    '/charts',
  ],
  [ROLES.VIEWER]: ['/dashboard', '/market', '/charts'],
  [ROLES.AUDITOR]: [
    '/dashboard',
    '/audit-logs',
    '/reports',
    '/orders',
    '/trades',
  ],
};

/**
 * 역할이 특정 라우트에 접근 가능한지 확인
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  const allowedRoutes = ROLE_ROUTES[role];

  // 모든 라우트 접근 가능
  if (allowedRoutes.includes('*')) {
    return true;
  }

  // 허용된 라우트 체크
  return allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
