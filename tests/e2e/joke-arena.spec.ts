import { test, expect } from "@playwright/test";

test.describe("Joke Arena happy path", () => {
  test("user can pick a setup, watch three jokes stream, vote, and see reveal", async ({
    page,
  }) => {
    await page.goto("/jokes");
    await expect(
      page.getByRole("heading", { name: "Joke Arena", level: 1 }),
    ).toBeVisible();

    // Borrow a curated setup instead of typing one.
    await page.getByRole("button", { name: /walk into a bar/i }).click();
    await expect(page.getByPlaceholder(/joke setup/i)).toHaveValue(/walk into a bar/i);

    await page.getByRole("button", { name: /generate jokes/i }).click();

    await expect(page.getByText("Joke A", { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText(/all three comics have delivered/i),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /Joke B/i }).first().click();
    await page.getByRole("button", { name: /Vote for Joke B/i }).click();

    await expect(page.getByText(/You picked/i)).toBeVisible({ timeout: 10_000 });
    const tryAgain = page.getByRole("link", { name: /Try another prompt/i });
    await expect(tryAgain).toHaveAttribute("href", "/jokes");
  });
});
