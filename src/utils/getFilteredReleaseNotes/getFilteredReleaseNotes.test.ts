import { NewsArticle } from "@/types"
import { OnPremRelease } from "@/api/getOnPremReleases/getOnPremReleases"
import getFilteredReleaseNotes from "./getFilteredReleaseNotes"

function generateMockOnPremReleases(releaseVersions: string[]): OnPremRelease[] {
    return releaseVersions.map((releaseVersion) => {
        return {
            version: releaseVersion,
            date: "fake-date",
            docker_tag: "blah"
        }
    })
}

describe("getFilteredReleaseNotes", () => {
    const mockCurrentDate = new Date("2025-01-01")
    const oneYearAgo = new Date(mockCurrentDate)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(mockCurrentDate)
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe("Release Note Title Handling", () => {
        it("should handle \"Deskpro Release\" titles only if included in onPremReleases and above 2025.3.0", () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.3.0",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/2025.3.0"
                }
            ]

            const onPremReleases1 = generateMockOnPremReleases(["2025.3.0"])
            const result1 = getFilteredReleaseNotes({
                currentVersion: "2025.0.0",
                newsArticles,
                onPremReleases: onPremReleases1,
                isCloud: false
            })

            expect(result1.filteredNewsArticles.length).toBe(0)
            expect(result1.latestOnPremRelease?.version).toBe("2025.3.0")

            const onPremReleases2 = generateMockOnPremReleases([])
            const result2 = getFilteredReleaseNotes({
                currentVersion: "2025.0.0",
                newsArticles,
                onPremReleases: onPremReleases2,
                isCloud: false
            })

            expect(result2.filteredNewsArticles.length).toBe(0)
            expect(result2.latestOnPremRelease?.version).toBe(undefined)
        })

        it("should handle \"Deskpro Horizon Release\" titles", () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Horizon Release 2025.6.0",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/2025.6.0"
                }
            ]

            const onPremReleases = generateMockOnPremReleases(["2025.6.0"])

            const result = getFilteredReleaseNotes({
                currentVersion: "2025.1.0",
                newsArticles,
                onPremReleases,
                isCloud: false
            })
            expect(result.filteredNewsArticles.length).toBe(0)
            expect(result.latestOnPremRelease?.version).toBe("2025.6.0")
            expect(result.latestOnPremRelease?.title).toBe("Deskpro Horizon Release 2025.6.0")
            expect(result.latestOnPremRelease?.url).toBe("https://example.com/2025.6.0")
        })

        it("should filter out poorly formatted titles", () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: "release",
                    created: 123456789,
                    title: "Invalid Release Title",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/blahblah"
                },
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Update 2025.7.0",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/blah"
                },
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.8.0",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/blah"
                }
            ]

            const result = getFilteredReleaseNotes({
                currentVersion: "2025.9.0",
                newsArticles,
                onPremReleases: [],
                isCloud: true,
                releaseVersionThreshold: "2025.6.0"
            })
            expect(result.filteredNewsArticles.length).toBe(1)
            expect(result.filteredNewsArticles[0]?.title).toBe("Deskpro Release 2025.8.0")
        })
    })

    describe("Version Comparison", () => {
        it("should return the latest version regardless of publish date order", () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.3.0",
                    published: new Date("2025-04-15").getTime(),
                    link: "https://example.com/2025.3.0"
                },
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.2.0",
                    published: new Date("2025-04-20").getTime(),
                    link: "https://example.com/2025.2.0"
                },
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.4.0",
                    published: new Date("2025-04-10").getTime(),
                    link: "https://example.com/2025.4.0"
                }
            ]

            const onPremReleases = generateMockOnPremReleases(["2025.4.0"])

            const result = getFilteredReleaseNotes({
                currentVersion: "2025.1.0",
                newsArticles,
                onPremReleases,
                isCloud: false
            })
            expect(result.latestOnPremRelease?.version).toBe("2025.4.0")
            expect(result.latestOnPremRelease?.url).toBe("https://example.com/2025.4.0")
        })

        it("should normalise versions correctly (adding .0 if missing)", () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.7",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/2025.1"
                }
            ]

            const onPremReleases = generateMockOnPremReleases(["2025.7.0"])

            const result = getFilteredReleaseNotes({
                currentVersion: "2025.0.0",
                newsArticles,
                onPremReleases,
                isCloud: false
            })
            expect(result.filteredNewsArticles.length).toBe(0)
            expect(result.latestOnPremRelease?.version).toBe("2025.7.0")
        })
    })

    describe("Publish Date Filtering", () => {
        it("should filter out releases older than one year", () => {
            const justOverOneYearAgo = new Date(oneYearAgo)
            justOverOneYearAgo.setDate(oneYearAgo.getDate() - 1)

            const newsArticles: NewsArticle[] = [
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.4.0",
                    published: oneYearAgo.getTime(),
                    link: "https://example.com/2025.4.0"
                },
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.12.0",
                    published: justOverOneYearAgo.getTime(),
                    link: "https://example.com/2023.12.0"
                },
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.7.0",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/2025.7.0"
                }
            ]

            const onPremReleases = generateMockOnPremReleases(["2025.7.0"])

            const result = getFilteredReleaseNotes({
                currentVersion: "2025.5.0",
                newsArticles,
                onPremReleases,
                isCloud: false
            })
            expect(result.filteredNewsArticles.length).toBe(1)
            expect(result.filteredNewsArticles[0].title).toBe("Deskpro Release 2025.4.0")
            expect(result.latestOnPremRelease?.version).toBe("2025.7.0")
            expect(result.latestOnPremRelease?.url).toBe("https://example.com/2025.7.0")
        })
    })

    describe("Mixed Article Types", () => {
        it("should handle mixed release and non-release articles", () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: "product-agent",
                    created: 123456789,
                    title: "New feature announcement",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/blah"
                },
                {
                    type: "release",
                    created: 123456789,
                    title: "Deskpro Release 2025.8.0",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/2025.8.0"
                },
                {
                    type: "product-admin",
                    created: 123456789,
                    title: "Product Admin Article",
                    published: mockCurrentDate.getTime(),
                    link: "https://example.com/blah"
                }
            ]

            const onPremReleases = generateMockOnPremReleases(["2025.8.0"])

            const result = getFilteredReleaseNotes({
                currentVersion: "2025.1.0",
                newsArticles,
                onPremReleases,
                isCloud: false
            })
            expect(result.filteredNewsArticles.length).toBe(2)
            expect(result.filteredNewsArticles.some(article => article.type === "product-admin")).toBe(true)
            expect(result.filteredNewsArticles.some(article => article.type === "product-agent")).toBe(true)
            expect(result.latestOnPremRelease?.version).toBe("2025.8.0")
        })
    })

    describe("Edge Cases", () => {
        it("should handle empty input", () => {
            const result = getFilteredReleaseNotes({
                currentVersion: "2025.1.0",
                newsArticles: [],
                onPremReleases: [],
                isCloud: true
            })
            expect(result.filteredNewsArticles.length).toBe(0)
            expect(result.latestOnPremRelease).toBeUndefined()
        })

        it("should return empty when no newer versions exist", () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: "release",
                    title: "Deskpro Release 2025.4.0",
                    published: mockCurrentDate.getTime(),
                    created: 123456789,
                    link: "https://example.com/2025.1.0"
                }
            ]

            const result = getFilteredReleaseNotes({
                currentVersion: "2025.7.0",
                newsArticles,
                onPremReleases: [],
                isCloud: true
            })
            expect(result.filteredNewsArticles.length).toBe(1)
            expect(result.latestOnPremRelease).toBeUndefined()
        })

        it("should handle exact version matches", () => {
            const newsArticles: NewsArticle[] = [
                {
                    type: "release",
                    title: "Deskpro Release 2025.3.0",
                    published: mockCurrentDate.getTime(),
                    created: 123456789,
                    link: "https://example.com/2025.3.0"
                }
            ]

            const result = getFilteredReleaseNotes({
                currentVersion: "2025.3.0",
                newsArticles,
                onPremReleases: [],
                isCloud: true
            })

            expect(result.filteredNewsArticles.length).toBe(1)
            expect(result.latestOnPremRelease).toBeUndefined()
        })
    })
})
