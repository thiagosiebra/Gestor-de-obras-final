export function deduplicateAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',').map(p => p.trim());
    const uniqueParts: string[] = [];
    const seen = new Set<string>();

    for (const part of parts) {
        const lowerPart = part.toLowerCase();
        if (!seen.has(lowerPart)) {
            uniqueParts.push(part);
            seen.add(lowerPart);
        }
    }

    return uniqueParts.join(', ');
}
