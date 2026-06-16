import { useSyncStore, emitSyncEvent } from './useSyncStatus';

describe('useSyncStatus store', () => {
  beforeEach(() => {
    useSyncStore.getState().reset();
  });

  it('starts with idle state', () => {
    const state = useSyncStore.getState();
    expect(state.status).toBe('idle');
    expect(state.lastSync).toBeNull();
    expect(state.pendingChanges).toBe(0);
  });

  it('sets status via store action', () => {
    useSyncStore.getState().setStatus('syncing');
    expect(useSyncStore.getState().status).toBe('syncing');
  });

  it('emitSyncEvent changes status start->syncing', () => {
    emitSyncEvent({ type: 'start' });
    expect(useSyncStore.getState().status).toBe('syncing');
  });

  it('emitSyncEvent success sets idle + lastSync', () => {
    emitSyncEvent({ type: 'success' });
    const state = useSyncStore.getState();
    expect(state.status).toBe('idle');
    expect(state.lastSync).toBeInstanceOf(Date);
  });

  it('emitSyncEvent failure sets error', () => {
    emitSyncEvent({ type: 'failure', payload: 'DB down' });
    expect(useSyncStore.getState().status).toBe('error');
    expect(useSyncStore.getState().errorMessage).toBe('DB down');
  });

  it('reset restores defaults', () => {
    useSyncStore.getState().setStatus('syncing');
    useSyncStore.getState().setPendingChanges(5);
    useSyncStore.getState().reset();
    expect(useSyncStore.getState().status).toBe('idle');
    expect(useSyncStore.getState().pendingChanges).toBe(0);
  });
});
