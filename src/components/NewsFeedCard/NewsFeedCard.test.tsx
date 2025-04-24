import { FeedItem } from "@/types"
import { lightTheme, ThemeProvider } from "@deskpro/deskpro-ui"
import { NewsFeedCard } from "./NewsFeedCard"
import { render, screen, waitFor } from "@testing-library/react"
import { useDeskproAppTheme } from "@deskpro/app-sdk"
import React from "react"

jest.mock("@deskpro/deskpro-ui", () => ({
    H0: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
    P4: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    lightTheme: {},
}))

jest.mock("@deskpro/app-sdk", () => ({
    useDeskproAppTheme: jest.fn(),
}))

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
}))

beforeEach(() => {
    (useDeskproAppTheme as jest.Mock).mockReturnValue({
        theme: {
            colors: {
                grey40: "#grey40",
                grey100: "#grey100",
                grey20: "#grey20",
            },
        },
    })
})

interface RenderNewsFeedCardProps {
    newsMeta?: Partial<FeedItem>
    isLastItem?: boolean
    onAllItemsSeen?: () => void
}

function renderNewsFeedCard (overrideProps: RenderNewsFeedCardProps)  {
    const defaultProps = {
        newsMeta: {
            title: "Default Title",
            created: 123456789,
            type: "release" as const,
            description: "<p>default description</p>",
            published: 12345678,
            link: "https://example.com",
            enclosures: [{ url: "https://example.com/image.jpg" }],
        },
        isLastItem: false,
        onAllItemsSeen: jest.fn(),
    }

    const mergedProps = {
        ...defaultProps,
        ...overrideProps,
        newsMeta: {
            ...defaultProps.newsMeta,
            ...(overrideProps.newsMeta ?? {})
        }
    }

    return render(
        <ThemeProvider theme={lightTheme}>
            <NewsFeedCard {...mergedProps} />
        </ThemeProvider>
    )
}

describe("NewsFeedCard", () => {

    it("should format the date from milliseconds timestamp", async () => {
        renderNewsFeedCard({
            newsMeta: {
                title: "Test Title",
                published: new Date("2025-01-23").getTime(),
            }
        })

        await waitFor(() => {
            expect(screen.getByText("JAN 23")).toBeInTheDocument()
            expect(screen.getByText("2025")).toBeInTheDocument()
        })
    })

    it("should render the cover image with correct src", () => {
        renderNewsFeedCard({
            newsMeta: {
                title: "Test Title",
                enclosures: [{ url: "https://example.com/image.jpg" }],
            },
        })

        const img = screen.getByRole("img")
        expect(img).toHaveAttribute("src", "https://example.com/image.jpg")
    })

    it("should render a fallback image if none is found", () => {
        renderNewsFeedCard({
            newsMeta: {
                enclosures: [],
            },
        })

        const img = screen.getByRole("img")
        expect(img).toHaveAttribute("src", "/news-app-cover.png")
    })

    it("should render the description content correctly after removing images", () => {
        renderNewsFeedCard({
            newsMeta: {
                description: "<p>This is <img src='image.jpg' /> a description</p>",
            },
        })

        expect(screen.getByText("This is a description")).toBeInTheDocument()
    })

    it("should have the correct link", () => {
        renderNewsFeedCard({
            newsMeta: {
                link: "https://example.com/link-to-deskpro",
            },
        })

        const anchor = screen.getByRole("link")
        expect(anchor).toHaveAttribute("href", "https://example.com/link-to-deskpro")
    })
})