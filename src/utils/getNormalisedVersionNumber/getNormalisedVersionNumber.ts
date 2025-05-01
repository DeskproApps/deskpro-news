/**
 * Normalises a version string to ensure it follows the "x.y.z" format.
 *
 * @param {string} version - A version string (e.g., "1.0", "2.3.4").
 * @returns {string} The normalised version string in "x.y.z" format.
 *
 * @example
 * getNormalisedVersionNumber("1.0") // returns "1.0.0"
 * getNormalisedVersionNumber("2.3.4") // returns "2.3.4"
 * getNormalisedVersionNumber("5") // returns "5.0.0"
 */
export default function getNormalisedVersionNumber(version: string): string {

    const isValidVersion = /^(\d+(\.\d+){0,2}(\.\d+)*)?$/.test(version)

    // If version is invalid, return "0.0.0"
    if (!isValidVersion) {
        return '0.0.0'
    }

    const parts = version ? version.split('.') : []
    while (parts.length < 3) parts.push('0')
    return parts.join('.')
}