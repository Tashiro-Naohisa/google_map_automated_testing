import { test as setup, expect } from '@playwright/test';
import { join } from 'path';

const sessionFile = join(__dirname, '../playwright/.auth/user.json');

// テスト用の認証情報
const LOGIN_CREDENTIALS = {
    username: 'developer',
    password: 'gmap-test-001'
};

setup('ログイン', async ({ page }) => {
    // ログインページに移動
    await page.goto('https://googlemaplinkage-testdevelop.cybozu.com/');

    // 問題点：なぜplaywrightだと、英語表記になる？⇒設定を変更して解決

    // ログインフォームに認証情報を入力
    await page.getByRole('textbox', { name: 'ログイン名' }).fill(LOGIN_CREDENTIALS.username);
    await page.getByRole('textbox', { name: 'パスワード' }).fill(LOGIN_CREDENTIALS.password);

    // ログイン
    await page.getByRole('button', { name: 'ログイン' }).click();
    await page.waitForTimeout(3000);
    await expect(page.locator('#slash-react-main').getByRole('link', { name: 'kintone' })).toBeVisible();
    await page.locator('#slash-react-main').getByRole('link', { name: 'kintone' }).click();
    await page.goto('https://googlemaplinkage-testdevelop.cybozu.com/k/#/portal');
    await expect(page.getByRole('heading', { name: 'スペース' })).toBeVisible();

    // セッション情報を保存
    await page.context().storageState({ path: sessionFile });
});
