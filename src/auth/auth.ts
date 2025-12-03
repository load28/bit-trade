/**
 * Auth.js v5 메인 설정
 * NextAuth 인스턴스 생성 및 내보내기
 */

import NextAuth from 'next-auth';
import { authConfig } from './config';

/**
 * NextAuth 인스턴스
 * - handlers: API 라우트 핸들러 (GET, POST)
 * - auth: 서버 컴포넌트/액션에서 세션 조회
 * - signIn: 프로그래매틱 로그인
 * - signOut: 프로그래매틱 로그아웃
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
