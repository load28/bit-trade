/**
 * RBAC 권한 모델 정의
 * 각 역할별 권한 매핑 및 역할 기반 권한 조회
 */

import {
  ROLES,
  ACTIONS,
  SUBJECTS,
  type Role,
  type Permission,
  type Action,
  type Subject,
  getInheritedRoles,
} from './types';

// ============================================================================
// 역할별 권한 정의
// ============================================================================

/**
 * 슈퍼 관리자 권한 - 모든 리소스에 대한 모든 액션
 */
const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.ALL,
    reason: '슈퍼 관리자는 모든 권한을 보유합니다.',
  },
];

/**
 * 회사 관리자 권한
 */
const COMPANY_ADMIN_PERMISSIONS: Permission[] = [
  // 사용자 관리 (같은 회사)
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.USER,
    conditions: { sameCompany: true },
    reason: '같은 회사 사용자만 관리 가능',
  },
  // 역할 관리 (제한적)
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.ROLE,
  },
  {
    action: ACTIONS.UPDATE,
    subject: SUBJECTS.ROLE,
    conditions: { sameCompany: true },
  },
  // 계정 관리
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.ACCOUNT,
    conditions: { sameCompany: true },
  },
  // 설정 관리
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.SETTINGS,
    conditions: { sameCompany: true },
  },
  // API 키 관리
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.API_KEY,
    conditions: { sameCompany: true },
  },
  // 감사 로그 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.AUDIT_LOG,
    conditions: { sameCompany: true },
  },
];

/**
 * 리스크 관리자 권한
 */
const RISK_MANAGER_PERMISSIONS: Permission[] = [
  // 리스크 관련 전체 권한
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.RISK_LIMIT,
    conditions: { sameCompany: true },
  },
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.RISK_REPORT,
    conditions: { sameCompany: true },
  },
  // 주문 모니터링 및 취소 권한
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.ORDER,
    conditions: { sameCompany: true },
  },
  {
    action: ACTIONS.CANCEL,
    subject: SUBJECTS.ORDER,
    conditions: { sameCompany: true },
    reason: '리스크 관리 목적의 주문 취소',
  },
  // 포지션 모니터링
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.POSITION,
    conditions: { sameCompany: true },
  },
  // 거래 내역 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.TRADE,
    conditions: { sameCompany: true },
  },
  // 알림 설정
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.ALERT,
    conditions: { sameCompany: true },
  },
];

/**
 * 트레이더 권한
 */
const TRADER_PERMISSIONS: Permission[] = [
  // 주문 관리 (본인)
  {
    action: ACTIONS.CREATE,
    subject: SUBJECTS.ORDER,
    conditions: { isOwner: true },
  },
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.ORDER,
    conditions: { isOwner: true },
  },
  {
    action: ACTIONS.MODIFY,
    subject: SUBJECTS.ORDER,
    conditions: { isOwner: true },
  },
  {
    action: ACTIONS.CANCEL,
    subject: SUBJECTS.ORDER,
    conditions: { isOwner: true },
  },
  {
    action: ACTIONS.EXECUTE,
    subject: SUBJECTS.ORDER,
    conditions: { isOwner: true },
  },
  // 포지션 관리 (본인)
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.POSITION,
    conditions: { isOwner: true },
  },
  {
    action: ACTIONS.UPDATE,
    subject: SUBJECTS.POSITION,
    conditions: { isOwner: true },
  },
  // 거래 내역 조회 (본인)
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.TRADE,
    conditions: { isOwner: true },
  },
  // 포트폴리오 관리 (본인)
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.PORTFOLIO,
    conditions: { isOwner: true },
  },
  // 시장 데이터 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.MARKET_DATA,
  },
  // 차트 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.CHART,
  },
  // 알림 관리 (본인)
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.ALERT,
    conditions: { isOwner: true },
  },
];

/**
 * 애널리스트 권한
 */
const ANALYST_PERMISSIONS: Permission[] = [
  // 분석 전체 권한
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.ANALYSIS,
    conditions: { isOwner: true },
  },
  // 리포트 전체 권한
  {
    action: ACTIONS.MANAGE,
    subject: SUBJECTS.REPORT,
    conditions: { isOwner: true },
  },
  // 시장 데이터 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.MARKET_DATA,
  },
  // 차트 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.CHART,
  },
  // 주문/거래 데이터 조회 (분석용)
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.ORDER,
    conditions: { sameCompany: true },
  },
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.TRADE,
    conditions: { sameCompany: true },
  },
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.POSITION,
    conditions: { sameCompany: true },
  },
  // 내보내기 권한
  {
    action: ACTIONS.EXPORT,
    subject: SUBJECTS.REPORT,
    conditions: { isOwner: true },
  },
  {
    action: ACTIONS.EXPORT,
    subject: SUBJECTS.ANALYSIS,
    conditions: { isOwner: true },
  },
];

/**
 * 뷰어 권한 (읽기 전용)
 */
