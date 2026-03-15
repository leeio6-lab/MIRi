import { useEffect } from 'react';
import { iapService } from '../services/iap';
import { usePurchaseStore } from '../stores/purchaseStore';
import { CONFIG } from '../constants/config';

export function usePurchase() {
  const store = usePurchaseStore();

  useEffect(() => {
    // IAP 이벤트 리스너를 store 액션에 연결
    iapService.setListeners(
      (productId) => store.onPurchaseSuccess(productId),
      (message) => store.onPurchaseError(message)
    );
    iapService.initialize();
    return () => iapService.destroy();
  }, []);

  return {
    ...store,
    isDevMode: CONFIG.DEV_BYPASS_PAYMENT,
  };
}
