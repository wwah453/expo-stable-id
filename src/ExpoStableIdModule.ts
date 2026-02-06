import { requireNativeModule } from 'expo';

declare class ExpoStableIdModuleType {
  fetchAppTransactionId(): Promise<string | null>;
}

export default requireNativeModule<ExpoStableIdModuleType>('ExpoStableId');
