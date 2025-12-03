/**
 * Jotai 기반 인증 상태 스토어
 * 클라이언트 사이드 인증 상태 관리
 */

import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import type { User, AuthStatus, PackedRule, Role } from './types';
import type { AppAbility } from './ability';
import { createEmptyAbility, unpackAbilityRules } from './ability';

// ============================================================================
// 기본 Atoms
// ============================================================================

/**
 * 인증 상태 Atom
 */
export const authStatusAtom = atom<AuthStatus>('loading');

/**
 * 현재 사용자 Atom
 */
export const userAtom = atom<User | null>(null);

/**
 * 패킹된 권한 규칙 Atom (서버에서 전달받은 규칙)
 */
export const packedRulesAtom = atom<PackedRule[]>([]);

/**
 * 액세스 토큰 Atom (메모리에만 저장)
 */
export const accessTokenAtom = atom<string | null>(null);

/**
 * 토큰 만료 시간 Atom
 */
export const tokenExpiresAtAtom = atom<Date | null>(null);

// ============================================================================
// 파생 Atoms (Derived Atoms)
// ============================================================================

/**
 * 인증 여부 Atom
 */
export const isAuthenticatedAtom = atom((get) => {
  const status = get(authStatusAtom);
  const user = get(userAtom);
  return status === 'authenticated' && user !== null;
});

/**
 * CASL Ability Atom
 * 패킹된 규칙에서 Ability 인스턴스 생성
 */
export const abilityAtom = atom<AppAbility>((get) => {
  const packedRules = get(packedRulesAtom);

  if (packedRules.length === 0) {
    return createEmptyAbility();
  }

  return unpackAbilityRules(packedRules);
});

/**
 * 현재 사용자 역할 Atom
 */
export const userRoleAtom = atom<Role | null>((get) => {
  const user = get(userAtom);
  return user?.role ?? null;
});

/**
 * 사용자 ID Atom
 */
export const userIdAtom = atom<string | null>((get) => {
  const user = get(userAtom);
  return user?.id ?? null;
});

/**
 * 회사 ID Atom
 */
export const companyIdAtom = atom<string | null>((get) => {
  const user = get(userAtom);
  return user?.companyId ?? null;
});

/**
 * 토큰 만료 여부 Atom
 */
export const isTokenExpiredAtom = atom((get) => {
  const expiresAt = get(tokenExpiresAtAtom);
  if (!expiresAt) return true;
  return new Date() >= expiresAt;
});

// ============================================================================
// 액션 Atoms (Write Atoms)
// ============================================================================

/**
 * 로그인 성공 시 상태 설정
 */
export const setAuthenticatedAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      user: User;
      packedRules: PackedRule[];
      accessToken: string;
      expiresAt: Date;
    }
  ) => {
    set(userAtom, payload.user);
    set(packedRulesAtom, payload.packedRules);
    set(accessTokenAtom, payload.accessToken);
    set(tokenExpiresAtAtom, payload.expiresAt);
    set(authStatusAtom, 'authenticated');
  }
);

/**
 * 로그아웃
 */
export const logoutAtom = atom(null, (get, set) => {
  set(userAtom, null);
  set(packedRulesAtom, []);
  set(accessTokenAtom, null);
  set(tokenExpiresAtAtom, null);
  set(authStatusAtom, 'unauthenticated');
});

/**
 * 사용자 정보 업데이트
 */
export const updateUserAtom = atom(
  null,
  (get, set, updates: Partial<User>) => {
    const currentUser = get(userAtom);
    if (currentUser) {
      set(userAtom, { ...currentUser, ...updates });
    }
  }
);

/**
 * 권한 규칙 업데이트
 */
export const updateRulesAtom = atom(
  null,
  (get, set, packedRules: PackedRule[]) => {
    set(packedRulesAtom, packedRules);
  }
);

/**
 * 토큰 갱신
 */
export const refreshTokenAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      accessToken: string;
      expiresAt: Date;
    }
  ) => {
    set(accessTokenAtom, payload.accessToken);
    set(tokenExpiresAtAtom, payload.expiresAt);
  }
);

/**
 * 인증 상태 초기화 (로딩 상태로)
 */
export const resetAuthAtom = atom(null, (get, set) => {
  set(authStatusAtom, 'loading');
  set(userAtom, null);
  set(packedRulesAtom, []);
  set(accessTokenAtom, null);
  set(tokenExpiresAtAtom, null);
});

// ============================================================================
// 영속성 Atoms (선택적 - localStorage 저장)
// ============================================================================

/**
 * 리프레시 토큰 Atom (localStorage에 저장)
 * 주의: 보안상 httpOnly 쿠키 사용 권장
 */
const storage = createJSONStorage<string | null>(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
});

export const refreshTokenStorageAtom = atomWithStorage<string | null>(
  'bit-trade-refresh-token',
  null,
  storage,
  { getOnInit: true }
);

/**
 * 마지막 로그인 사용자 이메일 (편의를 위한 저장)
 */
const stringStorage = createJSONStorage<string>(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => '',
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return {
    getItem: (key: string) => localStorage.getItem(key) ?? '',
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: (key: string) => localStorage.removeItem(key),
  };
});

export const lastEmailAtom = atomWithStorage<string>(
  'bit-trade-last-email',
  '',
  stringStorage,
  { getOnInit: true }
);

// ============================================================================
// 선택자 Atoms (Selector Atoms)
// ============================================================================

/**
 * 인증 정보 전체 스냅샷
 */
export const authSnapshotAtom = atom((get) => ({
  status: get(authStatusAtom),
  user: get(userAtom),
  isAuthenticated: get(isAuthenticatedAtom),
  ability: get(abilityAtom),
  accessToken: get(accessTokenAtom),
  isTokenExpired: get(isTokenExpiredAtom),
}));

/**
 * 사용자 프로필 정보
 */
export const userProfileAtom = atom((get) => {
  const user = get(userAtom);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    companyId: user.companyId,
    status: user.status,
  };
});
