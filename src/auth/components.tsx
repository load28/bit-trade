/**
 * 인증/권한 관련 React 컴포넌트
 */

'use client';

import { type ReactNode } from 'react';
import { useAuth, useCan, useCanAny, useCanAll, useHasRole, useHasAnyRole } from './hooks';
import type { Action, Subject, Role } from './types';

// ============================================================================
// 권한 기반 렌더링 컴포넌트
// ============================================================================

interface CanProps {
  /** 수행할 액션 */
  action: Action;
  /** 대상 리소스 */
  subject: Subject;
  /** 권한이 있을 때 렌더링할 내용 */
  children: ReactNode;
  /** 권한이 없을 때 렌더링할 내용 */
  fallback?: ReactNode;
  /** 권한이 없으면 null 반환 (기본값: true) */
  passThrough?: boolean;
}

/**
 * 권한 기반 조건부 렌더링 컴포넌트
 *
 * @example
 * <Can action="create" subject="Order">
 *   <CreateOrderButton />
 * </Can>
 *
 * @example
 * <Can action="delete" subject="User" fallback={<AccessDenied />}>
 *   <DeleteUserButton />
 * </Can>
 */
export function Can({
  action,
  subject,
  children,
  fallback = null,
  passThrough = true,
}: CanProps) {
  const can = useCan(action, subject);

  if (can) {
    return <>{children}</>;
  }

  if (passThrough) {
    return <>{fallback}</>;
  }

  return null;
}

/**
 * 권한이 없을 때 렌더링하는 컴포넌트
 */
interface CannotProps {
  action: Action;
  subject: Subject;
  children: ReactNode;
}

export function Cannot({ action, subject, children }: CannotProps) {
  const can = useCan(action, subject);

  if (!can) {
    return <>{children}</>;
  }

  return null;
}

// ============================================================================
// 다중 권한 체크 컴포넌트
// ============================================================================

interface CanAnyProps {
  /** 체크할 권한 목록 */
  checks: Array<{ action: Action; subject: Subject }>;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 여러 권한 중 하나라도 만족하면 렌더링
 */
export function CanAny({ checks, children, fallback = null }: CanAnyProps) {
  const canAny = useCanAny(checks);

  if (canAny) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface CanAllProps {
  checks: Array<{ action: Action; subject: Subject }>;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 모든 권한을 만족해야 렌더링
 */
export function CanAll({ checks, children, fallback = null }: CanAllProps) {
  const canAll = useCanAll(checks);

  if (canAll) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================================
// 역할 기반 렌더링 컴포넌트
// ============================================================================

interface RoleGateProps {
  /** 허용할 역할 (단일 또는 배열) */
  roles: Role | Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 특정 역할만 렌더링
 *
 * @example
 * <RoleGate roles="super_admin">
 *   <AdminPanel />
 * </RoleGate>
 *
 * @example
 * <RoleGate roles={['trader', 'risk_manager']}>
 *   <TradingPanel />
 * </RoleGate>
 */
export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  const hasRole = useHasAnyRole(roleArray);

  if (hasRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================================
// 인증 상태 기반 렌더링 컴포넌트
// ============================================================================

interface AuthenticatedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 인증된 사용자만 렌더링
 */
export function Authenticated({ children, fallback = null }: AuthenticatedProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * 비인증 사용자만 렌더링
 */
export function Unauthenticated({ children, fallback = null }: AuthenticatedProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================================
// 로딩 상태 컴포넌트
// ============================================================================

interface AuthLoadingProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 인증 로딩 중일 때 렌더링
 */
export function AuthLoading({ children, fallback = null }: AuthLoadingProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================================
// 사용자 정보 표시 컴포넌트
// ============================================================================

interface UserInfoProps {
  /** 표시할 필드 */
  field: 'name' | 'email' | 'role' | 'id';
  /** 값이 없을 때 표시할 기본값 */
  fallback?: string;
}

/**
 * 현재 사용자 정보 표시
 */
export function UserInfo({ field, fallback = '' }: UserInfoProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const value = user[field];
  return <>{value ?? fallback}</>;
}

// ============================================================================
// 권한 기반 래퍼 컴포넌트
// ============================================================================

interface ProtectedProps {
  /** 필요한 액션 */
  action?: Action;
  /** 필요한 리소스 */
  subject?: Subject;
  /** 필요한 역할 */
  roles?: Role | Role[];
  /** 인증만 필요 */
  authOnly?: boolean;
  children: ReactNode;
  /** 권한 없을 때 표시할 컴포넌트 */
  fallback?: ReactNode;
  /** 권한 없을 때 리다이렉트 URL */
  redirectTo?: string;
}

/**
 * 통합 보호 컴포넌트
 * 인증, 역할, 권한을 한 번에 체크
 *
 * @example
 * <Protected authOnly>
 *   <Dashboard />
 * </Protected>
 *
 * @example
 * <Protected roles="admin" action="manage" subject="User">
 *   <UserManagement />
 * </Protected>
 */
export function Protected({
  action,
  subject,
  roles,
  authOnly = false,
  children,
  fallback = null,
}: ProtectedProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasRole = useHasAnyRole(
    roles ? (Array.isArray(roles) ? roles : [roles]) : []
  );
  const canPerform = useCan(
    action || ('read' as Action),
    subject || ('all' as Subject)
  );

  // 로딩 중
  if (isLoading) {
    return null;
  }

  // 인증 체크
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // 인증만 필요한 경우
  if (authOnly) {
    return <>{children}</>;
  }

  // 역할 체크
  if (roles && !hasRole) {
    return <>{fallback}</>;
  }

  // 권한 체크
  if (action && subject && !canPerform) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
