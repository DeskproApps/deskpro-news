import { FeedItem } from "@/types";
import semver from 'semver';

export interface FilteredReleasesResponse {
    filteredNewsArticles: FeedItem[]
    /**
    * Information about the latest available release (if newer than current version).
    */
    latestRelease?: {
        title: string
        version: string
        url: string
    }
}

/**
 * Filters news articles to find relevant release notes based on the user's installed version and checks for newer versions.
 * 
 * @param {string} currentVersion - The current Deskpro version e.g. "2025.9.97"
 * @param {FeedItem[]} newsArticles - Array of news articles
 */
export default function filterAndCheckNewReleases(currentVersion: string, newsArticles: FeedItem[]): FilteredReleasesResponse {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    let latestRelease: FilteredReleasesResponse['latestRelease'] = undefined

    const filteredNewsArticles = newsArticles.filter((newsArticle) => {
        // Skip non-release articles
        if (newsArticle.type !== "release") {
            return true
        }

        // Check for release notes matching "Deskpro Release" and "Deskpro Horizon Release" patterns
        const versionMatch = newsArticle.title.match(
            /Deskpro (?:Horizon )?Release (?<version>\d{4}\.\d+(?:\.\d+)?)/
        );

        if (!versionMatch?.groups?.version) {
            return false
        }

        const versionString = versionMatch.groups.version

        // Normalise to XXXX.X.X format
        const versionParts = versionString.split('.')
        if (versionParts.length === 2) versionParts.push('0')
        const normalizedVersion = versionParts.join('.')

        // Check if the version is valid
        if (!semver.valid(normalizedVersion)) {
            return false
        }

        // Check if the release is older than 1 year
        // @todo: This should also filter out release notes made before 2025.3.0 
        const publishedDate = new Date(newsArticle.published)
        if (publishedDate < oneYearAgo) {
            return false
        }

        // Check if the release is newer than the current version 
        if (semver.gt(normalizedVersion, currentVersion)) {
            // Update latestRelease if this is the latest version we've found so far
            // This way we'll always direct the user to the latest release even if the
            // order of the notes aren't accurate.
            if (!latestRelease || semver.gt(normalizedVersion, latestRelease.version)) {
                latestRelease = {
                    title: newsArticle.title,
                    version: normalizedVersion,
                    url: newsArticle.link
                }
            }

            return false
        }

        return true
    })

    return {
        filteredNewsArticles,
        latestRelease
    };
}