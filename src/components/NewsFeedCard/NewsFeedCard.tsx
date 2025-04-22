import { H0, P4, } from "@deskpro/deskpro-ui";
import { FeedItem } from "../../types";
import "./NewsFeedCard.css";
import { useDeskproAppTheme } from "@deskpro/app-sdk";
import { removeContentImages } from "../../utils";
import { useEffect, useRef } from "react";


interface NewsFeedCardProps {
    newsMeta: FeedItem;
    shownItems: number;
    setShownItems: (shownItems: number) => void;
    isLastItem: boolean;
}

export function NewsFeedCard(props: Readonly<NewsFeedCardProps>) {

    const { newsMeta, shownItems, setShownItems, isLastItem } = props
    const { theme } = useDeskproAppTheme()
    const cardRef = useRef<HTMLAnchorElement>(null)

    const publishedDate = new Date(newsMeta.published)
    const coverSrc = newsMeta.enclosures?.[0]?.url

    const monthDay = publishedDate.toLocaleString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
    const year = publishedDate.getFullYear();

    useEffect(() => {
        if (!isLastItem || !cardRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShownItems(shownItems + 5);
                }
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0.5,
            }
        );

        observer.observe(cardRef.current);

        return () => {
            observer.disconnect();
        };
    }, [isLastItem, shownItems, setShownItems])



    return (
        <a ref={cardRef} href={newsMeta.link} target="_blank" className="news-feed-card"
            style={{
                '--grey-40': theme.colors.grey40,
                '--dark-40': theme.colors.grey100,
                '--grey-20': theme.colors.grey20,
            } as React.CSSProperties & { [key: string]: string }}
        >
            <div className="news-feed-card-date"><P4>{monthDay}</P4> <P4>{year}</P4></div>
            <div className="news-feed-card-cover">
                <img src={coverSrc} loading="lazy" />
            </div>

            <div className="news-feed-card-body">
                <H0>{newsMeta?.title}</H0>

                <div
                    className="news-feed-card-body-content"
                    tabIndex={-1}
                    dangerouslySetInnerHTML={{
                        __html: removeContentImages(newsMeta?.description ?? ""),
                    }}
                />
            </div>

        </a>
    )
}