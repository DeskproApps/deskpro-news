import ReleaseAndNewsFeedView from "@/components/ReleaseAndNewsFeedView";
import { WEBSITE_NEWS_URL } from "@/constants";
import { useInitialisedDeskproAppClient } from "@deskpro/app-sdk";

export default function GlobalTargetPage(){
useInitialisedDeskproAppClient((client) => {
    client.registerElement("link_to_news", {
      url: WEBSITE_NEWS_URL,
      type: "cta_external_link",
      hasIcon: false,
    });

    client.setTitle("Latest News");
  })

  return(
    <ReleaseAndNewsFeedView target="global"/>
  )
}