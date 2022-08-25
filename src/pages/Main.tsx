import {
    Context,
    HorizontalDivider,
    LoadingSpinner,
    useDeskproAppClient,
    useDeskproAppEvents, useDeskproAppTheme,
    useInitialisedDeskproAppClient
} from "@deskpro/app-sdk";
import { useState } from "react";
import { fetchAdminFeed, fetchAgentFeed } from "../api";
import { FeedItem } from "../types";
import { orderBy } from "lodash";
import { NewsFeedItem } from "../components/FeedItem/NewsFeedItem";
import {buildParentFeedPayload, parseContent} from "../utils";

const WEBSITE_NEWS_URL = "https://support.deskpro.com/en/news/product";

export const Main = () => {
    const { client } = useDeskproAppClient();
    const { theme } = useDeskproAppTheme();

    const [isLoading, setIsLoading] = useState(true);
    const [locale, setLocale] = useState<string>("en-US");
    const [items, setItems] = useState<FeedItem[]>([]);

    useInitialisedDeskproAppClient((client) => {
        client.setTitle("Latest News");
        client.registerElement("link_to_news", {
            type: "cta_external_link",
            url: WEBSITE_NEWS_URL,
            hasIcon: false
        });
    });

    const getFeed = async (context: Context) => {
        if (!(context && client)) {
            return;
        }

        setLocale(context.data.currentAgent.locale);

        if (items.length) {
            setIsLoading(false);
            return;
        }

        const feeds = [
            fetchAgentFeed(),
        ];

        if (context.data.currentAgent.isAdmin) {
            feeds.push(fetchAdminFeed());
        }

        let feedItems = (await Promise.all(feeds)).reduce<FeedItem[]>((combined, feed) => {
            if (feed === null) {
                return combined;
            }

            (feed?.items ?? [])
                .forEach((item) => combined.push({
                    ...item,
                    description: parseContent(item.description),
                }))
            ;

            return combined;
        }, []);

        if (context.data.env.releaseBuildTime > 0) {
            const releaseDate = new Date(context.data.env.releaseBuildTime * 1000);
            releaseDate.setHours(24, 0, 0);

            feedItems = feedItems.filter((item) => {
                const pubDate = new Date(item.published);
                pubDate.setHours(24, 0, 0);

                return pubDate.getTime() <= releaseDate.getTime();
            });
        }

        feedItems = orderBy(feedItems, ["created"], ["desc"]);

        setItems(feedItems);
        setIsLoading(false);

        return feedItems;
    };

    useDeskproAppEvents({
        onReady: (context) => {
            getFeed(context).then((items) => {
                if (items && items.length) {
                    const payload = buildParentFeedPayload(context.data.app.name, items);
                    parent.postMessage(payload, "*");
                }
            });
        },
        onShow: getFeed,
    }, [client]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!items.length) {
        return (
            <div className="problem-message" style={{ color: theme.colors.brandShade80, backgroundColor: theme.colors.brandShade10 }}>
                There was a problem fetching our news feed, would you like to <a href={WEBSITE_NEWS_URL} target="_blank" style={{ color: theme.colors.cyan100 }}>view the news on our website instead?</a>
            </div>
        );
    }

    return (
        <>
            <HorizontalDivider style={{ marginTop: "-8px", marginBottom: "10px" }} />
            {items.map((item, idx) => <NewsFeedItem item={item} locale={locale} key={idx} />)}
        </>
    );
};
