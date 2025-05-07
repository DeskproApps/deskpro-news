import { Button, Stack } from "@deskpro/deskpro-ui";
import { DeskproAppTheme } from "@deskpro/app-sdk";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";

export interface TwoButtonGroupProps {
    oneIcon?: IconDefinition
    oneLabel: string
    oneOnClick: () => void
    selectedTab: "one" | "two"
    twoIcon?: IconDefinition
    twoLabel: string
    twoOnClick: () => void
}

const Group = styled(Stack)`
    margin-bottom: 10px;
    padding: 6px 6px 7px;
    border-radius: 6px;
    background-color: ${({ theme }: DeskproAppTheme) => theme.colors.grey10};
`

const GroupButton = styled(Button) <{ selected: boolean }>`
    width: 50%;
    text-align: center;
    justify-content: center;

    ${({ selected }) => selected ? "" : `
        background-color: transparent;
        border-color: transparent;
        box-shadow: none;
    `}
`

export default function TwoButtonGroup(props: Readonly<TwoButtonGroupProps>) {
    const { oneIcon, oneLabel, oneOnClick, selectedTab, twoIcon, twoLabel, twoOnClick } = props

    return (
        <Group justify="space-between" align="center" gap={6}>
            <GroupButton
                text={oneLabel}
                intent="secondary"
                icon={oneIcon}
                size="large"
                selected={selectedTab === "one"}
                onClick={oneOnClick}
            />
            <GroupButton
                text={twoLabel}
                intent="secondary"
                icon={twoIcon}
                size="large"
                selected={selectedTab === "two"}
                onClick={twoOnClick}
            />
        </Group>
    )




}
