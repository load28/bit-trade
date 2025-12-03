/**
 * 인증/권한 시스템 공개 API
 */

// ============================================================================
// 타입
// ============================================================================

export type {
  // 역할
  Role,
  // 액션
  Action,
  // 리소스
  Subject,
  // 사용자
  User,
  UserStatus,
  // 세션
  Session,
  // 권한
  Permission,
  PermissionConditions,
  // 패킹된 권한
  PackedRule,
  PackedPermissions,
  // 인증 상태
  AuthStatus,
  AuthState,
  // 에러
  AuthErrorCode,
} from './types';

// ============================================================================
// 상수
// ============================================================================

export {
  ROLES,
  ACTIONS,
  SUBJECTS,
  ROLE_HIERARCHY,
  ROLE_METADATA,
  // 유틸리티 함수
  hasHigherRole,
  hasEqualOrHigherRole,
  getInheritedRoles,
  // 에러 클래스
  AuthError,
} from './types';

// ============================================================================
// 권한 관련
// ============================================================================

export {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  getUserPermissions,
  hasPermission,
  canRolePerform,
} from './permissions';

// ============================================================================
// CASL Ability
// ============================================================================

export type { AppAbility, AppSubjects } from './ability';

export {
  defineAbilityFor,
  packAbilityRules,
  unpackAbilityRules,
  createEmptyAbility,
  createGuestAbility,
  createAbilityForRole,
  canAny,
  canAll,
  getAllowedActions,
  getAccessibleSubjects,
  ForbiddenError,
  assertCan,
} from './ability';

// ============================================================================
// Jotai 스토어
// ============================================================================

export {
  // 기본 atoms
  authStatusAtom,
  userAtom,
  packedRulesAtom,
  accessTokenAtom,
  tokenExpiresAtAtom,
  // 파생 atoms
  isAuthenticatedAtom,
  abilityAtom,
  userRoleAtom,
  userIdAtom,
  companyIdAtom,
  isTokenExpiredAtom,
  // 액션 atoms
  setAuthenticatedAtom,
  logoutAtom,
  updateUserAtom,
  updateRulesAtom,
  refreshTokenAtom,
  resetAuthAtom,
  // 영속성 atoms
  refreshTokenStorageAtom,
  lastEmailAtom,
  // 선택자 atoms
  authSnapshotAtom,
  userProfileAtom,
} from './store';

// ============================================================================
// React Hooks
// ============================================================================

export {
  // 기본 인증
  useAuth,
  // 권한 체크
  useAbility,
  useCan,
  useCanAny,
  useCanAll,
  // 사용자 정보
  useUser,
  useRole,
  useUserId,
  useCompanyId,
  useUserProfile,
  // 인증 상태
  useIsAuthenticated,
  useAuthSnapshot,
  // 액션
  useUpdateUser,
  useLogout,
  // 역할 체크
  useHasRole,
  useHasAnyRole,
  // 서버 유틸리티
  getServerSession,
} from './hooks';

// ============================================================================
// React 컴포넌트
// ============================================================================

export {
  // 권한 기반 렌더링
  Can,
  Cannot,
  CanAny,
  CanAll,
  // 역할 기반 렌더링
  RoleGate,
  // 인증 상태 기반 렌더링
  Authenticated,
  Unauthenticated,
  AuthLoading,
  // 사용자 정보
  UserInfo,
  // 통합 보호
  Protected,
} from './components';

// ============================================================================
// 프로바이더
// ============================================================================

export { AuthProvider } from './provider';

// ============================================================================
// Auth.js
// ============================================================================

export { auth, signIn, signOut, handlers } from './auth';

// ============================================================================
// 설정
// ============================================================================

export {
  authConfig,
  PUBLIC_ROUTES,
  ROLE_ROUTES,
  canAccessRoute,
} from './config';
