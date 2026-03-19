import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Apple 영수증 검증 ───
async function verifyAppleReceipt(receipt: string): Promise<boolean> {
  const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET') ?? '';

  const payload = {
    'receipt-data': receipt,
    password: APPLE_SHARED_SECRET,
    'exclude-old-transactions': true,
  };

  // Production 먼저 시도
  let response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let result = await response.json();

  // status 21007 = sandbox receipt
  if (result.status === 21007) {
    response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    result = await response.json();
  }

  if (result.status !== 0) {
    console.error('[Apple] Verification failed, status:', result.status);
    return false;
  }

  // 소비성 상품: in_app 배열 확인
  const inApp = result.receipt?.in_app;
  return !!(inApp && inApp.length > 0);
}

// ─── Google Play 영수증 검증 ───
async function verifyGoogleReceipt(productId: string, purchaseToken: string): Promise<boolean> {
  const GOOGLE_SERVICE_ACCOUNT = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!GOOGLE_SERVICE_ACCOUNT) {
    console.error('[Google] No service account JSON configured');
    return false;
  }

  const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
  const accessToken = await getGoogleAccessToken(serviceAccount);
  if (!accessToken) return false;

  const packageName = 'com.myeongri.app';
  const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error('[Google] API error:', response.status);
    return false;
  }

  const data = await response.json();
  // purchaseState 0 = 구매 완료
  return data.purchaseState === 0;
}

// ─── Google Service Account → Access Token ───
async function getGoogleAccessToken(serviceAccount: any): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedClaim = base64url(JSON.stringify(claim));
    const signatureInput = `${encodedHeader}.${encodedClaim}`;

    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToBuffer(serviceAccount.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(signatureInput),
    );

    const jwt = `${signatureInput}.${base64url(signature)}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token ?? null;
  } catch (err) {
    console.error('[Google] Token generation failed:', err);
    return null;
  }
}

function base64url(input: string | ArrayBuffer): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

// ─── Main Handler ───
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { productId, receipt, platform } = await req.json();

    if (!receipt || !productId) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Missing receipt or productId' }),
        { status: 400, headers: CORS_HEADERS },
      );
    }

    let verified = false;

    if (platform === 'ios') {
      verified = await verifyAppleReceipt(receipt);
    } else if (platform === 'android') {
      verified = await verifyGoogleReceipt(productId, receipt);
    } else {
      return new Response(
        JSON.stringify({ verified: false, error: 'Unsupported platform' }),
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // DB에 구매 기록 저장
    if (verified) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
          const supabase = createClient(supabaseUrl, supabaseKey);

          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);

          if (user) {
            await supabase.from('purchases').insert({
              user_id: user.id,
              product_id: productId,
              platform,
              receipt_data: receipt.substring(0, 500),
              is_valid: true,
            });
          }
        } catch (dbErr) {
          console.error('[DB] Purchase record failed:', dbErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ verified, productId, platform }),
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[verify-purchase] Error:', error);
    return new Response(
      JSON.stringify({ verified: false, error: 'Verification failed' }),
      { status: 500, headers: CORS_HEADERS },
    );
  }
});
