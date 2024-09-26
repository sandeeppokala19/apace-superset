import { FilterConfiguration } from "@superset-ui/core";
import { areArraysShallowEqual, areObjectsEqual } from "src/reduxUtils";

const compareMemo = (function() {
  const cache = new Map();

  return function compare(oldValue: any, newValue: any, path: string): boolean {
    const cacheKey = `${path}-${JSON.stringify(oldValue)}-${JSON.stringify(newValue)}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const isEqual = (function() {
      if (oldValue === undefined && newValue === undefined) {
        return true;
      } 
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        if (areArraysShallowEqual(oldValue, newValue)) {
          return true;
        }

        return oldValue.length === newValue.length && oldValue.every((item, index) => {
          const newItem = newValue[index];
          if (typeof item === 'object' && item !== null) {
            return areObjectsEqual(item, newItem);
          } else {
            return item === newItem;
          }
        });
      } 
      if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        return areObjectsEqual(oldValue, newValue, { ignoreUndefined: false, ignoreNull: false });
      } 
      return oldValue === newValue;
    })();

    console.log(`Are values equal? ${isEqual}`);
    
    cache.set(cacheKey, isEqual);
    return isEqual;
  };
})();

const getChangedPaths = (oldObject: any, newObject: any, basePath: string = '') => {
  const changes = {};

  Object.keys(newObject).forEach(key => {
    const newPath = basePath ? `${basePath}.${key}` : key;

    const oldValue = oldObject[key];
    const newValue = newObject[key];

    if (oldValue === undefined && newValue === undefined) {
      return;
    }

    if (!(key in oldObject)) {
      changes[newPath] = newValue;
    } 
    else if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
      const nestedChanges = getChangedPaths(oldValue, newValue, newPath);
      if (Object.keys(nestedChanges).length > 0) {
        Object.assign(changes, nestedChanges);
      }
    } 
    else if (!compareMemo(oldValue, newValue, newPath)) {
      changes[newPath] = newValue;
    }
  });

  return changes;
};

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

export const preparePayload = (
  filterChanges: {
    added: any[],
    modified: Record<string, any>,
    deleted: string[],
    reordered: string[],
  }
) => {
  const payload: any = {
    native_filter_configuration: {},
  };

  if (filterChanges.added.length > 0) {
    payload.native_filter_configuration.added = filterChanges.added;
  }

  if (Object.keys(filterChanges.modified).length > 0) {
    payload.native_filter_configuration.modified = filterChanges.modified;
  }

  if (filterChanges.deleted.length > 0) {
    payload.native_filter_configuration.deleted = filterChanges.deleted;
  }

  if (filterChanges.reordered.length > 0) {
    payload.native_filter_configuration.reorder = filterChanges.reordered;
  }

  return payload;
};
