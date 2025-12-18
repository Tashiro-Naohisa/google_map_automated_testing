import { test as base, expect, Page } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// 比較する2つのバージョンを設定
// TODO 変数名 testVersion
const currentVersion = '3.60';
const baselineVersion = '3.59';

// 格納先のフォルダを定義
const currentFolder = `test-results-${currentVersion}`;
const baselineFolder = `test-results-${baselineVersion}`;
const screenshotFolder = `test-results-${currentVersion}`;

// popupPageがPlaywrightのページオブジェクトであることを定義
type MapTestFixtures = {
  popupPage: Page;
  popupPage1: Page;
};

// 各テストの前処理を定義
const test = base.extend<MapTestFixtures>({
  popupPage: async ({ page }, use) => {
    // 各テストごとに新しいポップアップページを作成
    await page.goto('https://googlemaplinkage-testdevelop.cybozu.com/k/#/portal');

    await page.getByRole('link', {
      name: `NICE営業物語 on kintone ver.4.5（Ver.${currentVersion}）`
    }).click();

    const page1Promise = page.waitForEvent('popup');
    await page.locator('div:nth-child(3) > a').click();
    const popup = await page1Promise;

    // ビューポートサイズを設定
    await popup.setViewportSize({ width: 1920, height: 1000 });

    await expect(popup.locator('body')).toContainText('顧客マップ(オプション)');
    await popup.getByRole('button', { name: '地図表示' }).click();
    await expect(popup.locator('#display-map')).toBeVisible();

    // テストにポップアップページを渡す
    await use(popup);
  },
  popupPage1: async ({ page }, use) => {
    // 各テストごとに新しいポップアップページを作成
    await page.goto('https://googlemaplinkage-testdevelop.cybozu.com/k/#/portal');

    await page.getByRole('link', {
      name: `NICE営業物語 on kintone ver.4.5（Ver.${baselineVersion}）`
    }).click();

    const page1Promise = page.waitForEvent('popup');
    await page.locator('div:nth-child(3) > a').click();
    const popup = await page1Promise;

    // ビューポートサイズを設定
    await popup.setViewportSize({ width: 1920, height: 1000 });

    await expect(popup.locator('body')).toContainText('顧客マップ(オプション)');
    await popup.getByRole('button', { name: '地図表示' }).click();
    await expect(popup.locator('#display-map')).toBeVisible();

    // テストにポップアップページを渡す
    await use(popup);
  },
});

// リトライ回数を設定（最大1回まで再試行）
test.describe.configure({ retries: 1 });

// === テスト ===========================================================
// 両バージョン（3.59と3.60）を同時にテストし、最後にまとめて画像比較

// 地図表示の確認
test('1.map display', async ({ popupPage, popupPage1 }) => {
  // 3.60版のテスト
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await expect(popupPage.locator('.gm-style > div > div:nth-child(2)')).toBeVisible();

  // 3.59版のテスト
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await expect(popupPage1.locator('.gm-style > div > div:nth-child(2)')).toBeVisible();
});

// 重複表示されていないことの確認
test('2.proliferation do not confirmation', async ({ popupPage, popupPage1 }) => {
  // 3.60版
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await popupPage.waitForTimeout(3000);
  await popupPage.screenshot({
    path: `${currentFolder}/map_notDuplicate.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });

  // 3.59版
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await popupPage1.waitForTimeout(3000);
  await popupPage1.screenshot({
    path: `${baselineFolder}/map_notDuplicate.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });
});

// 検索条件「中心地」を変更した時、正しい位置にピンが打たれることの確認
test('3.when changed search criteria center place valid position pin', async ({ popupPage, popupPage1 }) => {
  // 3.60版
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.locator('#kokyakuMap-center').selectOption('神奈川県');
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await popupPage.waitForTimeout(3000);
  await popupPage.screenshot({
    path: `${currentFolder}/changed_search_criteria_center_kanagawa.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });

  // 3.59版
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.locator('#kokyakuMap-center').selectOption('神奈川県');
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await popupPage1.waitForTimeout(3000);
  await popupPage1.screenshot({
    path: `${baselineFolder}/changed_search_criteria_center_kanagawa.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });
});

