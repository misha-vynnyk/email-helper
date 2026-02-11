/**
 * Clipboard utilities for copying text to clipboard
 * Includes fallback for older browsers
 */

/**
 * Copies text to clipboard with fallback for older browsers
 * @param text - Text to copy to clipboard
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Modern clipboard API
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers or when clipboard API is not available
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textArea);

      return success;
    } catch {
      console.error("Failed to copy to clipboard:", err);
      return false;
    }
  }
};
