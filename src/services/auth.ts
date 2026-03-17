import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// email + profile만 요청 (민감한 scope 없음 → Google 심사 없이 즉시 게시 가능)
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

// ─── Google Sign-In ───
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string; providerToken?: string }> {
  try {
    if (Platform.OS === 'web') {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, scopes: GOOGLE_SCOPES },
      });
      if (error) throw error;
      return { success: true };
    }

    // 네이티브 (iOS/Android): 인앱 브라우저
    const { makeRedirectUri } = await import('expo-auth-session');
    const WebBrowser = await import('expo-web-browser');

    const redirectTo = makeRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true, scopes: GOOGLE_SCOPES },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success') {
      return { success: false, error: 'Login cancelled' };
    }

    // PKCE flow: extract code
    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (code) {
      if (__DEV__) console.log('[Auth] PKCE code found, exchanging...');
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      const pt = sessionData.session?.provider_token;
      const userName = sessionData.session?.user?.user_metadata?.full_name ?? sessionData.session?.user?.user_metadata?.name;
      if (__DEV__) console.log('[Auth] Exchange success — provider_token:', !!pt, '— user name:', userName);
      return { success: true, providerToken: pt ?? undefined };
    }

    // Implicit flow fallback
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');

    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) throw sessionError;
      return { success: true };
    }

    return { success: false, error: 'No authentication data received' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google login failed';
    if (__DEV__) console.warn('[Auth] Google:', message);
    return { success: false, error: message };
  }
}

// ─── Kakao Sign-In ───
export async function signInWithKakao(): Promise<{ success: boolean; error?: string }> {
  try {
    // 카카오: 비즈앱 전환 전에는 닉네임만 가능 (account_email, profile_image 권한 없음)
    // Supabase GoTrue가 기본 scope를 덮어씌우도록 명시적으로 최소 scope만 지정
    const kakaoScopes = 'profile_nickname,openid';

    if (Platform.OS === 'web') {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo, scopes: kakaoScopes },
      });
      if (error) throw error;
      return { success: true };
    }

    const { makeRedirectUri } = await import('expo-auth-session');
    const WebBrowser = await import('expo-web-browser');

    const redirectTo = makeRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo, skipBrowserRedirect: true, scopes: kakaoScopes },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return { success: false, error: 'Login cancelled' };

    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      return { success: true };
    }

    const hashParams = new URLSearchParams(url.hash.substring(1));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');

    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) throw sessionError;
      return { success: true };
    }

    return { success: false, error: 'No authentication data received' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kakao login failed';
    if (__DEV__) console.warn('[Auth] Kakao:', message);
    return { success: false, error: message };
  }
}

