/**
 * 인증/권한 관련 React Hooks
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import type { Action, Subject, Role, User, PackedRule } from './types';
import type { AppAbility, AppSubjects } from './ability';
import {
  authStatusAtom,
  userAtom,
  packedRulesAtom,
  accessTokenAtom,
  tokenExpiresAtAtom,
  isAuthenticatedAtom,
  abilityAtom,
  userRoleAtom,
  userIdAtom,
  companyIdAtom,
  setAuthenticatedAtom,
  logoutAtom,
  updateUserAtom,
  authSnapshotAtom,
  userProfileAtom,
} from './store';

// ============================================================================
// 기본 인증 훅
// ============================================================================

/**
 * 인증 상태 및 사용자 정보 훅
 * NextAuth 세션과 Jotai 스토어 동기화
 */
export function useAuth() {
  const { data: session, status: sessionStatus } = useSession();
  const [authStatus, setAuthStatus] = useAtom(authStatusAtom);
  const [user, setUser] = useAtom(userAtom);
  const setPackedRules = useSetAtom(packedRulesAtom);
  const setAccessToken = useSetAtom(accessTokenAtom);
  const setTokenExpiresAt = useSetAtom(tokenExpiresAtAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const ability = useAtomValue(abilityAtom);

  // NextAuth 세션과 Jotai 스토어 동기화
  useEffect(() => {
    if (sessionStatus === 'loading') {
      setAuthStatus('loading');
      return;
    }

    if (sessionStatus === 'authenticated' && session?.user) {
      const appUser: User = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        companyId: session.user.companyId,
        status: session.user.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setUser(appUser);
      setPackedRules(session.packedRules || []);
      setAccessToken(session.accessToken || null);
      setTokenExpiresAt(session.expires ? new Date(session.expires) : null);
      setAuthStatus('authenticated');
    } else {
      setUser(null);
      setPackedRules([]);
      setAccessToken(null);
      setTokenExpiresAt(null);
      setAuthStatus('unauthenticated');
    }
  }, [
    session,
    sessionStatus,
    setAuthStatus,
    setUser,
    setPackedRules,
    setAccessToken,
    setTokenExpiresAt,
  ]);

  /**
   * 로그인 함수
   */
  const login = useCallback(
    async (email: string, password: string, callbackUrl?: string) => {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        callbackUrl: callbackUrl || '/dashboard',
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
    []
  );

  /**
   * 로그아웃 함수
   */
  const logout = useCallback(async (callbackUrl?: string) => {
    await nextAuthSignOut({
      callbackUrl: callbackUrl || '/auth/login',
      redirect: true,
    });
  }, []);

  return {
    user,
    status: authStatus,
    isAuthenticated,
    isLoading: authStatus === 'loading',
    ability,
    login,
    logout,
  };
}

// ============================================================================
// 권한 체크 훅
// ============================================================================

/**
 * 권한 체크 훅
 * CASL Ability를 사용한 권한 검증
 */
export function useAbility(): AppAbility {
  return useAtomValue(abilityAtom);
}

/**
 * 특정 권한 체크 훅
 */
export function useCan(action: Action, subject: Subject): boolean {
  const ability = useAbility();
  return ability.can(action, subject as AppSubjects);
}

/**
 * 다중 권한 체크 훅 (하나라도 만족)
 */
export function useCanAny(
  checks: Array<{ action: Action; subject: Subject }>
): boolean {
  const ability = useAbility();
  return checks.some(({ action, subject }) =>
    ability.can(action, subject as AppSubjects)
  );
}

/**
 * 다중 권한 체크 훅 (모두 만족)
 */
export function useCanAll(
  checks: Array<{ action: Action; subject: Subject }>
): boolean {
  const ability = useAbility();
  return checks.every(({ action, subject }) =>
    ability.can(action, subject as AppSubjects)
  );
}

// ============================================================================
// 사용자 정보 훅
// ============================================================================

/**
 * 현재 사용자 정보
 */
export function useUser(): User | null {
  return useAtomValue(userAtom);
}

/**
 * 현재 사용자 역할
 */
export function useRole(): Role | null {
  return useAtomValue(userRoleAtom);
}

/**
 * 현재 사용자 ID
 */
export function useUserId(): string | null {
  return useAtomValue(userIdAtom);
}

/**
 * 현재 회사 ID
 */
export function useCompanyId(): string | null {
  return useAtomValue(companyIdAtom);
}

/**
 * 사용자 프로필 정보
 */
export function useUserProfile() {
  return useAtomValue(userProfileAtom);
}

// ============================================================================
// 인증 상태 훅
// ============================================================================

/**
 * 인증 여부만 확인
 */
export function useIsAuthenticated(): boolean {
  return useAtomValue(isAuthenticatedAtom);
}

/**
 * 인증 상태 스냅샷
 */
export function useAuthSnapshot() {
  return useAtomValue(authSnapshotAtom);
}

// ============================================================================
// 액션 훅
// ============================================================================

/**
 * 사용자 정보 업데이트 훅
 */
export function useUpdateUser() {
  return useSetAtom(updateUserAtom);
}

/**
 * 로그아웃 액션 훅
 */
export function useLogout() {
  const logout = useSetAtom(logoutAtom);

  return useCallback(async (callbackUrl?: string) => {
    logout();
    await nextAuthSignOut({
      callbackUrl: callbackUrl || '/auth/login',
      redirect: true,
    });
  }, [logout]);
}

// ============================================================================
// 역할 체크 훅
// ============================================================================

/**
 * 특정 역할인지 확인
 */
export function useHasRole(role: Role): boolean {
  const userRole = useRole();
  return userRole === role;
}

/**
 * 여러 역할 중 하나인지 확인
 */
export function useHasAnyRole(roles: Role[]): boolean {
  const userRole = useRole();
  return userRole !== null && roles.includes(userRole);
}

// ============================================================================
// 서버 컴포넌트용 유틸리티
// ============================================================================

export { auth as getServerSession } from './auth';
