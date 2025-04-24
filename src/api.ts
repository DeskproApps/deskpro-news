import { Feed } from "@/types";
import { parse } from "rss-to-json";

const AGENT_NEWS_RSS_URL = "https://support.deskpro.com/en/news/product-agent.rss";
const ADMIN_NEWS_RSS_URL = "https://support.deskpro.com/en/news/product-admin.rss";
const RELEASE_NOTES_RSS_URL = "https://support.deskpro.com/en/news/deskpro-releases.rss";

export const fetchAdminFeed = async () => fetchFeed(ADMIN_NEWS_RSS_URL, "product-admin");
export const fetchAgentFeed = async () => fetchFeed(AGENT_NEWS_RSS_URL, "product-agent");
export const fetchReleaseFeed = async () => fetchFeed(RELEASE_NOTES_RSS_URL, "release");

const fetchFeed = async (url: string, type: Feed["type"]): Promise<Feed | null> => {
    try {
        const feed = await parse(url);

        if (!feed.items.length) {
            return null;
        }

        return {
            ...feed,
            type
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e instanceof Error ? e.message : "An unknown error occurred while fetching the feed");
        return null;
    }
};
