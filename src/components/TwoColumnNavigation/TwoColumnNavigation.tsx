import { TwoButtonGroup, TwoButtonGroupProps } from "@deskpro/app-sdk";

type Props = {
  selected: TwoButtonGroupProps["selected"],
  onOneNavigate: TwoButtonGroupProps["oneOnClick"],
  onTwoNavigate: TwoButtonGroupProps["twoOnClick"],
}

export default function TwoColumnNavigation(props: Readonly<Props>) {
  const { selected, onOneNavigate, onTwoNavigate } = props

  

  return (
    <TwoButtonGroup
      selected={selected}
      oneLabel="News"
      twoLabel="Release Notes"
      oneOnClick={onOneNavigate}
      twoOnClick={onTwoNavigate}
    />
  )
}

