import { FeedItem, ParentFeedPayload } from "./types";
import semver from 'semver';

export const parseContent = (content: string): string => {
    return content
        .replace(/<img(.*)src="(\/.+?)"/g, `<img $1 src="https://support.deskpro.com$2"`)
        .replace(/<a(.*)href="(.+?)"/g, `<a $1 href="$2" target="_blank"`)
        ;
};

export const buildParentFeedPayload = (appName: string, items: FeedItem[]): ParentFeedPayload => ({
    eventId: "deskpro-apps.message",
    appName: appName,
    appEventId: "newsData",
    news: items,
});

export const parseContentImages = (content: string): string => {
    return content.replace(/<img(.*)src="(.+?)"/g, `<img $1 src="$2" loading="lazy"`);
};

export const removeContentImages = (content: string): string => {
    return content.replace(/<img\b[^>]*>/gi, '');
};


export function filterReleases(currentVersion: string, items: FeedItem[]): { filteredItems: FeedItem[], hasNewerVersion: boolean } {
    let hasNewerVersion = false;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return {
        filteredItems: items.filter((item) => {
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
        }),
        hasNewerVersion
    };
};