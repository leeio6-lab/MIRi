// Analytics service - tracks user events for improving the app
// In production, integrate with Firebase Analytics, Mixpanel, or Amplitude

type EventName =
  | 'app_open'
  | 'onboarding_complete'
  | 'birth_input_submit'
  | 'saju_analyze'
  | 'saju_paid'
  | 'face_capture'
  | 'face_analyze'
  | 'face_paid'
  | 'compatibility_analyze'
  | 'compatibility_paid'
  | 'daily_fortune_view'
  | 'share_card'
  | 'paywall_view'
  | 'paywall_purchase'
  | 'paywall_close'
  | 'referral_invite'
  | 'referral_redeem'
  | 'language_change'
  | 'push_permission'
  | 'push_open';

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

class AnalyticsService {
  private enabled = true;

  track(event: EventName, params?: EventParams): void {
    if (!this.enabled) return;

    // TODO: Send to analytics provider
    if (__DEV__) {
      console.log('[Analytics]', event, params ?? '');
    }
  }

  setUser(userId: string, properties?: EventParams): void {
    if (!this.enabled) return;
    // TODO: Set user properties in analytics provider
    if (__DEV__) {
      console.log('[Analytics] setUser', userId, properties ?? '');
    }
  }

  disable(): void {
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }
}

export const analytics = new AnalyticsService();
