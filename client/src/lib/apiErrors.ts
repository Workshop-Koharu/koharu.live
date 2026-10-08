export function getAdminLoginErrorMessage(message: string): string {
  if (message.includes("Unexpected token") || message.includes("API_UNAVAILABLE") || message.includes("Failed to fetch")) {
    return "블로그 서버에 연결되지 않았어요. Netlify 정적 배포에서는 관리자 API를 사용할 수 없습니다.";
  }
  return message;
}
