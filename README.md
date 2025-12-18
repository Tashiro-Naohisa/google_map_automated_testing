# Google Maps Automated Testing

Playwrightを使用したGoogle Mapsの自動テストプロジェクトです。

## 📋 概要

このプロジェクトは、Playwrightテストフレームワークを使用してGoogle Mapsの機能をE2Eテストするために作成されました。

## 🛠️ 技術スタック

- **Node.js** - JavaScript実行環境
- **Playwright** - E2Eテストフレームワーク
- **TypeScript** - 型付きJavaScript

## 📦 セットアップ

### 前提条件

- Node.js (v16以上推奨)
- npm

### インストール手順

```bash
# 依存パッケージのインストール
npm install

# Playwrightブラウザのインストール
npx playwright install
```

## 🚀 テストの実行

### 基本的なコマンド

| コマンド | 説明 |
|---------|------|
| `npm test` | 全テストをヘッドレスモードで実行 |
| `npm run test:headed` | ブラウザを表示してテスト実行 |
| `npm run test:ui` | Playwright UI モードでインタラクティブにテスト |
| `npm run test:debug` | デバッグモードでテスト実行 |
| `npm run report` | HTMLレポートを表示 |

### 特定のブラウザでテスト

```bash
# Chromiumのみ
npx playwright test --project=chromium

# Firefoxのみ
npx playwright test --project=firefox

# WebKitのみ
npx playwright test --project=webkit
```

### 特定のテストファイルを実行

```bash
npx playwright test tests/google-maps.spec.ts
```

## 📁 プロジェクト構成

```
google_map_automated_testing/
├── tests/                    # テストファイル
│   └── google-maps.spec.ts   # Google Mapsテスト
├── playwright.config.ts      # Playwright設定
├── package.json              # npm設定
├── .gitignore               # Git除外設定
└── README.md                # このファイル
```

## ⚙️ 設定ファイル

### playwright.config.ts

主な設定項目：

- **testDir**: テストディレクトリ (`./tests`)
- **fullyParallel**: 並列実行有効
- **retries**: CI環境で2回リトライ
- **reporter**: HTMLレポーター
- **trace**: 失敗時にトレース収集
- **screenshot**: 失敗時にスクリーンショット
- **video**: 失敗時にビデオ録画

### 対応ブラウザ

- Chromium (Chrome)
- Firefox
- WebKit (Safari)

## 📝 テストの書き方

### 基本的なテスト構造

```typescript
import { test, expect } from '@playwright/test';

test.describe('テストスイート名', () => {
  test('テストケース名', async ({ page }) => {
    // ページにアクセス
    await page.goto('https://www.google.co.jp/maps');
    
    // 要素を操作
    const element = page.locator('#selector');
    await element.click();
    
    // アサーション
    await expect(page).toHaveTitle(/期待するタイトル/);
  });
});
```

### よく使うメソッド

```typescript
// ナビゲーション
await page.goto('URL');
await page.goBack();
await page.reload();

// 要素の取得
page.locator('#id');
page.locator('.class');
page.getByRole('button', { name: 'ボタン名' });
page.getByText('テキスト');

// アクション
await element.click();
await element.fill('入力値');
await element.press('Enter');

// 待機
await page.waitForTimeout(1000);
await element.waitFor({ state: 'visible' });

// アサーション
await expect(page).toHaveURL(/pattern/);
await expect(element).toBeVisible();
await expect(element).toHaveText('テキスト');
```

## 📊 レポート

テスト実行後、以下のコマンドでHTMLレポートを確認できます：

```bash
npm run report
```

レポートは `playwright-report/` ディレクトリに生成されます。

## 🔧 トラブルシューティング

### ブラウザが起動しない場合

```bash
# ブラウザを再インストール
npx playwright install
```

### タイムアウトエラーが発生する場合

`playwright.config.ts` でタイムアウト時間を調整：

```typescript
export default defineConfig({
  timeout: 60000, // テスト全体のタイムアウト（ミリ秒）
  expect: {
    timeout: 10000, // expectのタイムアウト（ミリ秒）
  },
});
```

## 📚 参考リンク

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwright API リファレンス](https://playwright.dev/docs/api/class-playwright)
- [Google Maps](https://www.google.co.jp/maps)

## 📄 ライセンス

ISC
