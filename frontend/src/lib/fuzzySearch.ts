import Fuse from 'fuse.js';

export function fuzzySearch<T>(list: T[], keys: string[], searchText: string, threshold = 0.3): T[] {
  if (!searchText) return list;
  
  const fuse = new Fuse(list, {
    keys,
    threshold,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });

  return fuse.search(searchText).map(result => result.item);
}
