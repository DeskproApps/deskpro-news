export type NewsFeed = {
    title: string;
    description: string;
    link: string;
    image: string;
    category: string[];
    items: NewsArticle[];
    type: "product-agent" | "product-admin" | "release";
};

type Enclosure ={
    url? :string,
    length?: string,
    type?: string
}

export type NewsArticle = {
    title: string;
    description?: string;
    link: string;
    published: number;
    created: number;
    enclosures?: Enclosure[]
    type: NewsFeed["type"]
};

export type ParentFeedPayload = {
    eventId: "deskpro-apps.message";
    appName: string;
    appEventId: "newsData";
    news: NewsArticle[];
};


export type ContextData = {
    app: {
        description: string;
        id: string;
        instanceId: string;
        name: string;
        title: string;
    },
    currentAgent: {
        id: string;
        firstName: string;
        lastName: string;
        primaryEmail: string;
        locale: string;
        emails: string[];
        isAdmin: boolean;
        isAgent: boolean;
        isUser: boolean;
    },
    env: {
        envId: string;
        release?: string;
        releaseBuildTime: number;
        isCloud?: boolean;
        isDemo?: boolean,
        trialDaysLeft?: number
    }
}