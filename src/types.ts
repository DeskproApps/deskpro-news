export type Feed = {
    title: string;
    description: string;
    link: string;
    image: string;
    category: string[];
    items: FeedItem[];
    type: "product-agent" | "product-admin" | "release";
};

type Enclosure ={
    url? :string,
    length?: string,
    type?: string
}

export type FeedItem = {
    title: string;
    description: string;
    link: string;
    published: number;
    created: number;
    enclosures?: Enclosure[]
    type: Feed["type"]
};

export type ParentFeedPayload = {
    eventId: "deskpro-apps.message";
    appName: string;
    appEventId: "newsData";
    news: FeedItem[];
};
