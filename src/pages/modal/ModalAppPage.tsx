import ReleaseAndNewsFeedView from "@/components/ReleaseAndNewsFeedView";
import { useInitialisedDeskproAppClient } from "@deskpro/app-sdk";

export default function ModalAppPage() {
  useInitialisedDeskproAppClient((client) => {

    client.setTitle("What's New?")
  })

  return (
    <ReleaseAndNewsFeedView target="modal" />
  )
}