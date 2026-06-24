import { useState, useEffect } from 'react';

export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [searchText, setSearchText] = useState(initialValue);
  const [debouncedSearchText, setDebouncedSearchText] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, delay);
    return () => clearTimeout(handler);
  }, [searchText, delay]);

  return { searchText, setSearchText, debouncedSearchText };
}
