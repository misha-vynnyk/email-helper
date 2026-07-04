/**
 * Build-time feature flags.
 */

// The email validator was migrated to a DOM-based engine but is not yet
// polished enough for end users — hidden for the v1.0 release.
// Flip to true to bring the panel back in the Email Sender tab.
export const EMAIL_VALIDATOR_ENABLED = false;

// Block Library is hidden for the v1.0 release.
// Flip to true to bring the tab back in the main navigation.
export const BLOCK_LIBRARY_ENABLED = false;
