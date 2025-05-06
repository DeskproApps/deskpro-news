import { NewsArticle } from "@/types";
import semver from 'semver';
import getNormalisedVersionNumber from "../getNormalisedVersionNumber";
import { OnPremRelease } from "@/api/getOnPremReleases/getOnPremReleases";

export interface FilteredReleasesResponse {
    filteredNewsArticles: NewsArticle[]
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
 * @param {NewsArticle[]} newsArticles - Array of news articles
 */
export default function filterAndCheckNewReleases(currentVersion: string, newsArticles: NewsArticle[], onPremReleases: OnPremRelease[]): FilteredReleasesResponse {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    let latestRelease: FilteredReleasesResponse['latestRelease'] = undefined

    // Create a Set of "major.minor" from onPremReleases
    const onPremMajorMinorSet = new Set(
        onPremReleases.map(release => {
            const normalized = getNormalisedVersionNumber(release.version);
            const parsed = semver.parse(normalized);
            return parsed ? `${parsed.major.toString()}.${parsed.minor.toString()}` : null;
        }).filter(Boolean)
    )

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

        // Normalise to XXXX.X.X format
        const normalizedVersion = getNormalisedVersionNumber(versionMatch.groups.version)

        // Check if the version is valid
        if (!semver.valid(normalizedVersion)) {
            return false
        }

        // Check if the release is for a version before the starting point
        if (semver.lt(normalizedVersion, "2025.3.0")) {
            return false
        }

        // Check if the release is older than 1 year
        const publishedDate = new Date(newsArticle.published)
        if (publishedDate < oneYearAgo) {
            return false
        }

        // Check if the release is newer than the current version 
        if (semver.gt(normalizedVersion, currentVersion)) {

            // Check if the normalized version's major.minor is present in onPremReleases
            // if its not, we don't show it to the user.
            
            const parsedNormalized = semver.parse(normalizedVersion);

            if (!parsedNormalized) {
                return false
            }

            const majorMinor = `${parsedNormalized.major.toString()}.${parsedNormalized.minor.toString()}`
            if (!onPremMajorMinorSet.has(majorMinor)) {
                return false
            }

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