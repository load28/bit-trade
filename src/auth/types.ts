/**
 * 트레이딩 시스템 인증/권한 타입 정의
 * 엔터프라이즈 수준의 RBAC (Role-Based Access Control) 시스템
 */

// ============================================================================
// 역할 (Roles) - 트레이딩 플랫폼 표준 역할 계층
// ============================================================================

/**
 * 시스템 역할 정의
 * Trading Technologies, LedgerX, Interactive Brokers 등 실제 트레이딩 플랫폼 분석 기반
 */
export const ROLES = {
  /** 시스템 전체 관리자 - 모든 권한 보유 */
  SUPER_ADMIN: 'super_admin',
  /** 회사 수준 관리자 - 사용자/설정 관리 */
  COMPANY_ADMIN: 'company_admin',
  /** 리스크 관리자 - 리스크 모니터링 및 주문 제한 설정 */
  RISK_MANAGER: 'risk_manager',
  /** 트레이더 - 거래 실행 및 포지션 관리 */
  TRADER: 'trader',
  /** 애널리스트 - 시장 분석 및 리포트 생성 */
  ANALYST: 'analyst',
  /** 읽기 전용 - 조회만 가능 */
  VIEWER: 'viewer',
  /** 감사자 - 감사 로그 및 보고서 접근 */
  AUDITOR: 'auditor',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * 역할 계층 구조
 * 상위 역할은 하위 역할의 모든 권한을 상속
 */
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [ROLES.SUPER_ADMIN]: [
    ROLES.COMPANY_ADMIN,
    ROLES.RISK_MANAGER,
    ROLES.TRADER,
    ROLES.ANALYST,
    ROLES.VIEWER,
    ROLES.AUDITOR,
  ],
  [ROLES.COMPANY_ADMIN]: [ROLES.RISK_MANAGER, ROLES.TRADER, ROLES.ANALYST, ROLES.VIEWER],
  [ROLES.RISK_MANAGER]: [ROLES.VIEWER],
  [ROLES.TRADER]: [ROLES.VIEWER],
  [ROLES.ANALYST]: [ROLES.VIEWER],
  [ROLES.VIEWER]: [],
  [ROLES.AUDITOR]: [ROLES.VIEWER],
};

/**
 * 역할 메타데이터
 */
export const ROLE_METADATA: Record<
  Role,
  {
    label: string;
    description: string;
    level: number; // 숫자가 낮을수록 높은 권한
  }
> = {
  [ROLES.SUPER_ADMIN]: {
    label: '슈퍼 관리자',
    description: '시스템 전체 관리 권한',
    level: 0,
  },
  [ROLES.COMPANY_ADMIN]: {
    label: '회사 관리자',
    description: '회사 수준 사용자 및 설정 관리',
    level: 1,
  },
  [ROLES.RISK_MANAGER]: {
    label: '리스크 관리자',
    description: '리스크 모니터링 및 주문 제한 설정',
    level: 2,
  },
  [ROLES.TRADER]: {
    label: '트레이더',
    description: '거래 실행 및 포지션 관리',
    level: 3,
  },
  [ROLES.ANALYST]: {
    label: '애널리스트',
    description: '시장 분석 및 리포트 생성',
    level: 3,
  },
  [ROLES.AUDITOR]: {
    label: '감사자',
    description: '감사 로그 및 보고서 접근',
    level: 3,
  },
  [ROLES.VIEWER]: {
    label: '뷰어',
    description: '읽기 전용 접근',
    level: 4,
  },
};

// ============================================================================
// 액션 (Actions) - CRUD 및 트레이딩 특화 액션
// ============================================================================

