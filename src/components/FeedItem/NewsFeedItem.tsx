import { FeedItem } from "../../types";
import { useDeskproAppTheme } from "@deskpro/app-sdk";
import "./NewsFeedItem.css";
import { parseContentImages } from "../../utils";
import { RefObject, useEffect, useRef } from "react";

type NewsFeedItemProps = {
  item: FeedItem;
  locale: string;
  shownItems: number;
  setShownItems: (shownItems: number) => void;
  i: number;
};

export const NewsFeedItem = ({
  item,
  locale,
  shownItems,
  setShownItems,
  i,
}: NewsFeedItemProps) => {
  const ref: RefObject<HTMLDivElement | undefined> = useRef();
  const { theme } = useDeskproAppTheme();

  const published = new Date(item.published);

  const dateFormat: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log(i, shownItems - 1, entry.isIntersecting);
        if (entry.isIntersecting) {
          shownItems - 1 === i && setShownItems(shownItems + 5);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.5,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [i, setShownItems, shownItems]);

  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className="news-feed-item"
      style={{ borderColor: theme.colors.grey20 }}
    >
      <h2
        className="news-feed-item-title"
        style={{ color: theme.colors.grey100 }}
      >
        <a
          href={item.link}
          target="_blank"
          style={{ color: theme.colors.grey100 }}
        >
          {item.title}
        </a>
      </h2>
      <time
        className="news-feed-item-date"
        style={{ color: theme.colors.grey80 }}
        dateTime={published.toISOString()}
      >
        {published.toLocaleDateString(locale, dateFormat)}
      </time>
      <div
        className="news-feed-item-body"
        dangerouslySetInnerHTML={{
          __html: parseContentImages(item.description),
        }}
      />
    </div>
  );
};
