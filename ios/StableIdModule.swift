import ExpoModulesCore
import StoreKit

public class StableIdModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoStableId")

    AsyncFunction("fetchAppTransactionId") { () -> String? in
      if #available(iOS 16.0, *) {
        do {
          let result = try await AppTransaction.shared
          switch result {
          case .verified(let transaction):
            return String(transaction.appTransactionID)
          case .unverified:
            return nil
          }
        } catch {
          return nil
        }
      }
      return nil
    }
  }
}
