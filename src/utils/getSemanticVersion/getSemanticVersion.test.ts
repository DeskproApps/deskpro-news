import getSemanticVersion from './getSemanticVersion'

describe('getSemanticVersion', () => {
    it('extracts a full semantic version (x.y.z)', () => {
        expect(getSemanticVersion('Deskpro Release 2025.5.1')).toBe('2025.5.1')
    });

    it('extracts a partial semantic version (x.y)', () => {
        expect(getSemanticVersion('Deskpro Release v2026.5.1')).toBe('2026.5.1')
    });

    it('returns "0.0.0" when no version is present', () => {
        expect(getSemanticVersion('Deskpro Release')).toBe('0.0.0')
    });

    it('extracts only the first version if multiple are present', () => {
        expect(getSemanticVersion('Deskpro Release 2027.5.1, goodbye Deskpro Release 2026.5.1')).toBe('2027.5.1')
    });

    it('handles version numbers without a prefix', () => {
        expect(getSemanticVersion('2028.5.1 is the new release version')).toBe('2028.5.1')
    });

    it('ignores numbers that don’t fit semantic versioning', () => {
        expect(getSemanticVersion('Deskpro Release 1')).toBe('0.0.0')
    });

    it('matches versions with only digits and dots', () => {
        expect(getSemanticVersion('Deskpro Release v2029.5.1-beta')).toBe('2029.5.1')
    });
});
