import "@testing-library/jest-dom/vitest";

// Penyelarasan instance Uint8Array dari TextEncoder pada lingkungan jsdom
const originalEncode = TextEncoder.prototype.encode;
TextEncoder.prototype.encode = function (input?: string) {
  const result = originalEncode.call(this, input);
  return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
};
