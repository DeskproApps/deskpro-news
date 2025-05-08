import getNormalisedVersionNumber from './getNormalisedVersionNumber';

describe('getNormalisedVersionNumber', () => {
    it('adds missing patch version (1.0 -> 1.0.0)', () => {
        expect(getNormalisedVersionNumber('1.0')).toBe('1.0.0')
    })

    it('adds missing minor and patch version (2 -> 2.0.0)', () => {
        expect(getNormalisedVersionNumber('2')).toBe('2.0.0')
    })

    it('returns the same version if already in x.y.z format', () => {
        expect(getNormalisedVersionNumber('3.1.4')).toBe('3.1.4')
    })

    it('leaves extra segments untouched (3.1.4.5 -> 3.1.4.5)', () => {
        expect(getNormalisedVersionNumber('3.1.4.5')).toBe('3.1.4.5')
    })

    it('works with leading zeros', () => {
        expect(getNormalisedVersionNumber('01.2')).toBe('01.2.0')
    })

    it('handles empty string input', () => {
        expect(getNormalisedVersionNumber('')).toBe('0.0.0')
    })

    it('handles invalid version input (e.g., non-numeric)', () => {
        expect(getNormalisedVersionNumber('Releases 01.2')).toBe('0.0.0');
      })
})
