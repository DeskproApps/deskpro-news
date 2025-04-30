import "./AnnouncementBanner.css";
import { faTimes, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDeskproAppTheme } from "@deskpro/app-sdk";
import { useState } from "react";

interface AnnouncementBannerProps {
    icon: IconDefinition,
    title: string
    children: React.ReactNode
}

export default function AnnouncementBanner(props: Readonly<AnnouncementBannerProps>) {
    const { icon, title, children } = props
    const { theme } = useDeskproAppTheme()
    const [isHidden, setIsHidden] = useState(false)

    return (
        <div className="announcement-banner" style={{
            '--cyan-10': theme.colors.cyan10,
            '--cyan-80': theme.colors.cyan80,
            '--cyan-100': theme.colors.cyan100,
            '--grey-60': theme.colors.grey60,
            '--red-60': theme.colors.red60,
            '--grey-20': theme.colors.grey20,
            display: isHidden ? 'none' : 'flex',
        } as React.CSSProperties & { [key: string]: string }}>
            <div className="announcement-left">
                <div className="announcement-icon">
                    <FontAwesomeIcon icon={icon} />
                </div>

                <div className="announcement-text">
                    <h2>{title}</h2>
                    <p>{children}</p>
                </div>
            </div>

            <div>
                <button className="announcement-close-button" onClick={() => { setIsHidden(true) }}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
        </div>
    );
}