// 現在地ピンが表示されていることの確認
test('4.current location pin is displayed', async ({ popupPage, popupPage1 }) => {
  // 3.60版
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await expect(popupPage.locator('gmp-advanced-marker:nth-child(38) > img')).toBeVisible();
  await popupPage.waitForTimeout(3000);
  await popupPage.screenshot({
    path: `${currentFolder}/current_location_pin.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });

  // 3.59版
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await expect(popupPage1.locator('gmp-advanced-marker:nth-child(38) > img')).toBeVisible();
  await popupPage1.waitForTimeout(3000);
  await popupPage1.screenshot({
    path: `${baselineFolder}/current_location_pin.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });
});

// 情報ダイアログ表示の確認（No.31、No.32、No.34、No.49）
test('5.information dialog display', async ({ popupPage, popupPage1 }) => {
  // 3.60版
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await popupPage.locator('gmp-advanced-marker').first().click();
  await popupPage.getByLabel('', { exact: true }).screenshot({
    path: `${currentFolder}/information_dialog.png`
  });

  // 3.59版
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await popupPage1.locator('gmp-advanced-marker').first().click();
  await popupPage1.getByLabel('', { exact: true }).screenshot({
    path: `${baselineFolder}/information_dialog.png`
  });
});

// mapIdが反映されていることの確認（No.53）
test('6.mapId affected is confirmation', async ({ popupPage, popupPage1 }) => {
  // 3.60版
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await popupPage.waitForTimeout(1000);
  await popupPage.locator('.gm-style > div > div:nth-child(2)').click();
  await popupPage.waitForTimeout(300);
  for (let i = 0; i < 9; i++) {
    await popupPage.waitForTimeout(500);
    await popupPage.keyboard.press('Minus');
  }
  await popupPage.waitForTimeout(1000);
  const mapElement = popupPage.locator('.gm-style > div > div:nth-child(2)');
  await mapElement.screenshot({ path: `${currentFolder}/mapId_affected.png` });

  // 赤色ピクセル検出（3.60版）
  const imageBuffer = readFileSync(`${currentFolder}/mapId_affected.png`);
  const png = PNG.sync.read(imageBuffer);
  let redPixelCount = 0;
  const threshold = { r: 180, g: 100, b: 100 };
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      if (r > threshold.r && g < threshold.g && b < threshold.b) {
        redPixelCount++;
      }
    }
  }
  const totalPixels = png.width * png.height;
  const redPercentage = (redPixelCount / totalPixels) * 100;
  console.log(`[3.60] 赤色ピクセル数: ${redPixelCount}`);
  console.log(`[3.60] 赤色の割合: ${redPercentage.toFixed(2)}%`);
  expect(redPercentage).toBeGreaterThan(0.1);

  // 3.59版
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await popupPage1.waitForTimeout(1000);
  await popupPage1.locator('.gm-style > div > div:nth-child(2)').click();
  await popupPage1.waitForTimeout(300);
  for (let i = 0; i < 9; i++) {
    await popupPage1.waitForTimeout(500);
    await popupPage1.keyboard.press('Minus');
  }
  await popupPage1.waitForTimeout(1000);
  const mapElement1 = popupPage1.locator('.gm-style > div > div:nth-child(2)');
  await mapElement1.screenshot({ path: `${baselineFolder}/mapId_affected.png` });

  // 赤色ピクセル検出（3.59版）
  const imageBuffer1 = readFileSync(`${baselineFolder}/mapId_affected.png`);
  const png1 = PNG.sync.read(imageBuffer1);
  let redPixelCount1 = 0;
  for (let y = 0; y < png1.height; y++) {
    for (let x = 0; x < png1.width; x++) {
      const idx = (png1.width * y + x) << 2;
      const r = png1.data[idx];
      const g = png1.data[idx + 1];
      const b = png1.data[idx + 2];
      if (r > threshold.r && g < threshold.g && b < threshold.b) {
        redPixelCount1++;
      }
    }
  }
  const totalPixels1 = png1.width * png1.height;
  const redPercentage1 = (redPixelCount1 / totalPixels1) * 100;
  console.log(`[3.59] 赤色ピクセル数: ${redPixelCount1}`);
  console.log(`[3.59] 赤色の割合: ${redPercentage1.toFixed(2)}%`);
  expect(redPercentage1).toBeGreaterThan(0.1);
});

