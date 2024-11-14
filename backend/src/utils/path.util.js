import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

export function getDirname(importMetaUrl) {
    return dirname(fileURLToPath(importMetaUrl));
}

export function pathToFileURL(filepath) {
    // Get absolute path
    const absolutePath = resolve(filepath);
    
    // Handle Windows paths
    if (process.platform === 'win32') {
        // Ensure proper drive letter format and convert backslashes
        const normalizedPath = absolutePath
            .replace(/^\/?/, '') // Remove leading slash if present
            .replace(/\\/g, '/'); // Convert backslashes to forward slashes
        return `file:///${normalizedPath}`;
    }
    
    // For non-Windows systems
    return `file://${absolutePath}`;
}