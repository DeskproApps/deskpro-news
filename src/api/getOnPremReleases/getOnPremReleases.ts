import { IDeskproClient, proxyFetch } from "@deskpro/app-sdk"

export interface OnPremRelease {
    version: string
    docker_tag: string
    date: string
}

interface GetOnPremReleasesResponse {
    releases: OnPremRelease[]
}

export default async function getOnPremReleases(client: IDeskproClient): Promise<OnPremRelease[]> {

    try {
        const dpFetch = await proxyFetch(client)
        const response = await dpFetch("https://get.deskpro.com/onprem.json")
        const jsonResponse = await response.json() as GetOnPremReleasesResponse
        return jsonResponse.releases
    } catch {
        return []
    }

}