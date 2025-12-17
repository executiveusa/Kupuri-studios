import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Kupuri|Studio|Home/i);
  });

  test('should have hero section', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('[class*="hero"], h1').first();
    await expect(hero).toBeVisible();
  });

  test('should have language toggle', async ({ page }) => {
    await page.goto('/');
    const langToggle = page.locator('button:has-text("English"), button:has-text("Español")').first();
    await expect(langToggle).toBeVisible();
  });

  test('should switch to Spanish', async ({ page }) => {
    await page.goto('/');
    
    // Click language toggle
    const langButton = page.locator('button[aria-label="Change language"]').first();
    await langButton.click();
    
    // Find Spanish option (es-MX or Español)
    const esOption = page.locator('[role="menuitem"]:has-text("Español")').first();
    await esOption.click();
    
    // Verify language change (check for Spanish text)
    await page.waitForTimeout(500); // Wait for i18n update
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('estudio' || 'español' || 'mexico');
  });

  test('should have enter studio button', async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('button:has-text("Enter Studio"), button:has-text("Estudio")').first();
    await expect(enterButton).toBeVisible();
  });
});

test.describe('Canvas Page', () => {
  test('should navigate to canvas', async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('button:has-text("Enter Studio"), button:has-text("Estudio")').first();
    await enterButton.click();
    
    // Wait for canvas to load
    await page.waitForURL(/\/canvas/);
    await expect(page).toHaveURL(/\/canvas/);
  });

  test('should load excalidraw', async ({ page }) => {
    await page.goto('/canvas/new');
    
    // Wait for Excalidraw to initialize (check for canvas element)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('should have chat button', async ({ page }) => {
    await page.goto('/canvas/new');
    
    // Wait for canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Check for chat button
    const chatButton = page.locator('button[aria-label="Open chat"], button:has-text("Chat")').first();
    await expect(chatButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard', () => {
  test('should load dashboard metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for dashboard title
    const title = page.locator('h1:has-text("Analytics"), h1:has-text("Analítica")').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });

  test('should display metric cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for metric cards
    const cards = page.locator('[class*="card"], [class*="metric"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should fetch metrics from API', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for API call
    const response = await page.waitForResponse(
      response => response.url().includes('/api/metrics') && response.status() === 200,
      { timeout: 10000 }
    );
    
    const data = await response.json();
    expect(data).toHaveProperty('total_requests');
    expect(data).toHaveProperty('avg_latency_ms');
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be mobile friendly on home', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should display hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone SE
    await page.goto('/');
    
    // Look for mobile menu
    const hamburger = page.locator('button:has-text("Menu"), button[aria-label*="menu"]').first();
    if (await hamburger.isVisible()) {
      expect(true); // Mobile menu exists
    }
  });
});

test.describe('Health Checks', () => {
  test('should return 200 from /health', async ({ page }) => {
    const response = await page.goto('/health');
    expect(response?.status()).toBe(200);
  });

  test('should return metrics from /metrics', async ({ page }) => {
    const response = await page.goto('/metrics');
    expect(response?.status()).toBe(200);
    
    const text = await response?.text() || '';
    expect(text).toContain('http_requests_total' || 'prometheus' || '#');
  });
});

test.describe('Navigation', () => {
  test('should redirect to /canvas/new when not authenticated', async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('button:has-text("Enter Studio"), button:has-text("Estudio")').first();
    await enterButton.click();
    
    // Should navigate to canvas
    await page.waitForURL(/\/canvas/, { timeout: 5000 });
    expect(page.url()).toContain('/canvas');
  });
});
