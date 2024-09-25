import { FilterConfiguration } from "@superset-ui/core";
import { areArraysShallowEqual } from "src/reduxUtils";

// Memoization function to cache comparisons
const compareMemo = (function() {
  const cache = new Map();

  return function compare(oldValue: any, newValue: any, path: string): boolean {
    const cacheKey = `${path}-${JSON.stringify(oldValue)}-${JSON.stringify(newValue)}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Handle undefined values: ignore comparison if both are undefined
    if (oldValue === undefined && newValue === undefined) {
      cache.set(cacheKey, true);
      return true;
    }

    // Handle empty arrays comparison: if both are empty arrays, consider them equal
    if (Array.isArray(oldValue) && Array.isArray(newValue) && oldValue.length === 0 && newValue.length === 0) {
      cache.set(cacheKey, true);
      return true;
    }

    const isEqual = oldValue === newValue;
    cache.set(cacheKey, isEqual);
    return isEqual;
  };
})();

// Recursive function to detect changes, ignoring undefined values
const getChangedPaths = (oldObject: any, newObject: any, basePath: string = '') => {
  const changes = {};

  Object.keys(newObject).forEach(key => {
    const newPath = basePath ? `${basePath}.${key}` : key;

    const oldValue = oldObject[key];
    const newValue = newObject[key];

    // Ignore comparison if both values are undefined
    if (oldValue === undefined && newValue === undefined) {
      return;
    }

    // If the key doesn't exist in oldObject, consider it a new addition
    if (!(key in oldObject)) {
      changes[newPath] = newValue;
    } 
    // If it's a nested object, recursively check for changes
    else if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
      const nestedChanges = getChangedPaths(oldValue, newValue, newPath);
      if (Object.keys(nestedChanges).length > 0) {
        Object.assign(changes, nestedChanges);
      }
    } 
    // If the values are different and not undefined, record the change
    else if (!compareMemo(oldValue, newValue, newPath)) {
      changes[newPath] = newValue;
    }
  });

  return changes;
};

// Detects added, modified, deleted, and reordered filters
export const detectFilterChanges = (
  newConfig: FilterConfiguration,
  oldFilters: Record<string, any>,
  initialOrder: string[],
  currentOrder: string[],
) => {

  console.time("alternative_function")
  const changes = {
    added: [] as any[],
    modified: {} as Record<string, any>, 
    deleted: [] as string[],
    reordered: [] as string[], 
  };

  const newConfigMap = newConfig.reduce((map, filter) => {
    map[filter.id] = filter;
    return map;
  }, {} as Record<string, any>);

  Object.keys(oldFilters).forEach(filterId => {
    if (!(filterId in newConfigMap)) {
      changes.deleted.push(filterId);
    }
  });

  newConfig.forEach(filter => {
    if (!(filter.id in oldFilters)) {
      changes.added.push({ id: filter.id, ...filter });
    } else {
      const changedPaths = getChangedPaths(oldFilters[filter.id], filter);
      if (Object.keys(changedPaths).length > 0) {
        changes.modified[filter.id] = changedPaths;
      }
    }
  });

  if (!areArraysShallowEqual(initialOrder, currentOrder)) {
    changes.reordered = currentOrder;
  }
  console.timeEnd("alternative_function")
  return changes;
};
