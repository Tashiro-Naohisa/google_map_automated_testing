import { test, expect } from '@playwright/test';

test.describe('Google Maps テスト', () => {
    test('Google Maps にアクセスできる', async ({ page }) => {
        // Google Mapsにアクセス
        await page.goto('https://www.google.co.jp/maps');

        // ページタイトルを確認
        await expect(page).toHaveTitle(/Google マップ|Google Maps/);
    });

    test('場所を検索できる', async ({ page }) => {
        // Google Mapsにアクセス
        await page.goto('https://www.google.co.jp/maps');

        // 検索ボックスを探してクリック
        const searchBox = page.locator('#searchboxinput');
        await searchBox.waitFor({ state: 'visible', timeout: 10000 });

        // 検索キーワードを入力
        await searchBox.fill('東京駅');
        await searchBox.press('Enter');

        // 検索結果が表示されるのを待つ
        await page.waitForTimeout(3000);

        // URLに検索キーワードが含まれているか確認
        await expect(page).toHaveURL(/東京駅|Tokyo/);
    });
});
