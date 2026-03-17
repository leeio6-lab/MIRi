/**
 * Shared helper: 서버 기반 분석 레코드 관리
 * Edge Function에서 import하여 사용
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface UserInfo {
  userId: string;
  isAnonymous: boolean;
}

/** JWT에서 사용자 정보 추출 */
export function getUserFromRequest(req: Request): UserInfo | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub,
      isAnonymous: payload.is_anonymous === true,
    };
  } catch {
    return null;
  }
}

/** Supabase admin 클라이언트 (service role key — RLS 바이패스) */
export function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

/** 분석 레코드 생성 (status: processing) */
export async function createProcessingRecord(
  userId: string,
  type: 'saju' | 'face' | 'compatibility',
  isPaid: boolean,
  inputData?: unknown,
): Promise<string | null> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from('analyses')
      .insert({
        user_id: userId,
        type,
        is_paid: isPaid,
        input_data: inputData ?? null,
        status: 'processing',
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[analysis-db] createProcessingRecord error:`, error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.error(`[analysis-db] createProcessingRecord exception:`, e);
    return null;
  }
}

/** 분석 완료: result 저장 + status → completed */
export async function completeRecord(
  analysisId: string,
  result: unknown,
): Promise<void> {
  try {
    const admin = getAdminClient();
    await admin
      .from('analyses')
      .update({ result, status: 'completed' })
      .eq('id', analysisId);
  } catch (e) {
    console.error(`[analysis-db] completeRecord exception:`, e);
  }
}

/** 분석 실패: status → failed */
export async function failRecord(
  analysisId: string,
  errorMsg?: string,
): Promise<void> {
  try {
    const admin = getAdminClient();
    await admin
      .from('analyses')
      .update({
        status: 'failed',
        result: errorMsg ? { _error: errorMsg } : null,
      })
      .eq('id', analysisId);
  } catch (e) {
    console.error(`[analysis-db] failRecord exception:`, e);
  }
}
