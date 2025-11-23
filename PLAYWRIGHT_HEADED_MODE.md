# Running Playwright Tests in Headed Mode

The Playwright configuration has been updated to run tests in **headed mode** (visible browser window).

## Configuration Change

**File:** `frontend/playwright.config.ts`

```typescript
// Added headless: false to run browser in headed mode
use: { 
  ...devices['Desktop Chrome'],
  headless: false,  // Show browser window during tests
},
```

## How to Run Tests

### Run all Playwright tests (headed):
```bash
cd frontend
npx playwright test
```

### Run specific test file:
```bash
npx playwright test tests/example.spec.ts
```

### Run with debug mode (interactive):
```bash
npx playwright test --debug
```

### Run with UI mode (recommended for development):
```bash
npx playwright test --ui
```

## What You'll See

When you run tests now:
1. ✅ Browser window will open automatically
2. ✅ You can watch each test step execute in real-time
3. ✅ Click interactions are visible
4. ✅ Page navigation is visible
5. ✅ Screenshots/videos are captured (if configured)

## Benefits of Headed Mode

- **Visibility** - See exactly what the tests are doing
- **Debugging** - Pause and inspect page state
- **Verification** - Confirm visual behavior during automation
- **Development** - Test new features while watching

## Reverting to Headless Mode

If you need to run tests headless (faster CI/CD):
1. Set `headless: true` in `playwright.config.ts`
2. Or run with: `npx playwright test --headed=false`

## Notes

- Tests run slower in headed mode (browser rendering overhead)
- Ideal for development and debugging
- Use headless mode for CI/CD pipelines
- Browser window will close after tests complete
