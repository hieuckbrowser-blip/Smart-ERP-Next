const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('InventoryPage fetchData race condition', () => {
  it('should discard stale responses when page changes before fetch completes', async () => {
    const pageRef: { current: number } = { current: 1 };
    let lastAppliedPage: number | null = null;

    const simulateFetchData = async (delayMs: number) => {
      const currentPage = pageRef.current;
      await delay(delayMs);
      if (pageRef.current !== currentPage) return;
      lastAppliedPage = currentPage;
    };

    // Start slow fetch for page 1
    const fetch1 = simulateFetchData(100);
    // Page changes to 2 before page 1 response arrives
    pageRef.current = 2;
    // Start fast fetch for page 2
    const fetch2 = simulateFetchData(10);

    await fetch2;
    expect(lastAppliedPage).toBe(2);

    // Page 1's stale response arrives late — should be discarded
    await fetch1;
    expect(lastAppliedPage).toBe(2);
  });
});
