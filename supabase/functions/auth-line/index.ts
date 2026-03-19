import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LINE_CHANNEL_ID = Deno.env.get('LINE_CHANNEL_ID') ?? '';
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, redirectUri } = await req.json();
    if (!code) throw new Error('Missing authorization code');

    // 1. LINE 토큰 교환
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`LINE token exchange failed: ${err}`);
    }

    const tokenData = await tokenRes.json();

    // 2. LINE 프로필 가져오기
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) throw new Error('Failed to fetch LINE profile');
    const profile = await profileRes.json();

    // 3. Supabase 유저 생성/업데이트 (service role)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = `line_${profile.userId}@line.myeongri.app`;

    // 기존 유저 찾기 또는 생성
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email === email || u.user_metadata?.line_user_id === profile.userId
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          line_user_id: profile.userId,
          full_name: profile.displayName,
          avatar_url: profile.pictureUrl,
          provider: 'line',
        },
      });
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          line_user_id: profile.userId,
          full_name: profile.displayName,
          avatar_url: profile.pictureUrl,
          provider: 'line',
        },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // 4. 세션 생성 (magic link 토큰 방식)
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError) throw sessionError;

    // token_hash로 세션 검증 → access_token + refresh_token 반환
    // 클라이언트가 이 토큰으로 setSession 호출
    const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({
        type: 'magiclink',
        token_hash: sessionData.properties?.hashed_token,
      }),
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      throw new Error(`Session verification failed: ${errText}`);
    }

    const session = await verifyRes.json();

    return new Response(JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: userId,
        name: profile.displayName,
        avatar: profile.pictureUrl,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[auth-line]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
