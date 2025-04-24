export default function parseContentImages(content: string): string {
    return content.replace(/<img(.*)src="(.+?)"/g, `<img $1 src="$2" loading="lazy"`)
} 