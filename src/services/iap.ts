import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';
import { CONSUMABLE_IDS } from '../constants/iapProducts';
import { CONFIG } from '../constants/config';

let RNIap: any = null;

type PurchaseListener = (productId: string) => void;
type ErrorListener = (message: string) => void;

class IAPService {
  private initialized = false;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private onPurchaseSuccess: PurchaseListener | null = null;
  private onPurchaseError: ErrorListener | null = null;

  setListeners(onSuccess: PurchaseListener, onError: ErrorListener) {
    this.onPurchaseSuccess = onSuccess;
    this.onPurchaseError = onError;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    if (CONFIG.DEV_BYPASS_PAYMENT) {
      if (__DEV__) console.log('[IAP] DEV mode — bypassing IAP initialization');
      this.initialized = true;
      return true;
    }

    try {
      RNIap = await import('react-native-iap');
      await RNIap.setup();
      this.setupListeners();
      this.initialized = true;
      return true;
    } catch (err) {
      if (__DEV__) console.warn('[IAP] Init failed (expected in Expo Go):', err);
      return false;
    }
  }

  private setupListeners() {
    if (!RNIap) return;

    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: any) => {
        try {
          const verified = await this.verifyReceipt(purchase);
          if (verified) {
            await RNIap.finishTransaction({ purchase, isConsumable: true });
            this.onPurchaseSuccess?.(purchase.productId);
          } else {
            this.onPurchaseError?.('영수증 검증에 실패했습니다.');
          }
        } catch {
          this.onPurchaseError?.('구매 처리 중 오류가 발생했습니다.');
        }
      }
    );

    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: any) => {
        const message = error?.message ?? 'Purchase failed';
        if (!message.includes('cancel') && !message.includes('Cancel')) {
          this.onPurchaseError?.(message);
        }
      }
    );
  }

  async getProducts() {
    if (!RNIap) return [];
    try {
      return await RNIap.getProducts(CONSUMABLE_IDS);
    } catch {
      return [];
    }
  }

  async purchase(productId: string): Promise<boolean> {
    if (CONFIG.DEV_BYPASS_PAYMENT) {
      if (__DEV__) console.log('[IAP] DEV bypass — purchase simulated:', productId);
      return true;
    }

    if (!RNIap) {
      Alert.alert(
        '결제 불가',
        'Expo Go에서는 결제가 지원되지 않습니다.\n개발 빌드(EAS Build)에서 테스트해주세요.',
      );
      return false;
    }

    try {
      await RNIap.requestPurchase(productId);
      return true;
    } catch (err: any) {
      const message = err?.message ?? 'Purchase failed';
      if (!message.includes('cancel') && !message.includes('Cancel')) {
        this.showPurchaseError();
      }
      return false;
    }
  }

  async restorePurchases(): Promise<string[]> {
    if (!RNIap) return [];
    try {
      const purchases = await RNIap.getAvailablePurchases();
      return purchases.map((p: any) => p.productId);
    } catch {
      return [];
    }
  }

  async verifyReceipt(purchase: any): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: JSON.stringify({
          productId: purchase.productId,
          receipt: Platform.OS === 'ios'
            ? purchase.transactionReceipt
            : purchase.purchaseToken,
          platform: Platform.OS,
        }),
      });
      return !error && data?.verified === true;
    } catch {
      if (__DEV__) {
        console.warn('[IAP] Receipt verification failed, allowing in dev mode');
        return true;
      }
      return false;
    }
  }

  private showPurchaseError() {
    Alert.alert(
      '결제 오류',
      '결제 처리 중 문제가 발생했습니다.\n다시 시도해주세요.\n\n문제가 지속되면 support@myeongri-app.com으로 문의해주세요.',
      [{ text: '확인' }],
    );
  }

  destroy() {
    this.purchaseUpdateSubscription?.remove();
    this.purchaseErrorSubscription?.remove();
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
  }
}

export const iapService = new IAPService();
