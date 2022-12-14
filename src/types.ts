export type Feed = {
    title: string;
    description: string;
    link: string;
    image: string;
    category: string[];
    items: FeedItem[];
};

export type FeedItem = {
    title: string;
    description: string;
    link: string;
    published: number;
    created: number;
};

export type ParentFeedPayload = {
    eventId: "deskpro-apps.message";
    appName: string;
    appEventId: "newsData";
    news: FeedItem[];
};
