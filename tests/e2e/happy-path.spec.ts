import { test, expect } from "@playwright/test";

test.describe("Story Arena happy path", () => {
  test("user can submit a prompt, vote, and see reveal", async ({ page }) => {
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

    // 4. Wait for the compare page (mocked AI is fast)
    await page.waitForURL(/\/compare\//, { timeout: 30_000 });
    await expect(page.getByText(/Story A/i).first()).toBeVisible();
    await expect(page.getByText(/Story B/i).first()).toBeVisible();
    await expect(page.getByText(/Story C/i).first()).toBeVisible();

    // 5. Read all three so allStoriesViewed becomes true (scroll to bring each into view)
    // (On desktop the IntersectionObserver should fire for all three on initial render)

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
