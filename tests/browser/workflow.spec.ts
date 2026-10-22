import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const summary = "What happened at home?";
const checkin = "Help me check in with someone at home.";
const unknown = "What do we know, and what is still unknown?";
async function openDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("ai-mode")).toHaveText(
    "Scripted demo — AI not connected",
  );
}
const inbox = (page: Page) =>
  page.getByRole("region", { name: "Simulated inbox", exact: true });

test("no-key empty state and complete reviewed scripted workflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openDemo(page);
  await expect(page.getByText("Your timeline starts here.")).toBeVisible();
  await expect(
    page.getByText("Alexa+ experience simulation", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo data only — no real devices connected", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/desktop-empty.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Simulate doorbell", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Doorbell rang" }),
  ).toBeVisible();
  await expect(page.getByText("Asia/Bangkok", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: summary, exact: true }).click();
  await expect(
    page.getByText("Read 1 recent event", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Haven" }).last(),
  ).toContainText("Doorbell rang at Front door");
  await page.getByRole("button", { name: checkin, exact: true }).click();
  await expect(page.getByLabel("Edit your message")).toBeVisible();
  await expect(inbox(page)).toContainText("No messages yet.");
  await page
    .getByLabel("Edit your message")
    .fill("Hi, thinking of you! How is your afternoon going?");
  await page.screenshot({
    path: "docs/evidence/desktop-review.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Confirm simulated send", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(inbox(page).getByRole("listitem")).toHaveCount(1);
  await expect(inbox(page)).toContainText(
    "Hi, thinking of you! How is your afternoon going?",
  );
  await expect(
    page.getByText("Added to simulated inbox — no external message sent.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/desktop-confirmed.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("empty events and unsupported messages stay honest", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: summary, exact: true }).click();
  await expect(
    page.getByRole("article", { name: "Haven" }).last(),
  ).toContainText("No events have been simulated yet");
  await page.getByLabel("Ask Haven", { exact: true }).fill("Tell me a joke");
  await page.getByRole("button", { name: "Send question to Haven" }).click();
  await expect(
    page.getByRole("article", { name: "Haven" }).last(),
  ).toContainText("supports the three quick prompts");
  for (const button of [
    "Simulate doorbell",
    "Simulate motion",
    "Simulate device offline",
  ])
    await page.getByRole("button", { name: button, exact: true }).click();
  await page.getByRole("button", { name: unknown, exact: true }).click();
  await expect(
    page.getByRole("article", { name: "Haven" }).last(),
  ).toContainText("does not establish danger");
  await expect(
    page.getByText("Read 3 recent events", { exact: true }),
  ).toBeVisible();
});

test("blank draft validation, cancel, and reset never send", async ({
  page,
}) => {
  await openDemo(page);
  await page.getByRole("button", { name: checkin, exact: true }).click();
  await page.getByLabel("Edit your message").fill("   ");
  await expect(
    page.getByRole("button", { name: "Confirm simulated send" }),
  ).toBeDisabled();
  await expect(page.getByLabel("Edit your message")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByText("Draft cancelled.", { exact: true }),
  ).toBeVisible();
  await expect(inbox(page)).toContainText("No messages yet.");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByText("Your timeline starts here.")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByLabel("Edit your message")).toHaveCount(0);
  await expect(inbox(page)).toContainText("No messages yet.");
});

test("reset cancels a pending response and prevents stale drafts returning", async ({
  page,
}) => {
  await openDemo(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/chat", async (route) => {
    await gate;
    await route
      .fulfill({
        json: {
          text: "STALE RESPONSE",
          activity: [],
          draft: {
            id: crypto.randomUUID(),
            recipient: "Household member",
            message: "Stale draft",
            status: "draft",
          },
        },
      })
      .catch(() => {});
  });
  await page.getByRole("button", { name: checkin, exact: true }).click();
  await expect(
    page.getByText("Reading the current demo events…"),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/desktop-loading.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  release();
  await page.waitForTimeout(200);
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByText("STALE RESPONSE")).toHaveCount(0);
  await expect(page.getByLabel("Edit your message")).toHaveCount(0);
  await expect(page.getByText("Start with what you know.")).toBeVisible();
});

test("failed scripted request can retry with fresh events and no duplicate user message", async ({
  page,
}) => {
  await openDemo(page);
  let first = true;
  await page.route("**/api/chat", async (route) => {
    if (first) {
      first = false;
      await route.fulfill({
        status: 503,
        json: { error: "The demo server is temporarily unavailable." },
      });
    } else await route.continue();
  });
  await page.getByRole("button", { name: summary, exact: true }).click();
  await expect(
    page.getByRole("alert", { name: "Request error" }),
  ).toContainText("Reply unavailable");
  await page
    .getByRole("button", { name: "Simulate motion", exact: true })
    .click();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByText("Read 1 recent event", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "You", exact: true }),
  ).toHaveCount(1);
});

test("live failure shows AI unavailable and requires an explicit scripted choice", async ({
  page,
}) => {
  await page.route("**/api/status", (route) =>
    route.fulfill({ json: { liveConfigured: true } }),
  );
  await page.route("**/api/chat", (route) => {
    const body = route.request().postDataJSON();
    if (body.mode === "live")
      return route.fulfill({
        status: 503,
        json: {
          error: "Live AI could not complete this request. Nothing was sent.",
        },
      });
    return route.continue();
  });
  await page.goto("/");
  await expect(page.getByTestId("ai-mode")).toHaveText("Live AI");
  await page.getByRole("button", { name: summary, exact: true }).click();
  await expect(page.getByTestId("ai-mode")).toHaveText("AI unavailable");
  await expect(
    page.getByRole("alert", { name: "Request error" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/desktop-ai-unavailable.png",
    fullPage: true,
  });
  await expect(page.getByRole("article", { name: "Haven" })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Use Scripted demo", exact: true })
    .click();
  await expect(page.getByTestId("ai-mode")).toHaveText(
    "Scripted demo — AI not connected",
  );
  await page.getByRole("button", { name: summary, exact: true }).click();
  await expect(page.getByRole("article", { name: "Haven" })).toContainText(
    "No events",
  );
});

test("separate browser tabs have no shared event or inbox state", async ({
  page,
  context,
}) => {
  await openDemo(page);
  await page
    .getByRole("button", { name: "Simulate doorbell", exact: true })
    .click();
  const other = await context.newPage();
  await openDemo(other);
  await expect(other.getByText("Your timeline starts here.")).toBeVisible();
  await expect(inbox(other)).toContainText("No messages yet.");
  await other.close();
});

test("keyboard controls expose focus and support the full confirmation path", async ({
  page,
}) => {
  await openDemo(page);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  const doorbell = page.getByRole("button", {
    name: "Simulate doorbell",
    exact: true,
  });
  await expect(doorbell).toBeFocused();
  expect(
    await doorbell.evaluate((node) => getComputedStyle(node).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Doorbell rang" }),
  ).toBeVisible();
  const prompt = page.getByRole("button", { name: checkin, exact: true });
  await prompt.focus();
  await page.keyboard.press("Enter");
  const edit = page.getByLabel("Edit your message");
  await edit.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Checking in with you today.");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Confirm simulated send" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(inbox(page).getByRole("listitem")).toHaveCount(1);
});

test("mobile layouts avoid horizontal overflow in empty, draft, and confirmed states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  const noOverflow = async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  await noOverflow();
  await page.screenshot({
    path: "docs/evidence/mobile-empty.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Simulate doorbell", exact: true })
    .click();
  await page.getByRole("button", { name: checkin, exact: true }).click();
  await expect(page.getByLabel("Edit your message")).toBeVisible();
  await page.getByLabel("Edit your message").fill("X".repeat(600));
  await noOverflow();
  await page.getByRole("button", { name: "Confirm simulated send" }).click();
  await expect(inbox(page).getByRole("listitem")).toHaveCount(1);
  await noOverflow();
  await page.screenshot({
    path: "docs/evidence/mobile-confirmed.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 640 });
  await noOverflow();
});

test("WCAG automated checks pass for empty and editable-draft states", async ({
  page,
}) => {
  await openDemo(page);
  const scan = () =>
    new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
  expect((await scan()).violations).toEqual([]);
  await page.getByRole("button", { name: checkin, exact: true }).click();
  await expect(page.getByLabel("Edit your message")).toBeVisible();
  expect((await scan()).violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .getByRole("button", { name: "Confirm simulated send" })
      .evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0s");
});

test("API validates payload limits, origins, content types, and missing credentials", async ({
  request,
}) => {
  const body = {
    message: summary,
    mode: "scripted",
    events: [],
    history: [],
    timeZone: "UTC",
  };
  expect(
    (
      await request.post("/api/chat", { data: { ...body, message: " " } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/chat", {
        data: { ...body, message: "x".repeat(128001) },
      })
    ).status(),
  ).toBe(413);
  expect(
    (
      await request.post("/api/chat", {
        data: body,
        headers: { Origin: "https://other.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/chat", {
        data: "hello",
        headers: { "Content-Type": "text/plain" },
      })
    ).status(),
  ).toBe(415);
  const live = await request.post("/api/chat", {
    data: { ...body, mode: "live" },
  });
  expect(live.status()).toBe(503);
  expect((await live.json()).code).toBe("AI_UNAVAILABLE");
  expect(await (await request.get("/api/status")).json()).toEqual({
    liveConfigured: false,
  });
});
