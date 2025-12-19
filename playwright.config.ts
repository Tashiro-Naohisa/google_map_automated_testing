import { defineConfig, devices } from '@playwright/test';
import { join } from 'path';

/**
 * Playwright設定ファイル
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    // テストディレクトリ
    testDir: './tests',

    // 並列実行
    fullyParallel: true,

    // CI環境ではリトライしない
    forbidOnly: !!process.env.CI,

    // リトライ回数
    retries: process.env.CI ? 2 : 0,

    // 並列ワーカー数
    workers: process.env.CI ? 1 : undefined,

    // レポーター設定
    reporter: 'html',

    // 全テスト共通設定
    use: {
        // ベースURL（必要に応じて変更）
        // baseURL: 'http://127.0.0.1:3000',

        // 失敗時にトレースを収集
        trace: 'on-first-retry',

        // スクリーンショット設定
        screenshot: 'only-on-failure',

        // ビデオ録画設定
        video: 'on-first-retry',
    },

    // ブラウザプロジェクト設定
    projects: [
        // 認証セットアップ（最初に実行）
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // 認証状態を使用
                storageState: join(__dirname, 'playwright/.auth/user.json'),
            },
            dependencies: ['setup'],
        },

        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                storageState: join(__dirname, 'playwright/.auth/user.json'),
            },
            dependencies: ['setup'],
        },

        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                storageState: join(__dirname, 'playwright/.auth/user.json'),
            },
            dependencies: ['setup'],
        },

        // モバイルビューポート
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },
    ],

    // ローカル開発サーバーを起動する場合
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://127.0.0.1:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
