/**
 * Applies a global filter across all values in a row array.
 * Uses JSON.stringify to search every field including nested data.
 * Matches case-insensitively.
 * Future-proof: works on rows regardless of how they're rendered (table or accordion).
 */
export function applyGlobalFilter(rows: any[], filterText: string): any[] {
    if (!filterText.trim()) return rows;
    const lowerFilter = filterText.trim().toLowerCase();
    return rows.filter((row) => {
        try {
            return JSON.stringify(row).toLowerCase().includes(lowerFilter);
        } catch {
            return false;
        }
    });
}