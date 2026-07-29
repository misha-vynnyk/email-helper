/**
 * Shared SSRF guard for routes that fetch a URL supplied by the client
 * (image proxy, convert-from-url). Kept in one place so the two routes
 * can't drift out of sync the way they did before.
 */

/** @param {string} hostname already-lowercased URL hostname */
function isPrivateOrLocalHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("169.254.") || // link-local, incl. cloud metadata (AWS/GCP)
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
}

module.exports = { isPrivateOrLocalHost };
