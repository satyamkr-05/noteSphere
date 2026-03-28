export function getStorageItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