export const ACTIONS = {
  // 기본 CRUD
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  // 관리 액션
  MANAGE: 'manage', // 모든 액션 (CASL 와일드카드)
  // 트레이딩 특화 액션
  EXECUTE: 'execute', // 거래 실행
  CANCEL: 'cancel', // 주문 취소
  MODIFY: 'modify', // 주문 수정
  APPROVE: 'approve', // 승인
  REJECT: 'reject', // 거부
  EXPORT: 'export', // 내보내기
  IMPORT: 'import', // 가져오기
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

// ============================================================================
// 리소스 (Subjects) - 트레이딩 시스템 리소스
// ============================================================================

export const SUBJECTS = {
  // 사용자 관리
  USER: 'User',
  ROLE: 'Role',
  PERMISSION: 'Permission',
  // 거래 관련
  ORDER: 'Order',
  POSITION: 'Position',
  TRADE: 'Trade',
  // 자산 관리
  ACCOUNT: 'Account',
  PORTFOLIO: 'Portfolio',
  ASSET: 'Asset',
  // 시장 데이터
  MARKET_DATA: 'MarketData',
  CHART: 'Chart',
  ALERT: 'Alert',
  // 리스크 관리
  RISK_LIMIT: 'RiskLimit',
  RISK_REPORT: 'RiskReport',
  // 분석 및 리포트
  ANALYSIS: 'Analysis',
  REPORT: 'Report',
  // 시스템
  SETTINGS: 'Settings',
  AUDIT_LOG: 'AuditLog',
  API_KEY: 'ApiKey',
  // 전체 (CASL 와일드카드)
  ALL: 'all',
} as const;

export type Subject = (typeof SUBJECTS)[keyof typeof SUBJECTS];

// ============================================================================
// 사용자 (User) 타입
// ============================================================================

/**
 * 사용자 기본 정보
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  role: Role;
  companyId?: string;
  /** 추가 권한 (역할 외 개별 부여) */
  additionalPermissions?: Permission[];
  /** 제한된 권한 (역할에서 차감) */
  restrictedPermissions?: Permission[];
  /** 계정 상태 */
  status: UserStatus;
  /** 마지막 로그인 시간 */
  lastLoginAt?: Date;
  /** 생성 시간 */
  createdAt: Date;
  /** 업데이트 시간 */
  updatedAt: Date;
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * 세션 정보
 */
export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

// ============================================================================
// 권한 (Permission) 타입
// ============================================================================

/**
 * 권한 정의
 */
export interface Permission {
  /** 액션 */
  action: Action;
  /** 대상 리소스 */
  subject: Subject;
  /** 조건 (ABAC) */
  conditions?: PermissionConditions;
  /** 필드 제한 */
  fields?: string[];
  /** 권한 부여 여부 (true: 허용, false: 거부) */
  inverted?: boolean;
  /** 이유/설명 */
  reason?: string;
}

/**
 * 권한 조건 (ABAC - Attribute-Based Access Control)
 */
export interface PermissionConditions {
  /** 본인 소유 리소스만 */
  isOwner?: boolean;
  /** 같은 회사 소속만 */
  sameCompany?: boolean;
  /** 특정 계정만 */
  accountIds?: string[];
  /** 금액 제한 */
  maxAmount?: number;
  /** 특정 상태만 */
  status?: string[];
  /** 시간 제한 */
  timeWindow?: {
    start: string; // HH:mm 형식
    end: string;
  };
  /** 커스텀 조건 */
  [key: string]: unknown;
}

// ============================================================================
// 권한 팩 (서버 → 클라이언트 전송용)
// ============================================================================

/**
 * CASL 규칙의 직렬화된 형태
 */
export interface PackedRule {
  action: Action | Action[];
  subject: Subject | Subject[];
  fields?: string[];
  conditions?: PermissionConditions;
  inverted?: boolean;
  reason?: string;
}

/**
 * 클라이언트로 전송되는 권한 정보
 */
export interface PackedPermissions {
  rules: PackedRule[];
  role: Role;
  userId: string;
}

// ============================================================================
// 인증 상태
// ============================================================================

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
}

// ============================================================================
// 인증 에러
// ============================================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'TOKEN_EXPIRED'
  | 'REFRESH_TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'USER_NOT_FOUND'
  | 'USER_SUSPENDED'
  | 'USER_INACTIVE'
  | 'INVALID_TOKEN'
  | 'MISSING_TOKEN';

// ============================================================================
// 유틸리티 타입
// ============================================================================

/**
 * 역할이 다른 역할보다 높은 권한을 가지는지 확인
 */
export function hasHigherRole(role: Role, targetRole: Role): boolean {
  const roleLevel = ROLE_METADATA[role].level;
  const targetLevel = ROLE_METADATA[targetRole].level;
  return roleLevel < targetLevel;
}

/**
 * 역할이 다른 역할과 같거나 높은 권한을 가지는지 확인
 */
export function hasEqualOrHigherRole(role: Role, targetRole: Role): boolean {
  const roleLevel = ROLE_METADATA[role].level;
  const targetLevel = ROLE_METADATA[targetRole].level;
  return roleLevel <= targetLevel;
}

/**
 * 역할이 상속하는 모든 역할 목록 반환
 */
export function getInheritedRoles(role: Role): Role[] {
  const inherited: Role[] = [role];
  const toProcess = [...ROLE_HIERARCHY[role]];

  while (toProcess.length > 0) {
    const current = toProcess.pop()!;
    if (!inherited.includes(current)) {
      inherited.push(current);
      toProcess.push(...ROLE_HIERARCHY[current]);
    }
  }

  return inherited;
}
