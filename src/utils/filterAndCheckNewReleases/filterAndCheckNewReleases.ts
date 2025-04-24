import { FeedItem } from "@/types";
import semver from 'semver';

export default function filterAndCheckNewReleases(currentVersion: string, items: FeedItem[]): { filteredItems: FeedItem[], hasNewerVersion: boolean } {
    let hasNewerVersion = false;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const filteredItems = items.filter((item) => {
        // Skip non-release items
        if (item.type !== "release") {
            return true
        }

        // Check for release notes matching "Deskpro Release" and "Deskpro Horizon Release" patterns
        const versionMatch = item.title.match(
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
        const publishedDate = new Date(item.published)
        if (publishedDate < oneYearAgo) {
            return false
        }

        // Check if the release is newer than the current version
        if (semver.gt(normalizedVersion, currentVersion)) {
            hasNewerVersion = true
            return false
        }

        return true
    })

    return {
        filteredItems,
        hasNewerVersion
    };
};