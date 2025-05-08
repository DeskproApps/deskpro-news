import { NewsArticle, ParentFeedPayload } from "@/types";

export default function buildParentFeedPayload(appName: string, items: NewsArticle[]): ParentFeedPayload {
    return {
        eventId: "deskpro-apps.message",
        appName: appName,
        appEventId: "newsData",
        news: items,
    };
}