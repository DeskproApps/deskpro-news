import TwoButtonGroup from "@/components/TwoButtonGroup";
import { TwoButtonGroupProps } from "@/components/TwoButtonGroup/TwoButtonGroup";

type Props = {
  selectedTab: TwoButtonGroupProps["selectedTab"],
  onOneNavigate: TwoButtonGroupProps["oneOnClick"],
  onTwoNavigate: TwoButtonGroupProps["twoOnClick"],
}

export default function TwoColumnNavigation(props: Readonly<Props>) {
  const { selectedTab, onOneNavigate, onTwoNavigate } = props

  

  return (
    <TwoButtonGroup
      selectedTab={selectedTab}
      oneLabel="News"
      twoLabel="Release Notes"
      oneOnClick={onOneNavigate}
      twoOnClick={onTwoNavigate}
    />
  )
}