// ツールチップが正しく表示されていることの確認（No.42）
test('7.tooltip', async ({ popupPage, popupPage1 }) => {
  // 3.60版
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.getByRole('button', { name: '絞り込む' }).click();
  await popupPage.getByRole('textbox').first().click();
  await popupPage.getByText('顧客名').nth(1).click();
  await popupPage.getByRole('option', { name: '=（等しい）' }).click();
  await popupPage.getByRole('menuitemradio', { name: '次のキーワードを含む' }).click();
  await popupPage.locator('[id^="value-"][id$="-text"]').last().fill('株式会社チヨダクツールチップ表示ツール');
  await popupPage.getByRole('button', { name: '追加' }).first().click();
  await popupPage.getByRole('button', { name: '適用' }).click();
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await expect(popupPage.locator('gmp-advanced-marker').first()).toBeVisible({ timeout: 10000 });
  await popupPage.locator('gmp-advanced-marker').first().click();
  await expect(popupPage.locator('#firstHeading')).toBeVisible({ timeout: 5000 });

  const customerNameElement = popupPage.locator('#firstHeading');
  const infoCustomerNameElement = popupPage.getByText('顧客名：株式会社チヨダクツールチップ表示ツールチップ表示ツールチップ表示');
  const katsudoRirekiElement = popupPage.getByRole('cell', { name: 'ツールチップ案件ツールチップ案件ツールチップ案件ツールチップ案件' });
  await popupPage.waitForTimeout(2000);

  const titleAttribute = await customerNameElement.getAttribute('title');
  const infoTitleAttribute = await infoCustomerNameElement.getAttribute('title');
  const katsudoRirekiTitleAttribute = await katsudoRirekiElement.getAttribute('title');
  const customerNameText = titleAttribute || await customerNameElement.textContent();
  const infoCustomerNameText = infoTitleAttribute || await infoCustomerNameElement.textContent();
  const katsudoRirekiText = katsudoRirekiTitleAttribute || await katsudoRirekiElement.textContent();

  (global as any).tooltipResult1 = customerNameText || '';
  (global as any).tooltipResult2 = infoCustomerNameText || '';
  (global as any).tooltipResult3 = katsudoRirekiText || '';

  await popupPage.screenshot({
    path: `${currentFolder}/tooltip_display.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });

  // 3.59版
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.getByRole('button', { name: '絞り込む' }).click();
  await popupPage1.getByRole('textbox').first().click();
  await popupPage1.getByText('顧客名').nth(1).click();
  await popupPage1.getByRole('option', { name: '=（等しい）' }).click();
  await popupPage1.getByRole('menuitemradio', { name: '次のキーワードを含む' }).click();
  await popupPage1.locator('[id^="value-"][id$="-text"]').last().fill('株式会社チヨダクツールチップ表示ツール');
  await popupPage1.getByRole('button', { name: '追加' }).first().click();
  await popupPage1.getByRole('button', { name: '適用' }).click();
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await expect(popupPage1.locator('gmp-advanced-marker').first()).toBeVisible({ timeout: 10000 });
  await popupPage1.locator('gmp-advanced-marker').first().click();
  await expect(popupPage1.locator('#firstHeading')).toBeVisible({ timeout: 5000 });
  await popupPage1.waitForTimeout(2000);

  await popupPage1.screenshot({
    path: `${baselineFolder}/tooltip_display.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });
});

