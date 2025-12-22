import { Crypto, nativeCrypto } from ".";
import { Debug } from "./debug";
import "./init";

const window = typeof self === "undefined" ? undefined : (self as any);

if (nativeCrypto) {
  Object.freeze(nativeCrypto.getRandomValues);
}

try {
  // Replace original crypto by liner if needed
  if (window) {
    console.log("[webcrypto-liner] Checking crypto...");
    if (window.crypto === "undefined" || window.crypto.subtle === undefined) {
      console.log(
        "[webcrypto-liner] Native crypto is not available. Using webcrypto-liner shim."
      );
      delete (self as any).crypto;
      window.crypto = new Crypto();
      Object.freeze(window.crypto);
    } else {
      console.log("[webcrypto-liner] Native crypto is available.");
    }
  }
} catch (e) {
  Debug.error(e);
}

export const crypto = window?.crypto;
export * from ".";
