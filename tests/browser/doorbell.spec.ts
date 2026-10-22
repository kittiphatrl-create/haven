import { expect, test } from "@playwright/test";

test("doorbell renders both chimes only after a click and reset stops playback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeContext = window.AudioContext;
    const probe = {
      contexts: [] as AudioContext[],
      firstPeak: 0,
      secondPeak: 0,
    };
    Object.assign(window, { doorbellProbe: probe });
    window.AudioContext = new Proxy(NativeContext, {
      construct(Target, args) {
        const context = new Target(...args);
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyser.connect(context.destination);
        Object.defineProperty(context, "destination", { get: () => analyser });
        probe.contexts.push(context);
        const samples = new Float32Array(analyser.fftSize);
        const timer = setInterval(() => {
          if (context.state === "closed") {
            clearInterval(timer);
            return;
          }
          analyser.getFloatTimeDomainData(samples);
          const peak = samples.reduce(
            (max, value) => Math.max(max, Math.abs(value)),
            0,
          );
          if (context.currentTime > 0.03 && context.currentTime < 0.3)
            probe.firstPeak = Math.max(probe.firstPeak, peak);
          if (context.currentTime > 0.65 && context.currentTime < 0.9)
            probe.secondPeak = Math.max(probe.secondPeak, peak);
        }, 15);
        return context;
      },
    });
  });
  await page.goto("/");
  await expect(page.getByTestId("ai-mode")).toContainText("Scripted demo");
  const probe = () =>
    page.evaluate(() => {
      const audio = (
        window as unknown as {
          doorbellProbe: {
            contexts: AudioContext[];
            firstPeak: number;
            secondPeak: number;
          };
        }
      ).doorbellProbe;
      return {
        count: audio.contexts.length,
        first: audio.firstPeak,
        second: audio.secondPeak,
        states: audio.contexts.map((context) => context.state),
      };
    });
  expect((await probe()).count).toBe(0);
  await page
    .getByRole("button", { name: "Simulate motion", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simulate device offline", exact: true })
    .click();
  expect((await probe()).count).toBe(0);
  await page
    .getByRole("button", { name: "Simulate doorbell", exact: true })
    .click();
  await expect.poll(async () => (await probe()).first).toBeGreaterThan(0.02);
  await expect.poll(async () => (await probe()).second).toBeGreaterThan(0.02);
  await expect(
    page.getByRole("heading", { name: "Doorbell rang" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect.poll(async () => (await probe()).states).toEqual(["closed"]);
});

test("event simulation still works if browser audio is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.AudioContext = new Proxy(window.AudioContext, {
      construct() {
        throw new Error("Audio unavailable");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Simulate doorbell", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Doorbell rang" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
