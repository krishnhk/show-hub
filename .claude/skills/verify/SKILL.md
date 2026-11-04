---
name: verify
description: How to build, launch and drive the ThiraiHub Angular client in a real browser to verify a change.
---

# Verifying ThiraiHub

The app is `client/` (Angular, in-memory mock API, no backend). Surface = the browser.

## Build and serve

1. `cd client && npx ng build` (output: `client/dist/task-manager/browser`).
2. Serve that folder with any static server that falls back to `index.html` for unknown paths
   (a ten-line `http.createServer` works). `ng serve` also works on port 4200.

## Drive it

- Use `puppeteer-core` with the installed Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`),
  `headless: 'new'`. Keep the harness outside the repo.
- Sign in as the demo user without the OTP screen: before load, run
  `localStorage.setItem('thiraihub_token', btoa('thiraihub:1:' + Date.now()))` (`evaluateOnNewDocument`).
  User 1 is Mad Monkey. For a real OTP flow the code is always `123456`.
- Chennai is the only city, so the city picker never shows.
- After a click, wait 300 ms before typing or reading: Angular renders on the next tick.
- A new `browser.createBrowserContext()` gives a signed-out session.

## Flows worth driving

Home (featured film, next-show pill and slides) · Movies > language chooser > day strip > showtime >
seats (no zoom bar, "All eyes this way" screen, 30 rupee fee per ticket) > checkout · My tickets ·
Resale (day strip, filters) · Profile (edit in place, phone/email OTP change) · Settings (themes).

## Gotchas

- The mock store lives in memory: a page reload resets every change.
- VS Code's Angular diagnostics are often stale after edits; trust `ng build`.
- Seed dates are relative to today, so counts of days and shows move from day to day.
- A saved theme is applied by `ThemeService`, which `App` injects at startup. Do not remove that.
