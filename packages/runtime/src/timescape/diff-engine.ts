import { createHash } from 'crypto';

export interface DiffOperation {
    op: 'add' | 'remove' | 'replace';
    path: string;
    value?: any;
    oldValue?: any;
}

export class DiffEngine {
    /**
     * Calculates the structural difference between two objects.
     * Returns a list of operations to transform obj1 into obj2.
     */
    public diff(obj1: any, obj2: any, path: string = ''): DiffOperation[] {
        const ops: DiffOperation[] = [];

        // Handle primitives
        if (obj1 === obj2) return ops;

        if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
            ops.push({ op: 'replace', path, value: obj2, oldValue: obj1 });
            return ops;
        }

        // Handle Arrays
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            // Simple array diff strategy: replace if length differs or recurse
            // A more complex strategy would use Longest Common Subsequence (LCS)
            // For now, we'll iterate and diff items, handling length mismatch
            const len = Math.max(obj1.length, obj2.length);
            for (let i = 0; i < len; i++) {
                const currentPath = `${path}/${i}`;
                if (i >= obj1.length) {
                    ops.push({ op: 'add', path: currentPath, value: obj2[i] });
                } else if (i >= obj2.length) {
                    ops.push({ op: 'remove', path: currentPath, oldValue: obj1[i] });
                } else {
                    ops.push(...this.diff(obj1[i], obj2[i], currentPath));
                }
            }
            return ops;
        }

        // Handle Objects
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        const allKeys = new Set([...keys1, ...keys2]);

        for (const key of allKeys) {
            const currentPath = path ? `${path}/${key}` : `/${key}`;

            if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
                ops.push({ op: 'add', path: currentPath, value: obj2[key] });
            } else if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
                ops.push({ op: 'remove', path: currentPath, oldValue: obj1[key] });
            } else {
                ops.push(...this.diff(obj1[key], obj2[key], currentPath));
            }
        }

        return ops;
    }

    /**
     * Calculates a content hash for an object or string.
     * Useful for detecting if a module's code has changed.
     */
    public hash(content: any): string {
        const str = typeof content === 'string' ? content : JSON.stringify(content);
        return createHash('sha256').update(str).digest('hex');
    }
}
