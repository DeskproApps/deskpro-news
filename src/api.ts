import { parse } from "rss-to-json";
import { Feed } from "./types";

const AGENT_NEWS_RSS_URL = "https://support.deskpro.com/en/news/product-agent.rss";
const ADMIN_NEWS_RSS_URL = "https://support.deskpro.com/en/news/product-admin.rss";

export const fetchAdminFeed = async () => fetchFeed(ADMIN_NEWS_RSS_URL);
export const fetchAgentFeed = async () => fetchFeed(AGENT_NEWS_RSS_URL);

const fetchFeed = async (url: string): Promise<Feed|null> => {
    try {
        const feed = await parse(url);

        if (!(feed?.items ?? []).length) {
            return null;
        }

        return feed;
    } catch (e) {
        console.error(e);
    }

    return null;
};
