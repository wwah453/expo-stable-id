package expo.modules.stableid

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StableIdModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoStableId")

    AsyncFunction("fetchAppTransactionId") {
      null as String?
    }
  }
}
