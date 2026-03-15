const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// MIRI 앱 아이콘: 다크 네이비 배경 + 골드 원형 + "命" 한자
async function generateIcon() {
  const size = 1024;
  const svg = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" style="stop-color:#1E1B2E"/>
        <stop offset="100%" style="stop-color:#0B0A0F"/>
      </radialGradient>
      <radialGradient id="glow" cx="50%" cy="45%" r="35%">
        <stop offset="0%" style="stop-color:#E8B04A;stop-opacity:0.25"/>
        <stop offset="100%" style="stop-color:#E8B04A;stop-opacity:0"/>
      </radialGradient>
      <radialGradient id="orb" cx="45%" cy="40%" r="40%">
        <stop offset="0%" style="stop-color:#F5D78E"/>
        <stop offset="50%" style="stop-color:#E8B04A"/>
        <stop offset="100%" style="stop-color:#C4912E"/>
      </radialGradient>
    </defs>
    <!-- Background -->
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <!-- Gold glow behind orb -->
    <circle cx="512" cy="480" r="380" fill="url(#glow)"/>
    <!-- Subtle ring -->
    <circle cx="512" cy="480" r="260" fill="none" stroke="#E8B04A" stroke-width="2" opacity="0.15"/>
    <circle cx="512" cy="480" r="320" fill="none" stroke="#E8B04A" stroke-width="1" opacity="0.08"/>
    <!-- Crystal orb -->
    <circle cx="512" cy="480" r="200" fill="url(#orb)" opacity="0.9"/>
    <!-- Light reflection -->
    <ellipse cx="460" cy="420" rx="60" ry="40" fill="#F5D78E" opacity="0.3"/>
    <!-- "命" character -->
    <text x="512" y="520" text-anchor="middle" fill="#0B0A0F" font-size="220" font-weight="700" font-family="serif" opacity="0.85">命</text>
    <!-- MIRI text at bottom -->
    <text x="512" y="820" text-anchor="middle" fill="#E8B04A" font-size="80" font-weight="700" font-family="sans-serif" letter-spacing="20" opacity="0.9">MIRI</text>
    <!-- Subtle border glow -->
    <rect x="20" y="20" width="984" height="984" rx="200" fill="none" stroke="#E8B04A" stroke-width="3" opacity="0.1"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));

  console.log('icon.png generated (1024x1024)');

  // Adaptive icon foreground (Android)
  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'android-icon-foreground.png'));

  console.log('android-icon-foreground.png generated');
}

// Splash icon
async function generateSplash() {
  const svg = `
  <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="orb2" cx="45%" cy="40%" r="45%">
        <stop offset="0%" style="stop-color:#F5D78E"/>
        <stop offset="100%" style="stop-color:#C4912E"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="90" r="70" fill="url(#orb2)" opacity="0.9"/>
    <text x="100" y="110" text-anchor="middle" fill="#0B0A0F" font-size="75" font-weight="700" font-family="serif" opacity="0.85">命</text>
    <text x="100" y="180" text-anchor="middle" fill="#E8B04A" font-size="28" font-weight="700" font-family="sans-serif" letter-spacing="8">MIRI</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .resize(200, 200)
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));

  console.log('splash-icon.png generated (200x200)');
}

// Favicon
async function generateFavicon() {
  const svg = `
  <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="8" fill="#0B0A0F"/>
    <circle cx="24" cy="22" r="14" fill="#E8B04A" opacity="0.9"/>
    <text x="24" y="28" text-anchor="middle" fill="#0B0A0F" font-size="16" font-weight="700" font-family="serif">命</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .resize(48, 48)
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));

  console.log('favicon.png generated');
}

async function main() {
  await generateIcon();
  await generateSplash();
  await generateFavicon();
  console.log('All icons generated!');
}

main().catch(console.error);