// ─── LINE Sign-In (manual OAuth — Supabase 미지원) ───
// LINE Login → auth code → Edge Function(auth-line)에서 토큰 교환 + Supabase 세션 생성
export async function signInWithLine(): Promise<{ success: boolean; error?: string }> {
  try {
    const LINE_CLIENT_ID = Constants.expoConfig?.extra?.lineChannelId ?? process.env.EXPO_PUBLIC_LINE_CHANNEL_ID ?? '';
    if (!LINE_CLIENT_ID) throw new Error('LINE Channel ID not configured');

    const state = Math.random().toString(36).substring(2, 10);
    const nonce = Math.random().toString(36).substring(2, 10);

    if (Platform.OS === 'web') {
      const redirectUri = window.location.origin + '/auth/callback';
      const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email&nonce=${nonce}`;
      // Edge Function이 콜백을 처리하여 Supabase 세션을 생성
      window.location.href = authUrl;
      return { success: true };
    }

    // 네이티브: 인앱 브라우저
    const { makeRedirectUri } = await import('expo-auth-session');
    const WebBrowser = await import('expo-web-browser');

    const redirectUri = makeRedirectUri();
    const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email&nonce=${nonce}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    if (result.type !== 'success') return { success: false, error: 'Login cancelled' };

    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (!code) return { success: false, error: 'No authorization code received' };

    // Edge Function에서 코드 → LINE 토큰 교환 → Supabase 세션 생성
    const { data, error } = await supabase.functions.invoke('auth-line', {
      body: { code, redirectUri },
    });
    if (error) throw error;

    if (data?.access_token && data?.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) throw sessionError;
      return { success: true };
    }

    return { success: false, error: 'No session data from server' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LINE login failed';
    if (__DEV__) console.warn('[Auth] LINE:', message);
    return { success: false, error: message };
  }
}

// ─── Apple Sign-In ───
export async function signInWithApple(): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Sign-In is only available on iOS' };
    }

    const AppleAuthentication = await import('expo-apple-authentication');

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign-In failed: no identityToken');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apple login failed';
    if (__DEV__) console.warn('[Auth] Apple:', message);
    return { success: false, error: message };
  }
}

// ─── Guest (Anonymous) Sign-In ───
export async function signInAsGuest(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Guest login failed';
    if (__DEV__) console.warn('[Auth] Guest:', message);
    return { success: false, error: message };
  }
}

// ─── Fetch Google Profile (name + birthday) ───
export interface GoogleProfile {
  name?: string;
  email?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
}

export async function fetchGoogleProfile(providerTokenOverride?: string): Promise<GoogleProfile> {
  const profile: GoogleProfile = {};

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (__DEV__) {
      console.log('[Auth] fetchGoogleProfile — session exists:', !!session);
      console.log('[Auth] session.provider_token exists:', !!session?.provider_token);
      console.log('[Auth] providerTokenOverride exists:', !!providerTokenOverride);
    }

    if (!session) {
      console.warn('[Auth] No session found after login');
      return profile;
    }

    const meta = session.user?.user_metadata;
    if (__DEV__) console.log('[Auth] user_metadata keys:', meta ? Object.keys(meta) : 'none');

    // 이름: user_metadata에서 가져오기
    profile.name = meta?.full_name ?? meta?.name ?? undefined;

    // 이메일
    profile.email = session.user?.email ?? undefined;

    // Google People API: 이름(한국어) + 생년월일
    const providerToken = providerTokenOverride ?? session.provider_token;
    if (providerToken) {
      if (__DEV__) console.log('[Auth] Calling People API with token...');
      try {
        const res = await fetch(
          'https://people.googleapis.com/v1/people/me?personFields=names,birthdays',
          { headers: { Authorization: `Bearer ${providerToken}` } }
        );
        if (__DEV__) console.log('[Auth] People API response status:', res.status);
        if (res.ok) {
          const data = await res.json();

          // 이름: 한국어 이름 우선, 없으면 기본 이름
          if (data.names?.length) {
            const koName = data.names.find((n: any) =>
              n.metadata?.source?.type === 'PROFILE' &&
              /[\uAC00-\uD7AF]/.test(n.displayName)
            );
            const primaryName = data.names.find((n: any) => n.metadata?.primary) ?? data.names[0];
            const bestName = koName ?? primaryName;
            if (bestName?.displayName) {
              profile.name = bestName.displayName;
              if (__DEV__) console.log('[Auth] Name from People API:', profile.name);
            }
          }

          // 생년월일
          if (__DEV__) console.log('[Auth] People API birthdays count:', data.birthdays?.length ?? 0);
          const birthday = data.birthdays?.find(
            (b: any) => b.metadata?.source?.type === 'ACCOUNT'
          ) ?? data.birthdays?.[0];

          if (birthday?.date) {
            if (birthday.date.year) profile.birthYear = birthday.date.year;
            if (birthday.date.month) profile.birthMonth = birthday.date.month;
            if (birthday.date.day) profile.birthDay = birthday.date.day;
            if (__DEV__) console.log('[Auth] Birthday extracted:', birthday.date);
          } else {
            console.warn('[Auth] No birthday.date in response');
          }
        } else {
          const body = await res.text();
          console.warn('[Auth] People API error:', res.status, body.substring(0, 200));
        }
      } catch (e) {
        console.warn('[Auth] People API fetch failed:', e);
      }
    } else {
      console.warn('[Auth] No provider_token available — birthday/name fetch skipped.');
    }
  } catch (e) {
    console.warn('[Auth] fetchGoogleProfile error:', e);
  }

  if (__DEV__) console.log('[Auth] Final profile:', JSON.stringify(profile));
  return profile;
}

// ─── Sign Out ───
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Auth State Listener ───
export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
