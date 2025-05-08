/**
 * Extracts the first semantic version number (e.g., "1.2.3" or "1.2") from a given string.
 *
 *
 * @param {string} input - The input string potentially containing a semantic version.
 * @returns {string} The extracted semantic version, or "0.0.0" if no valid version is found.
 *
 * @example
 * getSemanticVersion("Deskpro 2.5.1") // returns "2.5.1"
 * getSemanticVersion("Deskpro v1.0") // returns "1.0"
 * getSemanticVersion("Deskpro") // returns "0.0.0"
 */
export default function getSemanticVersion (input: string): string {
    const versionRegex = /(?:v)?(\d+\.\d+\.\d+|\d+\.\d+)/
    const match = input.match(versionRegex)
    return match ? match[1] : "0.0.0"
  }