// 取得範囲の基準が正しく反映されていることの確認（No.54、No.55）
test('8.acquisition range of criteria correctly affected is confirmation(50km)', async ({ popupPage, popupPage1 }) => {
  // 3.60版
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.getByRole('button', { name: '絞り込む' }).click();
  await popupPage.getByRole('textbox').first().click();
  await popupPage.getByText('顧客名').nth(1).click();
  await popupPage.getByRole('option', { name: '=（等しい）' }).click();
  await popupPage.getByRole('menuitemradio', { name: '次のキーワードを含む' }).click();
  await popupPage.locator('[id^="value-"][id$="-text"]').last().fill('中心地（東京）取得範囲テスト_50km取得');
  await popupPage.getByRole('button', { name: '追加' }).first().click();
  await popupPage.getByRole('button', { name: '適用' }).click();
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await popupPage.waitForTimeout(1000);
  await popupPage.locator('gmp-advanced-marker:nth-child(3) > img').click();
  await popupPage.waitForTimeout(300);
  for (let i = 0; i < 7; i++) {
    await popupPage.waitForTimeout(500);
    await popupPage.keyboard.press('Minus');
  }
  await expect(popupPage.locator('gmp-advanced-marker').first()).toBeVisible({ timeout: 10000 });
  await popupPage.locator('gmp-advanced-marker').nth(2).click();
  await expect(popupPage.locator('#firstHeading')).toContainText('中心地（東京）取得範囲テスト_50km取得');
  await popupPage.getByRole('button', { name: '閉じる' }).click();
  await popupPage.locator('gmp-advanced-marker').nth(1).click();
  await expect(popupPage.locator('#firstHeading')).toContainText('中心地（東京）取得範囲テスト_50km取得');
  await popupPage.waitForTimeout(3000);
  await popupPage.screenshot({
    path: `${currentFolder}/acquisition_range_of_criteria_50km.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });

  // 3.59版
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.getByRole('button', { name: '絞り込む' }).click();
  await popupPage1.getByRole('textbox').first().click();
  await popupPage1.getByText('顧客名').nth(1).click();
  await popupPage1.getByRole('option', { name: '=（等しい）' }).click();
  await popupPage1.getByRole('menuitemradio', { name: '次のキーワードを含む' }).click();
  await popupPage1.locator('[id^="value-"][id$="-text"]').last().fill('中心地（東京）取得範囲テスト_50km取得');
  await popupPage1.getByRole('button', { name: '追加' }).first().click();
  await popupPage1.getByRole('button', { name: '適用' }).click();
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await popupPage1.waitForTimeout(1000);
  await popupPage1.locator('gmp-advanced-marker:nth-child(3) > img').click();
  await popupPage1.waitForTimeout(300);
  for (let i = 0; i < 7; i++) {
    await popupPage1.waitForTimeout(500);
    await popupPage1.keyboard.press('Minus');
  }
  await expect(popupPage1.locator('gmp-advanced-marker').first()).toBeVisible({ timeout: 10000 });
  await popupPage1.locator('gmp-advanced-marker').nth(2).click();
  await expect(popupPage1.locator('#firstHeading')).toContainText('中心地（東京）取得範囲テスト_50km取得');
  await popupPage1.getByRole('button', { name: '閉じる' }).click();
  await popupPage1.locator('gmp-advanced-marker').nth(1).click();
  await expect(popupPage1.locator('#firstHeading')).toContainText('中心地（東京）取得範囲テスト_50km取得');
  await popupPage1.waitForTimeout(3000);
  await popupPage1.screenshot({
    path: `${baselineFolder}/acquisition_range_of_criteria_50km.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });
});

