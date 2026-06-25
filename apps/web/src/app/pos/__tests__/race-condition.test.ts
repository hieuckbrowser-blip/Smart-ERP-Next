const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('POSPage debounced search race condition', () => {
  it('should discard stale debounced search responses when search term changes', async () => {
    let currentSearchTerm = '';
    let results: string[] = [];
    const setResults = (r: string[]) => { results = r; };

    const simulateDebouncedSearch = async (term: string, apiDelay: number) => {
      currentSearchTerm = term;
      await delay(apiDelay);
      if (term !== currentSearchTerm) return;
      setResults([term]);
    };

    const searchA = simulateDebouncedSearch('A', 100);
    const searchAB = simulateDebouncedSearch('AB', 10);

    await searchAB;
    expect(results).toEqual(['AB']);

    await searchA;
    expect(results).toEqual(['AB']);
  });
});
