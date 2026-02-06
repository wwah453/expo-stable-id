// Re-exports expo-cloud-settings config plugin.
// Since expo-stable-id uses expo-cloud-settings for cloud storage,
// the iCloud KVS entitlement is needed.
const cloudSettingsPlugin = require('@nauverse/expo-cloud-settings/app.plugin');
module.exports = cloudSettingsPlugin;
