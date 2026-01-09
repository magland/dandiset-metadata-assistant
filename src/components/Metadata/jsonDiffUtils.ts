export type DiffType = 'unchanged' | 'added' | 'removed' | 'modified' | 'nested';

export interface DiffNode {
  key: string;
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
  children?: DiffNode[];
}

/**
 * Generate a diff tree comparing two JSON structures
 */
export function generateDiffTree(
  oldObj: unknown,
  newObj: unknown,
  key: string = '',
  path: string = ''
): DiffNode {
  const currentPath = path;

  // Both null/undefined - unchanged
  if (oldObj === null && newObj === null) {
    return { key, path: currentPath, type: 'unchanged', oldValue: null, newValue: null };
  }
  if (oldObj === undefined && newObj === undefined) {
    return { key, path: currentPath, type: 'unchanged', oldValue: undefined, newValue: undefined };
  }

  // Old is undefined/null, new exists - added
  if ((oldObj === undefined || oldObj === null) && newObj !== undefined && newObj !== null) {
    return { key, path: currentPath, type: 'added', oldValue: oldObj, newValue: newObj };
  }

  // New is undefined/null, old exists - removed
  if ((newObj === undefined || newObj === null) && oldObj !== undefined && oldObj !== null) {
    return { key, path: currentPath, type: 'removed', oldValue: oldObj, newValue: newObj };
  }

  // Different types
  if (typeof oldObj !== typeof newObj) {
    return { key, path: currentPath, type: 'modified', oldValue: oldObj, newValue: newObj };
  }

  // Arrays
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    const maxLen = Math.max(oldObj.length, newObj.length);
    const children: DiffNode[] = [];
    let hasChanges = false;

    for (let i = 0; i < maxLen; i++) {
      const childPath = currentPath ? `${currentPath}.${i}` : `${i}`;
      const childNode = generateDiffTree(oldObj[i], newObj[i], `[${i}]`, childPath);
      children.push(childNode);
      if (childNode.type !== 'unchanged') {
        hasChanges = true;
      }
    }

    return {
      key,
      path: currentPath,
      type: hasChanges ? 'nested' : 'unchanged',
      oldValue: oldObj,
      newValue: newObj,
      children,
    };
  }

  // Objects
  if (typeof oldObj === 'object' && typeof newObj === 'object' && oldObj !== null && newObj !== null) {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const children: DiffNode[] = [];
    let hasChanges = false;

    for (const k of Array.from(allKeys).sort()) {
      const childPath = currentPath ? `${currentPath}.${k}` : k;
      const oldVal = (oldObj as Record<string, unknown>)[k];
      const newVal = (newObj as Record<string, unknown>)[k];
      const childNode = generateDiffTree(oldVal, newVal, k, childPath);
      children.push(childNode);
      if (childNode.type !== 'unchanged') {
        hasChanges = true;
      }
    }

    return {
      key,
      path: currentPath,
      type: hasChanges ? 'nested' : 'unchanged',
      oldValue: oldObj,
      newValue: newObj,
      children,
    };
  }

  // Primitives
  if (oldObj === newObj) {
    return { key, path: currentPath, type: 'unchanged', oldValue: oldObj, newValue: newObj };
  }

  return { key, path: currentPath, type: 'modified', oldValue: oldObj, newValue: newObj };
}

export function formatPrimitiveValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return `{${Object.keys(value).length} keys}`;
  return String(value);
}

export function isExpandable(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
  return false;
}

export function countChanges(node: DiffNode): number {
  if (node.type === 'modified' || node.type === 'added' || node.type === 'removed') {
    return 1;
  }
  if (node.children) {
    return node.children.reduce((sum, child) => sum + countChanges(child), 0);
  }
  return 0;
}
