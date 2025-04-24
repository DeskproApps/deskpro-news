import { FeedItem, ParentFeedPayload } from "@/types";

export default function buildParentFeedPayload(appName: string, items: FeedItem[]): ParentFeedPayload {
    return {
        eventId: "deskpro-apps.message",
        appName: appName,
        appEventId: "newsData",
        news: items,
    };
}