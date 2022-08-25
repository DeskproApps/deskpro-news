import { FeedItem } from "../../types";
import { HorizontalDivider, useDeskproAppTheme } from "@deskpro/app-sdk";
import "./NewsFeedItem.css";

type NewsFeedItemProps = {
    item: FeedItem;
    locale: string;
};

export const NewsFeedItem = ({ item, locale }: NewsFeedItemProps) => {
    const { theme } = useDeskproAppTheme();

    const published = new Date(item.published);

    const dateFormat: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
    };

    return (
        <div className="news-feed-item">
            <h2 className="news-feed-item-title" style={{ color: theme.colors.grey100 }}>
                <a href={item.link} target="_blank" style={{ color: theme.colors.grey100 }}>{item.title}</a>
            </h2>
            <time className="news-feed-item-date" style={{ color: theme.colors.grey80 }} dateTime={published.toISOString()}>
                {published.toLocaleDateString(locale, dateFormat)}
            </time>
            <div className="news-feed-item-body" dangerouslySetInnerHTML={{ __html: item.description }} />
            <HorizontalDivider />
        </div>
    );
};
