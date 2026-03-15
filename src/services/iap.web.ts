// Web stub for IAP — in-app purchases are not available on web
import { Alert } from 'react-native';

type PurchaseListener = (productId: string) => void;
type ErrorListener = (message: string) => void;

class IAPService {
  private onPurchaseSuccess: PurchaseListener | null = null;
  private onPurchaseError: ErrorListener | null = null;

  setListeners(onSuccess: PurchaseListener, onError: ErrorListener) {
    this.onPurchaseSuccess = onSuccess;
    this.onPurchaseError = onError;
  }

  async initialize(): Promise<boolean> { return true; }
  async getProducts() { return []; }

  async purchase(_productId: string): Promise<boolean> {
    Alert.alert('웹 결제 불가', '웹에서는 앱 내 결제가 지원되지 않습니다.\n모바일 앱에서 이용해주세요.');
    return false;
  }

  async restorePurchases(): Promise<string[]> { return []; }
  async verifyReceipt(_purchase: any): Promise<boolean> { return false; }
  destroy() {}
}

export const iapService = new IAPService();
