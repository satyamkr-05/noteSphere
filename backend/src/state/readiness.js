const readinessState = {
  isReady: false,
  isInitializing: false,
  lastError: "",
  lastSuccessAt: null
};

export function markBackendInitializing() {
  readinessState.isInitializing = true;
}

export function markBackendReady() {
  readinessState.isReady = true;
  readinessState.isInitializing = false;
  readinessState.lastError = "";
  readinessState.lastSuccessAt = new Date().toISOString();
}

export function markBackendNotReady(error) {
  readinessState.isReady = false;
  readinessState.isInitializing = false;
  readinessState.lastError = error?.message || "";
}

export function isBackendReady() {
  return readinessState.isReady;
}

export function getReadinessState() {
  return { ...readinessState };
}
