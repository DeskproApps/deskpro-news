export default function removeContentImages(content: string): string {
    return content.replace(/<img\b[^>]*>/gi, '')
}