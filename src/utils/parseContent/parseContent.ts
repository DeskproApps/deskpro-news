export default function parseContent(content: string): string {
    return content
        .replace(/<img(.*)src="(\/.+?)"/g, `<img $1 src="https://support.deskpro.com$2"`)
        .replace(/<a(.*)href="(.+?)"/g, `<a $1 href="$2" target="_blank"`)
}