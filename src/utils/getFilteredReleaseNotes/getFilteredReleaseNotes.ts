import { NewsArticle } from "@/types";
import { OnPremRelease } from "@/api/getOnPremReleases/getOnPremReleases";
import getNormalisedVersionNumber from "../getNormalisedVersionNumber";
import semver from 'semver';

export interface FilteredReleasesResponse {
    filteredNewsArticles: NewsArticle[]
    /**
    * Information about the latest available OnPrem release (if newer than current version).
    */
    latestOnPremRelease?: {
        title: string
        version: string
        url: string
    }
}

interface GetFilteredReleaseNotesProps {
    currentVersion: string
    newsArticles: NewsArticle[]
    onPremReleases: OnPremRelease[]
    isCloud: boolean
    releaseVersionThreshold?: string
}

/**
 * Filters news articles to find relevant release notes based on the user's installed version and checks for newer onPrem versions.
 * 
 * @property {string} currentVersion - The user's installed Deskpro version e.g. "2025.9.97".
 * @property {NewsArticle[]} newsArticles - Array of news articles.
 * @property {OnPremRelease[]} onPremReleases - Valid OnPrem releases from onprem.json.
 * @property {boolean} isCloud - Flag to identify the user's environment.
 * @property {string} releaseVersionThreshold - The cut-off version when filtering release notes (Defaults to 2025.3.0)
 */
export default function getFilteredReleaseNotes(props: GetFilteredReleaseNotesProps): FilteredReleasesResponse {
    const { currentVersion, newsArticles, onPremReleases, releaseVersionThreshold = "2025.3.0", isCloud } = props

    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    let latestRelease: FilteredReleasesResponse['latestOnPremRelease'] = undefined

    // Create a Set of "major.minor" from onPremReleases.
    const onPremMajorMinorSet = new Set(
        onPremReleases.map(release => {
            const normalised = getNormalisedVersionNumber(release.version)
            const parsed = semver.parse(normalised)
            return parsed ? `${parsed.major.toString()}.${parsed.minor.toString()}` : null
        }).filter(Boolean)
    )

    const filteredNewsArticles = newsArticles.filter((newsArticle) => {
        // Skip non-release articles.
        if (newsArticle.type !== "release") {
            return true
        }

        // Filter out release notes with titles not matching the "Deskpro Release" and
        // "Deskpro Horizon Release" patterns.
        const versionMatch = newsArticle.title.match(
            /Deskpro (?:Horizon )?Release (?<version>\d{4}\.\d+(?:\.\d+)?)/
        )

        if (!versionMatch?.groups?.version) {
            return false
        }

        // Normalise the extracted release note's version to XXXX.X.X format.
        const normalisedVersion = getNormalisedVersionNumber(versionMatch.groups.version)

        // Filter out release notes with invalid versions.
        if (!semver.valid(normalisedVersion)) {
            return false
        }

        // Filter out release notes for versions less than the version threshold.
        if (semver.lt(normalisedVersion, releaseVersionThreshold)) {
            return false
        }

        // Filter out release notes made over a year ago.
        const publishedDate = new Date(newsArticle.published)
        if (publishedDate < oneYearAgo) {
            return false
        }

        // Filter out release notes for versions greater than the user's current
        // installed version.
        if (semver.gt(normalisedVersion, currentVersion)) {
            // Return details about the latest available release version if the user is an onPrem user.
            if (!isCloud) {
                // Verify that the release note's normalised version's major.minor is present in onPremReleases
                // if its not, we don't show it to the user.
                const parsedNormalised = semver.parse(normalisedVersion)

                if (!parsedNormalised) {
                    return false
                }

                const majorMinor = `${parsedNormalised.major.toString()}.${parsedNormalised.minor.toString()}`
                if (!onPremMajorMinorSet.has(majorMinor)) {
                    return false
                }

                // Update latestRelease if this is the latest version we've found so far
                // This way we'll always direct the user to the latest release even if the
                // order of the notes aren't accurate.
                if (!latestRelease || semver.gt(normalisedVersion, latestRelease.version)) {
                    latestRelease = {
                        title: newsArticle.title,
                        version: normalisedVersion,
                        url: newsArticle.link
                    }
                }
            }
            return false
        }

        return true
    })

    return {
        filteredNewsArticles,
        latestOnPremRelease: latestRelease
    };
}