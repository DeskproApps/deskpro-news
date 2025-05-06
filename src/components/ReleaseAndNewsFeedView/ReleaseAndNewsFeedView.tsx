import { buildParentFeedPayload, getSemanticVersion, filterAndCheckNewReleases, getNormalisedVersionNumber, parseContent } from "@/utils";
import { Context, HorizontalDivider, LoadingSpinner, useDeskproAppClient, useDeskproAppEvents } from "@deskpro/app-sdk";
import { ContextData, NewsArticle } from "@/types";
import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
import { fetchAdminFeed, fetchAgentFeed, fetchReleaseFeed } from "@/api";
import { FilteredReleasesResponse } from "@/utils/filterAndCheckNewReleases/filterAndCheckNewReleases";
import { Fragment, useState } from "react";
import { NewsFeedCard } from "@/components/NewsFeedCard/NewsFeedCard";
import Callout from "@/components/Callout";
import he from "he";
import semver from "semver";
import TwoColumnNavigation from "@/components/TwoColumnNavigation";

interface ReleaseAndNewsFeedViewProps {
  target: "modal" | "global"
}

export default function ReleaseAndNewsFeedView(props: Readonly<ReleaseAndNewsFeedViewProps>) {
  const { target } = props

    const [isLoading, setIsLoading] = useState(true);
    const [isShown, setIsShown] = useState(false)
    const [latestReleaseNote, setLatestReleaseNote] = useState<FilteredReleasesResponse["latestRelease"]>(undefined)
const [latestUpgradeReleaseNote, setLatestUpgradeReleaseNote] = useState<NewsArticle | null>(null)
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [selectedTab, setSelectedTab] = useState<"one" | "two">("one")
  const [shownItems, setShownItems] = useState<number>(5);

  const { client } = useDeskproAppClient()
  const ITEMS_PER_PAGE = 5

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

    // Fetch all news feeds in parallel & combine them
    const newsFeeds = [fetchAgentFeed(), fetchReleaseFeed()]

    if (context.data.currentAgent.isAdmin) {
      newsFeeds.push(fetchAdminFeed());
    }

    let feedArticles = (await Promise.all(newsFeeds)).reduce<NewsArticle[]>(
      (combined, newsFeed) => {
        if (newsFeed === null) {
          return combined;
        }

        (newsFeed.items).forEach((article) =>
          combined.push({
            ...article,
            title: he.decode(article.title),
            description: parseContent(he.decode(article.description ?? "")),
            type: newsFeed.type,
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

          // Only update the upgrade flag in the modal to prevent race condition where
          // the global target updates this first and the callout isn't shown to the user.
          if (semver.gt(getNormalisedVersionNumber(currentVersion), highestInstalledVersion) && target === "modal") {
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
          if (context.data.currentAgent.isAdmin && latestReleaseNoteAvailable && target === "modal") {
            const lastReleaseNoteTitleShown = await client.getUserState<string>("lastReleaseNoteTitleShown")

            // Show the modal once per version
            if (lastReleaseNoteTitleShown[0]?.data !== latestReleaseNoteAvailable.title) {
              await client.setUserState("lastReleaseNoteTitleShown", latestReleaseNoteAvailable.title)
              hasNewerReleaseNotes = true
            }
          }

          // Focus the app if the target is "modal" and:
          // - The user is an admin and there is a new release version/note available that hasn't been shown to the user already.
          // - The user has upgraded their instance version and there is a new
          if ((hasNewerReleaseNotes || hasUpgradeReleaseNote) && target === "modal") {
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
      {latestUpgradeReleaseNote && (
        <Callout
          accent="cyan"
icon={faBullhorn}
title={` You've been upgraded to ${latestUpgradeReleaseNote.title}`}
          showCloseIcon>
        Explore what’s new below, or for more detail see the <a href={latestUpgradeReleaseNote.link} target="_blank">Release Notes</a>.
      </Callout>)}

      {/* Show a banner if a new release note is available */}
      {latestReleaseNote && (
        <Callout
          accent="cyan"
icon={faBullhorn}
          headingText={`${latestReleaseNote.title} is available`}
          showCloseIcon>
        Explore what’s new in the latest version of Deskpro, or for more detail see the <a href={latestReleaseNote.url} target="_blank">Release Notes</a>.
      </Callout>)}

      <TwoColumnNavigation selected={selectedTab} onOneNavigate={() => { setSelectedTab("one") }} onTwoNavigate={() => { setSelectedTab("two") }} />

{/* Show a banner if no articles are available for the tab being viewed */}
      {!renderedArticles.length && (
        <Callout
          accent="grey"
          headingText={selectedTab === "one" ? "No news article available" : "No release note found for your installed version"}
          style={{ textAlign: "center", justifyContent: "center" }}
          >
          Visit <a href={"https://support.deskpro.com/en-US/news"} target="_blank">our support site</a> for more articles.
        </Callout>
      )}

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
