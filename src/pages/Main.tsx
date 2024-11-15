import {
  Context,
  LoadingSpinner,
  useDeskproAppClient,
  useDeskproAppEvents,
  useDeskproAppTheme,
  useInitialisedDeskproAppClient,
} from "@deskpro/app-sdk";
import { useState } from "react";
import { fetchAdminFeed, fetchAgentFeed } from "../api";
import { FeedItem } from "../types";
import { NewsFeedItem } from "../components/FeedItem/NewsFeedItem";
import { buildParentFeedPayload, parseContent } from "../utils";
import he from "he";

const WEBSITE_NEWS_URL = "https://support.deskpro.com/en/news/product";

export const Main = () => {
  const { client } = useDeskproAppClient();
  const { theme } = useDeskproAppTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [locale, setLocale] = useState<string>("en-US");
  const [shownItems, setShownItems] = useState<number>(5);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isShown, setIsShown] = useState(false);

  useInitialisedDeskproAppClient((client) => {
    client.registerElement("link_to_news", {
      url: WEBSITE_NEWS_URL,
      type: "cta_external_link",
      hasIcon: false,
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

    const feeds = [fetchAgentFeed()];

    if (context.data.currentAgent.isAdmin) {
      feeds.push(fetchAdminFeed());
    }

    let feedItems = (await Promise.all(feeds)).reduce<FeedItem[]>(
      (combined, feed) => {
        if (feed === null) {
          return combined;
        }

        (feed?.items ?? []).forEach((item) =>
          combined.push({
            ...item,
            title: he.decode(item.title),
            description: parseContent(he.decode(item.description)),
          })
        );

        return combined;
      },
      []
    );

    if (context.data.env.releaseBuildTime > 0) {
      const releaseDate = new Date(context.data.env.releaseBuildTime * 1000);
      releaseDate.setHours(24, 0, 0);

      feedItems = feedItems.filter((item) => {
        const pubDate = new Date(item.published);
        pubDate.setHours(24, 0, 0);

        return pubDate.getTime() <= releaseDate.getTime();
      });
    }

    feedItems.sort((a, b) => (a.created > b.created) ? -1 : ((b.created > a.created) ? 1 : 0));

    setItems(feedItems);
    setIsLoading(false);

    return feedItems;
  };

  useDeskproAppEvents(
    {
      onReady: (context) => {
        getFeed(context).then((items) => {
          if (items && items.length) {
            const payload = buildParentFeedPayload(
              context.data.app.name,
              items
            );
            parent.postMessage(payload, "*");
          }
        });
        setIsShown(false);
      },
      onShow: (context) => {
        setIsShown(true);
        getFeed(context);
      },
    },
    [client]
  );

  if (!isShown) {
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!items.length) {
    return (
      <div
        className="problem-message"
        style={{
          color: theme.colors.brandShade80,
          backgroundColor: theme.colors.brandShade10,
        }}
      >
        There was a problem fetching our news feed, would you like to{" "}
        <a
          href={WEBSITE_NEWS_URL}
          target="_blank"
          style={{ color: theme.colors.cyan100 }}
        >
          view the news on our website instead?
        </a>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "40px" }}>
      {items.slice(0, shownItems).map((item, idx) => (
        <NewsFeedItem
          item={item}
          shownItems={shownItems}
          setShownItems={setShownItems}
          locale={locale}
          key={idx}
          i={idx}
        />
      ))}
    </div>
  );
};
