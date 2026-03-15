export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  isLunar: boolean;
  gender: 'male' | 'female';
  locale: string;
  createdAt: string;
  birthCity?: string;       // city id like 'kr-seoul'
  birthLongitude?: number;  // for solar time correction
  birthUtcOffset?: number;  // timezone UTC offset
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  type: 'saju' | 'face' | 'compatibility';
  isPaid: boolean;
  result: unknown;
  createdAt: string;
}
