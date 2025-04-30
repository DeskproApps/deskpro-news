import { buildParentFeedPayload, filterAndCheckNewReleases, parseContent } from "@/utils";
import { Context, HorizontalDivider, LoadingSpinner, useDeskproAppClient, useDeskproAppEvents, useDeskproAppTheme, useInitialisedDeskproAppClient } from "@deskpro/app-sdk";
import { ContextData, FeedItem } from "@/types";
import { fetchAdminFeed, fetchAgentFeed, fetchReleaseFeed } from "@/api";
import { FilteredReleasesResponse } from "@/utils/filterAndCheckNewReleases/filterAndCheckNewReleases";
import { NewsFeedCard } from "@/components/NewsFeedCard/NewsFeedCard";
import { Fragment, useState } from "react";
import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import he from "he";
import TwoColumnNavigation from "@/components/TwoColumnNavigation";

const WEBSITE_NEWS_URL = "https://support.deskpro.com/en/news/product";

export default function ReleaseAndNewsFeedPage() {
  const { client } = useDeskproAppClient();
  const { theme } = useDeskproAppTheme();

  const [selectedTab, setSelectedTab] = useState<"one" | "two">("one")
  const [isLoading, setIsLoading] = useState(true);
  const [shownItems, setShownItems] = useState<number>(5);
  const [newsArticles, setNewsArticles] = useState<FeedItem[]>([])
  const [isShown, setIsShown] = useState(false);
  const [latestRelease, setLatestRelease] = useState<FilteredReleasesResponse["latestRelease"]>(undefined)
  const ITEMS_PER_PAGE = 5

  useInitialisedDeskproAppClient((client) => {
    client.registerElement("link_to_news", {
      url: WEBSITE_NEWS_URL,
      type: "cta_external_link",
      hasIcon: false,
    });

    client.setTitle("What's New?");
  });

  function handleAllItemsSeen() {
    setShownItems(prev => prev + ITEMS_PER_PAGE)
  }

  const getFeed = async (context: Context<ContextData, unknown>) => {
    if (!(context.data && client)) {
      return;
    }

    if (newsArticles.length) {
      setIsLoading(false);
      return;
    }

    // Fetch all feeds in parallel & combine them
    const feeds = [fetchAgentFeed(), fetchReleaseFeed()]

    if (context.data.currentAgent.isAdmin) {
      feeds.push(fetchAdminFeed());
    }

    let feedArticles = (await Promise.all(feeds)).reduce<FeedItem[]>(
      (combined, feed) => {
        if (feed === null) {
          return combined;
        }

        (feed.items).forEach((item) =>
          combined.push({
            ...item,
            title: he.decode(item.title),
            description: parseContent(he.decode(item.description ?? "")),
            type: feed.type,
          })
        );

        return combined;
      },
      []
    );
    if (context.data.env.releaseBuildTime && context.data.env.releaseBuildTime > 0) {
      const releaseDate = new Date(context.data.env.releaseBuildTime * 1000);
      releaseDate.setHours(24, 0, 0);

      feedArticles = feedArticles.filter((feedArticle) => {
        const pubDate = new Date(feedArticle.published)
        pubDate.setHours(24, 0, 0);

        return pubDate.getTime() <= releaseDate.getTime();
      });
    }
    // Filter releases and get the final articles
    const { filteredNewsArticles, latestRelease: mostRecentRelease } = filterAndCheckNewReleases(
      context.data.env.release ?? "0.0.0",
      feedArticles
    )
    // Sort by date (newest first)
    const sortedNewsArticles = filteredNewsArticles.sort((a, b) =>
      new Date(b.created).getTime() - new Date(a.created).getTime()
    )

    setNewsArticles(sortedNewsArticles)
    setLatestRelease(mostRecentRelease)
    setIsLoading(false)

    return { sortedNewsArticles, latestRelease: mostRecentRelease }
  };

  useDeskproAppEvents(
    {
      onReady: (context: Context<ContextData, unknown>) => {

        void getFeed(context).then((res) => {
          if (!context.data) {
            return;
          }

          if (!res) {
            return
          }
          const { sortedNewsArticles, latestRelease: latestReleaseVersion } = res

          if (sortedNewsArticles.length) {
            const payload = buildParentFeedPayload(
              context.data.app.name,
              sortedNewsArticles
            );
            parent.postMessage(payload, "*");
          }
          // Focus the app if the user is an admin and there is a new release version/note available.
          if (context.data.currentAgent.isAdmin && latestReleaseVersion) {

            client?.focus()
          }
        });
        setIsShown(false);


      },
      onShow: (context: Context<ContextData, unknown>) => {
        setIsShown(true);
        void getFeed(context);
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

  if (!newsArticles.length) {
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

  const filteredArticles = newsArticles.filter(newsArticle => {
    if (selectedTab === "one") {
      return newsArticle.type !== "release";
    } else {
      return newsArticle.type === "release";
    }
  })


  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Show a banner if a new version is available */}
      {latestRelease && (<AnnouncementBanner icon={faBullhorn} title={`${latestRelease.title} is available`}>
        Explore what’s new in the latest version of Deskpro, or for more detail see the <a href={latestRelease.url} target="_blank">Release Notes</a>.
      </AnnouncementBanner>)}

      <TwoColumnNavigation selected={selectedTab} onOneNavigate={() => { setSelectedTab("one") }} onTwoNavigate={() => { setSelectedTab("two") }} />

      {!filteredArticles.length && <div style={{ textAlign: "center" }}>No article available</div>}

      {filteredArticles.slice(0, shownItems).map((newsArticle, idx) => {
        const isLastItem = idx === shownItems - 1
        return (
          <Fragment>
            <NewsFeedCard
              newsMeta={newsArticle}
              isLastItem={isLastItem}
              key={idx}
              onAllItemsSeen={handleAllItemsSeen}
            />

            {!isLastItem && <HorizontalDivider />}
          </Fragment>

        )
      })}
    </div>
  );
};
