import { buildParentFeedPayload, getSemanticVersion, filterAndCheckNewReleases, getNormalisedVersionNumber, parseContent } from "@/utils";
import { Context, HorizontalDivider, LoadingSpinner, useDeskproAppClient, useDeskproAppEvents, useDeskproAppTheme, useInitialisedDeskproAppClient } from "@deskpro/app-sdk";
import { ContextData, FeedItem } from "@/types";
import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
import { fetchAdminFeed, fetchAgentFeed, fetchReleaseFeed } from "@/api";
import { FilteredReleasesResponse } from "@/utils/filterAndCheckNewReleases/filterAndCheckNewReleases";
import { Fragment, useState } from "react";
import { NewsFeedCard } from "@/components/NewsFeedCard/NewsFeedCard";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import he from "he";
import semver from "semver";
import TwoColumnNavigation from "@/components/TwoColumnNavigation";

const WEBSITE_NEWS_URL = "https://support.deskpro.com/en/news/product";

export default function ReleaseAndNewsFeedView() {
  const { client } = useDeskproAppClient()
  const { theme } = useDeskproAppTheme()

  const [selectedTab, setSelectedTab] = useState<"one" | "two">("one")
  const [isLoading, setIsLoading] = useState(true);
  const [shownItems, setShownItems] = useState<number>(5);
  const [newsArticles, setNewsArticles] = useState<FeedItem[]>([])
  const [isShown, setIsShown] = useState(false)
  const [latestUpgradeReleaseNote, setLatestUpgradeReleaseNote] = useState<FeedItem | null>(null)
  const [latestReleaseNote, setLatestReleaseNote] = useState<FilteredReleasesResponse["latestRelease"]>(undefined)
  const ITEMS_PER_PAGE = 5

  useInitialisedDeskproAppClient((client) => {
    client.registerElement("link_to_news", {
      url: WEBSITE_NEWS_URL,
      type: "cta_external_link",
      hasIcon: false,
    });

    client.setTitle("What's New?");
    client.focus()
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
      getNormalisedVersionNumber(getSemanticVersion(context.data.env.release ?? "0.0.0")),
      feedArticles
    )

    // Sort by date (newest first)
    const sortedNewsArticles = filteredNewsArticles.sort((a, b) =>
      new Date(b.created).getTime() - new Date(a.created).getTime()
    )

    setNewsArticles(sortedNewsArticles)
    setLatestReleaseNote(mostRecentRelease)
    setIsLoading(false)

    return { articles: sortedNewsArticles, latestReleaseNote: mostRecentRelease }
  };

  useDeskproAppEvents(
    {
      onReady: (context: Context<ContextData, unknown>) => {
        void (async () => {
          const res = await getFeed(context)

          if (!context.data || !client || !res) {
            return
          }

          const { articles, latestReleaseNote: latestReleaseNoteAvailable } = res

          if (articles.length) {
            const payload = buildParentFeedPayload(
              context.data.app.name,
              articles
            )
            parent.postMessage(payload, "*")
          }

          // Check if the user's instance version has upgraded since they last loaded the app.
          let hasUpgradeReleaseNote = false
          const storedVersion = await client.getUserState<string>("highestInstalledReleaseVersion")
          const currentVersion = getSemanticVersion(context.data.env.release ?? "0.0.0")
          const highestInstalledVersion = getNormalisedVersionNumber(storedVersion[0]?.data ?? "0.0.0")

          if (semver.gt(getNormalisedVersionNumber(currentVersion), highestInstalledVersion)) {
            // Try to find a release note matching this version.
            const versionRegex = new RegExp(`\\b${currentVersion.replace(/\./g, '\\.')}\\b`)
            const upgradeReleaseNote = articles.find((article) => {
              return (
                article.type === "release" &&
                (article.title.includes("Deskpro Release") ||
                  article.title.includes("Deskpro Horizon Release")) &&
                versionRegex.test(article.title)
              )
            })

            // Only set the upgrade flag if a release note was found for the new version.
            if (upgradeReleaseNote) {
              hasUpgradeReleaseNote = true
              setLatestUpgradeReleaseNote(upgradeReleaseNote)
            }

            await client.setUserState("highestInstalledReleaseVersion", currentVersion)
          }

          // Set focus flag for the latest release note available
          let hasNewerReleaseNotes = false
          if (context.data.currentAgent.isAdmin && latestReleaseNoteAvailable) {
            const lastReleaseNoteTitleShown = await client.getUserState<string>("lastReleaseNoteTitleShown")

            if (lastReleaseNoteTitleShown[0]?.data !== latestReleaseNoteAvailable.title) {
              await client.setUserState("lastReleaseNoteTitleShown", latestReleaseNoteAvailable.title)
              hasNewerReleaseNotes = true
            }
          }

          // Focus the app if:
          // - The user is an admin and there is a new release version/note available that hasn't been shown to the user already.
          // - The user has upgraded their instance version and there is a new
          if (hasNewerReleaseNotes || hasUpgradeReleaseNote) {
            setSelectedTab("two")
            client.focus()
          }
        })()
        setIsShown(false)
      },
      onShow: (context: Context<ContextData, unknown>) => {
        setIsShown(true)
        void getFeed(context)
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

  const renderedArticles = newsArticles.filter(newsArticle => {
    if (selectedTab === "one") {
      return newsArticle.type !== "release"
    } else {
      return newsArticle.type === "release"
    }
  })

  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Show a banner if the user has recently been upgraded and there's a new release note for their current version */}
      {latestUpgradeReleaseNote && (<AnnouncementBanner icon={faBullhorn} title={` You've been upgraded to ${latestUpgradeReleaseNote.title}`}>
        Explore what’s new below, or for more detail see the <a href={latestUpgradeReleaseNote.link} target="_blank">Release Notes</a>.
      </AnnouncementBanner>)}

      {/* Show a banner if a new release note is available */}
      {latestReleaseNote && (<AnnouncementBanner icon={faBullhorn} title={`${latestReleaseNote.title} is available`}>
        Explore what’s new in the latest version of Deskpro, or for more detail see the <a href={latestReleaseNote.url} target="_blank">Release Notes</a>.
      </AnnouncementBanner>)}



      <TwoColumnNavigation selected={selectedTab} onOneNavigate={() => { setSelectedTab("one") }} onTwoNavigate={() => { setSelectedTab("two") }} />

      {!renderedArticles.length && <div style={{ textAlign: "center" }}>No article available</div>}

      {renderedArticles.slice(0, shownItems).map((newsArticle, idx) => {
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
