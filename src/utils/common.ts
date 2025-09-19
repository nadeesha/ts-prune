/**
 * Simple alternatives to lodash functions used in this project
 * These implementations provide the same functionality without the lodash dependency
 */

/**
 * Returns the difference between two arrays based on a key function
 * Similar to lodash/fp/differenceBy
 */
export function differenceBy<T>(
  iteratee: (item: T) => any,
  array1: T[],
  array2: T[]
): T[] {
  const keys2 = new Set(array2.map(iteratee));
  return array1.filter(item => !keys2.has(iteratee(item)));
}

/**
 * Creates an object composed of the picked object properties
 * Similar to lodash/fp/pick
 */
export function pick<T extends Record<string, any>>(
  keys: string[]
): (obj: T) => Partial<T> {
  return (obj: T) => {
    const result: Partial<T> = {};
    for (const key of keys) {
      if (key in obj) {
        result[key as keyof T] = obj[key];
      }
    }
    return result;
  };
}

/**
 * Creates an object composed of keys generated from the results of running each element of collection thru iteratee
 * Similar to lodash/fp/countBy
 */
export function countBy<T>(
  iteratee: (item: T) => any
): (array: T[]) => Record<string, number> {
  return (array: T[]) => {
    const result: Record<string, number> = {};
    for (const item of array) {
      const key = String(iteratee(item));
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  };
}

/**
 * Gets the last element of array
 * Similar to lodash/fp/last
 */
export function last<T>(array: T[]): T | undefined {
  return array.length > 0 ? array[array.length - 1] : undefined;
}
