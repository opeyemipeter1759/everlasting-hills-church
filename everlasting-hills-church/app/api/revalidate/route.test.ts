import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);

import { POST } from "./route";

const originalSecret = process.env.CMS_REVALIDATE_SECRET;

function request(secret: string, body: unknown) {
  return new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-revalidate-secret": secret,
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CMS_REVALIDATE_SECRET;
  else process.env.CMS_REVALIDATE_SECRET = originalSecret;
  vi.clearAllMocks();
});

describe("POST /api/revalidate", () => {
  it("fails closed when the dedicated secret is not configured", async () => {
    delete process.env.CMS_REVALIDATE_SECRET;

    const response = await POST(request("ehc-cms-revalidate", {}));

    expect(response.status).toBe(503);
    expect(cacheMocks.revalidatePath).not.toHaveBeenCalled();
    expect(cacheMocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("accepts the configured secret and ignores unsafe cache keys", async () => {
    process.env.CMS_REVALIDATE_SECRET = "a-long-independent-secret";

    const response = await POST(request("a-long-independent-secret", {
      tags: ["homepage", "", 42],
      paths: ["/sermons", "https://example.com", "//example.com", 42],
    }));

    expect(response.status).toBe(200);
    expect(cacheMocks.revalidateTag).toHaveBeenCalledOnce();
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith("homepage");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledOnce();
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/sermons");
  });
});
