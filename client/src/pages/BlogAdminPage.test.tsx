import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminLoginErrorNotice } from "./BlogAdminPage";

describe("AdminLoginErrorNotice", () => {
  it("renders a visible alert for a static Netlify API response", () => {
    const html = renderToStaticMarkup(<AdminLoginErrorNotice message={'Unexpected token \'<\', "<!DOCTYPE" is not valid JSON'} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Netlify 정적 배포");
  });
});
