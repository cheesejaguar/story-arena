import { describe, it, expect, vi, beforeEach } from "vitest";

const memory: { existing: unknown; votes: unknown[] } = { existing: null, votes: [] };

vi.mock("@/lib/db/queries", () => ({
  findExistingVote: vi.fn(async () => memory.existing),
  insertVote: vi.fn(async (v) => {
    memory.votes.push(v);
    return v;
  }),
  getRunWithOutputs: vi.fn(async () => ({
    run: { id: "r1", status: "complete" },
    outputs: [
      { slotLabel: "A", modelSlug: "openai/gpt-5.4" },
      { slotLabel: "B", modelSlug: "anthropic/claude-opus-4.6" },
      { slotLabel: "C", modelSlug: "google/gemini-3.1-pro-preview" },
    ],
  })),
}));

vi.mock("@/lib/security/session", () => ({
  getOrCreateSessionId: async () => "sess1",
}));

vi.mock("@/lib/security/rate-limit", () => ({
  voteLimiter: { limit: async () => ({ success: true }) },
}));

import { POST } from "@/app/api/votes/route";

describe("POST /api/votes", () => {
  beforeEach(() => {
    memory.existing = null;
    memory.votes = [];
    vi.clearAllMocks();
  });

  it("records the vote and returns reveal mapping", async () => {
    const res = await POST(
      new Request("http://test/api/votes", {
        method: "POST",
        body: JSON.stringify({
          runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          chosenSlot: "B",
          timeToVoteMs: 5000,
          allStoriesViewed: true,
        }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.reveal).toEqual({
      A: "openai/gpt-5.4",
      B: "anthropic/claude-opus-4.6",
      C: "google/gemini-3.1-pro-preview",
    });
    expect(memory.votes).toHaveLength(1);
    expect((memory.votes[0] as { chosenModelSlug: string }).chosenModelSlug).toBe(
      "anthropic/claude-opus-4.6",
    );
    expect((memory.votes[0] as { chosenSlot: string }).chosenSlot).toBe("B");
  });

  it("rejects duplicate votes (app-level dedup)", async () => {
    memory.existing = { id: "v1" };
    const res = await POST(
      new Request("http://test/api/votes", {
        method: "POST",
        body: JSON.stringify({
          runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          chosenSlot: "A",
          timeToVoteMs: 1000,
          allStoriesViewed: true,
        }),
      }),
    );
    expect(res.status).toBe(409);
    expect(memory.votes).toHaveLength(0);
  });

  it("rejects invalid slot (not in run.outputs)", async () => {
    // Mock returns only slots A, B, C — but our schema also only allows A/B/C
    // so this scenario is unreachable through schema. Instead, simulate by
    // overriding getRunWithOutputs for this test to return only A and C.
    const { getRunWithOutputs } = await import("@/lib/db/queries");
    (getRunWithOutputs as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      run: { id: "r1", status: "complete" },
      outputs: [
        { slotLabel: "A", modelSlug: "openai/gpt-5.4" },
        { slotLabel: "C", modelSlug: "google/gemini-3.1-pro-preview" },
      ],
    });
    const res = await POST(
      new Request("http://test/api/votes", {
        method: "POST",
        body: JSON.stringify({
          runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          chosenSlot: "B",
          timeToVoteMs: 1000,
          allStoriesViewed: true,
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect(memory.votes).toHaveLength(0);
  });

  it("returns 404 when run does not exist", async () => {
    const { getRunWithOutputs } = await import("@/lib/db/queries");
    (getRunWithOutputs as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = await POST(
      new Request("http://test/api/votes", {
        method: "POST",
        body: JSON.stringify({
          runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          chosenSlot: "A",
          timeToVoteMs: 1000,
          allStoriesViewed: true,
        }),
      }),
    );
    expect(res.status).toBe(404);
    expect(memory.votes).toHaveLength(0);
  });

  it("returns 400 on invalid JSON body", async () => {
    const res = await POST(
      new Request("http://test/api/votes", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 on payload that fails zod validation", async () => {
    const res = await POST(
      new Request("http://test/api/votes", {
        method: "POST",
        body: JSON.stringify({ runId: "not-a-uuid", chosenSlot: "X" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate-limited", async () => {
    const { voteLimiter } = await import("@/lib/security/rate-limit");
    (voteLimiter.limit as unknown as ReturnType<typeof vi.fn>) = vi.fn(async () => ({
      success: false,
    }));
    const res = await POST(
      new Request("http://test/api/votes", {
        method: "POST",
        body: JSON.stringify({
          runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          chosenSlot: "A",
          timeToVoteMs: 1000,
          allStoriesViewed: true,
        }),
      }),
    );
    expect(res.status).toBe(429);
    // Restore for other tests:
    (voteLimiter.limit as unknown as ReturnType<typeof vi.fn>) = vi.fn(async () => ({
      success: true,
    }));
  });
});
