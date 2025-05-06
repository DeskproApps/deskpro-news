import { NewsArticle } from "@/types"
import filterAndCheckNewReleases from "./filterAndCheckNewReleases"

describe('filterAndCheckNewReleases', () => {
    const mockCurrentDate = new Date('2025-01-01')
    const oneYearAgo = new Date(mockCurrentDate)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(mockCurrentDate)
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe('Release Note Title Handling', () => {
        it('should handle "Deskpro Release" titles', () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2025.1.0',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/2025.1.0'
                }
            ]

            const result = filterAndCheckNewReleases('2025.0.0', newsArticles)
            expect(result.filteredNewsArticles.length).toBe(0)
            expect(result.latestRelease?.version).toBe('2025.1.0')
        })

        it('should handle "Deskpro Horizon Release" titles', () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Horizon Release 2025.2.0',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/2025.2.0'
                }
            ]

            const result = filterAndCheckNewReleases('2025.1.0', newsArticles)
            expect(result.filteredNewsArticles.length).toBe(0)
            expect(result.latestRelease?.version).toBe('2025.2.0')
            expect(result.latestRelease?.title).toBe('Deskpro Horizon Release 2025.2.0')
            expect(result.latestRelease?.url).toBe('https://example.com/2025.2.0')
        })

        it('should filter out poorly formatted titles', () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Invalid Release Title',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/blahblah'
                },
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Update 2025.1.0',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/blah'
                }
            ]

            const result = filterAndCheckNewReleases('2025.0.0', newsArticles)
            expect(result.filteredNewsArticles.length).toBe(0)
            expect(result.latestRelease).toBeUndefined()
        })
    })

    describe('Version Comparison', () => {
        it('should return the latest version regardless of publish date order', () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2025.3.0',
                    published: new Date('2025-03-15').getTime(),
                    link: 'https://example.com/2025.3.0'
                },
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2025.2.0',
                    published: new Date('2025-03-20').getTime(),
                    link: 'https://example.com/2025.2.0'
                },
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2025.4.0',
                    published: new Date('2025-03-10').getTime(),
                    link: 'https://example.com/2025.4.0'
                }
            ]

            const result = filterAndCheckNewReleases('2025.1.0', newsArticles)
            expect(result.latestRelease?.version).toBe('2025.4.0')
            expect(result.latestRelease?.url).toBe('https://example.com/2025.4.0')
        })

        it('should normalize versions correctly (adding .0 if missing)', () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2025.1',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/2025.1'
                }
            ]

            const result = filterAndCheckNewReleases('2025.0.0', newsArticles)
            expect(result.filteredNewsArticles.length).toBe(0)
            expect(result.latestRelease?.version).toBe('2025.1.0')
        })
    })

    describe('Publish Date Filtering', () => {
        it('should filter out releases older than one year', () => {
            const justOverOneYearAgo = new Date(oneYearAgo)
            justOverOneYearAgo.setDate(oneYearAgo.getDate() - 1)

            const newsArticles: NewsArticle[] = [
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2024.1.0',
                    published: oneYearAgo.getTime(),
                    link: 'https://example.com/2024.1.0'
                },
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2023.12.0',
                    published: justOverOneYearAgo.getTime(),
                    link: 'https://example.com/2023.12.0'
                },
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2025.1.0',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/2025.1.0'
                }
            ]

            const result = filterAndCheckNewReleases('2025.0.0', newsArticles)
            expect(result.filteredNewsArticles.length).toBe(1)
            expect(result.filteredNewsArticles[0].title).toBe('Deskpro Release 2024.1.0')
            expect(result.latestRelease?.version).toBe('2025.1.0')
            expect(result.latestRelease?.url).toBe('https://example.com/2025.1.0')
        })
    })

    describe('Mixed Article Types', () => {
        it('should handle mixed release and non-release articles', () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: 'product-agent',
                    created: 123456789,
                    title: 'New feature announcement',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/blah'
                },
                {
                    type: 'release',
                    created: 123456789,
                    title: 'Deskpro Release 2025.2.0',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/2025.2.0'
                },
                {
                    type: "product-admin",
                    created: 123456789,
                    title: 'Product Admin Article',
                    published: mockCurrentDate.getTime(),
                    link: 'https://example.com/blah'
                }
            ]

            const result = filterAndCheckNewReleases('2025.1.0', newsArticles)
            expect(result.filteredNewsArticles.length).toBe(2)
            expect(result.filteredNewsArticles.some(article => article.type === 'product-admin')).toBe(true)
            expect(result.filteredNewsArticles.some(article => article.type === "product-agent")).toBe(true)
            expect(result.latestRelease?.version).toBe('2025.2.0')
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty input', () => {
            const result = filterAndCheckNewReleases('2025.1.0', [])
            expect(result.filteredNewsArticles.length).toBe(0)
            expect(result.latestRelease).toBeUndefined()
        })

        it('should return empty when no newer versions exist', () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: 'release',
                    title: 'Deskpro Release 2025.1.0',
                    published: mockCurrentDate.getTime(),
                    created: 123456789,
                    link: 'https://example.com/2025.1.0'
                }
            ]

            const result = filterAndCheckNewReleases('2025.2.0', newsArticles)
            expect(result.filteredNewsArticles.length).toBe(1)
            expect(result.latestRelease).toBeUndefined()
        })

        it('should handle exact version matches', () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: 'release',
                    title: 'Deskpro Release 2025.1.0',
                    published: mockCurrentDate.getTime(),
                    created: 123456789,
                    link: 'https://example.com/2025.1.0'
                }
            ]

            const result = filterAndCheckNewReleases('2025.1.0', newsArticles)
            expect(result.filteredNewsArticles.length).toBe(1)
            expect(result.latestRelease).toBeUndefined()
        })
    })
})