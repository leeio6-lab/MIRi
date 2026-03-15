#!/usr/bin/env npx ts-node
/**
 * MIRI App Pre-Launch Checklist
 * 출시 전 점검 스크립트 — 누락된 설정을 확인합니다.
 *
 * Usage: npx ts-node scripts/pre-launch-check.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

interface CheckResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: CheckResult[] = [];

function check(category: string, name: string, condition: boolean, message: string, severity: 'FAIL' | 'WARN' = 'FAIL') {
  results.push({
    name,
    category,
    status: condition ? 'PASS' : severity,
    message: condition ? 'OK' : message,
  });
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(ROOT, filePath));
}

function readJson(filePath: string): any {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, filePath), 'utf8'));
  } catch {
    return null;
  }
}

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
  } catch {
    return '';
  }
}

// ═══════════════════════════════════════
// 1. 앱 설정
// ═══════════════════════════════════════
const appJson = readJson('app.json');
const easJson = readJson('eas.json');

check('앱 설정', 'app.json 존재', !!appJson, 'app.json이 없습니다');
check('앱 설정', 'Bundle ID 설정', appJson?.expo?.ios?.bundleIdentifier === 'com.miri.app', 'iOS bundleIdentifier 확인 필요');
check('앱 설정', 'Android Package', appJson?.expo?.android?.package === 'com.miri.app', 'Android package 확인 필요');
check('앱 설정', 'URI Scheme', appJson?.expo?.scheme === 'miri', 'OAuth redirect를 위한 URI scheme 미설정');
check('앱 설정', 'EAS Project ID', appJson?.expo?.extra?.eas?.projectId !== 'your-project-id', 'EAS projectId가 placeholder입니다. `eas init`을 실행하세요.');

// ═══════════════════════════════════════
// 2. 스토어 제출 설정
// ═══════════════════════════════════════
check('스토어 제출', 'eas.json 존재', !!easJson, 'eas.json이 없습니다');
check('스토어 제출', 'Apple ID', easJson?.submit?.production?.ios?.appleId !== 'your@email.com', 'Apple ID가 placeholder입니다');
check('스토어 제출', 'ASC App ID', easJson?.submit?.production?.ios?.ascAppId !== '0000000000', 'App Store Connect App ID가 placeholder입니다');
check('스토어 제출', 'Apple Team ID', easJson?.submit?.production?.ios?.appleTeamId !== 'YOUR_TEAM_ID', 'Apple Team ID가 placeholder입니다');
check('스토어 제출', 'Google Service Account', fileExists('google-service-account.json'), 'google-service-account.json이 없습니다 (Android 제출에 필요)');
check('스토어 제출', 'Store Metadata (KO)', fileExists('store-metadata/app-store-ko.md'), '한국어 스토어 메타데이터 없음');
check('스토어 제출', 'Store Metadata (EN)', fileExists('store-metadata/app-store-en.md'), '영어 스토어 메타데이터 없음');
check('스토어 제출', 'Store Metadata (JA)', fileExists('store-metadata/app-store-ja.md'), '일본어 스토어 메타데이터 없음');

// ═══════════════════════════════════════
// 3. 인증 (Google/Apple OAuth)
// ═══════════════════════════════════════
const envFile = readFile('.env');
check('인증', '.env 존재', fileExists('.env'), '.env 파일이 없습니다');
check('인증', 'Supabase URL', envFile.includes('EXPO_PUBLIC_SUPABASE_URL=') && !envFile.includes('your-project'), 'Supabase URL이 설정되지 않았습니다');
check('인증', 'Supabase Anon Key', envFile.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=') && envFile.includes('eyJ'), 'Supabase Anon Key가 설정되지 않았습니다');

// Google OAuth는 Supabase Dashboard에서 설정하므로 코드에서 직접 확인 불가
check('인증', 'Google OAuth 설정', false,
  '[수동 확인 필요] Supabase Dashboard > Authentication > Providers > Google에서 Client ID/Secret 설정 확인',
  'WARN');
check('인증', 'Apple OAuth 설정', false,
  '[수동 확인 필요] Supabase Dashboard > Authentication > Providers > Apple에서 설정 확인',
  'WARN');

// ═══════════════════════════════════════
// 4. 결제 시스템
// ═══════════════════════════════════════
check('결제', 'IAP Service', fileExists('src/services/iap.ts'), 'IAP 서비스 파일 없음');
check('결제', 'verify-purchase Function', fileExists('supabase/functions/verify-purchase/index.ts'), '결제 검증 Edge Function 없음');
check('결제', 'IAP Products 정의', fileExists('src/constants/iapProducts.ts'), 'IAP 상품 정의 파일 없음');

const verifyPurchase = readFile('supabase/functions/verify-purchase/index.ts');
check('결제', '영수증 검증 (Non-MVP)', !verifyPurchase.includes('MVP: receipt 존재하면 승인'),
  'verify-purchase가 아직 MVP 모드입니다 (모든 영수증 승인)');

check('결제', 'Apple Shared Secret',
  false,
  '[수동 확인] `supabase secrets list`로 APPLE_SHARED_SECRET 설정 확인',
  'WARN');
check('결제', 'Google Service Account (Edge Function)',
  false,
  '[수동 확인] `supabase secrets list`로 GOOGLE_SERVICE_ACCOUNT_JSON 설정 확인',
  'WARN');

// App Store / Google Play 상품 등록
check('결제', 'App Store IAP 상품 등록', false,
  '[수동 확인] App Store Connect에서 소비성 상품 3개 등록 확인 (saju.detail, face.analysis, compatibility)',
  'WARN');
check('결제', 'Google Play IAP 상품 등록', false,
  '[수동 확인] Google Play Console에서 인앱 상품 3개 등록 확인 (saju_detail, face_analysis, compatibility)',
  'WARN');

// ═══════════════════════════════════════
// 5. 보안
// ═══════════════════════════════════════
check('보안', '.gitignore에 .env', readFile('.gitignore').includes('.env'), '.env가 .gitignore에 포함되지 않음');
check('보안', '.gitignore에 service account', readFile('.gitignore').includes('google-service-account'), 'google-service-account.json이 .gitignore에 포함되지 않음', 'WARN');
check('보안', 'DEV_BYPASS_PAYMENT 프로덕션 안전',
  readFile('src/constants/config.ts').includes('__DEV__'),
  'DEV_BYPASS_PAYMENT가 __DEV__로 보호되지 않음 — 프로덕션에서 결제 우회 위험!');

// ═══════════════════════════════════════
// 6. 법률 / 컴플라이언스
// ═══════════════════════════════════════
check('컴플라이언스', '개인정보처리방침 화면', fileExists('app/settings/privacy.tsx'), '개인정보처리방침 화면 없음');
check('컴플라이언스', '결제 관리 화면', fileExists('app/settings/subscription.tsx'), '결제 관리 화면 없음');
check('컴플라이언스', 'DB 마이그레이션 (indexes)', fileExists('supabase/migrations/002_premium_fields.sql'), 'Purchase index 마이그레이션 없음');

// ═══════════════════════════════════════
// 7. 앱 에셋
// ═══════════════════════════════════════
check('에셋', 'App Icon', fileExists('assets/icon.png'), 'icon.png 없음');
check('에셋', 'Splash Screen', fileExists('assets/splash-icon.png'), 'splash-icon.png 없음');
check('에셋', 'Android Icon (foreground)', fileExists('assets/android-icon-foreground.png'), 'Android adaptive icon foreground 없음');
check('에셋', 'Android Icon (background)', fileExists('assets/android-icon-background.png'), 'Android adaptive icon background 없음');
check('에셋', 'Favicon', fileExists('assets/favicon.png'), 'favicon.png 없음');

// ═══════════════════════════════════════
// 결과 출력
// ═══════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║        MIRI App 출시 전 점검 결과               ║');
console.log('╚══════════════════════════════════════════════════╝\n');

const categories = [...new Set(results.map(r => r.category))];

let passCount = 0;
let failCount = 0;
let warnCount = 0;

for (const category of categories) {
  console.log(`\n── ${category} ──`);
  const catResults = results.filter(r => r.category === category);
  for (const r of catResults) {
    const icon = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`  ${icon} ${r.name}: ${r.message}`);
    if (r.status === 'PASS') passCount++;
    else if (r.status === 'FAIL') failCount++;
    else warnCount++;
  }
}

console.log('\n────────────────────────────────────────────');
console.log(`  PASS: ${passCount}  |  FAIL: ${failCount}  |  WARN: ${warnCount}`);
console.log('────────────────────────────────────────────');

if (failCount > 0) {
  console.log('\n[!] FAIL 항목이 있습니다. 출시 전 반드시 해결하세요.');
  process.exit(1);
} else if (warnCount > 0) {
  console.log('\n[!] WARN 항목을 수동으로 확인해주세요.');
  process.exit(0);
} else {
  console.log('\n모든 항목이 통과했습니다! 출시 준비 완료!');
  process.exit(0);
}
