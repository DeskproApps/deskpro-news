import "./NewsFeedCard.css";
import { NewsArticle } from "@/types";
import { removeContentImages } from "@/utils";
import { useDeskproAppTheme } from "@deskpro/app-sdk";
import { useEffect, useRef } from "react";

interface NewsFeedCardProps {
    newsMeta: NewsArticle;
    isLastItem: boolean;
    onAllItemsSeen: () => void
}

export function NewsFeedCard(props: Readonly<NewsFeedCardProps>) {

    const { newsMeta, isLastItem, onAllItemsSeen } = props
    const { theme } = useDeskproAppTheme()
    const cardRef = useRef<HTMLAnchorElement>(null)

    const publishedDate = new Date(newsMeta.published)
    const coverSrc = newsMeta.enclosures?.[0]?.url

    // Effect to detect when the last item becomes visible
    useEffect(() => {
        if (!isLastItem || !cardRef.current) {
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onAllItemsSeen()
                }
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0.5,
            }
        );

        observer.observe(cardRef.current)

        return () => {
            observer.disconnect()
        };
    }, [isLastItem, onAllItemsSeen])



    return (
        <a ref={cardRef} href={newsMeta.link} target="_blank" className="news-feed-card"
            style={{
                '--system-80': theme.colors.systemShade80,
                '--grey-100': theme.colors.grey100,
                '--cyan-100': theme.colors.cyan100,
                '--grey-20': theme.colors.grey20,
            } as React.CSSProperties & { [key: string]: string }}
        >
            <h2 className="news-title">{newsMeta.title}</h2>

            <div className="news-publish-date">{publishedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            })}</div>

            <div className="news-article-content"
                tabIndex={-1}
                dangerouslySetInnerHTML={{
                    __html: removeContentImages(newsMeta.description ?? ""),
                }} ></div>

            {coverSrc && (<div className="news-cover-image">
                <img src={coverSrc} loading="lazy" />
            </div>)}

        </a>
    )
}