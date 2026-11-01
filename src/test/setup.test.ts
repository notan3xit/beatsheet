describe('Testumgebung', () => {
  it('stellt DOM und IndexedDB bereit', () => {
    expect(document).toBeDefined();
    expect(indexedDB).toBeDefined();
  });
});
