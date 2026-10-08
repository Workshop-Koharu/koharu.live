import { describe, expect, it } from "vitest";
import { getAdminLoginErrorMessage } from "./apiErrors";

describe("getAdminLoginErrorMessage", () => {
  it("explains that a static Netlify site has no blog API", () => {
    const message = getAdminLoginErrorMessage("Unexpected token '<', \"<!DOCTYPE\" is not valid JSON");
    expect(message).toContain("Netlify 정적 배포");
  });

  it("keeps ordinary authentication errors readable", () => {
    expect(getAdminLoginErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다.")).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
  });
});
