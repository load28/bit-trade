"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 실시간 데이터 요구사항:
        // 1. 사용하지 않는 쿼리는 즉시 메모리에서 삭제
        gcTime: 0,

        // 2. stale 상태를 사용하지 않음 (암시적 refetch 방지)
        //    데이터는 항상 fresh 상태로 유지되며, 명시적으로만 갱신
        staleTime: Infinity,

        // 3. 모든 자동 refetch 비활성화 - 명시적 갱신만 허용
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,

        // 4. 자동 재시도 비활성화 - 실시간 데이터는 즉시 실패 처리
        retry: false,
      },
      mutations: {
        // mutation도 자동 재시도 비활성화
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  // 서버 사이드: 항상 새로운 QueryClient 생성
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  // 클라이언트 사이드: 싱글톤 패턴으로 QueryClient 재사용
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
