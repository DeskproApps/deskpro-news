import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { Stack } from "@deskpro/deskpro-ui"
import Callout from "@/components/Callout"
import { FallbackRender } from "@sentry/react";

const ErrorFallback: FallbackRender = (props) => {
  const { error } = props

  const errorMessage = error instanceof Error && error.message.trim() !== "" ? error.message : "An unknown error occurred"

  return (
    <Stack padding={8}>
      <Callout
        icon={faExclamationTriangle}
        accent="red"
        style={{ width: "100%" }}
        headingText="Something Went Wrong"
      >
        {errorMessage}
      </Callout>
    </Stack>)
}

export default ErrorFallback;