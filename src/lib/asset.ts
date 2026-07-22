/**
 * Asset URL helper — prefixes with Vite base path.
 */
export const asset = (p: string): string => `${import.meta.env.BASE_URL}${p}`