const VIEWER_PERMISSIONS: Permission[] = [
  // 시장 데이터 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.MARKET_DATA,
  },
  // 차트 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.CHART,
  },
  // 본인 정보만 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.USER,
    conditions: { isOwner: true },
  },
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.ACCOUNT,
    conditions: { isOwner: true },
  },
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.PORTFOLIO,
    conditions: { isOwner: true },
  },
];

/**
 * 감사자 권한
 */
const AUDITOR_PERMISSIONS: Permission[] = [
  // 감사 로그 전체 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.AUDIT_LOG,
    conditions: { sameCompany: true },
  },
  // 모든 리포트 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.REPORT,
    conditions: { sameCompany: true },
  },
  // 리스크 리포트 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.RISK_REPORT,
    conditions: { sameCompany: true },
  },
  // 거래 내역 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.TRADE,
    conditions: { sameCompany: true },
  },
  // 주문 내역 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.ORDER,
    conditions: { sameCompany: true },
  },
  // 사용자 정보 조회
  {
    action: ACTIONS.READ,
    subject: SUBJECTS.USER,
    conditions: { sameCompany: true },
  },
  // 내보내기 권한
  {
    action: ACTIONS.EXPORT,
    subject: SUBJECTS.AUDIT_LOG,
    conditions: { sameCompany: true },
  },
  {
    action: ACTIONS.EXPORT,
    subject: SUBJECTS.REPORT,
    conditions: { sameCompany: true },
  },
];

// ============================================================================
// 역할 → 권한 매핑
// ============================================================================

/**
 * 역할별 기본 권한 매핑
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: SUPER_ADMIN_PERMISSIONS,
  [ROLES.COMPANY_ADMIN]: COMPANY_ADMIN_PERMISSIONS,
  [ROLES.RISK_MANAGER]: RISK_MANAGER_PERMISSIONS,
  [ROLES.TRADER]: TRADER_PERMISSIONS,
  [ROLES.ANALYST]: ANALYST_PERMISSIONS,
  [ROLES.VIEWER]: VIEWER_PERMISSIONS,
  [ROLES.AUDITOR]: AUDITOR_PERMISSIONS,
};

// ============================================================================
// 권한 조회 함수
// ============================================================================

/**
 * 역할에 대한 모든 권한 조회 (상속 포함)
 */
export function getPermissionsForRole(role: Role): Permission[] {
  const inheritedRoles = getInheritedRoles(role);
  const allPermissions: Permission[] = [];

  for (const r of inheritedRoles) {
    allPermissions.push(...ROLE_PERMISSIONS[r]);
  }

  return deduplicatePermissions(allPermissions);
}

/**
 * 사용자의 최종 권한 계산
 * 역할 권한 + 추가 권한 - 제한 권한
 */
export function getUserPermissions(
  role: Role,
  additionalPermissions?: Permission[],
  restrictedPermissions?: Permission[]
): Permission[] {
  // 역할 기반 권한
  let permissions = getPermissionsForRole(role);

  // 추가 권한 적용
  if (additionalPermissions?.length) {
    permissions = [...permissions, ...additionalPermissions];
  }

  // 제한 권한 적용 (inverted = true로 추가)
  if (restrictedPermissions?.length) {
    const inverted = restrictedPermissions.map((p) => ({
      ...p,
      inverted: true,
    }));
    permissions = [...permissions, ...inverted];
  }

  return permissions;
}

/**
 * 권한 중복 제거 (같은 action + subject 조합)
 */
function deduplicatePermissions(permissions: Permission[]): Permission[] {
  const seen = new Map<string, Permission>();

  for (const permission of permissions) {
    const key = `${permission.action}:${permission.subject}`;

    // 기존 권한보다 더 넓은 권한이면 교체
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, permission);
    } else if (!permission.conditions && existing.conditions) {
      // 조건 없는 권한이 더 넓음
      seen.set(key, permission);
    }
  }

  return Array.from(seen.values());
}

// ============================================================================
// 권한 체크 헬퍼
// ============================================================================

/**
 * 특정 액션이 주어진 subject에 대해 허용되는지 확인
 */
export function hasPermission(
  permissions: Permission[],
  action: Action,
  subject: Subject
): boolean {
  // manage:all 권한 확인
  const hasFullAccess = permissions.some(
    (p) =>
      p.action === ACTIONS.MANAGE && p.subject === SUBJECTS.ALL && !p.inverted
  );

  if (hasFullAccess) return true;

  // 특정 권한 확인
  return permissions.some(
    (p) =>
      (p.action === action || p.action === ACTIONS.MANAGE) &&
      (p.subject === subject || p.subject === SUBJECTS.ALL) &&
      !p.inverted
  );
}

/**
 * 역할이 특정 액션을 수행할 수 있는지 확인
 */
export function canRolePerform(
  role: Role,
  action: Action,
  subject: Subject
): boolean {
  const permissions = getPermissionsForRole(role);
  return hasPermission(permissions, action, subject);
}
