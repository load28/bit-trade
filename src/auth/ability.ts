/**
 * CASL Ability 정의
 * 권한 체크를 위한 Ability 빌더 및 유틸리티
 */

import {
  AbilityBuilder,
  PureAbility,
  AbilityClass,
} from '@casl/ability';
import { packRules, unpackRules } from '@casl/ability/extra';
import type {
  User,
  Role,
  Action,
  Subject,
  PackedRule,
  PermissionConditions,
} from './types';
import { ACTIONS, SUBJECTS } from './types';
import { getUserPermissions } from './permissions';

// ============================================================================
// CASL 타입 정의
// ============================================================================

/**
 * 앱 Ability 타입
 * PureAbility를 사용하여 타입 복잡성 감소
 */
export type AppAbility = PureAbility<[Action, Subject]>;

/**
 * Ability 클래스 타입
 */
const AppAbilityClass = PureAbility as AbilityClass<AppAbility>;

/**
 * CASL Subject 타입 (런타임 체크용)
 */
export type AppSubjects = Subject | 'all';

// ============================================================================
// Ability 빌더
// ============================================================================

/**
 * 사용자 기반 Ability 생성
 */
export function defineAbilityFor(user: User | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder(AppAbilityClass);

  if (!user) {
    // 미인증 사용자: 권한 없음
    return build({
      conditionsMatcher: (matchConditions) => matchConditions,
    });
  }

  // 사용자 권한 계산
  const permissions = getUserPermissions(
    user.role,
    user.additionalPermissions,
    user.restrictedPermissions
  );

  // 각 권한을 CASL 규칙으로 변환
  for (const permission of permissions) {
    const { action, subject, conditions, fields, inverted } = permission;

    // 조건 변환
    const caslConditions = conditions
      ? convertConditions(conditions, user)
      : undefined;

    if (inverted) {
      // 거부 규칙
      if (fields?.length && caslConditions) {
        cannot(action, subject, fields, caslConditions);
      } else if (fields?.length) {
        cannot(action, subject, fields);
      } else if (caslConditions) {
        cannot(action, subject, caslConditions);
      } else {
        cannot(action, subject);
      }
    } else {
      // 허용 규칙
      if (fields?.length && caslConditions) {
        can(action, subject, fields, caslConditions);
      } else if (fields?.length) {
        can(action, subject, fields);
      } else if (caslConditions) {
        can(action, subject, caslConditions);
      } else {
        can(action, subject);
      }
    }
  }

  return build({
    conditionsMatcher: (matchConditions) => matchConditions,
  });
}

/**
 * 권한 조건을 CASL 조건으로 변환
 */
function convertConditions(
  conditions: PermissionConditions,
  user: User
): Record<string, unknown> {
  const caslConditions: Record<string, unknown> = {};

  // 본인 소유 리소스
  if (conditions.isOwner) {
    caslConditions['userId'] = user.id;
  }

  // 같은 회사
  if (conditions.sameCompany && user.companyId) {
    caslConditions['companyId'] = user.companyId;
  }

  // 특정 계정
  if (conditions.accountIds?.length) {
    caslConditions['accountId'] = { $in: conditions.accountIds };
  }

  // 특정 상태
  if (conditions.status?.length) {
    caslConditions['status'] = { $in: conditions.status };
  }

  return caslConditions;
}

// ============================================================================
// 규칙 직렬화 (서버 → 클라이언트)
// ============================================================================

/**
 * Ability 규칙을 클라이언트 전송용으로 패킹
 */
export function packAbilityRules(ability: AppAbility): PackedRule[] {
  return packRules(ability.rules) as unknown as PackedRule[];
}

/**
 * 패킹된 규칙에서 Ability 복원
 */
export function unpackAbilityRules(packedRules: PackedRule[]): AppAbility {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rules = unpackRules(packedRules as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new AppAbilityClass(rules as any);
}

// ============================================================================
// 권한 체크 헬퍼
// ============================================================================

/**
 * 빈 Ability 생성 (미인증 상태용)
 */
export function createEmptyAbility(): AppAbility {
  return new AppAbilityClass([]);
}

/**
 * 게스트 Ability 생성 (공개 리소스만 접근 가능)
 */
export function createGuestAbility(): AppAbility {
  const { can, build } = new AbilityBuilder(AppAbilityClass);

  // 게스트는 시장 데이터와 차트만 조회 가능
  can(ACTIONS.READ, SUBJECTS.MARKET_DATA);
  can(ACTIONS.READ, SUBJECTS.CHART);

  return build({
    conditionsMatcher: (matchConditions) => matchConditions,
  });
}

/**
 * 특정 역할의 기본 Ability 생성
 */
export function createAbilityForRole(role: Role): AppAbility {
  const mockUser: User = {
    id: 'mock',
    email: 'mock@example.com',
    name: 'Mock User',
    role,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return defineAbilityFor(mockUser);
}

// ============================================================================
// 권한 검증 유틸리티
// ============================================================================

/**
 * 여러 권한 중 하나라도 만족하는지 확인
 */
export function canAny(
  ability: AppAbility,
  checks: Array<{ action: Action; subject: Subject }>
): boolean {
  return checks.some(({ action, subject }) => ability.can(action, subject));
}

/**
 * 여러 권한 모두 만족하는지 확인
 */
export function canAll(
  ability: AppAbility,
  checks: Array<{ action: Action; subject: Subject }>
): boolean {
  return checks.every(({ action, subject }) => ability.can(action, subject));
}

/**
 * 특정 리소스에 대한 허용된 액션 목록 반환
 */
export function getAllowedActions(
  ability: AppAbility,
  subject: Subject
): Action[] {
  const allActions = Object.values(ACTIONS);
  return allActions.filter((action) => ability.can(action, subject));
}

/**
 * 사용자가 접근 가능한 리소스 목록 반환
 */
export function getAccessibleSubjects(
  ability: AppAbility,
  action: Action = ACTIONS.READ
): Subject[] {
  const allSubjects = Object.values(SUBJECTS);
  return allSubjects.filter((subject) => ability.can(action, subject));
}

// ============================================================================
// 권한 에러
// ============================================================================

export class ForbiddenError extends Error {
  constructor(
    public action: Action,
    public subject: Subject,
    message?: string
  ) {
    super(
      message ||
        `'${action}' 액션을 '${subject}' 리소스에 대해 수행할 권한이 없습니다.`
    );
    this.name = 'ForbiddenError';
  }
}

/**
 * 권한 검증 후 에러 throw
 */
export function assertCan(
  ability: AppAbility,
  action: Action,
  subject: Subject,
  message?: string
): void {
  if (!ability.can(action, subject)) {
    throw new ForbiddenError(action, subject, message);
  }
}
