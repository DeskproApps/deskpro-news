import {FeedItem, ParentFeedPayload} from "./types";

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