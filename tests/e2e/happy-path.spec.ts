import { test, expect } from "@playwright/test";

test.describe("Story Arena happy path", () => {
  test("user can submit a prompt, watch live streams, vote, and see reveal", async ({
    page,
  }) => {
    // 1. Land on homepage
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Story Arena", level: 1 }),
    ).toBeVisible();

    // 2. Type a prompt
    await page
      .getByPlaceholder(/Write a fictional prompt/i)
      .fill("Write a story about a lighthouse keeper at the edge of the world.");

    // 3. Submit
    await page.getByRole("button", { name: /generate stories/i }).click();

    // 4. Streaming view appears in-place (no navigation). Wait for all 3
    //    story headers to render as the stream opens.
    await expect(page.getByText("Story A", { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Story B", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Story C", { exact: false }).first()).toBeVisible();

    // 5. Wait for the run to finish streaming — the status line flips to
    //    "All three pens have finished" when the done event arrives.
    await expect(
      page.getByText(/all three pens have finished/i),
    ).toBeVisible({ timeout: 30_000 });

    // 6. Click Story B to select it
    await page.getByRole("button", { name: /Story B/i }).first().click();

    // 7. Submit vote
    await page.getByRole("button", { name: /Vote for Story B/i }).click();

    // 8. Reveal panel appears
    await expect(page.getByText(/Thanks for voting/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/You picked/i)).toBeVisible();

    // 9. Try-another link is present and points home
    const tryAgain = page.getByRole("link", { name: /Try another prompt/i });
    await expect(tryAgain).toBeVisible();
    await expect(tryAgain).toHaveAttribute("href", "/");
  });
});
