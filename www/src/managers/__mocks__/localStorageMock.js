// www/src/managers/__mocks__/localStorageMock.js
export const localStorageMock = {
  store: Object.create(null),
  getItem: jest.fn((key) => localStorageMock.store[key] ?? null),
  setItem: jest.fn((key, value) => { localStorageMock.store[key] = String(value); }),
  removeItem: jest.fn((key) => { delete localStorageMock.store[key]; }),
  clear: jest.fn(() => { localStorageMock.store = Object.create(null); }),
};
