import { test, expect } from '@playwright/test';

test.describe('End-to-End User Journey: Customizer, Quote Request & Order Tracking', () => {
  test('should allow user to customize product, submit quote, receive protocol, and track status live', async ({
    page,
  }) => {
    // 1. Visit Home Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Clarico Sportwear/i);

    // 2. Navigate to Customizer Studio section
    const customizerHeading = page.getByRole('heading', {
      name: /Preview Your Academy Shirts/i,
    });
    await customizerHeading.scrollIntoViewIfNeeded();
    await expect(customizerHeading).toBeVisible();

    // 3. Select Garment Color "Crimson Red"
    const crimsonColorButton = page.getByTitle('Crimson Red');
    await crimsonColorButton.click();
    await expect(page.getByText('Crimson Red')).toBeVisible();

    // 4. Click Request Quote for Custom Mockup
    const quoteButton = page.getByRole('button', {
      name: /Request Quote For This Custom Mockup/i,
    });
    await quoteButton.click();

    // 5. Verify Quote Modal is open
    const modalHeading = page.getByRole('heading', {
      name: /Create Your Gym Line/i,
    });
    await expect(modalHeading).toBeVisible();

    // 6. Fill out Quote Form
    await page
      .getByPlaceholder('e.g., Prof. Rafael Silva')
      .fill('Prof. Helio Gracie');
    await page
      .getByPlaceholder('e.g., Gracie Barra Downtown')
      .fill('Gracie Humaita Main Gym');
    await page.getByPlaceholder('rafael@academy.com').fill('helio@gracie.com');
    await page.getByPlaceholder('+1 (555) 019-2834').fill('+55 21 99999-7777');

    // 7. Apply Discount Code
    await page.getByPlaceholder('e.g. NFC2026').fill('NFC2026');
    await page.getByRole('button', { name: /^Apply$/i }).click();
    await expect(page.getByText(/Code NFC2026 applied!/i)).toBeVisible();

    // 8. Submit Quote Request
    const submitButton = page.getByRole('button', {
      name: /Submit Quote Request/i,
    });
    await submitButton.click();

    // 9. Verify Confirmation Screen & Extract Tracking Protocol Code
    const confirmationHeading = page.getByRole('heading', {
      name: /Quote Request Received!/i,
    });
    await expect(confirmationHeading).toBeVisible();

    const protocolElement = page.locator('span.text-2xl.font-black.text-red-500');
    await expect(protocolElement).toBeVisible();

    const protocolText = (await protocolElement.textContent())?.trim() || '';
    expect(protocolText).toMatch(/^CS-\d{4}-\d{4}$/);

    // 10. Close Quote Modal
    await page.getByRole('button', { name: /Close Window/i }).click();

    // 11. Open Live Track Status Modal from Navbar / Header
    const trackOrderTrigger = page.getByRole('button', {
      name: /Track Order|Track Status|Rastrear/i,
    });
    if (await trackOrderTrigger.count() > 0) {
      await trackOrderTrigger.first().click();

      // Fill in protocol code in tracking modal
      const trackInput = page.getByPlaceholder('e.g. CS-2026-8942');
      await trackInput.fill(protocolText);
      await page.getByRole('button', { name: /^Track$/i }).click();

      // Verify order progress summary
      await expect(
        page.getByText('Gracie Humaita Main Gym')
      ).toBeVisible();
    }
  });
});