// 取得範囲の基準が正しく反映されていることの確認
test('9.acquisition range of criteria correctly affected is confirmation(51km)', async ({ popupPage, popupPage1 }) => {
  // 3.60版
  await popupPage.getByRole('button', { name: '▼' }).click();
  await popupPage.getByRole('button', { name: '絞り込む' }).click();
  await popupPage.getByRole('textbox').first().click();
  await popupPage.getByText('顧客名').nth(1).click();
  await popupPage.getByRole('option', { name: '=（等しい）' }).click();
  await popupPage.getByText('次のキーワードを含む').click();
  await popupPage.locator('[id^="value-"][id$="-text"]').last().fill('中心地（東京）取得範囲テスト_51km取得');
  await popupPage.getByRole('button', { name: '追加' }).first().click();
  await popupPage.getByRole('button', { name: '適用' }).click();
  await popupPage.locator('#nok_search_input').click();
  await popupPage.locator('#nok_search_input').fill('51');
  await popupPage.getByRole('button', { name: '地図表示' }).click();
  await popupPage.waitForTimeout(1000);
  await popupPage.locator('gmp-advanced-marker:nth-child(3) > img').click();
  await popupPage.waitForTimeout(300);
  for (let i = 0; i < 7; i++) {
    await popupPage.waitForTimeout(500);
    await popupPage.keyboard.press('Minus');
  }
  await expect(popupPage.locator('gmp-advanced-marker').first()).toBeVisible({ timeout: 10000 });
  await popupPage.locator('gmp-advanced-marker').nth(1).click();
  await expect(popupPage.locator('#firstHeading')).toContainText('中心地（東京）「取得範囲テスト_51km取');
  await popupPage.waitForTimeout(3000);
  await popupPage.screenshot({
    path: `${currentFolder}/acquisition_range_of_criteria_51km.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });

  // 3.59版
  await popupPage1.getByRole('button', { name: '▼' }).click();
  await popupPage1.getByRole('button', { name: '絞り込む' }).click();
  await popupPage1.getByRole('textbox').first().click();
  await popupPage1.getByText('顧客名').nth(1).click();
  await popupPage1.getByRole('option', { name: '=（等しい）' }).click();
  await popupPage1.getByText('次のキーワードを含む').click();
  await popupPage1.locator('[id^="value-"][id$="-text"]').last().fill('中心地（東京）取得範囲テスト_51km取得');
  await popupPage1.getByRole('button', { name: '追加' }).first().click();
  await popupPage1.getByRole('button', { name: '適用' }).click();
  await popupPage1.locator('#nok_search_input').click();
  await popupPage1.locator('#nok_search_input').fill('51');
  await popupPage1.getByRole('button', { name: '地図表示' }).click();
  await popupPage1.waitForTimeout(1000);
  await popupPage1.locator('gmp-advanced-marker:nth-child(3) > img').click();
  await popupPage1.waitForTimeout(300);
  for (let i = 0; i < 7; i++) {
    await popupPage1.waitForTimeout(500);
    await popupPage1.keyboard.press('Minus');
  }
  await expect(popupPage1.locator('gmp-advanced-marker').first()).toBeVisible({ timeout: 10000 });
  await popupPage1.locator('gmp-advanced-marker').nth(1).click();
  await expect(popupPage1.locator('#firstHeading')).toContainText('中心地（東京）「取得範囲テスト_51km取');
  await popupPage1.waitForTimeout(3000);
  await popupPage1.screenshot({
    path: `${baselineFolder}/acquisition_range_of_criteria_51km.png`,
    clip: { x: 0, y: 200, width: 1920, height: 1000 }
  });
});

// === 画像比較テスト（まとめて実行） ===
test('10.compare all screenshots', async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 画像比較テスト開始');
  console.log('='.repeat(60));

  const screenshotsToCompare = [
    'map_notDuplicate.png',
    'changed_search_criteria_center_kanagawa.png',
    'current_location_pin.png',
    'information_dialog.png',
    'mapId_affected.png',
    'tooltip_display.png',
    'acquisition_range_of_criteria_50km.png',
    'acquisition_range_of_criteria_51km.png'
  ];

  const results: Array<{ name: string; diffPixels: number; status: string }> = [];

  for (const screenshotName of screenshotsToCompare) {
    const result = await compareVersionScreenshots(screenshotName, 1000);
    results.push({
      name: screenshotName,
      diffPixels: result.diffPixels,
      status: result.passed ? '✅ OK' : '❌ NG'
    });
  }

  // 結果サマリー表示
  console.log('\n' + '='.repeat(60));
  console.log('📊 画像比較結果サマリー');
  console.log('='.repeat(60));
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.status} ${r.name} (差分: ${r.diffPixels}px)`);
  });

  const passed = results.filter(r => r.status.includes('OK')).length;
  const failed = results.filter(r => r.status.includes('NG')).length;
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${passed}/${results.length} | ❌ 失敗: ${failed}/${results.length}`);
  console.log('='.repeat(60));

  // 失敗があればテスト失敗
  expect(failed).toBe(0);
});

// 画像比較関数（結果を返すように変更）
async function compareVersionScreenshots(
  screenshotName: string,
  maxDiffPixels: number = 1000
): Promise<{ diffPixels: number; passed: boolean }> {
  const currentPath = join(currentFolder, screenshotName);
  const baselinePath = join(baselineFolder, screenshotName);

  if (!existsSync(baselinePath)) {
    console.log(`⚠ ベースライン未作成: ${screenshotName}`);
    return { diffPixels: -1, passed: false };
  }

  if (!existsSync(currentPath)) {
    console.log(`⚠ 現在のバージョンの画像が見つかりません: ${screenshotName}`);
    return { diffPixels: -1, passed: false };
  }

  const img1 = PNG.sync.read(readFileSync(baselinePath));
  const img2 = PNG.sync.read(readFileSync(currentPath));
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.2 }
  );

  console.log(`📊 ${screenshotName}: ${numDiffPixels} ピクセルの差分 (許容値: ${maxDiffPixels})`);

  if (numDiffPixels > 0) {
    const diffPath = join('diff-test-results', `diff-${screenshotName}`);
    diff.pack().pipe(require('fs').createWriteStream(diffPath));
  }

  const passed = numDiffPixels < maxDiffPixels;
  return { diffPixels: numDiffPixels, passed };
}

// ============================================================
// テスト結果レポート
// ============================================================

const testResults: Array<{
  name: string;
  status: string;           // テスト実行ステータス（passed/failed）
  executionResult: string;  // テスト実行結果（OK/NG）
  expectedResult: string;   // 期待値確認結果（OK/NG/確認中）
  duration: number;
  error?: string;
  errorDetail?: string;     // エラー詳細
  result?: string;
  retry: number;
}> = [];

// 結果出力CSVファイルのパス
const csvPath = `${screenshotFolder}/test-results.csv`;

// 各テスト実施後にcsvに結果を格納
test.afterEach(async ({ }, testInfo) => {
  // ツールチップテストの場合は結果を取得
  let additionalResult = '';
  if (testInfo.title === '7.tooltip' && testInfo.status === 'passed') {
    const tooltip1 = (global as any).tooltipResult1 || '';
    const tooltip2 = (global as any).tooltipResult2 || '';
    const tooltip3 = (global as any).tooltipResult3 || '';

    // 全てのツールチップを結合して表示
    const results = [];
    if (tooltip1) results.push(`#firstHeading: ${tooltip1}`);
    if (tooltip2) results.push(`顧客名詳細: ${tooltip2}`);
    if (tooltip3) results.push(`活動履歴: ${tooltip3}`);
    additionalResult = results.join(' | ');
  }

  // テスト実行結果の判定（テストが正常に実行されたか）
  const executionResult = testInfo.status === 'passed' ? 'OK' : 'NG';

  // 期待値確認結果の判定（機能が期待通りに動作したか）
  let expectedResult = '確認中';
  if (testInfo.status === 'passed') {
    // テストが成功した場合、期待値も満たされたとみなす
    expectedResult = 'OK';
  } else if (testInfo.status === 'failed') {
    // テストが失敗した場合
    const errorMsg = testInfo.error?.message || '';
    if (errorMsg.includes('expect') ||
      errorMsg.includes('toContainText') ||
      errorMsg.includes('toBeVisible') ||
      errorMsg.includes('toBeGreaterThan') ||
      errorMsg.includes('toBe')) {
      // アサーション失敗 = 機能が期待通りでない
      expectedResult = 'NG';
    } else {
      // その他のエラー（タイムアウト、要素未発見など）= 確認不可
      expectedResult = '確認不可';
    }
  }

  // エラー詳細の取得
  let errorDetail = '';
  if (testInfo.error) {
    // スタックトレースも含めた詳細なエラー情報
    const fullError = testInfo.error.message || '';
    const stack = testInfo.error.stack || '';

    // ANSIエスケープコードを削除
    const cleanError = fullError.replace(/\u001b\[\d+m/g, '').trim();
    const cleanStack = stack.replace(/\u001b\[\d+m/g, '').trim();

    // エラーメッセージとスタックの主要部分を取得
    errorDetail = cleanError;

    // スタックからファイル名と行番号を抽出
    const stackMatch = cleanStack.match(/at.*?([\w-]+\.spec\.ts:\d+:\d+)/);
    if (stackMatch) {
      errorDetail += ` [場所: ${stackMatch[1]}]`;
    }
  }

  const result = {
    name: testInfo.title,
    status: testInfo.status || 'unknown',
    executionResult,
    expectedResult,
    duration: testInfo.duration,
    error: testInfo.error?.message,
    errorDetail,
    result: additionalResult,
    retry: testInfo.retry
  };

  testResults.push(result);

  // CSVに即座に追記
  const fs = require('fs');

  // ファイルが存在しない場合のみヘッダーを作成（並列実行対応）
  let needsHeader = false;
  try {
    fs.accessSync(csvPath);
  } catch {
    needsHeader = true;
  }

  if (needsHeader) {
    try {
      const header = `\uFEFFNo.,テスト名,試行回数,テスト実行結果,期待値確認結果,実行時間(秒),詳細,エラー内容\n`;
      fs.writeFileSync(csvPath, header, { flag: 'wx', encoding: 'utf-8' });
    } catch (err: any) {
      // 他のワーカーが既に作成した場合は無視
      if (err?.code !== 'EEXIST') {
        throw err;
      }
    }
  }

  // 既存のCSVを読み込んで行数を取得
  let lineCount = 0;
  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    lineCount = content.split('\n').filter((line: string) => line.trim()).length - 1; // ヘッダーを除く
  } catch {
    lineCount = 0;
  }

  // テスト結果を1行追加
  const time = (result.duration / 1000).toFixed(2);

  // 詳細メッセージの作成
  let detailMsg = '-';
  if (result.result) {
    // 追加の結果情報（例: ツールチップの内容）
    detailMsg = result.result;
  }

  // エラーメッセージの作成（詳細）
  let errorMsg = '-';
  if (result.error) {
    // エラーメッセージを抽出して整形
    let rawError = result.error
      .replace(/\u001b\[\d+m/g, '')  // ANSIエスケープコード削除
      .trim();

    // エラーメッセージを日本語に翻訳して簡潔化
    errorMsg = translateErrorToJapanese(rawError);

    // スタック情報を追加
    if (result.errorDetail && result.errorDetail.includes('[場所:')) {
      const locationMatch = result.errorDetail.match(/\[場所: ([^\]]+)\]/);
      if (locationMatch) {
        errorMsg += ` [場所: ${locationMatch[1]}]`;
      }
    }

    // 最大300文字に制限
    if (errorMsg.length > 300) {
      errorMsg = errorMsg.substring(0, 300) + '...';
    }
  }

  const retryDisplay = `${result.retry + 1}回目`;
  const csvLine = `${lineCount + 1},"${result.name}","${retryDisplay}","${result.executionResult}","${result.expectedResult}",${time},"${detailMsg.replace(/"/g, '""')}","${errorMsg.replace(/"/g, '""')}"\n`;
  fs.appendFileSync(csvPath, csvLine, 'utf-8');

  console.log(`📝 CSV更新: ${result.name} - 実行:${result.executionResult} / 期待値:${result.expectedResult}`);
});

// エラーメッセージを日本語に翻訳する関数
function translateErrorToJapanese(errorMsg: string): string {
  // 主要なエラーパターンを日本語化
  // タイムアウト関連のエラー
  if (errorMsg.includes('Test timeout') && errorMsg.includes('exceeded while setting up')) {
    const match = errorMsg.match(/Test timeout of (\d+)ms exceeded while setting up "([^"]+)"/);
    if (match) {
      return `"${match[2]}"のセットアップ中にタイムアウト（${match[1]}ms）しました。`;
    }
  }

  if (errorMsg.includes('Test timeout') && errorMsg.includes('exceeded')) {
    const match = errorMsg.match(/Test timeout of (\d+)ms exceeded/);
    if (match) {
      return `テストがタイムアウト（${match[1]}ms）しました。`;
    }
  }

  if (errorMsg.includes('page.goto:')) {
    return 'ページの読み込みがタイムアウトしました。';
  }

  if (errorMsg.includes('page.waitForEvent:') && errorMsg.includes('popup')) {
    return 'ポップアップウィンドウの表示を待機中にタイムアウトしました。';
  }

  if (errorMsg.includes('locator.click:')) {
    return '要素のクリックがタイムアウトしました。';
  }

  if (errorMsg.includes('locator.hover:')) {
    return '要素へのホバー操作がタイムアウトしました。';
  }

  // 表示関連のエラー
  if (errorMsg.includes('expect(locator).toBeVisible()')) {
    return '要素が表示されませんでした。';
  }

  if (errorMsg.includes('expect(locator).toContainText')) {
    const match = errorMsg.match(/Expected substring - (\d+) \+ Received string/);
    return '期待するテキストが見つかりませんでした。';
  }

  // その他のエラーはそのまま返す（簡潔化のみ）
  return errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg;

} test.afterAll(async () => {
  // コンソール出力
  console.log('\n' + '='.repeat(90));
  console.log('📊 テスト結果一覧');
  console.log('='.repeat(90));
  console.log('No. | テスト名                                          | 実行結果 | 期待値確認 | 時間');
  console.log('-'.repeat(90));
  testResults.forEach((result, i) => {
    const execIcon = result.executionResult === 'OK' ? '✅' : '❌';
    const expectIcon = result.expectedResult === 'OK' ? '✅' :
      result.expectedResult === 'NG' ? '❌' : '⚠️';
    const testName = result.name.padEnd(45).substring(0, 45);
    const time = (result.duration / 1000).toFixed(2) + '秒';
    console.log(`${String(i + 1).padStart(2)}  | ${testName} | ${execIcon} ${result.executionResult.padEnd(4)} | ${expectIcon} ${result.expectedResult.padEnd(6)} | ${time}`);

    // エラーがあれば詳細を表示
    if (result.error && result.executionResult === 'NG') {
      const errorSummary = result.error
        .replace(/\u001b\[\d+m/g, '')
        .split('\n')[0]
        .substring(0, 80);
      console.log(`     └─ エラー: ${errorSummary}`);
    }
  });

  // テスト実行結果の集計
  const execPassed = testResults.filter(r => r.executionResult === 'OK').length;
  const execFailed = testResults.filter(r => r.executionResult === 'NG').length;

  // 期待値確認結果の集計
  const expectPassed = testResults.filter(r => r.expectedResult === 'OK').length;
  const expectFailed = testResults.filter(r => r.expectedResult === 'NG').length;
  const expectPending = testResults.filter(r => r.expectedResult === '確認中' || r.expectedResult === '確認不可').length;

  console.log('='.repeat(90));
  console.log('📈 サマリー:');
  console.log(`   テスト実行結果: ✅ 成功 ${execPassed}/${testResults.length} | ❌ 失敗 ${execFailed}/${testResults.length}`);
  console.log(`   期待値確認結果: ✅ OK ${expectPassed} | ❌ NG ${expectFailed} | ⚠️ 確認中/不可 ${expectPending}`);
  console.log('='.repeat(90) + '\n');
  console.log(`✅ CSVレポート保存済み: ${csvPath}`);
});

export { test, expect };
