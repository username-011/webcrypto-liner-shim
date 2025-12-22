var liner = function (exports) {
  'use strict';

  function _mergeNamespaces(n, m) {
    m.forEach(function (e) {
      e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
        if (k !== 'default' && !(k in n)) {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () {
              return e[k];
            }
          });
        }
      });
    });
    return Object.freeze(n);
  }
  let window$2 = {};
  if (typeof self !== "undefined") {
    window$2 = self;
  }
  exports.nativeCrypto = window$2["msCrypto"] || window$2.crypto || {};
  exports.nativeSubtle = null;
  try {
    exports.nativeSubtle = (exports.nativeCrypto === null || exports.nativeCrypto === void 0 ? void 0 : exports.nativeCrypto.subtle) || (exports.nativeCrypto === null || exports.nativeCrypto === void 0 ? void 0 : exports.nativeCrypto["webkitSubtle"]) || null;
  } catch (err) {
    console.warn("Cannot get subtle from crypto", err);
  }
  function setCrypto(crypto) {
    exports.nativeCrypto = crypto;
    exports.nativeSubtle = crypto.subtle;
  }
  const ARRAY_BUFFER_NAME = "[object ArrayBuffer]";
  class BufferSourceConverter {
    static isArrayBuffer(data) {
      return Object.prototype.toString.call(data) === ARRAY_BUFFER_NAME;
    }
    static toArrayBuffer(data) {
      if (this.isArrayBuffer(data)) {
        return data;
      }
      if (data.byteLength === data.buffer.byteLength) {
        return data.buffer;
      }
      if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
        return data.buffer;
      }
      return this.toUint8Array(data.buffer).slice(data.byteOffset, data.byteOffset + data.byteLength).buffer;
    }
    static toUint8Array(data) {
      return this.toView(data, Uint8Array);
    }
    static toView(data, type) {
      if (data.constructor === type) {
        return data;
      }
      if (this.isArrayBuffer(data)) {
        return new type(data);
      }
      if (this.isArrayBufferView(data)) {
        return new type(data.buffer, data.byteOffset, data.byteLength);
      }
      throw new TypeError("The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
    }
    static isBufferSource(data) {
      return this.isArrayBufferView(data) || this.isArrayBuffer(data);
    }
    static isArrayBufferView(data) {
      return ArrayBuffer.isView(data) || data && this.isArrayBuffer(data.buffer);
    }
    static isEqual(a, b) {
      const aView = BufferSourceConverter.toUint8Array(a);
      const bView = BufferSourceConverter.toUint8Array(b);
      if (aView.length !== bView.byteLength) {
        return false;
      }
      for (let i = 0; i < aView.length; i++) {
        if (aView[i] !== bView[i]) {
          return false;
        }
      }
      return true;
    }
    static concat(...args) {
      let buffers;
      if (Array.isArray(args[0]) && !(args[1] instanceof Function)) {
        buffers = args[0];
      } else if (Array.isArray(args[0]) && args[1] instanceof Function) {
        buffers = args[0];
      } else {
        if (args[args.length - 1] instanceof Function) {
          buffers = args.slice(0, args.length - 1);
        } else {
          buffers = args;
        }
      }
      let size = 0;
      for (const buffer of buffers) {
        size += buffer.byteLength;
      }
      const res = new Uint8Array(size);
      let offset = 0;
      for (const buffer of buffers) {
        const view = this.toUint8Array(buffer);
        res.set(view, offset);
        offset += view.length;
      }
      if (args[args.length - 1] instanceof Function) {
        return this.toView(res, args[args.length - 1]);
      }
      return res.buffer;
    }
  }
  const STRING_TYPE = "string";
  const HEX_REGEX = /^[0-9a-f]+$/i;
  const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  const BASE64URL_REGEX = /^[a-zA-Z0-9-_]+$/;
  class Utf8Converter {
    static fromString(text) {
      const s = unescape(encodeURIComponent(text));
      const uintArray = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) {
        uintArray[i] = s.charCodeAt(i);
      }
      return uintArray.buffer;
    }
    static toString(buffer) {
      const buf = BufferSourceConverter.toUint8Array(buffer);
      let encodedString = "";
      for (let i = 0; i < buf.length; i++) {
        encodedString += String.fromCharCode(buf[i]);
      }
      const decodedString = decodeURIComponent(escape(encodedString));
      return decodedString;
    }
  }
  class Utf16Converter {
    static toString(buffer, littleEndian = false) {
      const arrayBuffer = BufferSourceConverter.toArrayBuffer(buffer);
      const dataView = new DataView(arrayBuffer);
      let res = "";
      for (let i = 0; i < arrayBuffer.byteLength; i += 2) {
        const code = dataView.getUint16(i, littleEndian);
        res += String.fromCharCode(code);
      }
      return res;
    }
    static fromString(text, littleEndian = false) {
      const res = new ArrayBuffer(text.length * 2);
      const dataView = new DataView(res);
      for (let i = 0; i < text.length; i++) {
        dataView.setUint16(i * 2, text.charCodeAt(i), littleEndian);
      }
      return res;
    }
  }
  class Convert {
    static isHex(data) {
      return typeof data === STRING_TYPE && HEX_REGEX.test(data);
    }
    static isBase64(data) {
      return typeof data === STRING_TYPE && BASE64_REGEX.test(data);
    }
    static isBase64Url(data) {
      return typeof data === STRING_TYPE && BASE64URL_REGEX.test(data);
    }
    static ToString(buffer, enc = "utf8") {
      const buf = BufferSourceConverter.toUint8Array(buffer);
      switch (enc.toLowerCase()) {
        case "utf8":
          return this.ToUtf8String(buf);
        case "binary":
          return this.ToBinary(buf);
        case "hex":
          return this.ToHex(buf);
        case "base64":
          return this.ToBase64(buf);
        case "base64url":
          return this.ToBase64Url(buf);
        case "utf16le":
          return Utf16Converter.toString(buf, true);
        case "utf16":
        case "utf16be":
          return Utf16Converter.toString(buf);
        default:
          throw new Error(`Unknown type of encoding '${enc}'`);
      }
    }
    static FromString(str, enc = "utf8") {
      if (!str) {
        return new ArrayBuffer(0);
      }
      switch (enc.toLowerCase()) {
        case "utf8":
          return this.FromUtf8String(str);
        case "binary":
          return this.FromBinary(str);
        case "hex":
          return this.FromHex(str);
        case "base64":
          return this.FromBase64(str);
        case "base64url":
          return this.FromBase64Url(str);
        case "utf16le":
          return Utf16Converter.fromString(str, true);
        case "utf16":
        case "utf16be":
          return Utf16Converter.fromString(str);
        default:
          throw new Error(`Unknown type of encoding '${enc}'`);
      }
    }
    static ToBase64(buffer) {
      const buf = BufferSourceConverter.toUint8Array(buffer);
      if (typeof btoa !== "undefined") {
        const binary = this.ToString(buf, "binary");
        return btoa(binary);
      } else {
        return Buffer.from(buf).toString("base64");
      }
    }
    static FromBase64(base64) {
      const formatted = this.formatString(base64);
      if (!formatted) {
        return new ArrayBuffer(0);
      }
      if (!Convert.isBase64(formatted)) {
        throw new TypeError("Argument 'base64Text' is not Base64 encoded");
      }
      if (typeof atob !== "undefined") {
        return this.FromBinary(atob(formatted));
      } else {
        return new Uint8Array(Buffer.from(formatted, "base64")).buffer;
      }
    }
    static FromBase64Url(base64url) {
      const formatted = this.formatString(base64url);
      if (!formatted) {
        return new ArrayBuffer(0);
      }
      if (!Convert.isBase64Url(formatted)) {
        throw new TypeError("Argument 'base64url' is not Base64Url encoded");
      }
      return this.FromBase64(this.Base64Padding(formatted.replace(/\-/g, "+").replace(/\_/g, "/")));
    }
    static ToBase64Url(data) {
      return this.ToBase64(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/\=/g, "");
    }
    static FromUtf8String(text, encoding = Convert.DEFAULT_UTF8_ENCODING) {
      switch (encoding) {
        case "ascii":
          return this.FromBinary(text);
        case "utf8":
          return Utf8Converter.fromString(text);
        case "utf16":
        case "utf16be":
          return Utf16Converter.fromString(text);
        case "utf16le":
        case "usc2":
          return Utf16Converter.fromString(text, true);
        default:
          throw new Error(`Unknown type of encoding '${encoding}'`);
      }
    }
    static ToUtf8String(buffer, encoding = Convert.DEFAULT_UTF8_ENCODING) {
      switch (encoding) {
        case "ascii":
          return this.ToBinary(buffer);
        case "utf8":
          return Utf8Converter.toString(buffer);
        case "utf16":
        case "utf16be":
          return Utf16Converter.toString(buffer);
        case "utf16le":
        case "usc2":
          return Utf16Converter.toString(buffer, true);
        default:
          throw new Error(`Unknown type of encoding '${encoding}'`);
      }
    }
    static FromBinary(text) {
      const stringLength = text.length;
      const resultView = new Uint8Array(stringLength);
      for (let i = 0; i < stringLength; i++) {
        resultView[i] = text.charCodeAt(i);
      }
      return resultView.buffer;
    }
    static ToBinary(buffer) {
      const buf = BufferSourceConverter.toUint8Array(buffer);
      let res = "";
      for (let i = 0; i < buf.length; i++) {
        res += String.fromCharCode(buf[i]);
      }
      return res;
    }
    static ToHex(buffer) {
      const buf = BufferSourceConverter.toUint8Array(buffer);
      let result = "";
      const len = buf.length;
      for (let i = 0; i < len; i++) {
        const byte = buf[i];
        if (byte < 16) {
          result += "0";
        }
        result += byte.toString(16);
      }
      return result;
    }
    static FromHex(hexString) {
      let formatted = this.formatString(hexString);
      if (!formatted) {
        return new ArrayBuffer(0);
      }
      if (!Convert.isHex(formatted)) {
        throw new TypeError("Argument 'hexString' is not HEX encoded");
      }
      if (formatted.length % 2) {
        formatted = `0${formatted}`;
      }
      const res = new Uint8Array(formatted.length / 2);
      for (let i = 0; i < formatted.length; i = i + 2) {
        const c = formatted.slice(i, i + 2);
        res[i / 2] = parseInt(c, 16);
      }
      return res.buffer;
    }
    static ToUtf16String(buffer, littleEndian = false) {
      return Utf16Converter.toString(buffer, littleEndian);
    }
    static FromUtf16String(text, littleEndian = false) {
      return Utf16Converter.fromString(text, littleEndian);
    }
    static Base64Padding(base64) {
      const padCount = 4 - base64.length % 4;
      if (padCount < 4) {
        for (let i = 0; i < padCount; i++) {
          base64 += "=";
        }
      }
      return base64;
    }
    static formatString(data) {
      return (data === null || data === void 0 ? void 0 : data.replace(/[\n\r\t ]/g, "")) || "";
    }
  }
  Convert.DEFAULT_UTF8_ENCODING = "utf8";
  function combine(...buf) {
    const totalByteLength = buf.map(item => item.byteLength).reduce((prev, cur) => prev + cur);
    const res = new Uint8Array(totalByteLength);
    let currentPos = 0;
    buf.map(item => new Uint8Array(item)).forEach(arr => {
      for (const item2 of arr) {
        res[currentPos++] = item2;
      }
    });
    return res.buffer;
  }
  function utilFromBase(inputBuffer, inputBase) {
    let result = 0;
    if (inputBuffer.length === 1) {
      return inputBuffer[0];
    }
    for (let i = inputBuffer.length - 1; i >= 0; i--) {
      result += inputBuffer[inputBuffer.length - 1 - i] * Math.pow(2, inputBase * i);
    }
    return result;
  }
  function utilToBase(value, base, reserved = -1) {
    const internalReserved = reserved;
    let internalValue = value;
    let result = 0;
    let biggest = Math.pow(2, base);
    for (let i = 1; i < 8; i++) {
      if (value < biggest) {
        let retBuf;
        if (internalReserved < 0) {
          retBuf = new ArrayBuffer(i);
          result = i;
        } else {
          if (internalReserved < i) {
            return new ArrayBuffer(0);
          }
          retBuf = new ArrayBuffer(internalReserved);
          result = internalReserved;
        }
        const retView = new Uint8Array(retBuf);
        for (let j = i - 1; j >= 0; j--) {
          const basis = Math.pow(2, j * base);
          retView[result - j - 1] = Math.floor(internalValue / basis);
          internalValue -= retView[result - j - 1] * basis;
        }
        return retBuf;
      }
      biggest *= Math.pow(2, base);
    }
    return new ArrayBuffer(0);
  }
  function utilConcatView(...views) {
    let outputLength = 0;
    let prevLength = 0;
    for (const view of views) {
      outputLength += view.length;
    }
    const retBuf = new ArrayBuffer(outputLength);
    const retView = new Uint8Array(retBuf);
    for (const view of views) {
      retView.set(view, prevLength);
      prevLength += view.length;
    }
    return retView;
  }
  function utilDecodeTC() {
    const buf = new Uint8Array(this.valueHex);
    if (this.valueHex.byteLength >= 2) {
      const condition1 = buf[0] === 0xFF && buf[1] & 0x80;
      const condition2 = buf[0] === 0x00 && (buf[1] & 0x80) === 0x00;
      if (condition1 || condition2) {
        this.warnings.push("Needlessly long format");
      }
    }
    const bigIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
    const bigIntView = new Uint8Array(bigIntBuffer);
    for (let i = 0; i < this.valueHex.byteLength; i++) {
      bigIntView[i] = 0;
    }
    bigIntView[0] = buf[0] & 0x80;
    const bigInt = utilFromBase(bigIntView, 8);
    const smallIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
    const smallIntView = new Uint8Array(smallIntBuffer);
    for (let j = 0; j < this.valueHex.byteLength; j++) {
      smallIntView[j] = buf[j];
    }
    smallIntView[0] &= 0x7F;
    const smallInt = utilFromBase(smallIntView, 8);
    return smallInt - bigInt;
  }
  function utilEncodeTC(value) {
    const modValue = value < 0 ? value * -1 : value;
    let bigInt = 128;
    for (let i = 1; i < 8; i++) {
      if (modValue <= bigInt) {
        if (value < 0) {
          const smallInt = bigInt - modValue;
          const retBuf = utilToBase(smallInt, 8, i);
          const retView = new Uint8Array(retBuf);
          retView[0] |= 0x80;
          return retBuf;
        }
        let retBuf = utilToBase(modValue, 8, i);
        let retView = new Uint8Array(retBuf);
        if (retView[0] & 0x80) {
          const tempBuf = retBuf.slice(0);
          const tempView = new Uint8Array(tempBuf);
          retBuf = new ArrayBuffer(retBuf.byteLength + 1);
          retView = new Uint8Array(retBuf);
          for (let k = 0; k < tempBuf.byteLength; k++) {
            retView[k + 1] = tempView[k];
          }
          retView[0] = 0x00;
        }
        return retBuf;
      }
      bigInt *= Math.pow(2, 8);
    }
    return new ArrayBuffer(0);
  }
  function isEqualBuffer(inputBuffer1, inputBuffer2) {
    if (inputBuffer1.byteLength !== inputBuffer2.byteLength) {
      return false;
    }
    const view1 = new Uint8Array(inputBuffer1);
    const view2 = new Uint8Array(inputBuffer2);
    for (let i = 0; i < view1.length; i++) {
      if (view1[i] !== view2[i]) {
        return false;
      }
    }
    return true;
  }
  function padNumber(inputNumber, fullLength) {
    const str = inputNumber.toString(10);
    if (fullLength < str.length) {
      return "";
    }
    const dif = fullLength - str.length;
    const padding = new Array(dif);
    for (let i = 0; i < dif; i++) {
      padding[i] = "0";
    }
    const paddingString = padding.join("");
    return paddingString.concat(str);
  }
  function assertBigInt() {
    if (typeof BigInt === "undefined") {
      throw new Error("BigInt is not defined. Your environment doesn't implement BigInt.");
    }
  }
  function concat$1(buffers) {
    let outputLength = 0;
    let prevLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      outputLength += buffer.byteLength;
    }
    const retView = new Uint8Array(outputLength);
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      retView.set(new Uint8Array(buffer), prevLength);
      prevLength += buffer.byteLength;
    }
    return retView.buffer;
  }
  function checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength) {
    if (!(inputBuffer instanceof Uint8Array)) {
      baseBlock.error = "Wrong parameter: inputBuffer must be 'Uint8Array'";
      return false;
    }
    if (!inputBuffer.byteLength) {
      baseBlock.error = "Wrong parameter: inputBuffer has zero length";
      return false;
    }
    if (inputOffset < 0) {
      baseBlock.error = "Wrong parameter: inputOffset less than zero";
      return false;
    }
    if (inputLength < 0) {
      baseBlock.error = "Wrong parameter: inputLength less than zero";
      return false;
    }
    if (inputBuffer.byteLength - inputOffset - inputLength < 0) {
      baseBlock.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
      return false;
    }
    return true;
  }
  class ViewWriter {
    constructor() {
      this.items = [];
    }
    write(buf) {
      this.items.push(buf);
    }
    final() {
      return concat$1(this.items);
    }
  }
  const powers2 = [new Uint8Array([1])];
  const digitsString = "0123456789";
  const NAME = "name";
  const VALUE_HEX_VIEW = "valueHexView";
  const IS_HEX_ONLY = "isHexOnly";
  const ID_BLOCK = "idBlock";
  const TAG_CLASS = "tagClass";
  const TAG_NUMBER = "tagNumber";
  const IS_CONSTRUCTED = "isConstructed";
  const FROM_BER = "fromBER";
  const TO_BER = "toBER";
  const LOCAL = "local";
  const EMPTY_STRING = "";
  const EMPTY_BUFFER = new ArrayBuffer(0);
  const EMPTY_VIEW = new Uint8Array(0);
  const END_OF_CONTENT_NAME = "EndOfContent";
  const OCTET_STRING_NAME = "OCTET STRING";
  const BIT_STRING_NAME = "BIT STRING";
  function HexBlock(BaseClass) {
    var _a;
    return _a = class Some extends BaseClass {
      constructor(...args) {
        var _a;
        super(...args);
        const params = args[0] || {};
        this.isHexOnly = (_a = params.isHexOnly) !== null && _a !== void 0 ? _a : false;
        this.valueHexView = params.valueHex ? BufferSourceConverter.toUint8Array(params.valueHex) : EMPTY_VIEW;
      }
      get valueHex() {
        return this.valueHexView.slice().buffer;
      }
      set valueHex(value) {
        this.valueHexView = new Uint8Array(value);
      }
      fromBER(inputBuffer, inputOffset, inputLength) {
        const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
        if (!checkBufferParams(this, view, inputOffset, inputLength)) {
          return -1;
        }
        const endLength = inputOffset + inputLength;
        this.valueHexView = view.subarray(inputOffset, endLength);
        if (!this.valueHexView.length) {
          this.warnings.push("Zero buffer length");
          return inputOffset;
        }
        this.blockLength = inputLength;
        return endLength;
      }
      toBER(sizeOnly = false) {
        if (!this.isHexOnly) {
          this.error = "Flag 'isHexOnly' is not set, abort";
          return EMPTY_BUFFER;
        }
        if (sizeOnly) {
          return new ArrayBuffer(this.valueHexView.byteLength);
        }
        return this.valueHexView.byteLength === this.valueHexView.buffer.byteLength ? this.valueHexView.buffer : this.valueHexView.slice().buffer;
      }
      toJSON() {
        return {
          ...super.toJSON(),
          isHexOnly: this.isHexOnly,
          valueHex: Convert.ToHex(this.valueHexView)
        };
      }
    }, _a.NAME = "hexBlock", _a;
  }
  class LocalBaseBlock {
    constructor({
      blockLength = 0,
      error = EMPTY_STRING,
      warnings = [],
      valueBeforeDecode = EMPTY_VIEW
    } = {}) {
      this.blockLength = blockLength;
      this.error = error;
      this.warnings = warnings;
      this.valueBeforeDecodeView = BufferSourceConverter.toUint8Array(valueBeforeDecode);
    }
    static blockName() {
      return this.NAME;
    }
    get valueBeforeDecode() {
      return this.valueBeforeDecodeView.slice().buffer;
    }
    set valueBeforeDecode(value) {
      this.valueBeforeDecodeView = new Uint8Array(value);
    }
    toJSON() {
      return {
        blockName: this.constructor.NAME,
        blockLength: this.blockLength,
        error: this.error,
        warnings: this.warnings,
        valueBeforeDecode: Convert.ToHex(this.valueBeforeDecodeView)
      };
    }
  }
  LocalBaseBlock.NAME = "baseBlock";
  class ValueBlock extends LocalBaseBlock {
    fromBER(inputBuffer, inputOffset, inputLength) {
      throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
    }
    toBER(sizeOnly, writer) {
      throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
    }
  }
  ValueBlock.NAME = "valueBlock";
  class LocalIdentificationBlock extends HexBlock(LocalBaseBlock) {
    constructor({
      idBlock = {}
    } = {}) {
      var _a, _b, _c, _d;
      super();
      if (idBlock) {
        this.isHexOnly = (_a = idBlock.isHexOnly) !== null && _a !== void 0 ? _a : false;
        this.valueHexView = idBlock.valueHex ? BufferSourceConverter.toUint8Array(idBlock.valueHex) : EMPTY_VIEW;
        this.tagClass = (_b = idBlock.tagClass) !== null && _b !== void 0 ? _b : -1;
        this.tagNumber = (_c = idBlock.tagNumber) !== null && _c !== void 0 ? _c : -1;
        this.isConstructed = (_d = idBlock.isConstructed) !== null && _d !== void 0 ? _d : false;
      } else {
        this.tagClass = -1;
        this.tagNumber = -1;
        this.isConstructed = false;
      }
    }
    toBER(sizeOnly = false) {
      let firstOctet = 0;
      switch (this.tagClass) {
        case 1:
          firstOctet |= 0x00;
          break;
        case 2:
          firstOctet |= 0x40;
          break;
        case 3:
          firstOctet |= 0x80;
          break;
        case 4:
          firstOctet |= 0xC0;
          break;
        default:
          this.error = "Unknown tag class";
          return EMPTY_BUFFER;
      }
      if (this.isConstructed) firstOctet |= 0x20;
      if (this.tagNumber < 31 && !this.isHexOnly) {
        const retView = new Uint8Array(1);
        if (!sizeOnly) {
          let number = this.tagNumber;
          number &= 0x1F;
          firstOctet |= number;
          retView[0] = firstOctet;
        }
        return retView.buffer;
      }
      if (!this.isHexOnly) {
        const encodedBuf = utilToBase(this.tagNumber, 7);
        const encodedView = new Uint8Array(encodedBuf);
        const size = encodedBuf.byteLength;
        const retView = new Uint8Array(size + 1);
        retView[0] = firstOctet | 0x1F;
        if (!sizeOnly) {
          for (let i = 0; i < size - 1; i++) retView[i + 1] = encodedView[i] | 0x80;
          retView[size] = encodedView[size - 1];
        }
        return retView.buffer;
      }
      const retView = new Uint8Array(this.valueHexView.byteLength + 1);
      retView[0] = firstOctet | 0x1F;
      if (!sizeOnly) {
        const curView = this.valueHexView;
        for (let i = 0; i < curView.length - 1; i++) retView[i + 1] = curView[i] | 0x80;
        retView[this.valueHexView.byteLength] = curView[curView.length - 1];
      }
      return retView.buffer;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const inputView = BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
        return -1;
      }
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      if (intBuffer.length === 0) {
        this.error = "Zero buffer length";
        return -1;
      }
      const tagClassMask = intBuffer[0] & 0xC0;
      switch (tagClassMask) {
        case 0x00:
          this.tagClass = 1;
          break;
        case 0x40:
          this.tagClass = 2;
          break;
        case 0x80:
          this.tagClass = 3;
          break;
        case 0xC0:
          this.tagClass = 4;
          break;
        default:
          this.error = "Unknown tag class";
          return -1;
      }
      this.isConstructed = (intBuffer[0] & 0x20) === 0x20;
      this.isHexOnly = false;
      const tagNumberMask = intBuffer[0] & 0x1F;
      if (tagNumberMask !== 0x1F) {
        this.tagNumber = tagNumberMask;
        this.blockLength = 1;
      } else {
        let count = 1;
        let intTagNumberBuffer = this.valueHexView = new Uint8Array(255);
        let tagNumberBufferMaxLength = 255;
        while (intBuffer[count] & 0x80) {
          intTagNumberBuffer[count - 1] = intBuffer[count] & 0x7F;
          count++;
          if (count >= intBuffer.length) {
            this.error = "End of input reached before message was fully decoded";
            return -1;
          }
          if (count === tagNumberBufferMaxLength) {
            tagNumberBufferMaxLength += 255;
            const tempBufferView = new Uint8Array(tagNumberBufferMaxLength);
            for (let i = 0; i < intTagNumberBuffer.length; i++) tempBufferView[i] = intTagNumberBuffer[i];
            intTagNumberBuffer = this.valueHexView = new Uint8Array(tagNumberBufferMaxLength);
          }
        }
        this.blockLength = count + 1;
        intTagNumberBuffer[count - 1] = intBuffer[count] & 0x7F;
        const tempBufferView = new Uint8Array(count);
        for (let i = 0; i < count; i++) tempBufferView[i] = intTagNumberBuffer[i];
        intTagNumberBuffer = this.valueHexView = new Uint8Array(count);
        intTagNumberBuffer.set(tempBufferView);
        if (this.blockLength <= 9) this.tagNumber = utilFromBase(intTagNumberBuffer, 7);else {
          this.isHexOnly = true;
          this.warnings.push("Tag too long, represented as hex-coded");
        }
      }
      if (this.tagClass === 1 && this.isConstructed) {
        switch (this.tagNumber) {
          case 1:
          case 2:
          case 5:
          case 6:
          case 9:
          case 13:
          case 14:
          case 23:
          case 24:
          case 31:
          case 32:
          case 33:
          case 34:
            this.error = "Constructed encoding used for primitive type";
            return -1;
        }
      }
      return inputOffset + this.blockLength;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        tagClass: this.tagClass,
        tagNumber: this.tagNumber,
        isConstructed: this.isConstructed
      };
    }
  }
  LocalIdentificationBlock.NAME = "identificationBlock";
  class LocalLengthBlock extends LocalBaseBlock {
    constructor({
      lenBlock = {}
    } = {}) {
      var _a, _b, _c;
      super();
      this.isIndefiniteForm = (_a = lenBlock.isIndefiniteForm) !== null && _a !== void 0 ? _a : false;
      this.longFormUsed = (_b = lenBlock.longFormUsed) !== null && _b !== void 0 ? _b : false;
      this.length = (_c = lenBlock.length) !== null && _c !== void 0 ? _c : 0;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const view = BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, view, inputOffset, inputLength)) {
        return -1;
      }
      const intBuffer = view.subarray(inputOffset, inputOffset + inputLength);
      if (intBuffer.length === 0) {
        this.error = "Zero buffer length";
        return -1;
      }
      if (intBuffer[0] === 0xFF) {
        this.error = "Length block 0xFF is reserved by standard";
        return -1;
      }
      this.isIndefiniteForm = intBuffer[0] === 0x80;
      if (this.isIndefiniteForm) {
        this.blockLength = 1;
        return inputOffset + this.blockLength;
      }
      this.longFormUsed = !!(intBuffer[0] & 0x80);
      if (this.longFormUsed === false) {
        this.length = intBuffer[0];
        this.blockLength = 1;
        return inputOffset + this.blockLength;
      }
      const count = intBuffer[0] & 0x7F;
      if (count > 8) {
        this.error = "Too big integer";
        return -1;
      }
      if (count + 1 > intBuffer.length) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      const lenOffset = inputOffset + 1;
      const lengthBufferView = view.subarray(lenOffset, lenOffset + count);
      if (lengthBufferView[count - 1] === 0x00) this.warnings.push("Needlessly long encoded length");
      this.length = utilFromBase(lengthBufferView, 8);
      if (this.longFormUsed && this.length <= 127) this.warnings.push("Unnecessary usage of long length form");
      this.blockLength = count + 1;
      return inputOffset + this.blockLength;
    }
    toBER(sizeOnly = false) {
      let retBuf;
      let retView;
      if (this.length > 127) this.longFormUsed = true;
      if (this.isIndefiniteForm) {
        retBuf = new ArrayBuffer(1);
        if (sizeOnly === false) {
          retView = new Uint8Array(retBuf);
          retView[0] = 0x80;
        }
        return retBuf;
      }
      if (this.longFormUsed) {
        const encodedBuf = utilToBase(this.length, 8);
        if (encodedBuf.byteLength > 127) {
          this.error = "Too big length";
          return EMPTY_BUFFER;
        }
        retBuf = new ArrayBuffer(encodedBuf.byteLength + 1);
        if (sizeOnly) return retBuf;
        const encodedView = new Uint8Array(encodedBuf);
        retView = new Uint8Array(retBuf);
        retView[0] = encodedBuf.byteLength | 0x80;
        for (let i = 0; i < encodedBuf.byteLength; i++) retView[i + 1] = encodedView[i];
        return retBuf;
      }
      retBuf = new ArrayBuffer(1);
      if (sizeOnly === false) {
        retView = new Uint8Array(retBuf);
        retView[0] = this.length;
      }
      return retBuf;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        isIndefiniteForm: this.isIndefiniteForm,
        longFormUsed: this.longFormUsed,
        length: this.length
      };
    }
  }
  LocalLengthBlock.NAME = "lengthBlock";
  const typeStore = {};
  class BaseBlock extends LocalBaseBlock {
    constructor({
      name = EMPTY_STRING,
      optional = false,
      primitiveSchema,
      ...parameters
    } = {}, valueBlockType) {
      super(parameters);
      this.name = name;
      this.optional = optional;
      if (primitiveSchema) {
        this.primitiveSchema = primitiveSchema;
      }
      this.idBlock = new LocalIdentificationBlock(parameters);
      this.lenBlock = new LocalLengthBlock(parameters);
      this.valueBlock = valueBlockType ? new valueBlockType(parameters) : new ValueBlock(parameters);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length) this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    toBER(sizeOnly, writer) {
      const _writer = writer || new ViewWriter();
      if (!writer) {
        prepareIndefiniteForm(this);
      }
      const idBlockBuf = this.idBlock.toBER(sizeOnly);
      _writer.write(idBlockBuf);
      if (this.lenBlock.isIndefiniteForm) {
        _writer.write(new Uint8Array([0x80]).buffer);
        this.valueBlock.toBER(sizeOnly, _writer);
        _writer.write(new ArrayBuffer(2));
      } else {
        const valueBlockBuf = this.valueBlock.toBER(sizeOnly);
        this.lenBlock.length = valueBlockBuf.byteLength;
        const lenBlockBuf = this.lenBlock.toBER(sizeOnly);
        _writer.write(lenBlockBuf);
        _writer.write(valueBlockBuf);
      }
      if (!writer) {
        return _writer.final();
      }
      return EMPTY_BUFFER;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        idBlock: this.idBlock.toJSON(),
        lenBlock: this.lenBlock.toJSON(),
        valueBlock: this.valueBlock.toJSON(),
        name: this.name,
        optional: this.optional
      };
      if (this.primitiveSchema) object.primitiveSchema = this.primitiveSchema.toJSON();
      return object;
    }
    toString(encoding = "ascii") {
      if (encoding === "ascii") {
        return this.onAsciiEncoding();
      }
      return Convert.ToHex(this.toBER());
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${Convert.ToHex(this.valueBlock.valueBeforeDecodeView)}`;
    }
    isEqual(other) {
      if (this === other) {
        return true;
      }
      if (!(other instanceof this.constructor)) {
        return false;
      }
      const thisRaw = this.toBER();
      const otherRaw = other.toBER();
      return isEqualBuffer(thisRaw, otherRaw);
    }
  }
  BaseBlock.NAME = "BaseBlock";
  function prepareIndefiniteForm(baseBlock) {
    if (baseBlock instanceof typeStore.Constructed) {
      for (const value of baseBlock.valueBlock.value) {
        if (prepareIndefiniteForm(value)) {
          baseBlock.lenBlock.isIndefiniteForm = true;
        }
      }
    }
    return !!baseBlock.lenBlock.isIndefiniteForm;
  }
  class BaseStringBlock extends BaseBlock {
    constructor({
      value = EMPTY_STRING,
      ...parameters
    } = {}, stringValueBlockType) {
      super(parameters, stringValueBlockType);
      if (value) {
        this.fromString(value);
      }
    }
    getValue() {
      return this.valueBlock.value;
    }
    setValue(value) {
      this.valueBlock.value = value;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      this.fromBuffer(this.valueBlock.valueHexView);
      if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length) this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : '${this.valueBlock.value}'`;
    }
  }
  BaseStringBlock.NAME = "BaseStringBlock";
  class LocalPrimitiveValueBlock extends HexBlock(ValueBlock) {
    constructor({
      isHexOnly = true,
      ...parameters
    } = {}) {
      super(parameters);
      this.isHexOnly = isHexOnly;
    }
  }
  LocalPrimitiveValueBlock.NAME = "PrimitiveValueBlock";
  var _a$w;
  class Primitive extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalPrimitiveValueBlock);
      this.idBlock.isConstructed = false;
    }
  }
  _a$w = Primitive;
  (() => {
    typeStore.Primitive = _a$w;
  })();
  Primitive.NAME = "PRIMITIVE";
  function localChangeType(inputObject, newType) {
    if (inputObject instanceof newType) {
      return inputObject;
    }
    const newObject = new newType();
    newObject.idBlock = inputObject.idBlock;
    newObject.lenBlock = inputObject.lenBlock;
    newObject.warnings = inputObject.warnings;
    newObject.valueBeforeDecodeView = inputObject.valueBeforeDecodeView;
    return newObject;
  }
  function localFromBER(inputBuffer, inputOffset = 0, inputLength = inputBuffer.length) {
    const incomingOffset = inputOffset;
    let returnObject = new BaseBlock({}, ValueBlock);
    const baseBlock = new LocalBaseBlock();
    if (!checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength)) {
      returnObject.error = baseBlock.error;
      return {
        offset: -1,
        result: returnObject
      };
    }
    const intBuffer = inputBuffer.subarray(inputOffset, inputOffset + inputLength);
    if (!intBuffer.length) {
      returnObject.error = "Zero buffer length";
      return {
        offset: -1,
        result: returnObject
      };
    }
    let resultOffset = returnObject.idBlock.fromBER(inputBuffer, inputOffset, inputLength);
    if (returnObject.idBlock.warnings.length) {
      returnObject.warnings.concat(returnObject.idBlock.warnings);
    }
    if (resultOffset === -1) {
      returnObject.error = returnObject.idBlock.error;
      return {
        offset: -1,
        result: returnObject
      };
    }
    inputOffset = resultOffset;
    inputLength -= returnObject.idBlock.blockLength;
    resultOffset = returnObject.lenBlock.fromBER(inputBuffer, inputOffset, inputLength);
    if (returnObject.lenBlock.warnings.length) {
      returnObject.warnings.concat(returnObject.lenBlock.warnings);
    }
    if (resultOffset === -1) {
      returnObject.error = returnObject.lenBlock.error;
      return {
        offset: -1,
        result: returnObject
      };
    }
    inputOffset = resultOffset;
    inputLength -= returnObject.lenBlock.blockLength;
    if (!returnObject.idBlock.isConstructed && returnObject.lenBlock.isIndefiniteForm) {
      returnObject.error = "Indefinite length form used for primitive encoding form";
      return {
        offset: -1,
        result: returnObject
      };
    }
    let newASN1Type = BaseBlock;
    switch (returnObject.idBlock.tagClass) {
      case 1:
        if (returnObject.idBlock.tagNumber >= 37 && returnObject.idBlock.isHexOnly === false) {
          returnObject.error = "UNIVERSAL 37 and upper tags are reserved by ASN.1 standard";
          return {
            offset: -1,
            result: returnObject
          };
        }
        switch (returnObject.idBlock.tagNumber) {
          case 0:
            if (returnObject.idBlock.isConstructed && returnObject.lenBlock.length > 0) {
              returnObject.error = "Type [UNIVERSAL 0] is reserved";
              return {
                offset: -1,
                result: returnObject
              };
            }
            newASN1Type = typeStore.EndOfContent;
            break;
          case 1:
            newASN1Type = typeStore.Boolean;
            break;
          case 2:
            newASN1Type = typeStore.Integer;
            break;
          case 3:
            newASN1Type = typeStore.BitString;
            break;
          case 4:
            newASN1Type = typeStore.OctetString;
            break;
          case 5:
            newASN1Type = typeStore.Null;
            break;
          case 6:
            newASN1Type = typeStore.ObjectIdentifier;
            break;
          case 10:
            newASN1Type = typeStore.Enumerated;
            break;
          case 12:
            newASN1Type = typeStore.Utf8String;
            break;
          case 13:
            newASN1Type = typeStore.RelativeObjectIdentifier;
            break;
          case 14:
            newASN1Type = typeStore.TIME;
            break;
          case 15:
            returnObject.error = "[UNIVERSAL 15] is reserved by ASN.1 standard";
            return {
              offset: -1,
              result: returnObject
            };
          case 16:
            newASN1Type = typeStore.Sequence;
            break;
          case 17:
            newASN1Type = typeStore.Set;
            break;
          case 18:
            newASN1Type = typeStore.NumericString;
            break;
          case 19:
            newASN1Type = typeStore.PrintableString;
            break;
          case 20:
            newASN1Type = typeStore.TeletexString;
            break;
          case 21:
            newASN1Type = typeStore.VideotexString;
            break;
          case 22:
            newASN1Type = typeStore.IA5String;
            break;
          case 23:
            newASN1Type = typeStore.UTCTime;
            break;
          case 24:
            newASN1Type = typeStore.GeneralizedTime;
            break;
          case 25:
            newASN1Type = typeStore.GraphicString;
            break;
          case 26:
            newASN1Type = typeStore.VisibleString;
            break;
          case 27:
            newASN1Type = typeStore.GeneralString;
            break;
          case 28:
            newASN1Type = typeStore.UniversalString;
            break;
          case 29:
            newASN1Type = typeStore.CharacterString;
            break;
          case 30:
            newASN1Type = typeStore.BmpString;
            break;
          case 31:
            newASN1Type = typeStore.DATE;
            break;
          case 32:
            newASN1Type = typeStore.TimeOfDay;
            break;
          case 33:
            newASN1Type = typeStore.DateTime;
            break;
          case 34:
            newASN1Type = typeStore.Duration;
            break;
          default:
            {
              const newObject = returnObject.idBlock.isConstructed ? new typeStore.Constructed() : new typeStore.Primitive();
              newObject.idBlock = returnObject.idBlock;
              newObject.lenBlock = returnObject.lenBlock;
              newObject.warnings = returnObject.warnings;
              returnObject = newObject;
            }
        }
        break;
      case 2:
      case 3:
      case 4:
      default:
        {
          newASN1Type = returnObject.idBlock.isConstructed ? typeStore.Constructed : typeStore.Primitive;
        }
    }
    returnObject = localChangeType(returnObject, newASN1Type);
    resultOffset = returnObject.fromBER(inputBuffer, inputOffset, returnObject.lenBlock.isIndefiniteForm ? inputLength : returnObject.lenBlock.length);
    returnObject.valueBeforeDecodeView = inputBuffer.subarray(incomingOffset, incomingOffset + returnObject.blockLength);
    return {
      offset: resultOffset,
      result: returnObject
    };
  }
  function fromBER(inputBuffer) {
    if (!inputBuffer.byteLength) {
      const result = new BaseBlock({}, ValueBlock);
      result.error = "Input buffer has zero length";
      return {
        offset: -1,
        result
      };
    }
    return localFromBER(BufferSourceConverter.toUint8Array(inputBuffer).slice(), 0, inputBuffer.byteLength);
  }
  function checkLen(indefiniteLength, length) {
    if (indefiniteLength) {
      return 1;
    }
    return length;
  }
  class LocalConstructedValueBlock extends ValueBlock {
    constructor({
      value = [],
      isIndefiniteForm = false,
      ...parameters
    } = {}) {
      super(parameters);
      this.value = value;
      this.isIndefiniteForm = isIndefiniteForm;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const view = BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, view, inputOffset, inputLength)) {
        return -1;
      }
      this.valueBeforeDecodeView = view.subarray(inputOffset, inputOffset + inputLength);
      if (this.valueBeforeDecodeView.length === 0) {
        this.warnings.push("Zero buffer length");
        return inputOffset;
      }
      let currentOffset = inputOffset;
      while (checkLen(this.isIndefiniteForm, inputLength) > 0) {
        const returnObject = localFromBER(view, currentOffset, inputLength);
        if (returnObject.offset === -1) {
          this.error = returnObject.result.error;
          this.warnings.concat(returnObject.result.warnings);
          return -1;
        }
        currentOffset = returnObject.offset;
        this.blockLength += returnObject.result.blockLength;
        inputLength -= returnObject.result.blockLength;
        this.value.push(returnObject.result);
        if (this.isIndefiniteForm && returnObject.result.constructor.NAME === END_OF_CONTENT_NAME) {
          break;
        }
      }
      if (this.isIndefiniteForm) {
        if (this.value[this.value.length - 1].constructor.NAME === END_OF_CONTENT_NAME) {
          this.value.pop();
        } else {
          this.warnings.push("No EndOfContent block encoded");
        }
      }
      return currentOffset;
    }
    toBER(sizeOnly, writer) {
      const _writer = writer || new ViewWriter();
      for (let i = 0; i < this.value.length; i++) {
        this.value[i].toBER(sizeOnly, _writer);
      }
      if (!writer) {
        return _writer.final();
      }
      return EMPTY_BUFFER;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        isIndefiniteForm: this.isIndefiniteForm,
        value: []
      };
      for (const value of this.value) {
        object.value.push(value.toJSON());
      }
      return object;
    }
  }
  LocalConstructedValueBlock.NAME = "ConstructedValueBlock";
  var _a$v;
  class Constructed extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalConstructedValueBlock);
      this.idBlock.isConstructed = true;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length) this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    onAsciiEncoding() {
      const values = [];
      for (const value of this.valueBlock.value) {
        values.push(value.toString("ascii").split("\n").map(o => `  ${o}`).join("\n"));
      }
      const blockName = this.idBlock.tagClass === 3 ? `[${this.idBlock.tagNumber}]` : this.constructor.NAME;
      return values.length ? `${blockName} :\n${values.join("\n")}` : `${blockName} :`;
    }
  }
  _a$v = Constructed;
  (() => {
    typeStore.Constructed = _a$v;
  })();
  Constructed.NAME = "CONSTRUCTED";
  class LocalEndOfContentValueBlock extends ValueBlock {
    fromBER(inputBuffer, inputOffset, inputLength) {
      return inputOffset;
    }
    toBER(sizeOnly) {
      return EMPTY_BUFFER;
    }
  }
  LocalEndOfContentValueBlock.override = "EndOfContentValueBlock";
  var _a$u;
  class EndOfContent extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalEndOfContentValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 0;
    }
  }
  _a$u = EndOfContent;
  (() => {
    typeStore.EndOfContent = _a$u;
  })();
  EndOfContent.NAME = END_OF_CONTENT_NAME;
  var _a$t;
  class Null extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, ValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 5;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (this.lenBlock.length > 0) this.warnings.push("Non-zero length of value block for Null type");
      if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;
      this.blockLength += inputLength;
      if (inputOffset + inputLength > inputBuffer.byteLength) {
        this.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
        return -1;
      }
      return inputOffset + inputLength;
    }
    toBER(sizeOnly, writer) {
      const retBuf = new ArrayBuffer(2);
      if (!sizeOnly) {
        const retView = new Uint8Array(retBuf);
        retView[0] = 0x05;
        retView[1] = 0x00;
      }
      if (writer) {
        writer.write(retBuf);
      }
      return retBuf;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME}`;
    }
  }
  _a$t = Null;
  (() => {
    typeStore.Null = _a$t;
  })();
  Null.NAME = "NULL";
  class LocalBooleanValueBlock extends HexBlock(ValueBlock) {
    constructor({
      value,
      ...parameters
    } = {}) {
      super(parameters);
      if (parameters.valueHex) {
        this.valueHexView = BufferSourceConverter.toUint8Array(parameters.valueHex);
      } else {
        this.valueHexView = new Uint8Array(1);
      }
      if (value) {
        this.value = value;
      }
    }
    get value() {
      for (const octet of this.valueHexView) {
        if (octet > 0) {
          return true;
        }
      }
      return false;
    }
    set value(value) {
      this.valueHexView[0] = value ? 0xFF : 0x00;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const inputView = BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
        return -1;
      }
      this.valueHexView = inputView.subarray(inputOffset, inputOffset + inputLength);
      if (inputLength > 1) this.warnings.push("Boolean value encoded in more then 1 octet");
      this.isHexOnly = true;
      utilDecodeTC.call(this);
      this.blockLength = inputLength;
      return inputOffset + inputLength;
    }
    toBER() {
      return this.valueHexView.slice();
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.value
      };
    }
  }
  LocalBooleanValueBlock.NAME = "BooleanValueBlock";
  var _a$s;
  class Boolean extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalBooleanValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 1;
    }
    getValue() {
      return this.valueBlock.value;
    }
    setValue(value) {
      this.valueBlock.value = value;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.getValue}`;
    }
  }
  _a$s = Boolean;
  (() => {
    typeStore.Boolean = _a$s;
  })();
  Boolean.NAME = "BOOLEAN";
  class LocalOctetStringValueBlock extends HexBlock(LocalConstructedValueBlock) {
    constructor({
      isConstructed = false,
      ...parameters
    } = {}) {
      super(parameters);
      this.isConstructed = isConstructed;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      let resultOffset = 0;
      if (this.isConstructed) {
        this.isHexOnly = false;
        resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength);
        if (resultOffset === -1) return resultOffset;
        for (let i = 0; i < this.value.length; i++) {
          const currentBlockName = this.value[i].constructor.NAME;
          if (currentBlockName === END_OF_CONTENT_NAME) {
            if (this.isIndefiniteForm) break;else {
              this.error = "EndOfContent is unexpected, OCTET STRING may consists of OCTET STRINGs only";
              return -1;
            }
          }
          if (currentBlockName !== OCTET_STRING_NAME) {
            this.error = "OCTET STRING may consists of OCTET STRINGs only";
            return -1;
          }
        }
      } else {
        this.isHexOnly = true;
        resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
        this.blockLength = inputLength;
      }
      return resultOffset;
    }
    toBER(sizeOnly, writer) {
      if (this.isConstructed) return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
      return sizeOnly ? new ArrayBuffer(this.valueHexView.byteLength) : this.valueHexView.slice().buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        isConstructed: this.isConstructed
      };
    }
  }
  LocalOctetStringValueBlock.NAME = "OctetStringValueBlock";
  var _a$r;
  let OctetString$1 = class OctetString extends BaseBlock {
    constructor({
      idBlock = {},
      lenBlock = {},
      ...parameters
    } = {}) {
      var _b, _c;
      (_b = parameters.isConstructed) !== null && _b !== void 0 ? _b : parameters.isConstructed = !!((_c = parameters.value) === null || _c === void 0 ? void 0 : _c.length);
      super({
        idBlock: {
          isConstructed: parameters.isConstructed,
          ...idBlock
        },
        lenBlock: {
          ...lenBlock,
          isIndefiniteForm: !!parameters.isIndefiniteForm
        },
        ...parameters
      }, LocalOctetStringValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 4;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      this.valueBlock.isConstructed = this.idBlock.isConstructed;
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      if (inputLength === 0) {
        if (this.idBlock.error.length === 0) this.blockLength += this.idBlock.blockLength;
        if (this.lenBlock.error.length === 0) this.blockLength += this.lenBlock.blockLength;
        return inputOffset;
      }
      if (!this.valueBlock.isConstructed) {
        const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
        const buf = view.subarray(inputOffset, inputOffset + inputLength);
        try {
          if (buf.byteLength) {
            const asn = localFromBER(buf, 0, buf.byteLength);
            if (asn.offset !== -1 && asn.offset === inputLength) {
              this.valueBlock.value = [asn.result];
            }
          }
        } catch (e) {}
      }
      return super.fromBER(inputBuffer, inputOffset, inputLength);
    }
    onAsciiEncoding() {
      if (this.valueBlock.isConstructed || this.valueBlock.value && this.valueBlock.value.length) {
        return Constructed.prototype.onAsciiEncoding.call(this);
      }
      return `${this.constructor.NAME} : ${Convert.ToHex(this.valueBlock.valueHexView)}`;
    }
    getValue() {
      if (!this.idBlock.isConstructed) {
        return this.valueBlock.valueHexView.slice().buffer;
      }
      const array = [];
      for (const content of this.valueBlock.value) {
        if (content instanceof OctetString) {
          array.push(content.valueBlock.valueHexView);
        }
      }
      return BufferSourceConverter.concat(array);
    }
  };
  _a$r = OctetString$1;
  (() => {
    typeStore.OctetString = _a$r;
  })();
  OctetString$1.NAME = OCTET_STRING_NAME;
  class LocalBitStringValueBlock extends HexBlock(LocalConstructedValueBlock) {
    constructor({
      unusedBits = 0,
      isConstructed = false,
      ...parameters
    } = {}) {
      super(parameters);
      this.unusedBits = unusedBits;
      this.isConstructed = isConstructed;
      this.blockLength = this.valueHexView.byteLength;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (!inputLength) {
        return inputOffset;
      }
      let resultOffset = -1;
      if (this.isConstructed) {
        resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength);
        if (resultOffset === -1) return resultOffset;
        for (const value of this.value) {
          const currentBlockName = value.constructor.NAME;
          if (currentBlockName === END_OF_CONTENT_NAME) {
            if (this.isIndefiniteForm) break;else {
              this.error = "EndOfContent is unexpected, BIT STRING may consists of BIT STRINGs only";
              return -1;
            }
          }
          if (currentBlockName !== BIT_STRING_NAME) {
            this.error = "BIT STRING may consists of BIT STRINGs only";
            return -1;
          }
          const valueBlock = value.valueBlock;
          if (this.unusedBits > 0 && valueBlock.unusedBits > 0) {
            this.error = "Using of \"unused bits\" inside constructive BIT STRING allowed for least one only";
            return -1;
          }
          this.unusedBits = valueBlock.unusedBits;
        }
        return resultOffset;
      }
      const inputView = BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
        return -1;
      }
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      this.unusedBits = intBuffer[0];
      if (this.unusedBits > 7) {
        this.error = "Unused bits for BitString must be in range 0-7";
        return -1;
      }
      if (!this.unusedBits) {
        const buf = intBuffer.subarray(1);
        try {
          if (buf.byteLength) {
            const asn = localFromBER(buf, 0, buf.byteLength);
            if (asn.offset !== -1 && asn.offset === inputLength - 1) {
              this.value = [asn.result];
            }
          }
        } catch (e) {}
      }
      this.valueHexView = intBuffer.subarray(1);
      this.blockLength = intBuffer.length;
      return inputOffset + inputLength;
    }
    toBER(sizeOnly, writer) {
      if (this.isConstructed) {
        return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
      }
      if (sizeOnly) {
        return new ArrayBuffer(this.valueHexView.byteLength + 1);
      }
      if (!this.valueHexView.byteLength) {
        return EMPTY_BUFFER;
      }
      const retView = new Uint8Array(this.valueHexView.length + 1);
      retView[0] = this.unusedBits;
      retView.set(this.valueHexView, 1);
      return retView.buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        unusedBits: this.unusedBits,
        isConstructed: this.isConstructed
      };
    }
  }
  LocalBitStringValueBlock.NAME = "BitStringValueBlock";
  var _a$q;
  let BitString$1 = class BitString extends BaseBlock {
    constructor({
      idBlock = {},
      lenBlock = {},
      ...parameters
    } = {}) {
      var _b, _c;
      (_b = parameters.isConstructed) !== null && _b !== void 0 ? _b : parameters.isConstructed = !!((_c = parameters.value) === null || _c === void 0 ? void 0 : _c.length);
      super({
        idBlock: {
          isConstructed: parameters.isConstructed,
          ...idBlock
        },
        lenBlock: {
          ...lenBlock,
          isIndefiniteForm: !!parameters.isIndefiniteForm
        },
        ...parameters
      }, LocalBitStringValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 3;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      this.valueBlock.isConstructed = this.idBlock.isConstructed;
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      return super.fromBER(inputBuffer, inputOffset, inputLength);
    }
    onAsciiEncoding() {
      if (this.valueBlock.isConstructed || this.valueBlock.value && this.valueBlock.value.length) {
        return Constructed.prototype.onAsciiEncoding.call(this);
      } else {
        const bits = [];
        const valueHex = this.valueBlock.valueHexView;
        for (const byte of valueHex) {
          bits.push(byte.toString(2).padStart(8, "0"));
        }
        const bitsStr = bits.join("");
        return `${this.constructor.NAME} : ${bitsStr.substring(0, bitsStr.length - this.valueBlock.unusedBits)}`;
      }
    }
  };
  _a$q = BitString$1;
  (() => {
    typeStore.BitString = _a$q;
  })();
  BitString$1.NAME = BIT_STRING_NAME;
  var _a$p;
  function viewAdd(first, second) {
    const c = new Uint8Array([0]);
    const firstView = new Uint8Array(first);
    const secondView = new Uint8Array(second);
    let firstViewCopy = firstView.slice(0);
    const firstViewCopyLength = firstViewCopy.length - 1;
    const secondViewCopy = secondView.slice(0);
    const secondViewCopyLength = secondViewCopy.length - 1;
    let value = 0;
    const max = secondViewCopyLength < firstViewCopyLength ? firstViewCopyLength : secondViewCopyLength;
    let counter = 0;
    for (let i = max; i >= 0; i--, counter++) {
      switch (true) {
        case counter < secondViewCopy.length:
          value = firstViewCopy[firstViewCopyLength - counter] + secondViewCopy[secondViewCopyLength - counter] + c[0];
          break;
        default:
          value = firstViewCopy[firstViewCopyLength - counter] + c[0];
      }
      c[0] = value / 10;
      switch (true) {
        case counter >= firstViewCopy.length:
          firstViewCopy = utilConcatView(new Uint8Array([value % 10]), firstViewCopy);
          break;
        default:
          firstViewCopy[firstViewCopyLength - counter] = value % 10;
      }
    }
    if (c[0] > 0) firstViewCopy = utilConcatView(c, firstViewCopy);
    return firstViewCopy;
  }
  function power2(n) {
    if (n >= powers2.length) {
      for (let p = powers2.length; p <= n; p++) {
        const c = new Uint8Array([0]);
        let digits = powers2[p - 1].slice(0);
        for (let i = digits.length - 1; i >= 0; i--) {
          const newValue = new Uint8Array([(digits[i] << 1) + c[0]]);
          c[0] = newValue[0] / 10;
          digits[i] = newValue[0] % 10;
        }
        if (c[0] > 0) digits = utilConcatView(c, digits);
        powers2.push(digits);
      }
    }
    return powers2[n];
  }
  function viewSub(first, second) {
    let b = 0;
    const firstView = new Uint8Array(first);
    const secondView = new Uint8Array(second);
    const firstViewCopy = firstView.slice(0);
    const firstViewCopyLength = firstViewCopy.length - 1;
    const secondViewCopy = secondView.slice(0);
    const secondViewCopyLength = secondViewCopy.length - 1;
    let value;
    let counter = 0;
    for (let i = secondViewCopyLength; i >= 0; i--, counter++) {
      value = firstViewCopy[firstViewCopyLength - counter] - secondViewCopy[secondViewCopyLength - counter] - b;
      switch (true) {
        case value < 0:
          b = 1;
          firstViewCopy[firstViewCopyLength - counter] = value + 10;
          break;
        default:
          b = 0;
          firstViewCopy[firstViewCopyLength - counter] = value;
      }
    }
    if (b > 0) {
      for (let i = firstViewCopyLength - secondViewCopyLength + 1; i >= 0; i--, counter++) {
        value = firstViewCopy[firstViewCopyLength - counter] - b;
        if (value < 0) {
          b = 1;
          firstViewCopy[firstViewCopyLength - counter] = value + 10;
        } else {
          b = 0;
          firstViewCopy[firstViewCopyLength - counter] = value;
          break;
        }
      }
    }
    return firstViewCopy.slice();
  }
  class LocalIntegerValueBlock extends HexBlock(ValueBlock) {
    constructor({
      value,
      ...parameters
    } = {}) {
      super(parameters);
      this._valueDec = 0;
      if (parameters.valueHex) {
        this.setValueHex();
      }
      if (value !== undefined) {
        this.valueDec = value;
      }
    }
    setValueHex() {
      if (this.valueHexView.length >= 4) {
        this.warnings.push("Too big Integer for decoding, hex only");
        this.isHexOnly = true;
        this._valueDec = 0;
      } else {
        this.isHexOnly = false;
        if (this.valueHexView.length > 0) {
          this._valueDec = utilDecodeTC.call(this);
        }
      }
    }
    set valueDec(v) {
      this._valueDec = v;
      this.isHexOnly = false;
      this.valueHexView = new Uint8Array(utilEncodeTC(v));
    }
    get valueDec() {
      return this._valueDec;
    }
    fromDER(inputBuffer, inputOffset, inputLength, expectedLength = 0) {
      const offset = this.fromBER(inputBuffer, inputOffset, inputLength);
      if (offset === -1) return offset;
      const view = this.valueHexView;
      if (view[0] === 0x00 && (view[1] & 0x80) !== 0) {
        this.valueHexView = view.subarray(1);
      } else {
        if (expectedLength !== 0) {
          if (view.length < expectedLength) {
            if (expectedLength - view.length > 1) expectedLength = view.length + 1;
            this.valueHexView = view.subarray(expectedLength - view.length);
          }
        }
      }
      return offset;
    }
    toDER(sizeOnly = false) {
      const view = this.valueHexView;
      switch (true) {
        case (view[0] & 0x80) !== 0:
          {
            const updatedView = new Uint8Array(this.valueHexView.length + 1);
            updatedView[0] = 0x00;
            updatedView.set(view, 1);
            this.valueHexView = updatedView;
          }
          break;
        case view[0] === 0x00 && (view[1] & 0x80) === 0:
          {
            this.valueHexView = this.valueHexView.subarray(1);
          }
          break;
      }
      return this.toBER(sizeOnly);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
      if (resultOffset === -1) {
        return resultOffset;
      }
      this.setValueHex();
      return resultOffset;
    }
    toBER(sizeOnly) {
      return sizeOnly ? new ArrayBuffer(this.valueHexView.length) : this.valueHexView.slice().buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        valueDec: this.valueDec
      };
    }
    toString() {
      const firstBit = this.valueHexView.length * 8 - 1;
      let digits = new Uint8Array(this.valueHexView.length * 8 / 3);
      let bitNumber = 0;
      let currentByte;
      const asn1View = this.valueHexView;
      let result = "";
      let flag = false;
      for (let byteNumber = asn1View.byteLength - 1; byteNumber >= 0; byteNumber--) {
        currentByte = asn1View[byteNumber];
        for (let i = 0; i < 8; i++) {
          if ((currentByte & 1) === 1) {
            switch (bitNumber) {
              case firstBit:
                digits = viewSub(power2(bitNumber), digits);
                result = "-";
                break;
              default:
                digits = viewAdd(digits, power2(bitNumber));
            }
          }
          bitNumber++;
          currentByte >>= 1;
        }
      }
      for (let i = 0; i < digits.length; i++) {
        if (digits[i]) flag = true;
        if (flag) result += digitsString.charAt(digits[i]);
      }
      if (flag === false) result += digitsString.charAt(0);
      return result;
    }
  }
  _a$p = LocalIntegerValueBlock;
  LocalIntegerValueBlock.NAME = "IntegerValueBlock";
  (() => {
    Object.defineProperty(_a$p.prototype, "valueHex", {
      set: function (v) {
        this.valueHexView = new Uint8Array(v);
        this.setValueHex();
      },
      get: function () {
        return this.valueHexView.slice().buffer;
      }
    });
  })();
  var _a$o;
  class Integer extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalIntegerValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 2;
    }
    toBigInt() {
      assertBigInt();
      return BigInt(this.valueBlock.toString());
    }
    static fromBigInt(value) {
      assertBigInt();
      const bigIntValue = BigInt(value);
      const writer = new ViewWriter();
      const hex = bigIntValue.toString(16).replace(/^-/, "");
      const view = new Uint8Array(Convert.FromHex(hex));
      if (bigIntValue < 0) {
        const first = new Uint8Array(view.length + (view[0] & 0x80 ? 1 : 0));
        first[0] |= 0x80;
        const firstInt = BigInt(`0x${Convert.ToHex(first)}`);
        const secondInt = firstInt + bigIntValue;
        const second = BufferSourceConverter.toUint8Array(Convert.FromHex(secondInt.toString(16)));
        second[0] |= 0x80;
        writer.write(second);
      } else {
        if (view[0] & 0x80) {
          writer.write(new Uint8Array([0]));
        }
        writer.write(view);
      }
      const res = new Integer({
        valueHex: writer.final()
      });
      return res;
    }
    convertToDER() {
      const integer = new Integer({
        valueHex: this.valueBlock.valueHexView
      });
      integer.valueBlock.toDER();
      return integer;
    }
    convertFromDER() {
      return new Integer({
        valueHex: this.valueBlock.valueHexView[0] === 0 ? this.valueBlock.valueHexView.subarray(1) : this.valueBlock.valueHexView
      });
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.valueBlock.toString()}`;
    }
  }
  _a$o = Integer;
  (() => {
    typeStore.Integer = _a$o;
  })();
  Integer.NAME = "INTEGER";
  var _a$n;
  class Enumerated extends Integer {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 10;
    }
  }
  _a$n = Enumerated;
  (() => {
    typeStore.Enumerated = _a$n;
  })();
  Enumerated.NAME = "ENUMERATED";
  class LocalSidValueBlock extends HexBlock(ValueBlock) {
    constructor({
      valueDec = -1,
      isFirstSid = false,
      ...parameters
    } = {}) {
      super(parameters);
      this.valueDec = valueDec;
      this.isFirstSid = isFirstSid;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (!inputLength) {
        return inputOffset;
      }
      const inputView = BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
        return -1;
      }
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      this.valueHexView = new Uint8Array(inputLength);
      for (let i = 0; i < inputLength; i++) {
        this.valueHexView[i] = intBuffer[i] & 0x7F;
        this.blockLength++;
        if ((intBuffer[i] & 0x80) === 0x00) break;
      }
      const tempView = new Uint8Array(this.blockLength);
      for (let i = 0; i < this.blockLength; i++) {
        tempView[i] = this.valueHexView[i];
      }
      this.valueHexView = tempView;
      if ((intBuffer[this.blockLength - 1] & 0x80) !== 0x00) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      if (this.valueHexView[0] === 0x00) this.warnings.push("Needlessly long format of SID encoding");
      if (this.blockLength <= 8) this.valueDec = utilFromBase(this.valueHexView, 7);else {
        this.isHexOnly = true;
        this.warnings.push("Too big SID for decoding, hex only");
      }
      return inputOffset + this.blockLength;
    }
    set valueBigInt(value) {
      assertBigInt();
      let bits = BigInt(value).toString(2);
      while (bits.length % 7) {
        bits = "0" + bits;
      }
      const bytes = new Uint8Array(bits.length / 7);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.slice(i * 7, i * 7 + 7), 2) + (i + 1 < bytes.length ? 0x80 : 0);
      }
      this.fromBER(bytes.buffer, 0, bytes.length);
    }
    toBER(sizeOnly) {
      if (this.isHexOnly) {
        if (sizeOnly) return new ArrayBuffer(this.valueHexView.byteLength);
        const curView = this.valueHexView;
        const retView = new Uint8Array(this.blockLength);
        for (let i = 0; i < this.blockLength - 1; i++) retView[i] = curView[i] | 0x80;
        retView[this.blockLength - 1] = curView[this.blockLength - 1];
        return retView.buffer;
      }
      const encodedBuf = utilToBase(this.valueDec, 7);
      if (encodedBuf.byteLength === 0) {
        this.error = "Error during encoding SID value";
        return EMPTY_BUFFER;
      }
      const retView = new Uint8Array(encodedBuf.byteLength);
      if (!sizeOnly) {
        const encodedView = new Uint8Array(encodedBuf);
        const len = encodedBuf.byteLength - 1;
        for (let i = 0; i < len; i++) retView[i] = encodedView[i] | 0x80;
        retView[len] = encodedView[len];
      }
      return retView;
    }
    toString() {
      let result = "";
      if (this.isHexOnly) result = Convert.ToHex(this.valueHexView);else {
        if (this.isFirstSid) {
          let sidValue = this.valueDec;
          if (this.valueDec <= 39) result = "0.";else {
            if (this.valueDec <= 79) {
              result = "1.";
              sidValue -= 40;
            } else {
              result = "2.";
              sidValue -= 80;
            }
          }
          result += sidValue.toString();
        } else result = this.valueDec.toString();
      }
      return result;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        valueDec: this.valueDec,
        isFirstSid: this.isFirstSid
      };
    }
  }
  LocalSidValueBlock.NAME = "sidBlock";
  class LocalObjectIdentifierValueBlock extends ValueBlock {
    constructor({
      value = EMPTY_STRING,
      ...parameters
    } = {}) {
      super(parameters);
      this.value = [];
      if (value) {
        this.fromString(value);
      }
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      let resultOffset = inputOffset;
      while (inputLength > 0) {
        const sidBlock = new LocalSidValueBlock();
        resultOffset = sidBlock.fromBER(inputBuffer, resultOffset, inputLength);
        if (resultOffset === -1) {
          this.blockLength = 0;
          this.error = sidBlock.error;
          return resultOffset;
        }
        if (this.value.length === 0) sidBlock.isFirstSid = true;
        this.blockLength += sidBlock.blockLength;
        inputLength -= sidBlock.blockLength;
        this.value.push(sidBlock);
      }
      return resultOffset;
    }
    toBER(sizeOnly) {
      const retBuffers = [];
      for (let i = 0; i < this.value.length; i++) {
        const valueBuf = this.value[i].toBER(sizeOnly);
        if (valueBuf.byteLength === 0) {
          this.error = this.value[i].error;
          return EMPTY_BUFFER;
        }
        retBuffers.push(valueBuf);
      }
      return concat$1(retBuffers);
    }
    fromString(string) {
      this.value = [];
      let pos1 = 0;
      let pos2 = 0;
      let sid = "";
      let flag = false;
      do {
        pos2 = string.indexOf(".", pos1);
        if (pos2 === -1) sid = string.substring(pos1);else sid = string.substring(pos1, pos2);
        pos1 = pos2 + 1;
        if (flag) {
          const sidBlock = this.value[0];
          let plus = 0;
          switch (sidBlock.valueDec) {
            case 0:
              break;
            case 1:
              plus = 40;
              break;
            case 2:
              plus = 80;
              break;
            default:
              this.value = [];
              return;
          }
          const parsedSID = parseInt(sid, 10);
          if (isNaN(parsedSID)) return;
          sidBlock.valueDec = parsedSID + plus;
          flag = false;
        } else {
          const sidBlock = new LocalSidValueBlock();
          if (sid > Number.MAX_SAFE_INTEGER) {
            assertBigInt();
            const sidValue = BigInt(sid);
            sidBlock.valueBigInt = sidValue;
          } else {
            sidBlock.valueDec = parseInt(sid, 10);
            if (isNaN(sidBlock.valueDec)) return;
          }
          if (!this.value.length) {
            sidBlock.isFirstSid = true;
            flag = true;
          }
          this.value.push(sidBlock);
        }
      } while (pos2 !== -1);
    }
    toString() {
      let result = "";
      let isHexOnly = false;
      for (let i = 0; i < this.value.length; i++) {
        isHexOnly = this.value[i].isHexOnly;
        let sidStr = this.value[i].toString();
        if (i !== 0) result = `${result}.`;
        if (isHexOnly) {
          sidStr = `{${sidStr}}`;
          if (this.value[i].isFirstSid) result = `2.{${sidStr} - 80}`;else result += sidStr;
        } else result += sidStr;
      }
      return result;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        value: this.toString(),
        sidArray: []
      };
      for (let i = 0; i < this.value.length; i++) {
        object.sidArray.push(this.value[i].toJSON());
      }
      return object;
    }
  }
  LocalObjectIdentifierValueBlock.NAME = "ObjectIdentifierValueBlock";
  var _a$m;
  let ObjectIdentifier$1 = class ObjectIdentifier extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalObjectIdentifierValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 6;
    }
    getValue() {
      return this.valueBlock.toString();
    }
    setValue(value) {
      this.valueBlock.fromString(value);
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.valueBlock.toString() || "empty"}`;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.getValue()
      };
    }
  };
  _a$m = ObjectIdentifier$1;
  (() => {
    typeStore.ObjectIdentifier = _a$m;
  })();
  ObjectIdentifier$1.NAME = "OBJECT IDENTIFIER";
  class LocalRelativeSidValueBlock extends HexBlock(LocalBaseBlock) {
    constructor({
      valueDec = 0,
      ...parameters
    } = {}) {
      super(parameters);
      this.valueDec = valueDec;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (inputLength === 0) return inputOffset;
      const inputView = BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) return -1;
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      this.valueHexView = new Uint8Array(inputLength);
      for (let i = 0; i < inputLength; i++) {
        this.valueHexView[i] = intBuffer[i] & 0x7F;
        this.blockLength++;
        if ((intBuffer[i] & 0x80) === 0x00) break;
      }
      const tempView = new Uint8Array(this.blockLength);
      for (let i = 0; i < this.blockLength; i++) tempView[i] = this.valueHexView[i];
      this.valueHexView = tempView;
      if ((intBuffer[this.blockLength - 1] & 0x80) !== 0x00) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      if (this.valueHexView[0] === 0x00) this.warnings.push("Needlessly long format of SID encoding");
      if (this.blockLength <= 8) this.valueDec = utilFromBase(this.valueHexView, 7);else {
        this.isHexOnly = true;
        this.warnings.push("Too big SID for decoding, hex only");
      }
      return inputOffset + this.blockLength;
    }
    toBER(sizeOnly) {
      if (this.isHexOnly) {
        if (sizeOnly) return new ArrayBuffer(this.valueHexView.byteLength);
        const curView = this.valueHexView;
        const retView = new Uint8Array(this.blockLength);
        for (let i = 0; i < this.blockLength - 1; i++) retView[i] = curView[i] | 0x80;
        retView[this.blockLength - 1] = curView[this.blockLength - 1];
        return retView.buffer;
      }
      const encodedBuf = utilToBase(this.valueDec, 7);
      if (encodedBuf.byteLength === 0) {
        this.error = "Error during encoding SID value";
        return EMPTY_BUFFER;
      }
      const retView = new Uint8Array(encodedBuf.byteLength);
      if (!sizeOnly) {
        const encodedView = new Uint8Array(encodedBuf);
        const len = encodedBuf.byteLength - 1;
        for (let i = 0; i < len; i++) retView[i] = encodedView[i] | 0x80;
        retView[len] = encodedView[len];
      }
      return retView.buffer;
    }
    toString() {
      let result = "";
      if (this.isHexOnly) result = Convert.ToHex(this.valueHexView);else {
        result = this.valueDec.toString();
      }
      return result;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        valueDec: this.valueDec
      };
    }
  }
  LocalRelativeSidValueBlock.NAME = "relativeSidBlock";
  class LocalRelativeObjectIdentifierValueBlock extends ValueBlock {
    constructor({
      value = EMPTY_STRING,
      ...parameters
    } = {}) {
      super(parameters);
      this.value = [];
      if (value) {
        this.fromString(value);
      }
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      let resultOffset = inputOffset;
      while (inputLength > 0) {
        const sidBlock = new LocalRelativeSidValueBlock();
        resultOffset = sidBlock.fromBER(inputBuffer, resultOffset, inputLength);
        if (resultOffset === -1) {
          this.blockLength = 0;
          this.error = sidBlock.error;
          return resultOffset;
        }
        this.blockLength += sidBlock.blockLength;
        inputLength -= sidBlock.blockLength;
        this.value.push(sidBlock);
      }
      return resultOffset;
    }
    toBER(sizeOnly, writer) {
      const retBuffers = [];
      for (let i = 0; i < this.value.length; i++) {
        const valueBuf = this.value[i].toBER(sizeOnly);
        if (valueBuf.byteLength === 0) {
          this.error = this.value[i].error;
          return EMPTY_BUFFER;
        }
        retBuffers.push(valueBuf);
      }
      return concat$1(retBuffers);
    }
    fromString(string) {
      this.value = [];
      let pos1 = 0;
      let pos2 = 0;
      let sid = "";
      do {
        pos2 = string.indexOf(".", pos1);
        if (pos2 === -1) sid = string.substring(pos1);else sid = string.substring(pos1, pos2);
        pos1 = pos2 + 1;
        const sidBlock = new LocalRelativeSidValueBlock();
        sidBlock.valueDec = parseInt(sid, 10);
        if (isNaN(sidBlock.valueDec)) return true;
        this.value.push(sidBlock);
      } while (pos2 !== -1);
      return true;
    }
    toString() {
      let result = "";
      let isHexOnly = false;
      for (let i = 0; i < this.value.length; i++) {
        isHexOnly = this.value[i].isHexOnly;
        let sidStr = this.value[i].toString();
        if (i !== 0) result = `${result}.`;
        if (isHexOnly) {
          sidStr = `{${sidStr}}`;
          result += sidStr;
        } else result += sidStr;
      }
      return result;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        value: this.toString(),
        sidArray: []
      };
      for (let i = 0; i < this.value.length; i++) object.sidArray.push(this.value[i].toJSON());
      return object;
    }
  }
  LocalRelativeObjectIdentifierValueBlock.NAME = "RelativeObjectIdentifierValueBlock";
  var _a$l;
  class RelativeObjectIdentifier extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalRelativeObjectIdentifierValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 13;
    }
    getValue() {
      return this.valueBlock.toString();
    }
    setValue(value) {
      this.valueBlock.fromString(value);
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.valueBlock.toString() || "empty"}`;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.getValue()
      };
    }
  }
  _a$l = RelativeObjectIdentifier;
  (() => {
    typeStore.RelativeObjectIdentifier = _a$l;
  })();
  RelativeObjectIdentifier.NAME = "RelativeObjectIdentifier";
  var _a$k;
  class Sequence extends Constructed {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 16;
    }
  }
  _a$k = Sequence;
  (() => {
    typeStore.Sequence = _a$k;
  })();
  Sequence.NAME = "SEQUENCE";
  var _a$j;
  class Set extends Constructed {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 17;
    }
  }
  _a$j = Set;
  (() => {
    typeStore.Set = _a$j;
  })();
  Set.NAME = "SET";
  class LocalStringValueBlock extends HexBlock(ValueBlock) {
    constructor({
      ...parameters
    } = {}) {
      super(parameters);
      this.isHexOnly = true;
      this.value = EMPTY_STRING;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.value
      };
    }
  }
  LocalStringValueBlock.NAME = "StringValueBlock";
  class LocalSimpleStringValueBlock extends LocalStringValueBlock {}
  LocalSimpleStringValueBlock.NAME = "SimpleStringValueBlock";
  class LocalSimpleStringBlock extends BaseStringBlock {
    constructor({
      ...parameters
    } = {}) {
      super(parameters, LocalSimpleStringValueBlock);
    }
    fromBuffer(inputBuffer) {
      this.valueBlock.value = String.fromCharCode.apply(null, BufferSourceConverter.toUint8Array(inputBuffer));
    }
    fromString(inputString) {
      const strLen = inputString.length;
      const view = this.valueBlock.valueHexView = new Uint8Array(strLen);
      for (let i = 0; i < strLen; i++) view[i] = inputString.charCodeAt(i);
      this.valueBlock.value = inputString;
    }
  }
  LocalSimpleStringBlock.NAME = "SIMPLE STRING";
  class LocalUtf8StringValueBlock extends LocalSimpleStringBlock {
    fromBuffer(inputBuffer) {
      this.valueBlock.valueHexView = BufferSourceConverter.toUint8Array(inputBuffer);
      try {
        this.valueBlock.value = Convert.ToUtf8String(inputBuffer);
      } catch (ex) {
        this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);
        this.valueBlock.value = Convert.ToBinary(inputBuffer);
      }
    }
    fromString(inputString) {
      this.valueBlock.valueHexView = new Uint8Array(Convert.FromUtf8String(inputString));
      this.valueBlock.value = inputString;
    }
  }
  LocalUtf8StringValueBlock.NAME = "Utf8StringValueBlock";
  var _a$i;
  class Utf8String extends LocalUtf8StringValueBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 12;
    }
  }
  _a$i = Utf8String;
  (() => {
    typeStore.Utf8String = _a$i;
  })();
  Utf8String.NAME = "UTF8String";
  class LocalBmpStringValueBlock extends LocalSimpleStringBlock {
    fromBuffer(inputBuffer) {
      this.valueBlock.value = Convert.ToUtf16String(inputBuffer);
      this.valueBlock.valueHexView = BufferSourceConverter.toUint8Array(inputBuffer);
    }
    fromString(inputString) {
      this.valueBlock.value = inputString;
      this.valueBlock.valueHexView = new Uint8Array(Convert.FromUtf16String(inputString));
    }
  }
  LocalBmpStringValueBlock.NAME = "BmpStringValueBlock";
  var _a$h;
  class BmpString extends LocalBmpStringValueBlock {
    constructor({
      ...parameters
    } = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 30;
    }
  }
  _a$h = BmpString;
  (() => {
    typeStore.BmpString = _a$h;
  })();
  BmpString.NAME = "BMPString";
  class LocalUniversalStringValueBlock extends LocalSimpleStringBlock {
    fromBuffer(inputBuffer) {
      const copyBuffer = ArrayBuffer.isView(inputBuffer) ? inputBuffer.slice().buffer : inputBuffer.slice(0);
      const valueView = new Uint8Array(copyBuffer);
      for (let i = 0; i < valueView.length; i += 4) {
        valueView[i] = valueView[i + 3];
        valueView[i + 1] = valueView[i + 2];
        valueView[i + 2] = 0x00;
        valueView[i + 3] = 0x00;
      }
      this.valueBlock.value = String.fromCharCode.apply(null, new Uint32Array(copyBuffer));
    }
    fromString(inputString) {
      const strLength = inputString.length;
      const valueHexView = this.valueBlock.valueHexView = new Uint8Array(strLength * 4);
      for (let i = 0; i < strLength; i++) {
        const codeBuf = utilToBase(inputString.charCodeAt(i), 8);
        const codeView = new Uint8Array(codeBuf);
        if (codeView.length > 4) continue;
        const dif = 4 - codeView.length;
        for (let j = codeView.length - 1; j >= 0; j--) valueHexView[i * 4 + j + dif] = codeView[j];
      }
      this.valueBlock.value = inputString;
    }
  }
  LocalUniversalStringValueBlock.NAME = "UniversalStringValueBlock";
  var _a$g;
  class UniversalString extends LocalUniversalStringValueBlock {
    constructor({
      ...parameters
    } = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 28;
    }
  }
  _a$g = UniversalString;
  (() => {
    typeStore.UniversalString = _a$g;
  })();
  UniversalString.NAME = "UniversalString";
  var _a$f;
  class NumericString extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 18;
    }
  }
  _a$f = NumericString;
  (() => {
    typeStore.NumericString = _a$f;
  })();
  NumericString.NAME = "NumericString";
  var _a$e;
  class PrintableString extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 19;
    }
  }
  _a$e = PrintableString;
  (() => {
    typeStore.PrintableString = _a$e;
  })();
  PrintableString.NAME = "PrintableString";
  var _a$d;
  class TeletexString extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 20;
    }
  }
  _a$d = TeletexString;
  (() => {
    typeStore.TeletexString = _a$d;
  })();
  TeletexString.NAME = "TeletexString";
  var _a$c;
  class VideotexString extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 21;
    }
  }
  _a$c = VideotexString;
  (() => {
    typeStore.VideotexString = _a$c;
  })();
  VideotexString.NAME = "VideotexString";
  var _a$b;
  class IA5String extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 22;
    }
  }
  _a$b = IA5String;
  (() => {
    typeStore.IA5String = _a$b;
  })();
  IA5String.NAME = "IA5String";
  var _a$a;
  class GraphicString extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 25;
    }
  }
  _a$a = GraphicString;
  (() => {
    typeStore.GraphicString = _a$a;
  })();
  GraphicString.NAME = "GraphicString";
  var _a$9;
  class VisibleString extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 26;
    }
  }
  _a$9 = VisibleString;
  (() => {
    typeStore.VisibleString = _a$9;
  })();
  VisibleString.NAME = "VisibleString";
  var _a$8;
  class GeneralString extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 27;
    }
  }
  _a$8 = GeneralString;
  (() => {
    typeStore.GeneralString = _a$8;
  })();
  GeneralString.NAME = "GeneralString";
  var _a$7;
  class CharacterString extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 29;
    }
  }
  _a$7 = CharacterString;
  (() => {
    typeStore.CharacterString = _a$7;
  })();
  CharacterString.NAME = "CharacterString";
  var _a$6;
  class UTCTime extends VisibleString {
    constructor({
      value,
      valueDate,
      ...parameters
    } = {}) {
      super(parameters);
      this.year = 0;
      this.month = 0;
      this.day = 0;
      this.hour = 0;
      this.minute = 0;
      this.second = 0;
      if (value) {
        this.fromString(value);
        this.valueBlock.valueHexView = new Uint8Array(value.length);
        for (let i = 0; i < value.length; i++) this.valueBlock.valueHexView[i] = value.charCodeAt(i);
      }
      if (valueDate) {
        this.fromDate(valueDate);
        this.valueBlock.valueHexView = new Uint8Array(this.toBuffer());
      }
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 23;
    }
    fromBuffer(inputBuffer) {
      this.fromString(String.fromCharCode.apply(null, BufferSourceConverter.toUint8Array(inputBuffer)));
    }
    toBuffer() {
      const str = this.toString();
      const buffer = new ArrayBuffer(str.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i);
      return buffer;
    }
    fromDate(inputDate) {
      this.year = inputDate.getUTCFullYear();
      this.month = inputDate.getUTCMonth() + 1;
      this.day = inputDate.getUTCDate();
      this.hour = inputDate.getUTCHours();
      this.minute = inputDate.getUTCMinutes();
      this.second = inputDate.getUTCSeconds();
    }
    toDate() {
      return new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second));
    }
    fromString(inputString) {
      const parser = /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z/ig;
      const parserArray = parser.exec(inputString);
      if (parserArray === null) {
        this.error = "Wrong input string for conversion";
        return;
      }
      const year = parseInt(parserArray[1], 10);
      if (year >= 50) this.year = 1900 + year;else this.year = 2000 + year;
      this.month = parseInt(parserArray[2], 10);
      this.day = parseInt(parserArray[3], 10);
      this.hour = parseInt(parserArray[4], 10);
      this.minute = parseInt(parserArray[5], 10);
      this.second = parseInt(parserArray[6], 10);
    }
    toString(encoding = "iso") {
      if (encoding === "iso") {
        const outputArray = new Array(7);
        outputArray[0] = padNumber(this.year < 2000 ? this.year - 1900 : this.year - 2000, 2);
        outputArray[1] = padNumber(this.month, 2);
        outputArray[2] = padNumber(this.day, 2);
        outputArray[3] = padNumber(this.hour, 2);
        outputArray[4] = padNumber(this.minute, 2);
        outputArray[5] = padNumber(this.second, 2);
        outputArray[6] = "Z";
        return outputArray.join("");
      }
      return super.toString(encoding);
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.toDate().toISOString()}`;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        year: this.year,
        month: this.month,
        day: this.day,
        hour: this.hour,
        minute: this.minute,
        second: this.second
      };
    }
  }
  _a$6 = UTCTime;
  (() => {
    typeStore.UTCTime = _a$6;
  })();
  UTCTime.NAME = "UTCTime";
  var _a$5;
  class GeneralizedTime extends UTCTime {
    constructor(parameters = {}) {
      var _b;
      super(parameters);
      (_b = this.millisecond) !== null && _b !== void 0 ? _b : this.millisecond = 0;
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 24;
    }
    fromDate(inputDate) {
      super.fromDate(inputDate);
      this.millisecond = inputDate.getUTCMilliseconds();
    }
    toDate() {
      return new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.millisecond));
    }
    fromString(inputString) {
      let isUTC = false;
      let timeString = "";
      let dateTimeString = "";
      let fractionPart = 0;
      let parser;
      let hourDifference = 0;
      let minuteDifference = 0;
      if (inputString[inputString.length - 1] === "Z") {
        timeString = inputString.substring(0, inputString.length - 1);
        isUTC = true;
      } else {
        const number = new Number(inputString[inputString.length - 1]);
        if (isNaN(number.valueOf())) throw new Error("Wrong input string for conversion");
        timeString = inputString;
      }
      if (isUTC) {
        if (timeString.indexOf("+") !== -1) throw new Error("Wrong input string for conversion");
        if (timeString.indexOf("-") !== -1) throw new Error("Wrong input string for conversion");
      } else {
        let multiplier = 1;
        let differencePosition = timeString.indexOf("+");
        let differenceString = "";
        if (differencePosition === -1) {
          differencePosition = timeString.indexOf("-");
          multiplier = -1;
        }
        if (differencePosition !== -1) {
          differenceString = timeString.substring(differencePosition + 1);
          timeString = timeString.substring(0, differencePosition);
          if (differenceString.length !== 2 && differenceString.length !== 4) throw new Error("Wrong input string for conversion");
          let number = parseInt(differenceString.substring(0, 2), 10);
          if (isNaN(number.valueOf())) throw new Error("Wrong input string for conversion");
          hourDifference = multiplier * number;
          if (differenceString.length === 4) {
            number = parseInt(differenceString.substring(2, 4), 10);
            if (isNaN(number.valueOf())) throw new Error("Wrong input string for conversion");
            minuteDifference = multiplier * number;
          }
        }
      }
      let fractionPointPosition = timeString.indexOf(".");
      if (fractionPointPosition === -1) fractionPointPosition = timeString.indexOf(",");
      if (fractionPointPosition !== -1) {
        const fractionPartCheck = new Number(`0${timeString.substring(fractionPointPosition)}`);
        if (isNaN(fractionPartCheck.valueOf())) throw new Error("Wrong input string for conversion");
        fractionPart = fractionPartCheck.valueOf();
        dateTimeString = timeString.substring(0, fractionPointPosition);
      } else dateTimeString = timeString;
      switch (true) {
        case dateTimeString.length === 8:
          parser = /(\d{4})(\d{2})(\d{2})/ig;
          if (fractionPointPosition !== -1) throw new Error("Wrong input string for conversion");
          break;
        case dateTimeString.length === 10:
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})/ig;
          if (fractionPointPosition !== -1) {
            let fractionResult = 60 * fractionPart;
            this.minute = Math.floor(fractionResult);
            fractionResult = 60 * (fractionResult - this.minute);
            this.second = Math.floor(fractionResult);
            fractionResult = 1000 * (fractionResult - this.second);
            this.millisecond = Math.floor(fractionResult);
          }
          break;
        case dateTimeString.length === 12:
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/ig;
          if (fractionPointPosition !== -1) {
            let fractionResult = 60 * fractionPart;
            this.second = Math.floor(fractionResult);
            fractionResult = 1000 * (fractionResult - this.second);
            this.millisecond = Math.floor(fractionResult);
          }
          break;
        case dateTimeString.length === 14:
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/ig;
          if (fractionPointPosition !== -1) {
            const fractionResult = 1000 * fractionPart;
            this.millisecond = Math.floor(fractionResult);
          }
          break;
        default:
          throw new Error("Wrong input string for conversion");
      }
      const parserArray = parser.exec(dateTimeString);
      if (parserArray === null) throw new Error("Wrong input string for conversion");
      for (let j = 1; j < parserArray.length; j++) {
        switch (j) {
          case 1:
            this.year = parseInt(parserArray[j], 10);
            break;
          case 2:
            this.month = parseInt(parserArray[j], 10);
            break;
          case 3:
            this.day = parseInt(parserArray[j], 10);
            break;
          case 4:
            this.hour = parseInt(parserArray[j], 10) + hourDifference;
            break;
          case 5:
            this.minute = parseInt(parserArray[j], 10) + minuteDifference;
            break;
          case 6:
            this.second = parseInt(parserArray[j], 10);
            break;
          default:
            throw new Error("Wrong input string for conversion");
        }
      }
      if (isUTC === false) {
        const tempDate = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second, this.millisecond);
        this.year = tempDate.getUTCFullYear();
        this.month = tempDate.getUTCMonth();
        this.day = tempDate.getUTCDay();
        this.hour = tempDate.getUTCHours();
        this.minute = tempDate.getUTCMinutes();
        this.second = tempDate.getUTCSeconds();
        this.millisecond = tempDate.getUTCMilliseconds();
      }
    }
    toString(encoding = "iso") {
      if (encoding === "iso") {
        const outputArray = [];
        outputArray.push(padNumber(this.year, 4));
        outputArray.push(padNumber(this.month, 2));
        outputArray.push(padNumber(this.day, 2));
        outputArray.push(padNumber(this.hour, 2));
        outputArray.push(padNumber(this.minute, 2));
        outputArray.push(padNumber(this.second, 2));
        if (this.millisecond !== 0) {
          outputArray.push(".");
          outputArray.push(padNumber(this.millisecond, 3));
        }
        outputArray.push("Z");
        return outputArray.join("");
      }
      return super.toString(encoding);
    }
    toJSON() {
      return {
        ...super.toJSON(),
        millisecond: this.millisecond
      };
    }
  }
  _a$5 = GeneralizedTime;
  (() => {
    typeStore.GeneralizedTime = _a$5;
  })();
  GeneralizedTime.NAME = "GeneralizedTime";
  var _a$4;
  class DATE extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 31;
    }
  }
  _a$4 = DATE;
  (() => {
    typeStore.DATE = _a$4;
  })();
  DATE.NAME = "DATE";
  var _a$3;
  class TimeOfDay extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 32;
    }
  }
  _a$3 = TimeOfDay;
  (() => {
    typeStore.TimeOfDay = _a$3;
  })();
  TimeOfDay.NAME = "TimeOfDay";
  var _a$2;
  class DateTime extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 33;
    }
  }
  _a$2 = DateTime;
  (() => {
    typeStore.DateTime = _a$2;
  })();
  DateTime.NAME = "DateTime";
  var _a$1;
  class Duration extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 34;
    }
  }
  _a$1 = Duration;
  (() => {
    typeStore.Duration = _a$1;
  })();
  Duration.NAME = "Duration";
  var _a;
  class TIME extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 14;
    }
  }
  _a = TIME;
  (() => {
    typeStore.TIME = _a;
  })();
  TIME.NAME = "TIME";
  class Any {
    constructor({
      name = EMPTY_STRING,
      optional = false
    } = {}) {
      this.name = name;
      this.optional = optional;
    }
  }
  class Choice extends Any {
    constructor({
      value = [],
      ...parameters
    } = {}) {
      super(parameters);
      this.value = value;
    }
  }
  class Repeated extends Any {
    constructor({
      value = new Any(),
      local = false,
      ...parameters
    } = {}) {
      super(parameters);
      this.value = value;
      this.local = local;
    }
  }
  class RawData {
    constructor({
      data = EMPTY_VIEW
    } = {}) {
      this.dataView = BufferSourceConverter.toUint8Array(data);
    }
    get data() {
      return this.dataView.slice().buffer;
    }
    set data(value) {
      this.dataView = BufferSourceConverter.toUint8Array(value);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const endLength = inputOffset + inputLength;
      this.dataView = BufferSourceConverter.toUint8Array(inputBuffer).subarray(inputOffset, endLength);
      return endLength;
    }
    toBER(sizeOnly) {
      return this.dataView.slice().buffer;
    }
  }
  function compareSchema(root, inputData, inputSchema) {
    if (inputSchema instanceof Choice) {
      for (let j = 0; j < inputSchema.value.length; j++) {
        const result = compareSchema(root, inputData, inputSchema.value[j]);
        if (result.verified) {
          return {
            verified: true,
            result: root
          };
        }
      }
      {
        const _result = {
          verified: false,
          result: {
            error: "Wrong values for Choice type"
          }
        };
        if (inputSchema.hasOwnProperty(NAME)) _result.name = inputSchema.name;
        return _result;
      }
    }
    if (inputSchema instanceof Any) {
      if (inputSchema.hasOwnProperty(NAME)) root[inputSchema.name] = inputData;
      return {
        verified: true,
        result: root
      };
    }
    if (root instanceof Object === false) {
      return {
        verified: false,
        result: {
          error: "Wrong root object"
        }
      };
    }
    if (inputData instanceof Object === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 data"
        }
      };
    }
    if (inputSchema instanceof Object === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema"
        }
      };
    }
    if (ID_BLOCK in inputSchema === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema"
        }
      };
    }
    if (FROM_BER in inputSchema.idBlock === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema"
        }
      };
    }
    if (TO_BER in inputSchema.idBlock === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema"
        }
      };
    }
    const encodedId = inputSchema.idBlock.toBER(false);
    if (encodedId.byteLength === 0) {
      return {
        verified: false,
        result: {
          error: "Error encoding idBlock for ASN.1 schema"
        }
      };
    }
    const decodedOffset = inputSchema.idBlock.fromBER(encodedId, 0, encodedId.byteLength);
    if (decodedOffset === -1) {
      return {
        verified: false,
        result: {
          error: "Error decoding idBlock for ASN.1 schema"
        }
      };
    }
    if (inputSchema.idBlock.hasOwnProperty(TAG_CLASS) === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema"
        }
      };
    }
    if (inputSchema.idBlock.tagClass !== inputData.idBlock.tagClass) {
      return {
        verified: false,
        result: root
      };
    }
    if (inputSchema.idBlock.hasOwnProperty(TAG_NUMBER) === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema"
        }
      };
    }
    if (inputSchema.idBlock.tagNumber !== inputData.idBlock.tagNumber) {
      return {
        verified: false,
        result: root
      };
    }
    if (inputSchema.idBlock.hasOwnProperty(IS_CONSTRUCTED) === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema"
        }
      };
    }
    if (inputSchema.idBlock.isConstructed !== inputData.idBlock.isConstructed) {
      return {
        verified: false,
        result: root
      };
    }
    if (!(IS_HEX_ONLY in inputSchema.idBlock)) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema"
        }
      };
    }
    if (inputSchema.idBlock.isHexOnly !== inputData.idBlock.isHexOnly) {
      return {
        verified: false,
        result: root
      };
    }
    if (inputSchema.idBlock.isHexOnly) {
      if (VALUE_HEX_VIEW in inputSchema.idBlock === false) {
        return {
          verified: false,
          result: {
            error: "Wrong ASN.1 schema"
          }
        };
      }
      const schemaView = inputSchema.idBlock.valueHexView;
      const asn1View = inputData.idBlock.valueHexView;
      if (schemaView.length !== asn1View.length) {
        return {
          verified: false,
          result: root
        };
      }
      for (let i = 0; i < schemaView.length; i++) {
        if (schemaView[i] !== asn1View[1]) {
          return {
            verified: false,
            result: root
          };
        }
      }
    }
    if (inputSchema.name) {
      inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
      if (inputSchema.name) root[inputSchema.name] = inputData;
    }
    if (inputSchema instanceof typeStore.Constructed) {
      let admission = 0;
      let result = {
        verified: false,
        result: {
          error: "Unknown error"
        }
      };
      let maxLength = inputSchema.valueBlock.value.length;
      if (maxLength > 0) {
        if (inputSchema.valueBlock.value[0] instanceof Repeated) {
          maxLength = inputData.valueBlock.value.length;
        }
      }
      if (maxLength === 0) {
        return {
          verified: true,
          result: root
        };
      }
      if (inputData.valueBlock.value.length === 0 && inputSchema.valueBlock.value.length !== 0) {
        let _optional = true;
        for (let i = 0; i < inputSchema.valueBlock.value.length; i++) _optional = _optional && (inputSchema.valueBlock.value[i].optional || false);
        if (_optional) {
          return {
            verified: true,
            result: root
          };
        }
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
          if (inputSchema.name) delete root[inputSchema.name];
        }
        root.error = "Inconsistent object length";
        return {
          verified: false,
          result: root
        };
      }
      for (let i = 0; i < maxLength; i++) {
        if (i - admission >= inputData.valueBlock.value.length) {
          if (inputSchema.valueBlock.value[i].optional === false) {
            const _result = {
              verified: false,
              result: root
            };
            root.error = "Inconsistent length between ASN.1 data and schema";
            if (inputSchema.name) {
              inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
              if (inputSchema.name) {
                delete root[inputSchema.name];
                _result.name = inputSchema.name;
              }
            }
            return _result;
          }
        } else {
          if (inputSchema.valueBlock.value[0] instanceof Repeated) {
            result = compareSchema(root, inputData.valueBlock.value[i], inputSchema.valueBlock.value[0].value);
            if (result.verified === false) {
              if (inputSchema.valueBlock.value[0].optional) admission++;else {
                if (inputSchema.name) {
                  inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
                  if (inputSchema.name) delete root[inputSchema.name];
                }
                return result;
              }
            }
            if (NAME in inputSchema.valueBlock.value[0] && inputSchema.valueBlock.value[0].name.length > 0) {
              let arrayRoot = {};
              if (LOCAL in inputSchema.valueBlock.value[0] && inputSchema.valueBlock.value[0].local) arrayRoot = inputData;else arrayRoot = root;
              if (typeof arrayRoot[inputSchema.valueBlock.value[0].name] === "undefined") arrayRoot[inputSchema.valueBlock.value[0].name] = [];
              arrayRoot[inputSchema.valueBlock.value[0].name].push(inputData.valueBlock.value[i]);
            }
          } else {
            result = compareSchema(root, inputData.valueBlock.value[i - admission], inputSchema.valueBlock.value[i]);
            if (result.verified === false) {
              if (inputSchema.valueBlock.value[i].optional) admission++;else {
                if (inputSchema.name) {
                  inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
                  if (inputSchema.name) delete root[inputSchema.name];
                }
                return result;
              }
            }
          }
        }
      }
      if (result.verified === false) {
        const _result = {
          verified: false,
          result: root
        };
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
          if (inputSchema.name) {
            delete root[inputSchema.name];
            _result.name = inputSchema.name;
          }
        }
        return _result;
      }
      return {
        verified: true,
        result: root
      };
    }
    if (inputSchema.primitiveSchema && VALUE_HEX_VIEW in inputData.valueBlock) {
      const asn1 = localFromBER(inputData.valueBlock.valueHexView);
      if (asn1.offset === -1) {
        const _result = {
          verified: false,
          result: asn1.result
        };
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
          if (inputSchema.name) {
            delete root[inputSchema.name];
            _result.name = inputSchema.name;
          }
        }
        return _result;
      }
      return compareSchema(root, asn1.result, inputSchema.primitiveSchema);
    }
    return {
      verified: true,
      result: root
    };
  }
  function verifySchema(inputBuffer, inputSchema) {
    if (inputSchema instanceof Object === false) {
      return {
        verified: false,
        result: {
          error: "Wrong ASN.1 schema type"
        }
      };
    }
    const asn1 = localFromBER(BufferSourceConverter.toUint8Array(inputBuffer));
    if (asn1.offset === -1) {
      return {
        verified: false,
        result: asn1.result
      };
    }
    return compareSchema(asn1.result, asn1.result, inputSchema);
  }
  var asn1js = Object.freeze({
    __proto__: null,
    Any: Any,
    BaseBlock: BaseBlock,
    BaseStringBlock: BaseStringBlock,
    BitString: BitString$1,
    BmpString: BmpString,
    Boolean: Boolean,
    CharacterString: CharacterString,
    Choice: Choice,
    Constructed: Constructed,
    DATE: DATE,
    DateTime: DateTime,
    Duration: Duration,
    EndOfContent: EndOfContent,
    Enumerated: Enumerated,
    GeneralString: GeneralString,
    GeneralizedTime: GeneralizedTime,
    GraphicString: GraphicString,
    HexBlock: HexBlock,
    IA5String: IA5String,
    Integer: Integer,
    Null: Null,
    NumericString: NumericString,
    ObjectIdentifier: ObjectIdentifier$1,
    OctetString: OctetString$1,
    Primitive: Primitive,
    PrintableString: PrintableString,
    RawData: RawData,
    RelativeObjectIdentifier: RelativeObjectIdentifier,
    Repeated: Repeated,
    Sequence: Sequence,
    Set: Set,
    TIME: TIME,
    TeletexString: TeletexString,
    TimeOfDay: TimeOfDay,
    UTCTime: UTCTime,
    UniversalString: UniversalString,
    Utf8String: Utf8String,
    ValueBlock: ValueBlock,
    VideotexString: VideotexString,
    ViewWriter: ViewWriter,
    VisibleString: VisibleString,
    compareSchema: compareSchema,
    fromBER: fromBER,
    verifySchema: verifySchema
  });
  var AsnTypeTypes;
  (function (AsnTypeTypes) {
    AsnTypeTypes[AsnTypeTypes["Sequence"] = 0] = "Sequence";
    AsnTypeTypes[AsnTypeTypes["Set"] = 1] = "Set";
    AsnTypeTypes[AsnTypeTypes["Choice"] = 2] = "Choice";
  })(AsnTypeTypes || (AsnTypeTypes = {}));
  var AsnPropTypes;
  (function (AsnPropTypes) {
    AsnPropTypes[AsnPropTypes["Any"] = 1] = "Any";
    AsnPropTypes[AsnPropTypes["Boolean"] = 2] = "Boolean";
    AsnPropTypes[AsnPropTypes["OctetString"] = 3] = "OctetString";
    AsnPropTypes[AsnPropTypes["BitString"] = 4] = "BitString";
    AsnPropTypes[AsnPropTypes["Integer"] = 5] = "Integer";
    AsnPropTypes[AsnPropTypes["Enumerated"] = 6] = "Enumerated";
    AsnPropTypes[AsnPropTypes["ObjectIdentifier"] = 7] = "ObjectIdentifier";
    AsnPropTypes[AsnPropTypes["Utf8String"] = 8] = "Utf8String";
    AsnPropTypes[AsnPropTypes["BmpString"] = 9] = "BmpString";
    AsnPropTypes[AsnPropTypes["UniversalString"] = 10] = "UniversalString";
    AsnPropTypes[AsnPropTypes["NumericString"] = 11] = "NumericString";
    AsnPropTypes[AsnPropTypes["PrintableString"] = 12] = "PrintableString";
    AsnPropTypes[AsnPropTypes["TeletexString"] = 13] = "TeletexString";
    AsnPropTypes[AsnPropTypes["VideotexString"] = 14] = "VideotexString";
    AsnPropTypes[AsnPropTypes["IA5String"] = 15] = "IA5String";
    AsnPropTypes[AsnPropTypes["GraphicString"] = 16] = "GraphicString";
    AsnPropTypes[AsnPropTypes["VisibleString"] = 17] = "VisibleString";
    AsnPropTypes[AsnPropTypes["GeneralString"] = 18] = "GeneralString";
    AsnPropTypes[AsnPropTypes["CharacterString"] = 19] = "CharacterString";
    AsnPropTypes[AsnPropTypes["UTCTime"] = 20] = "UTCTime";
    AsnPropTypes[AsnPropTypes["GeneralizedTime"] = 21] = "GeneralizedTime";
    AsnPropTypes[AsnPropTypes["DATE"] = 22] = "DATE";
    AsnPropTypes[AsnPropTypes["TimeOfDay"] = 23] = "TimeOfDay";
    AsnPropTypes[AsnPropTypes["DateTime"] = 24] = "DateTime";
    AsnPropTypes[AsnPropTypes["Duration"] = 25] = "Duration";
    AsnPropTypes[AsnPropTypes["TIME"] = 26] = "TIME";
    AsnPropTypes[AsnPropTypes["Null"] = 27] = "Null";
  })(AsnPropTypes || (AsnPropTypes = {}));
  class OctetString {
    get byteLength() {
      return this.buffer.byteLength;
    }
    get byteOffset() {
      return 0;
    }
    constructor(param) {
      if (typeof param === "number") {
        this.buffer = new ArrayBuffer(param);
      } else {
        if (BufferSourceConverter.isBufferSource(param)) {
          this.buffer = BufferSourceConverter.toArrayBuffer(param);
        } else if (Array.isArray(param)) {
          this.buffer = new Uint8Array(param);
        } else {
          this.buffer = new ArrayBuffer(0);
        }
      }
    }
    fromASN(asn) {
      if (!(asn instanceof OctetString$1)) {
        throw new TypeError("Argument 'asn' is not instance of ASN.1 OctetString");
      }
      this.buffer = asn.valueBlock.valueHex;
      return this;
    }
    toASN() {
      return new OctetString$1({
        valueHex: this.buffer
      });
    }
    toSchema(name) {
      return new OctetString$1({
        name
      });
    }
  }
  const AsnAnyConverter = {
    fromASN: value => value instanceof Null ? null : value.valueBeforeDecodeView,
    toASN: value => {
      if (value === null) {
        return new Null();
      }
      const schema = fromBER(value);
      if (schema.result.error) {
        throw new Error(schema.result.error);
      }
      return schema.result;
    }
  };
  const AsnIntegerConverter = {
    fromASN: value => value.valueBlock.valueHexView.byteLength >= 4 ? value.valueBlock.toString() : value.valueBlock.valueDec,
    toASN: value => new Integer({
      value: +value
    })
  };
  const AsnEnumeratedConverter = {
    fromASN: value => value.valueBlock.valueDec,
    toASN: value => new Enumerated({
      value
    })
  };
  const AsnBitStringConverter = {
    fromASN: value => value.valueBlock.valueHexView,
    toASN: value => new BitString$1({
      valueHex: value
    })
  };
  const AsnObjectIdentifierConverter = {
    fromASN: value => value.valueBlock.toString(),
    toASN: value => new ObjectIdentifier$1({
      value
    })
  };
  const AsnBooleanConverter = {
    fromASN: value => value.valueBlock.value,
    toASN: value => new Boolean({
      value
    })
  };
  const AsnOctetStringConverter = {
    fromASN: value => value.valueBlock.valueHexView,
    toASN: value => new OctetString$1({
      valueHex: value
    })
  };
  function createStringConverter(Asn1Type) {
    return {
      fromASN: value => value.valueBlock.value,
      toASN: value => new Asn1Type({
        value
      })
    };
  }
  const AsnUtf8StringConverter = createStringConverter(Utf8String);
  const AsnBmpStringConverter = createStringConverter(BmpString);
  const AsnUniversalStringConverter = createStringConverter(UniversalString);
  const AsnNumericStringConverter = createStringConverter(NumericString);
  const AsnPrintableStringConverter = createStringConverter(PrintableString);
  const AsnTeletexStringConverter = createStringConverter(TeletexString);
  const AsnVideotexStringConverter = createStringConverter(VideotexString);
  const AsnIA5StringConverter = createStringConverter(IA5String);
  const AsnGraphicStringConverter = createStringConverter(GraphicString);
  const AsnVisibleStringConverter = createStringConverter(VisibleString);
  const AsnGeneralStringConverter = createStringConverter(GeneralString);
  const AsnCharacterStringConverter = createStringConverter(CharacterString);
  const AsnUTCTimeConverter = {
    fromASN: value => value.toDate(),
    toASN: value => new UTCTime({
      valueDate: value
    })
  };
  const AsnGeneralizedTimeConverter = {
    fromASN: value => value.toDate(),
    toASN: value => new GeneralizedTime({
      valueDate: value
    })
  };
  const AsnNullConverter = {
    fromASN: () => null,
    toASN: () => {
      return new Null();
    }
  };
  function defaultConverter(type) {
    switch (type) {
      case AsnPropTypes.Any:
        return AsnAnyConverter;
      case AsnPropTypes.BitString:
        return AsnBitStringConverter;
      case AsnPropTypes.BmpString:
        return AsnBmpStringConverter;
      case AsnPropTypes.Boolean:
        return AsnBooleanConverter;
      case AsnPropTypes.CharacterString:
        return AsnCharacterStringConverter;
      case AsnPropTypes.Enumerated:
        return AsnEnumeratedConverter;
      case AsnPropTypes.GeneralString:
        return AsnGeneralStringConverter;
      case AsnPropTypes.GeneralizedTime:
        return AsnGeneralizedTimeConverter;
      case AsnPropTypes.GraphicString:
        return AsnGraphicStringConverter;
      case AsnPropTypes.IA5String:
        return AsnIA5StringConverter;
      case AsnPropTypes.Integer:
        return AsnIntegerConverter;
      case AsnPropTypes.Null:
        return AsnNullConverter;
      case AsnPropTypes.NumericString:
        return AsnNumericStringConverter;
      case AsnPropTypes.ObjectIdentifier:
        return AsnObjectIdentifierConverter;
      case AsnPropTypes.OctetString:
        return AsnOctetStringConverter;
      case AsnPropTypes.PrintableString:
        return AsnPrintableStringConverter;
      case AsnPropTypes.TeletexString:
        return AsnTeletexStringConverter;
      case AsnPropTypes.UTCTime:
        return AsnUTCTimeConverter;
      case AsnPropTypes.UniversalString:
        return AsnUniversalStringConverter;
      case AsnPropTypes.Utf8String:
        return AsnUtf8StringConverter;
      case AsnPropTypes.VideotexString:
        return AsnVideotexStringConverter;
      case AsnPropTypes.VisibleString:
        return AsnVisibleStringConverter;
      default:
        return null;
    }
  }
  function isConvertible$1(target) {
    if (typeof target === "function" && target.prototype) {
      if (target.prototype.toASN && target.prototype.fromASN) {
        return true;
      } else {
        return isConvertible$1(target.prototype);
      }
    } else {
      return !!(target && typeof target === "object" && "toASN" in target && "fromASN" in target);
    }
  }
  function isTypeOfArray(target) {
    var _a;
    if (target) {
      const proto = Object.getPrototypeOf(target);
      if (((_a = proto === null || proto === void 0 ? void 0 : proto.prototype) === null || _a === void 0 ? void 0 : _a.constructor) === Array) {
        return true;
      }
      return isTypeOfArray(proto);
    }
    return false;
  }
  function isArrayEqual(bytes1, bytes2) {
    if (!(bytes1 && bytes2)) {
      return false;
    }
    if (bytes1.byteLength !== bytes2.byteLength) {
      return false;
    }
    const b1 = new Uint8Array(bytes1);
    const b2 = new Uint8Array(bytes2);
    for (let i = 0; i < bytes1.byteLength; i++) {
      if (b1[i] !== b2[i]) {
        return false;
      }
    }
    return true;
  }
  class AsnSchemaStorage {
    constructor() {
      this.items = new WeakMap();
    }
    has(target) {
      return this.items.has(target);
    }
    get(target, checkSchema = false) {
      const schema = this.items.get(target);
      if (!schema) {
        throw new Error(`Cannot get schema for '${target.prototype.constructor.name}' target`);
      }
      if (checkSchema && !schema.schema) {
        throw new Error(`Schema '${target.prototype.constructor.name}' doesn't contain ASN.1 schema. Call 'AsnSchemaStorage.cache'.`);
      }
      return schema;
    }
    cache(target) {
      const schema = this.get(target);
      if (!schema.schema) {
        schema.schema = this.create(target, true);
      }
    }
    createDefault(target) {
      const schema = {
        type: AsnTypeTypes.Sequence,
        items: {}
      };
      const parentSchema = this.findParentSchema(target);
      if (parentSchema) {
        Object.assign(schema, parentSchema);
        schema.items = Object.assign({}, schema.items, parentSchema.items);
      }
      return schema;
    }
    create(target, useNames) {
      const schema = this.items.get(target) || this.createDefault(target);
      const asn1Value = [];
      for (const key in schema.items) {
        const item = schema.items[key];
        const name = useNames ? key : "";
        let asn1Item;
        if (typeof item.type === "number") {
          const Asn1TypeName = AsnPropTypes[item.type];
          const Asn1Type = asn1js[Asn1TypeName];
          if (!Asn1Type) {
            throw new Error(`Cannot get ASN1 class by name '${Asn1TypeName}'`);
          }
          asn1Item = new Asn1Type({
            name
          });
        } else if (isConvertible$1(item.type)) {
          const instance = new item.type();
          asn1Item = instance.toSchema(name);
        } else if (item.optional) {
          const itemSchema = this.get(item.type);
          if (itemSchema.type === AsnTypeTypes.Choice) {
            asn1Item = new Any({
              name
            });
          } else {
            asn1Item = this.create(item.type, false);
            asn1Item.name = name;
          }
        } else {
          asn1Item = new Any({
            name
          });
        }
        const optional = !!item.optional || item.defaultValue !== undefined;
        if (item.repeated) {
          asn1Item.name = "";
          const Container = item.repeated === "set" ? Set : Sequence;
          asn1Item = new Container({
            name: "",
            value: [new Repeated({
              name,
              value: asn1Item
            })]
          });
        }
        if (item.context !== null && item.context !== undefined) {
          if (item.implicit) {
            if (typeof item.type === "number" || isConvertible$1(item.type)) {
              const Container = item.repeated ? Constructed : Primitive;
              asn1Value.push(new Container({
                name,
                optional,
                idBlock: {
                  tagClass: 3,
                  tagNumber: item.context
                }
              }));
            } else {
              this.cache(item.type);
              const isRepeated = !!item.repeated;
              let value = !isRepeated ? this.get(item.type, true).schema : asn1Item;
              value = "valueBlock" in value ? value.valueBlock.value : value.value;
              asn1Value.push(new Constructed({
                name: !isRepeated ? name : "",
                optional,
                idBlock: {
                  tagClass: 3,
                  tagNumber: item.context
                },
                value: value
              }));
            }
          } else {
            asn1Value.push(new Constructed({
              optional,
              idBlock: {
                tagClass: 3,
                tagNumber: item.context
              },
              value: [asn1Item]
            }));
          }
        } else {
          asn1Item.optional = optional;
          asn1Value.push(asn1Item);
        }
      }
      switch (schema.type) {
        case AsnTypeTypes.Sequence:
          return new Sequence({
            value: asn1Value,
            name: ""
          });
        case AsnTypeTypes.Set:
          return new Set({
            value: asn1Value,
            name: ""
          });
        case AsnTypeTypes.Choice:
          return new Choice({
            value: asn1Value,
            name: ""
          });
        default:
          throw new Error(`Unsupported ASN1 type in use`);
      }
    }
    set(target, schema) {
      this.items.set(target, schema);
      return this;
    }
    findParentSchema(target) {
      const parent = Object.getPrototypeOf(target);
      if (parent) {
        const schema = this.items.get(parent);
        return schema || this.findParentSchema(parent);
      }
      return null;
    }
  }
  const schemaStorage$1 = new AsnSchemaStorage();
  const AsnType = options => target => {
    let schema;
    if (!schemaStorage$1.has(target)) {
      schema = schemaStorage$1.createDefault(target);
      schemaStorage$1.set(target, schema);
    } else {
      schema = schemaStorage$1.get(target);
    }
    Object.assign(schema, options);
  };
  const AsnProp = options => (target, propertyKey) => {
    let schema;
    if (!schemaStorage$1.has(target.constructor)) {
      schema = schemaStorage$1.createDefault(target.constructor);
      schemaStorage$1.set(target.constructor, schema);
    } else {
      schema = schemaStorage$1.get(target.constructor);
    }
    const copyOptions = Object.assign({}, options);
    if (typeof copyOptions.type === "number" && !copyOptions.converter) {
      const defaultConverter$1 = defaultConverter(options.type);
      if (!defaultConverter$1) {
        throw new Error(`Cannot get default converter for property '${propertyKey}' of ${target.constructor.name}`);
      }
      copyOptions.converter = defaultConverter$1;
    }
    schema.items[propertyKey] = copyOptions;
  };
  class AsnSchemaValidationError extends Error {
    constructor() {
      super(...arguments);
      this.schemas = [];
    }
  }
  class AsnParser {
    static parse(data, target) {
      const asn1Parsed = fromBER(data);
      if (asn1Parsed.result.error) {
        throw new Error(asn1Parsed.result.error);
      }
      const res = this.fromASN(asn1Parsed.result, target);
      return res;
    }
    static fromASN(asn1Schema, target) {
      var _a;
      try {
        if (isConvertible$1(target)) {
          const value = new target();
          return value.fromASN(asn1Schema);
        }
        const schema = schemaStorage$1.get(target);
        schemaStorage$1.cache(target);
        let targetSchema = schema.schema;
        if (asn1Schema.constructor === Constructed && schema.type !== AsnTypeTypes.Choice) {
          targetSchema = new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: asn1Schema.idBlock.tagNumber
            },
            value: schema.schema.valueBlock.value
          });
          for (const key in schema.items) {
            delete asn1Schema[key];
          }
        }
        const asn1ComparedSchema = compareSchema({}, asn1Schema, targetSchema);
        if (!asn1ComparedSchema.verified) {
          throw new AsnSchemaValidationError(`Data does not match to ${target.name} ASN1 schema. ${asn1ComparedSchema.result.error}`);
        }
        const res = new target();
        if (isTypeOfArray(target)) {
          if (!("value" in asn1Schema.valueBlock && Array.isArray(asn1Schema.valueBlock.value))) {
            throw new Error(`Cannot get items from the ASN.1 parsed value. ASN.1 object is not constructed.`);
          }
          const itemType = schema.itemType;
          if (typeof itemType === "number") {
            const converter = defaultConverter(itemType);
            if (!converter) {
              throw new Error(`Cannot get default converter for array item of ${target.name} ASN1 schema`);
            }
            return target.from(asn1Schema.valueBlock.value, element => converter.fromASN(element));
          } else {
            return target.from(asn1Schema.valueBlock.value, element => this.fromASN(element, itemType));
          }
        }
        for (const key in schema.items) {
          const asn1SchemaValue = asn1ComparedSchema.result[key];
          if (!asn1SchemaValue) {
            continue;
          }
          const schemaItem = schema.items[key];
          const schemaItemType = schemaItem.type;
          if (typeof schemaItemType === "number" || isConvertible$1(schemaItemType)) {
            const converter = (_a = schemaItem.converter) !== null && _a !== void 0 ? _a : isConvertible$1(schemaItemType) ? new schemaItemType() : null;
            if (!converter) {
              throw new Error("Converter is empty");
            }
            if (schemaItem.repeated) {
              if (schemaItem.implicit) {
                const Container = schemaItem.repeated === "sequence" ? Sequence : Set;
                const newItem = new Container();
                newItem.valueBlock = asn1SchemaValue.valueBlock;
                const newItemAsn = fromBER(newItem.toBER(false));
                if (newItemAsn.offset === -1) {
                  throw new Error(`Cannot parse the child item. ${newItemAsn.result.error}`);
                }
                if (!("value" in newItemAsn.result.valueBlock && Array.isArray(newItemAsn.result.valueBlock.value))) {
                  throw new Error("Cannot get items from the ASN.1 parsed value. ASN.1 object is not constructed.");
                }
                const value = newItemAsn.result.valueBlock.value;
                res[key] = Array.from(value, element => converter.fromASN(element));
              } else {
                res[key] = Array.from(asn1SchemaValue, element => converter.fromASN(element));
              }
            } else {
              let value = asn1SchemaValue;
              if (schemaItem.implicit) {
                let newItem;
                if (isConvertible$1(schemaItemType)) {
                  newItem = new schemaItemType().toSchema("");
                } else {
                  const Asn1TypeName = AsnPropTypes[schemaItemType];
                  const Asn1Type = asn1js[Asn1TypeName];
                  if (!Asn1Type) {
                    throw new Error(`Cannot get '${Asn1TypeName}' class from asn1js module`);
                  }
                  newItem = new Asn1Type();
                }
                newItem.valueBlock = value.valueBlock;
                value = fromBER(newItem.toBER(false)).result;
              }
              res[key] = converter.fromASN(value);
            }
          } else {
            if (schemaItem.repeated) {
              if (!Array.isArray(asn1SchemaValue)) {
                throw new Error("Cannot get list of items from the ASN.1 parsed value. ASN.1 value should be iterable.");
              }
              res[key] = Array.from(asn1SchemaValue, element => this.fromASN(element, schemaItemType));
            } else {
              res[key] = this.fromASN(asn1SchemaValue, schemaItemType);
            }
          }
        }
        return res;
      } catch (error) {
        if (error instanceof AsnSchemaValidationError) {
          error.schemas.push(target.name);
        }
        throw error;
      }
    }
  }
  class AsnSerializer {
    static serialize(obj) {
      if (obj instanceof BaseBlock) {
        return obj.toBER(false);
      }
      return this.toASN(obj).toBER(false);
    }
    static toASN(obj) {
      if (obj && typeof obj === "object" && isConvertible$1(obj)) {
        return obj.toASN();
      }
      if (!(obj && typeof obj === "object")) {
        throw new TypeError("Parameter 1 should be type of Object.");
      }
      const target = obj.constructor;
      const schema = schemaStorage$1.get(target);
      schemaStorage$1.cache(target);
      let asn1Value = [];
      if (schema.itemType) {
        if (!Array.isArray(obj)) {
          throw new TypeError("Parameter 1 should be type of Array.");
        }
        if (typeof schema.itemType === "number") {
          const converter = defaultConverter(schema.itemType);
          if (!converter) {
            throw new Error(`Cannot get default converter for array item of ${target.name} ASN1 schema`);
          }
          asn1Value = obj.map(o => converter.toASN(o));
        } else {
          asn1Value = obj.map(o => this.toAsnItem({
            type: schema.itemType
          }, "[]", target, o));
        }
      } else {
        for (const key in schema.items) {
          const schemaItem = schema.items[key];
          const objProp = obj[key];
          if (objProp === undefined || schemaItem.defaultValue === objProp || typeof schemaItem.defaultValue === "object" && typeof objProp === "object" && isArrayEqual(this.serialize(schemaItem.defaultValue), this.serialize(objProp))) {
            continue;
          }
          const asn1Item = AsnSerializer.toAsnItem(schemaItem, key, target, objProp);
          if (typeof schemaItem.context === "number") {
            if (schemaItem.implicit) {
              if (!schemaItem.repeated && (typeof schemaItem.type === "number" || isConvertible$1(schemaItem.type))) {
                const value = {};
                value.valueHex = asn1Item instanceof Null ? asn1Item.valueBeforeDecodeView : asn1Item.valueBlock.toBER();
                asn1Value.push(new Primitive({
                  optional: schemaItem.optional,
                  idBlock: {
                    tagClass: 3,
                    tagNumber: schemaItem.context
                  },
                  ...value
                }));
              } else {
                asn1Value.push(new Constructed({
                  optional: schemaItem.optional,
                  idBlock: {
                    tagClass: 3,
                    tagNumber: schemaItem.context
                  },
                  value: asn1Item.valueBlock.value
                }));
              }
            } else {
              asn1Value.push(new Constructed({
                optional: schemaItem.optional,
                idBlock: {
                  tagClass: 3,
                  tagNumber: schemaItem.context
                },
                value: [asn1Item]
              }));
            }
          } else if (schemaItem.repeated) {
            asn1Value = asn1Value.concat(asn1Item);
          } else {
            asn1Value.push(asn1Item);
          }
        }
      }
      let asnSchema;
      switch (schema.type) {
        case AsnTypeTypes.Sequence:
          asnSchema = new Sequence({
            value: asn1Value
          });
          break;
        case AsnTypeTypes.Set:
          asnSchema = new Set({
            value: asn1Value
          });
          break;
        case AsnTypeTypes.Choice:
          if (!asn1Value[0]) {
            throw new Error(`Schema '${target.name}' has wrong data. Choice cannot be empty.`);
          }
          asnSchema = asn1Value[0];
          break;
      }
      return asnSchema;
    }
    static toAsnItem(schemaItem, key, target, objProp) {
      let asn1Item;
      if (typeof schemaItem.type === "number") {
        const converter = schemaItem.converter;
        if (!converter) {
          throw new Error(`Property '${key}' doesn't have converter for type ${AsnPropTypes[schemaItem.type]} in schema '${target.name}'`);
        }
        if (schemaItem.repeated) {
          if (!Array.isArray(objProp)) {
            throw new TypeError("Parameter 'objProp' should be type of Array.");
          }
          const items = Array.from(objProp, element => converter.toASN(element));
          const Container = schemaItem.repeated === "sequence" ? Sequence : Set;
          asn1Item = new Container({
            value: items
          });
        } else {
          asn1Item = converter.toASN(objProp);
        }
      } else {
        if (schemaItem.repeated) {
          if (!Array.isArray(objProp)) {
            throw new TypeError("Parameter 'objProp' should be type of Array.");
          }
          const items = Array.from(objProp, element => this.toASN(element));
          const Container = schemaItem.repeated === "sequence" ? Sequence : Set;
          asn1Item = new Container({
            value: items
          });
        } else {
          asn1Item = this.toASN(objProp);
        }
      }
      return asn1Item;
    }
  }
  class AsnConvert {
    static serialize(obj) {
      return AsnSerializer.serialize(obj);
    }
    static parse(data, target) {
      return AsnParser.parse(data, target);
    }
    static toString(data) {
      const buf = BufferSourceConverter.isBufferSource(data) ? BufferSourceConverter.toArrayBuffer(data) : AsnConvert.serialize(data);
      const asn = fromBER(buf);
      if (asn.offset === -1) {
        throw new Error(`Cannot decode ASN.1 data. ${asn.result.error}`);
      }
      return asn.result.toString();
    }
  }
  function __decorate(decorators, target, key, desc) {
    var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function (resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }
  function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  }
  function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
  }
  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };
  class JsonError extends Error {
    constructor(message, innerError) {
      super(innerError ? `${message}. See the inner exception for more details.` : message);
      this.message = message;
      this.innerError = innerError;
    }
  }
  class TransformError extends JsonError {
    constructor(schema, message, innerError) {
      super(message, innerError);
      this.schema = schema;
    }
  }
  class ParserError extends TransformError {
    constructor(schema, message, innerError) {
      super(schema, `JSON doesn't match to '${schema.target.name}' schema. ${message}`, innerError);
    }
  }
  class ValidationError extends JsonError {}
  class SerializerError extends JsonError {
    constructor(schemaName, message, innerError) {
      super(`Cannot serialize by '${schemaName}' schema. ${message}`, innerError);
      this.schemaName = schemaName;
    }
  }
  class KeyError extends ParserError {
    constructor(schema, keys, errors = {}) {
      super(schema, "Some keys doesn't match to schema");
      this.keys = keys;
      this.errors = errors;
    }
  }
  var JsonPropTypes;
  (function (JsonPropTypes) {
    JsonPropTypes[JsonPropTypes["Any"] = 0] = "Any";
    JsonPropTypes[JsonPropTypes["Boolean"] = 1] = "Boolean";
    JsonPropTypes[JsonPropTypes["Number"] = 2] = "Number";
    JsonPropTypes[JsonPropTypes["String"] = 3] = "String";
  })(JsonPropTypes || (JsonPropTypes = {}));
  function checkType(value, type) {
    switch (type) {
      case JsonPropTypes.Boolean:
        return typeof value === "boolean";
      case JsonPropTypes.Number:
        return typeof value === "number";
      case JsonPropTypes.String:
        return typeof value === "string";
    }
    return true;
  }
  function throwIfTypeIsWrong(value, type) {
    if (!checkType(value, type)) {
      throw new TypeError(`Value must be ${JsonPropTypes[type]}`);
    }
  }
  function isConvertible(target) {
    if (target && target.prototype) {
      if (target.prototype.toJSON && target.prototype.fromJSON) {
        return true;
      } else {
        return isConvertible(target.prototype);
      }
    } else {
      return !!(target && target.toJSON && target.fromJSON);
    }
  }
  class JsonSchemaStorage {
    constructor() {
      this.items = new Map();
    }
    has(target) {
      return this.items.has(target) || !!this.findParentSchema(target);
    }
    get(target) {
      const schema = this.items.get(target) || this.findParentSchema(target);
      if (!schema) {
        throw new Error("Cannot get schema for current target");
      }
      return schema;
    }
    create(target) {
      const schema = {
        names: {}
      };
      const parentSchema = this.findParentSchema(target);
      if (parentSchema) {
        Object.assign(schema, parentSchema);
        schema.names = {};
        for (const name in parentSchema.names) {
          schema.names[name] = Object.assign({}, parentSchema.names[name]);
        }
      }
      schema.target = target;
      return schema;
    }
    set(target, schema) {
      this.items.set(target, schema);
      return this;
    }
    findParentSchema(target) {
      const parent = target.__proto__;
      if (parent) {
        const schema = this.items.get(parent);
        return schema || this.findParentSchema(parent);
      }
      return null;
    }
  }
  const DEFAULT_SCHEMA = "default";
  const schemaStorage = new JsonSchemaStorage();
  class PatternValidation {
    constructor(pattern) {
      this.pattern = new RegExp(pattern);
    }
    validate(value) {
      const pattern = new RegExp(this.pattern.source, this.pattern.flags);
      if (typeof value !== "string") {
        throw new ValidationError("Incoming value must be string");
      }
      if (!pattern.exec(value)) {
        throw new ValidationError(`Value doesn't match to pattern '${pattern.toString()}'`);
      }
    }
  }
  class InclusiveValidation {
    constructor(min = Number.MIN_VALUE, max = Number.MAX_VALUE) {
      this.min = min;
      this.max = max;
    }
    validate(value) {
      throwIfTypeIsWrong(value, JsonPropTypes.Number);
      if (!(this.min <= value && value <= this.max)) {
        const min = this.min === Number.MIN_VALUE ? "MIN" : this.min;
        const max = this.max === Number.MAX_VALUE ? "MAX" : this.max;
        throw new ValidationError(`Value doesn't match to diapason [${min},${max}]`);
      }
    }
  }
  class ExclusiveValidation {
    constructor(min = Number.MIN_VALUE, max = Number.MAX_VALUE) {
      this.min = min;
      this.max = max;
    }
    validate(value) {
      throwIfTypeIsWrong(value, JsonPropTypes.Number);
      if (!(this.min < value && value < this.max)) {
        const min = this.min === Number.MIN_VALUE ? "MIN" : this.min;
        const max = this.max === Number.MAX_VALUE ? "MAX" : this.max;
        throw new ValidationError(`Value doesn't match to diapason (${min},${max})`);
      }
    }
  }
  class LengthValidation {
    constructor(length, minLength, maxLength) {
      this.length = length;
      this.minLength = minLength;
      this.maxLength = maxLength;
    }
    validate(value) {
      if (this.length !== undefined) {
        if (value.length !== this.length) {
          throw new ValidationError(`Value length must be exactly ${this.length}.`);
        }
        return;
      }
      if (this.minLength !== undefined) {
        if (value.length < this.minLength) {
          throw new ValidationError(`Value length must be more than ${this.minLength}.`);
        }
      }
      if (this.maxLength !== undefined) {
        if (value.length > this.maxLength) {
          throw new ValidationError(`Value length must be less than ${this.maxLength}.`);
        }
      }
    }
  }
  class EnumerationValidation {
    constructor(enumeration) {
      this.enumeration = enumeration;
    }
    validate(value) {
      throwIfTypeIsWrong(value, JsonPropTypes.String);
      if (!this.enumeration.includes(value)) {
        throw new ValidationError(`Value must be one of ${this.enumeration.map(v => `'${v}'`).join(", ")}`);
      }
    }
  }
  class JsonTransform {
    static checkValues(data, schemaItem) {
      const values = Array.isArray(data) ? data : [data];
      for (const value of values) {
        for (const validation of schemaItem.validations) {
          if (validation instanceof LengthValidation && schemaItem.repeated) {
            validation.validate(data);
          } else {
            validation.validate(value);
          }
        }
      }
    }
    static checkTypes(value, schemaItem) {
      if (schemaItem.repeated && !Array.isArray(value)) {
        throw new TypeError("Value must be Array");
      }
      if (typeof schemaItem.type === "number") {
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
          throwIfTypeIsWrong(v, schemaItem.type);
        }
      }
    }
    static getSchemaByName(schema, name = DEFAULT_SCHEMA) {
      return {
        ...schema.names[DEFAULT_SCHEMA],
        ...schema.names[name]
      };
    }
  }
  class JsonSerializer extends JsonTransform {
    static serialize(obj, options, replacer, space) {
      const json = this.toJSON(obj, options);
      return JSON.stringify(json, replacer, space);
    }
    static toJSON(obj, options = {}) {
      let res;
      let targetSchema = options.targetSchema;
      const schemaName = options.schemaName || DEFAULT_SCHEMA;
      if (isConvertible(obj)) {
        return obj.toJSON();
      }
      if (Array.isArray(obj)) {
        res = [];
        for (const item of obj) {
          res.push(this.toJSON(item, options));
        }
      } else if (typeof obj === "object") {
        if (targetSchema && !schemaStorage.has(targetSchema)) {
          throw new JsonError("Cannot get schema for `targetSchema` param");
        }
        targetSchema = targetSchema || obj.constructor;
        if (schemaStorage.has(targetSchema)) {
          const schema = schemaStorage.get(targetSchema);
          res = {};
          const namedSchema = this.getSchemaByName(schema, schemaName);
          for (const key in namedSchema) {
            try {
              const item = namedSchema[key];
              const objItem = obj[key];
              let value;
              if (item.optional && objItem === undefined || item.defaultValue !== undefined && objItem === item.defaultValue) {
                continue;
              }
              if (!item.optional && objItem === undefined) {
                throw new SerializerError(targetSchema.name, `Property '${key}' is required.`);
              }
              if (typeof item.type === "number") {
                if (item.converter) {
                  if (item.repeated) {
                    value = objItem.map(el => item.converter.toJSON(el, obj));
                  } else {
                    value = item.converter.toJSON(objItem, obj);
                  }
                } else {
                  value = objItem;
                }
              } else {
                if (item.repeated) {
                  value = objItem.map(el => this.toJSON(el, {
                    schemaName
                  }));
                } else {
                  value = this.toJSON(objItem, {
                    schemaName
                  });
                }
              }
              this.checkTypes(value, item);
              this.checkValues(value, item);
              res[item.name || key] = value;
            } catch (e) {
              if (e instanceof SerializerError) {
                throw e;
              } else {
                throw new SerializerError(schema.target.name, `Property '${key}' is wrong. ${e.message}`, e);
              }
            }
          }
        } else {
          res = {};
          for (const key in obj) {
            res[key] = this.toJSON(obj[key], {
              schemaName
            });
          }
        }
      } else {
        res = obj;
      }
      return res;
    }
  }
  class JsonParser extends JsonTransform {
    static parse(data, options) {
      const obj = JSON.parse(data);
      return this.fromJSON(obj, options);
    }
    static fromJSON(target, options) {
      const targetSchema = options.targetSchema;
      const schemaName = options.schemaName || DEFAULT_SCHEMA;
      const obj = new targetSchema();
      if (isConvertible(obj)) {
        return obj.fromJSON(target);
      }
      const schema = schemaStorage.get(targetSchema);
      const namedSchema = this.getSchemaByName(schema, schemaName);
      const keyErrors = {};
      if (options.strictProperty && !Array.isArray(target)) {
        JsonParser.checkStrictProperty(target, namedSchema, schema);
      }
      for (const key in namedSchema) {
        try {
          const item = namedSchema[key];
          const name = item.name || key;
          const value = target[name];
          if (value === undefined && (item.optional || item.defaultValue !== undefined)) {
            continue;
          }
          if (!item.optional && value === undefined) {
            throw new ParserError(schema, `Property '${name}' is required.`);
          }
          this.checkTypes(value, item);
          this.checkValues(value, item);
          if (typeof item.type === "number") {
            if (item.converter) {
              if (item.repeated) {
                obj[key] = value.map(el => item.converter.fromJSON(el, obj));
              } else {
                obj[key] = item.converter.fromJSON(value, obj);
              }
            } else {
              obj[key] = value;
            }
          } else {
            const newOptions = {
              ...options,
              targetSchema: item.type,
              schemaName
            };
            if (item.repeated) {
              obj[key] = value.map(el => this.fromJSON(el, newOptions));
            } else {
              obj[key] = this.fromJSON(value, newOptions);
            }
          }
        } catch (e) {
          if (!(e instanceof ParserError)) {
            e = new ParserError(schema, `Property '${key}' is wrong. ${e.message}`, e);
          }
          if (options.strictAllKeys) {
            keyErrors[key] = e;
          } else {
            throw e;
          }
        }
      }
      const keys = Object.keys(keyErrors);
      if (keys.length) {
        throw new KeyError(schema, keys, keyErrors);
      }
      return obj;
    }
    static checkStrictProperty(target, namedSchema, schema) {
      const jsonProps = Object.keys(target);
      const schemaProps = Object.keys(namedSchema);
      const keys = [];
      for (const key of jsonProps) {
        if (schemaProps.indexOf(key) === -1) {
          keys.push(key);
        }
      }
      if (keys.length) {
        throw new KeyError(schema, keys);
      }
    }
  }
  function getValidations(item) {
    const validations = [];
    if (item.pattern) {
      validations.push(new PatternValidation(item.pattern));
    }
    if (item.type === JsonPropTypes.Number || item.type === JsonPropTypes.Any) {
      if (item.minInclusive !== undefined || item.maxInclusive !== undefined) {
        validations.push(new InclusiveValidation(item.minInclusive, item.maxInclusive));
      }
      if (item.minExclusive !== undefined || item.maxExclusive !== undefined) {
        validations.push(new ExclusiveValidation(item.minExclusive, item.maxExclusive));
      }
      if (item.enumeration !== undefined) {
        validations.push(new EnumerationValidation(item.enumeration));
      }
    }
    if (item.type === JsonPropTypes.String || item.repeated || item.type === JsonPropTypes.Any) {
      if (item.length !== undefined || item.minLength !== undefined || item.maxLength !== undefined) {
        validations.push(new LengthValidation(item.length, item.minLength, item.maxLength));
      }
    }
    return validations;
  }
  const JsonProp = (options = {}) => (target, propertyKey) => {
    const errorMessage = `Cannot set type for ${propertyKey} property of ${target.constructor.name} schema`;
    let schema;
    if (!schemaStorage.has(target.constructor)) {
      schema = schemaStorage.create(target.constructor);
      schemaStorage.set(target.constructor, schema);
    } else {
      schema = schemaStorage.get(target.constructor);
      if (schema.target !== target.constructor) {
        schema = schemaStorage.create(target.constructor);
        schemaStorage.set(target.constructor, schema);
      }
    }
    const defaultSchema = {
      type: JsonPropTypes.Any,
      validations: []
    };
    const copyOptions = Object.assign(defaultSchema, options);
    copyOptions.validations = getValidations(copyOptions);
    if (typeof copyOptions.type !== "number") {
      if (!schemaStorage.has(copyOptions.type) && !isConvertible(copyOptions.type)) {
        throw new Error(`${errorMessage}. Assigning type doesn't have schema.`);
      }
    }
    let schemaNames;
    if (Array.isArray(options.schema)) {
      schemaNames = options.schema;
    } else {
      schemaNames = [options.schema || DEFAULT_SCHEMA];
    }
    for (const schemaName of schemaNames) {
      if (!schema.names[schemaName]) {
        schema.names[schemaName] = {};
      }
      const namedSchema = schema.names[schemaName];
      namedSchema[propertyKey] = copyOptions;
    }
  };
  class CryptoError extends Error {}
  class AlgorithmError extends CryptoError {}
  class UnsupportedOperationError extends CryptoError {
    constructor(methodName) {
      super(`Unsupported operation: ${methodName ? `${methodName}` : ""}`);
    }
  }
  class OperationError extends CryptoError {}
  class RequiredPropertyError extends CryptoError {
    constructor(propName) {
      super(`${propName}: Missing required property`);
    }
  }
  function isJWK(data) {
    return typeof data === "object" && "kty" in data;
  }
  class ProviderCrypto {
    async digest(...args) {
      this.checkDigest.apply(this, args);
      return this.onDigest.apply(this, args);
    }
    checkDigest(algorithm, _data) {
      this.checkAlgorithmName(algorithm);
    }
    async onDigest(_algorithm, _data) {
      throw new UnsupportedOperationError("digest");
    }
    async generateKey(...args) {
      this.checkGenerateKey.apply(this, args);
      return this.onGenerateKey.apply(this, args);
    }
    checkGenerateKey(algorithm, _extractable, keyUsages, ..._args) {
      this.checkAlgorithmName(algorithm);
      this.checkGenerateKeyParams(algorithm);
      if (!(keyUsages && keyUsages.length)) {
        throw new TypeError(`Usages cannot be empty when creating a key.`);
      }
      let allowedUsages;
      if (Array.isArray(this.usages)) {
        allowedUsages = this.usages;
      } else {
        allowedUsages = this.usages.privateKey.concat(this.usages.publicKey);
      }
      this.checkKeyUsages(keyUsages, allowedUsages);
    }
    checkGenerateKeyParams(_algorithm) {}
    async onGenerateKey(_algorithm, _extractable, _keyUsages, ..._args) {
      throw new UnsupportedOperationError("generateKey");
    }
    async sign(...args) {
      this.checkSign.apply(this, args);
      return this.onSign.apply(this, args);
    }
    checkSign(algorithm, key, _data, ..._args) {
      this.checkAlgorithmName(algorithm);
      this.checkAlgorithmParams(algorithm);
      this.checkCryptoKey(key, "sign");
    }
    async onSign(_algorithm, _key, _data, ..._args) {
      throw new UnsupportedOperationError("sign");
    }
    async verify(...args) {
      this.checkVerify.apply(this, args);
      return this.onVerify.apply(this, args);
    }
    checkVerify(algorithm, key, _signature, _data, ..._args) {
      this.checkAlgorithmName(algorithm);
      this.checkAlgorithmParams(algorithm);
      this.checkCryptoKey(key, "verify");
    }
    async onVerify(_algorithm, _key, _signature, _data, ..._args) {
      throw new UnsupportedOperationError("verify");
    }
    async encrypt(...args) {
      this.checkEncrypt.apply(this, args);
      return this.onEncrypt.apply(this, args);
    }
    checkEncrypt(algorithm, key, _data, options = {}, ..._args) {
      this.checkAlgorithmName(algorithm);
      this.checkAlgorithmParams(algorithm);
      this.checkCryptoKey(key, options.keyUsage ? "encrypt" : void 0);
    }
    async onEncrypt(_algorithm, _key, _data, ..._args) {
      throw new UnsupportedOperationError("encrypt");
    }
    async decrypt(...args) {
      this.checkDecrypt.apply(this, args);
      return this.onDecrypt.apply(this, args);
    }
    checkDecrypt(algorithm, key, _data, options = {}, ..._args) {
      this.checkAlgorithmName(algorithm);
      this.checkAlgorithmParams(algorithm);
      this.checkCryptoKey(key, options.keyUsage ? "decrypt" : void 0);
    }
    async onDecrypt(_algorithm, _key, _data, ..._args) {
      throw new UnsupportedOperationError("decrypt");
    }
    async deriveBits(...args) {
      this.checkDeriveBits.apply(this, args);
      return this.onDeriveBits.apply(this, args);
    }
    checkDeriveBits(algorithm, baseKey, length, options = {}, ..._args) {
      this.checkAlgorithmName(algorithm);
      this.checkAlgorithmParams(algorithm);
      this.checkCryptoKey(baseKey, options.keyUsage ? "deriveBits" : void 0);
      if (length % 8 !== 0) {
        throw new OperationError("length: Is not multiple of 8");
      }
    }
    async onDeriveBits(_algorithm, _baseKey, _length, ..._args) {
      throw new UnsupportedOperationError("deriveBits");
    }
    async exportKey(...args) {
      this.checkExportKey.apply(this, args);
      return this.onExportKey.apply(this, args);
    }
    checkExportKey(format, key, ..._args) {
      this.checkKeyFormat(format);
      this.checkCryptoKey(key);
      if (!key.extractable) {
        throw new CryptoError("key: Is not extractable");
      }
    }
    async onExportKey(_format, _key, ..._args) {
      throw new UnsupportedOperationError("exportKey");
    }
    async importKey(...args) {
      this.checkImportKey.apply(this, args);
      return this.onImportKey.apply(this, args);
    }
    checkImportKey(format, keyData, algorithm, _extractable, keyUsages, ..._args) {
      this.checkKeyFormat(format);
      this.checkKeyData(format, keyData);
      this.checkAlgorithmName(algorithm);
      this.checkImportParams(algorithm);
      if (Array.isArray(this.usages)) {
        this.checkKeyUsages(keyUsages, this.usages);
      }
    }
    async onImportKey(_format, _keyData, _algorithm, _extractable, _keyUsages, ..._args) {
      throw new UnsupportedOperationError("importKey");
    }
    checkAlgorithmName(algorithm) {
      if (algorithm.name.toLowerCase() !== this.name.toLowerCase()) {
        throw new AlgorithmError("Unrecognized name");
      }
    }
    checkAlgorithmParams(_algorithm) {}
    checkDerivedKeyParams(_algorithm) {}
    checkKeyUsages(usages, allowed) {
      for (const usage of usages) {
        if (allowed.indexOf(usage) === -1) {
          throw new TypeError("Cannot create a key using the specified key usages");
        }
      }
    }
    checkCryptoKey(key, keyUsage) {
      this.checkAlgorithmName(key.algorithm);
      if (keyUsage && key.usages.indexOf(keyUsage) === -1) {
        throw new CryptoError(`key does not match that of operation`);
      }
    }
    checkRequiredProperty(data, propName) {
      if (!(propName in data)) {
        throw new RequiredPropertyError(propName);
      }
    }
    checkHashAlgorithm(algorithm, hashAlgorithms) {
      for (const item of hashAlgorithms) {
        if (item.toLowerCase() === algorithm.name.toLowerCase()) {
          return;
        }
      }
      throw new OperationError(`hash: Must be one of ${hashAlgorithms.join(", ")}`);
    }
    checkImportParams(_algorithm) {}
    checkKeyFormat(format) {
      switch (format) {
        case "raw":
        case "pkcs8":
        case "spki":
        case "jwk":
          break;
        default:
          throw new TypeError("format: Is invalid value. Must be 'jwk', 'raw', 'spki', or 'pkcs8'");
      }
    }
    checkKeyData(format, keyData) {
      if (!keyData) {
        throw new TypeError("keyData: Cannot be empty on empty on key importing");
      }
      if (format === "jwk") {
        if (!isJWK(keyData)) {
          throw new TypeError("keyData: Is not JsonWebToken");
        }
      } else if (!BufferSourceConverter.isBufferSource(keyData)) {
        throw new TypeError("keyData: Is not ArrayBufferView or ArrayBuffer");
      }
    }
    prepareData(data) {
      return BufferSourceConverter.toArrayBuffer(data);
    }
  }
  class AesProvider extends ProviderCrypto {
    checkGenerateKeyParams(algorithm) {
      this.checkRequiredProperty(algorithm, "length");
      if (typeof algorithm.length !== "number") {
        throw new TypeError("length: Is not of type Number");
      }
      switch (algorithm.length) {
        case 128:
        case 192:
        case 256:
          break;
        default:
          throw new TypeError("length: Must be 128, 192, or 256");
      }
    }
    checkDerivedKeyParams(algorithm) {
      this.checkGenerateKeyParams(algorithm);
    }
  }
  let AesCbcProvider$1 = class AesCbcProvider extends AesProvider {
    constructor() {
      super(...arguments);
      this.name = "AES-CBC";
      this.usages = ["encrypt", "decrypt", "wrapKey", "unwrapKey"];
    }
    checkAlgorithmParams(algorithm) {
      this.checkRequiredProperty(algorithm, "iv");
      if (!(algorithm.iv instanceof ArrayBuffer || ArrayBuffer.isView(algorithm.iv))) {
        throw new TypeError("iv: Is not of type '(ArrayBuffer or ArrayBufferView)'");
      }
      if (algorithm.iv.byteLength !== 16) {
        throw new TypeError("iv: Must have length 16 bytes");
      }
    }
  };
  let AesCtrProvider$1 = class AesCtrProvider extends AesProvider {
    constructor() {
      super(...arguments);
      this.name = "AES-CTR";
      this.usages = ["encrypt", "decrypt", "wrapKey", "unwrapKey"];
    }
    checkAlgorithmParams(algorithm) {
      this.checkRequiredProperty(algorithm, "counter");
      if (!(algorithm.counter instanceof ArrayBuffer || ArrayBuffer.isView(algorithm.counter))) {
        throw new TypeError("counter: Is not of type '(ArrayBuffer or ArrayBufferView)'");
      }
      if (algorithm.counter.byteLength !== 16) {
        throw new TypeError("iv: Must have length 16 bytes");
      }
      this.checkRequiredProperty(algorithm, "length");
      if (typeof algorithm.length !== "number") {
        throw new TypeError("length: Is not a Number");
      }
      if (algorithm.length < 1) {
        throw new OperationError("length: Must be more than 0");
      }
    }
  };
  let AesEcbProvider$1 = class AesEcbProvider extends AesProvider {
    constructor() {
      super(...arguments);
      this.name = "AES-ECB";
      this.usages = ["encrypt", "decrypt", "wrapKey", "unwrapKey"];
    }
  };
  let AesGcmProvider$1 = class AesGcmProvider extends AesProvider {
    constructor() {
      super(...arguments);
      this.name = "AES-GCM";
      this.usages = ["encrypt", "decrypt", "wrapKey", "unwrapKey"];
    }
    checkAlgorithmParams(algorithm) {
      this.checkRequiredProperty(algorithm, "iv");
      if (!(algorithm.iv instanceof ArrayBuffer || ArrayBuffer.isView(algorithm.iv))) {
        throw new TypeError("iv: Is not of type '(ArrayBuffer or ArrayBufferView)'");
      }
      if (algorithm.iv.byteLength < 1) {
        throw new OperationError("iv: Must have length more than 0 and less than 2^64 - 1");
      }
      if (!("tagLength" in algorithm)) {
        algorithm.tagLength = 128;
      }
      switch (algorithm.tagLength) {
        case 32:
        case 64:
        case 96:
        case 104:
        case 112:
        case 120:
        case 128:
          break;
        default:
          throw new OperationError("tagLength: Must be one of 32, 64, 96, 104, 112, 120 or 128");
      }
    }
  };
  let AesKwProvider$1 = class AesKwProvider extends AesProvider {
    constructor() {
      super(...arguments);
      this.name = "AES-KW";
      this.usages = ["wrapKey", "unwrapKey"];
    }
  };
  class DesProvider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.usages = ["encrypt", "decrypt", "wrapKey", "unwrapKey"];
    }
    checkAlgorithmParams(algorithm) {
      if (this.ivSize) {
        this.checkRequiredProperty(algorithm, "iv");
        if (!(algorithm.iv instanceof ArrayBuffer || ArrayBuffer.isView(algorithm.iv))) {
          throw new TypeError("iv: Is not of type '(ArrayBuffer or ArrayBufferView)'");
        }
        if (algorithm.iv.byteLength !== this.ivSize) {
          throw new TypeError(`iv: Must have length ${this.ivSize} bytes`);
        }
      }
    }
    checkGenerateKeyParams(algorithm) {
      this.checkRequiredProperty(algorithm, "length");
      if (typeof algorithm.length !== "number") {
        throw new TypeError("length: Is not of type Number");
      }
      if (algorithm.length !== this.keySizeBits) {
        throw new OperationError(`algorithm.length: Must be ${this.keySizeBits}`);
      }
    }
    checkDerivedKeyParams(algorithm) {
      this.checkGenerateKeyParams(algorithm);
    }
  }
  class RsaProvider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.hashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    }
    checkGenerateKeyParams(algorithm) {
      this.checkRequiredProperty(algorithm, "hash");
      this.checkHashAlgorithm(algorithm.hash, this.hashAlgorithms);
      this.checkRequiredProperty(algorithm, "publicExponent");
      if (!(algorithm.publicExponent && algorithm.publicExponent instanceof Uint8Array)) {
        throw new TypeError("publicExponent: Missing or not a Uint8Array");
      }
      const publicExponent = Convert.ToBase64(algorithm.publicExponent);
      if (!(publicExponent === "Aw==" || publicExponent === "AQAB")) {
        throw new TypeError("publicExponent: Must be [3] or [1,0,1]");
      }
      this.checkRequiredProperty(algorithm, "modulusLength");
      if (algorithm.modulusLength % 8 || algorithm.modulusLength < 256 || algorithm.modulusLength > 16384) {
        throw new TypeError("The modulus length must be a multiple of 8 bits and >= 256 and <= 16384");
      }
    }
    checkImportParams(algorithm) {
      this.checkRequiredProperty(algorithm, "hash");
      this.checkHashAlgorithm(algorithm.hash, this.hashAlgorithms);
    }
  }
  let RsaSsaProvider$1 = class RsaSsaProvider extends RsaProvider {
    constructor() {
      super(...arguments);
      this.name = "RSASSA-PKCS1-v1_5";
      this.usages = {
        privateKey: ["sign"],
        publicKey: ["verify"]
      };
    }
  };
  let RsaPssProvider$1 = class RsaPssProvider extends RsaProvider {
    constructor() {
      super(...arguments);
      this.name = "RSA-PSS";
      this.usages = {
        privateKey: ["sign"],
        publicKey: ["verify"]
      };
    }
    checkAlgorithmParams(algorithm) {
      this.checkRequiredProperty(algorithm, "saltLength");
      if (typeof algorithm.saltLength !== "number") {
        throw new TypeError("saltLength: Is not a Number");
      }
      if (algorithm.saltLength < 0) {
        throw new RangeError("saltLength: Must be positive number");
      }
    }
  };
  let RsaOaepProvider$1 = class RsaOaepProvider extends RsaProvider {
    constructor() {
      super(...arguments);
      this.name = "RSA-OAEP";
      this.usages = {
        privateKey: ["decrypt", "unwrapKey"],
        publicKey: ["encrypt", "wrapKey"]
      };
    }
    checkAlgorithmParams(algorithm) {
      if (algorithm.label && !(algorithm.label instanceof ArrayBuffer || ArrayBuffer.isView(algorithm.label))) {
        throw new TypeError("label: Is not of type '(ArrayBuffer or ArrayBufferView)'");
      }
    }
  };
  class EllipticProvider extends ProviderCrypto {
    checkGenerateKeyParams(algorithm) {
      this.checkRequiredProperty(algorithm, "namedCurve");
      this.checkNamedCurve(algorithm.namedCurve);
    }
    checkNamedCurve(namedCurve) {
      for (const item of this.namedCurves) {
        if (item.toLowerCase() === namedCurve.toLowerCase()) {
          return;
        }
      }
      throw new OperationError(`namedCurve: Must be one of ${this.namedCurves.join(", ")}`);
    }
  }
  let EcdsaProvider$1 = class EcdsaProvider extends EllipticProvider {
    constructor() {
      super(...arguments);
      this.name = "ECDSA";
      this.hashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
      this.usages = {
        privateKey: ["sign"],
        publicKey: ["verify"]
      };
      this.namedCurves = ["P-256", "P-384", "P-521", "K-256"];
    }
    checkAlgorithmParams(algorithm) {
      this.checkRequiredProperty(algorithm, "hash");
      this.checkHashAlgorithm(algorithm.hash, this.hashAlgorithms);
    }
  };
  const KEY_TYPES = ["secret", "private", "public"];
  let CryptoKey$1 = class CryptoKey {
    static create(algorithm, type, extractable, usages) {
      const key = new this();
      key.algorithm = algorithm;
      key.type = type;
      key.extractable = extractable;
      key.usages = usages;
      return key;
    }
    static isKeyType(data) {
      return KEY_TYPES.indexOf(data) !== -1;
    }
    get [Symbol.toStringTag]() {
      return "CryptoKey";
    }
  };
  let EcdhProvider$1 = class EcdhProvider extends EllipticProvider {
    constructor() {
      super(...arguments);
      this.name = "ECDH";
      this.usages = {
        privateKey: ["deriveBits", "deriveKey"],
        publicKey: []
      };
      this.namedCurves = ["P-256", "P-384", "P-521", "K-256"];
    }
    checkAlgorithmParams(algorithm) {
      this.checkRequiredProperty(algorithm, "public");
      if (!(algorithm.public instanceof CryptoKey$1)) {
        throw new TypeError("public: Is not a CryptoKey");
      }
      if (algorithm.public.type !== "public") {
        throw new OperationError("public: Is not a public key");
      }
      if (algorithm.public.algorithm.name !== this.name) {
        throw new OperationError(`public: Is not ${this.name} key`);
      }
    }
  };
  let EcdhEsProvider$1 = class EcdhEsProvider extends EcdhProvider$1 {
    constructor() {
      super(...arguments);
      this.name = "ECDH-ES";
      this.namedCurves = ["X25519", "X448"];
    }
  };
  let EdDsaProvider$1 = class EdDsaProvider extends EllipticProvider {
    constructor() {
      super(...arguments);
      this.name = "EdDSA";
      this.usages = {
        privateKey: ["sign"],
        publicKey: ["verify"]
      };
      this.namedCurves = ["Ed25519", "Ed448"];
    }
  };
  let ObjectIdentifier = class ObjectIdentifier {
    constructor(value) {
      if (value) {
        this.value = value;
      }
    }
  };
  __decorate([AsnProp({
    type: AsnPropTypes.ObjectIdentifier
  })], ObjectIdentifier.prototype, "value", void 0);
  ObjectIdentifier = __decorate([AsnType({
    type: AsnTypeTypes.Choice
  })], ObjectIdentifier);
  class AlgorithmIdentifier {
    constructor(params) {
      Object.assign(this, params);
    }
  }
  __decorate([AsnProp({
    type: AsnPropTypes.ObjectIdentifier
  })], AlgorithmIdentifier.prototype, "algorithm", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Any,
    optional: true
  })], AlgorithmIdentifier.prototype, "parameters", void 0);
  class PrivateKeyInfo {
    constructor() {
      this.version = 0;
      this.privateKeyAlgorithm = new AlgorithmIdentifier();
      this.privateKey = new ArrayBuffer(0);
    }
  }
  __decorate([AsnProp({
    type: AsnPropTypes.Integer
  })], PrivateKeyInfo.prototype, "version", void 0);
  __decorate([AsnProp({
    type: AlgorithmIdentifier
  })], PrivateKeyInfo.prototype, "privateKeyAlgorithm", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.OctetString
  })], PrivateKeyInfo.prototype, "privateKey", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Any,
    optional: true
  })], PrivateKeyInfo.prototype, "attributes", void 0);
  class PublicKeyInfo {
    constructor() {
      this.publicKeyAlgorithm = new AlgorithmIdentifier();
      this.publicKey = new ArrayBuffer(0);
    }
  }
  __decorate([AsnProp({
    type: AlgorithmIdentifier
  })], PublicKeyInfo.prototype, "publicKeyAlgorithm", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.BitString
  })], PublicKeyInfo.prototype, "publicKey", void 0);
  const JsonBase64UrlArrayBufferConverter = {
    fromJSON: value => Convert.FromBase64Url(value),
    toJSON: value => Convert.ToBase64Url(new Uint8Array(value))
  };
  const AsnIntegerArrayBufferConverter = {
    fromASN: value => {
      const valueHex = value.valueBlock.valueHex;
      return !new Uint8Array(valueHex)[0] ? value.valueBlock.valueHex.slice(1) : value.valueBlock.valueHex;
    },
    toASN: value => {
      const valueHex = new Uint8Array(value)[0] > 127 ? combine(new Uint8Array([0]).buffer, value) : value;
      return new Integer({
        valueHex
      });
    }
  };
  class RsaPrivateKey {
    constructor() {
      this.version = 0;
      this.modulus = new ArrayBuffer(0);
      this.publicExponent = new ArrayBuffer(0);
      this.privateExponent = new ArrayBuffer(0);
      this.prime1 = new ArrayBuffer(0);
      this.prime2 = new ArrayBuffer(0);
      this.exponent1 = new ArrayBuffer(0);
      this.exponent2 = new ArrayBuffer(0);
      this.coefficient = new ArrayBuffer(0);
    }
  }
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerConverter
  })], RsaPrivateKey.prototype, "version", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "n",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPrivateKey.prototype, "modulus", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "e",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPrivateKey.prototype, "publicExponent", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "d",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPrivateKey.prototype, "privateExponent", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "p",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPrivateKey.prototype, "prime1", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "q",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPrivateKey.prototype, "prime2", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "dp",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPrivateKey.prototype, "exponent1", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "dq",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPrivateKey.prototype, "exponent2", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "qi",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPrivateKey.prototype, "coefficient", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Any,
    optional: true
  })], RsaPrivateKey.prototype, "otherPrimeInfos", void 0);
  class RsaPublicKey {
    constructor() {
      this.modulus = new ArrayBuffer(0);
      this.publicExponent = new ArrayBuffer(0);
    }
  }
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "n",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPublicKey.prototype, "modulus", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  }), JsonProp({
    name: "e",
    converter: JsonBase64UrlArrayBufferConverter
  })], RsaPublicKey.prototype, "publicExponent", void 0);
  let EcPublicKey = class EcPublicKey {
    constructor(value) {
      this.value = new ArrayBuffer(0);
      if (value) {
        this.value = value;
      }
    }
    toJSON() {
      let bytes = new Uint8Array(this.value);
      if (bytes[0] !== 0x04) {
        throw new CryptoError("Wrong ECPoint. Current version supports only Uncompressed (0x04) point");
      }
      bytes = new Uint8Array(this.value.slice(1));
      const size = bytes.length / 2;
      const offset = 0;
      const json = {
        x: Convert.ToBase64Url(bytes.buffer.slice(offset, offset + size)),
        y: Convert.ToBase64Url(bytes.buffer.slice(offset + size, offset + size + size))
      };
      return json;
    }
    fromJSON(json) {
      if (!("x" in json)) {
        throw new Error("x: Missing required property");
      }
      if (!("y" in json)) {
        throw new Error("y: Missing required property");
      }
      const x = Convert.FromBase64Url(json.x);
      const y = Convert.FromBase64Url(json.y);
      const value = combine(new Uint8Array([0x04]).buffer, x, y);
      this.value = new Uint8Array(value).buffer;
      return this;
    }
  };
  __decorate([AsnProp({
    type: AsnPropTypes.OctetString
  })], EcPublicKey.prototype, "value", void 0);
  EcPublicKey = __decorate([AsnType({
    type: AsnTypeTypes.Choice
  })], EcPublicKey);
  class EcPrivateKey {
    constructor() {
      this.version = 1;
      this.privateKey = new ArrayBuffer(0);
    }
    fromJSON(json) {
      if (!("d" in json)) {
        throw new Error("d: Missing required property");
      }
      this.privateKey = Convert.FromBase64Url(json.d);
      if ("x" in json) {
        const publicKey = new EcPublicKey();
        publicKey.fromJSON(json);
        const asn = AsnSerializer.toASN(publicKey);
        if ("valueHex" in asn.valueBlock) {
          this.publicKey = asn.valueBlock.valueHex;
        }
      }
      return this;
    }
    toJSON() {
      const jwk = {};
      jwk.d = Convert.ToBase64Url(this.privateKey);
      if (this.publicKey) {
        Object.assign(jwk, new EcPublicKey(this.publicKey).toJSON());
      }
      return jwk;
    }
  }
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerConverter
  })], EcPrivateKey.prototype, "version", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.OctetString
  })], EcPrivateKey.prototype, "privateKey", void 0);
  __decorate([AsnProp({
    context: 0,
    type: AsnPropTypes.Any,
    optional: true
  })], EcPrivateKey.prototype, "parameters", void 0);
  __decorate([AsnProp({
    context: 1,
    type: AsnPropTypes.BitString,
    optional: true
  })], EcPrivateKey.prototype, "publicKey", void 0);
  const AsnIntegerWithoutPaddingConverter = {
    fromASN: value => {
      const bytes = new Uint8Array(value.valueBlock.valueHex);
      return bytes[0] === 0 ? bytes.buffer.slice(1) : bytes.buffer;
    },
    toASN: value => {
      const bytes = new Uint8Array(value);
      if (bytes[0] > 127) {
        const newValue = new Uint8Array(bytes.length + 1);
        newValue.set(bytes, 1);
        return new Integer({
          valueHex: newValue.buffer
        });
      }
      return new Integer({
        valueHex: value
      });
    }
  };
  var index$2 = Object.freeze({
    __proto__: null,
    AsnIntegerWithoutPaddingConverter: AsnIntegerWithoutPaddingConverter
  });
  class EcUtils {
    static decodePoint(data, pointSize) {
      const view = BufferSourceConverter.toUint8Array(data);
      if (view.length === 0 || view[0] !== 4) {
        throw new Error("Only uncompressed point format supported");
      }
      const n = (view.length - 1) / 2;
      if (n !== Math.ceil(pointSize / 8)) {
        throw new Error("Point does not match field size");
      }
      const xb = view.slice(1, n + 1);
      const yb = view.slice(n + 1, n + 1 + n);
      return {
        x: xb,
        y: yb
      };
    }
    static encodePoint(point, pointSize) {
      const size = Math.ceil(pointSize / 8);
      if (point.x.byteLength !== size || point.y.byteLength !== size) {
        throw new Error("X,Y coordinates don't match point size criteria");
      }
      const x = BufferSourceConverter.toUint8Array(point.x);
      const y = BufferSourceConverter.toUint8Array(point.y);
      const res = new Uint8Array(size * 2 + 1);
      res[0] = 4;
      res.set(x, 1);
      res.set(y, size + 1);
      return res;
    }
    static getSize(pointSize) {
      return Math.ceil(pointSize / 8);
    }
    static encodeSignature(signature, pointSize) {
      const size = this.getSize(pointSize);
      const r = BufferSourceConverter.toUint8Array(signature.r);
      const s = BufferSourceConverter.toUint8Array(signature.s);
      const res = new Uint8Array(size * 2);
      res.set(this.padStart(r, size));
      res.set(this.padStart(s, size), size);
      return res;
    }
    static decodeSignature(data, pointSize) {
      const size = this.getSize(pointSize);
      const view = BufferSourceConverter.toUint8Array(data);
      if (view.length !== size * 2) {
        throw new Error("Incorrect size of the signature");
      }
      const r = view.slice(0, size);
      const s = view.slice(size);
      return {
        r: this.trimStart(r),
        s: this.trimStart(s)
      };
    }
    static trimStart(data) {
      let i = 0;
      while (i < data.length - 1 && data[i] === 0) {
        i++;
      }
      if (i === 0) {
        return data;
      }
      return data.slice(i, data.length);
    }
    static padStart(data, size) {
      if (size === data.length) {
        return data;
      }
      const res = new Uint8Array(size);
      res.set(data, size - data.length);
      return res;
    }
  }
  class EcDsaSignature {
    constructor() {
      this.r = new ArrayBuffer(0);
      this.s = new ArrayBuffer(0);
    }
    static fromWebCryptoSignature(value) {
      const pointSize = value.byteLength / 2;
      const point = EcUtils.decodeSignature(value, pointSize * 8);
      const ecSignature = new EcDsaSignature();
      ecSignature.r = BufferSourceConverter.toArrayBuffer(point.r);
      ecSignature.s = BufferSourceConverter.toArrayBuffer(point.s);
      return ecSignature;
    }
    toWebCryptoSignature(pointSize) {
      pointSize !== null && pointSize !== void 0 ? pointSize : pointSize = Math.max(this.r.byteLength, this.s.byteLength) * 8;
      const signature = EcUtils.encodeSignature(this, pointSize);
      return signature.buffer;
    }
  }
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerWithoutPaddingConverter
  })], EcDsaSignature.prototype, "r", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerWithoutPaddingConverter
  })], EcDsaSignature.prototype, "s", void 0);
  class OneAsymmetricKey extends PrivateKeyInfo {}
  __decorate([AsnProp({
    context: 1,
    implicit: true,
    type: AsnPropTypes.BitString,
    optional: true
  })], OneAsymmetricKey.prototype, "publicKey", void 0);
  let EdPrivateKey$1 = class EdPrivateKey {
    constructor() {
      this.value = new ArrayBuffer(0);
    }
    fromJSON(json) {
      if (!json.d) {
        throw new Error("d: Missing required property");
      }
      this.value = Convert.FromBase64Url(json.d);
      return this;
    }
    toJSON() {
      const jwk = {
        d: Convert.ToBase64Url(this.value)
      };
      return jwk;
    }
  };
  __decorate([AsnProp({
    type: AsnPropTypes.OctetString
  })], EdPrivateKey$1.prototype, "value", void 0);
  EdPrivateKey$1 = __decorate([AsnType({
    type: AsnTypeTypes.Choice
  })], EdPrivateKey$1);
  let EdPublicKey$1 = class EdPublicKey {
    constructor(value) {
      this.value = new ArrayBuffer(0);
      if (value) {
        this.value = value;
      }
    }
    toJSON() {
      const json = {
        x: Convert.ToBase64Url(this.value)
      };
      return json;
    }
    fromJSON(json) {
      if (!("x" in json)) {
        throw new Error("x: Missing required property");
      }
      this.value = Convert.FromBase64Url(json.x);
      return this;
    }
  };
  __decorate([AsnProp({
    type: AsnPropTypes.BitString
  })], EdPublicKey$1.prototype, "value", void 0);
  EdPublicKey$1 = __decorate([AsnType({
    type: AsnTypeTypes.Choice
  })], EdPublicKey$1);
  let CurvePrivateKey = class CurvePrivateKey {};
  __decorate([AsnProp({
    type: AsnPropTypes.OctetString
  }), JsonProp({
    type: JsonPropTypes.String,
    converter: JsonBase64UrlArrayBufferConverter
  })], CurvePrivateKey.prototype, "d", void 0);
  CurvePrivateKey = __decorate([AsnType({
    type: AsnTypeTypes.Choice
  })], CurvePrivateKey);
  const idSecp256r1 = "1.2.840.10045.3.1.7";
  const idEllipticCurve = "1.3.132.0";
  const idSecp384r1 = `${idEllipticCurve}.34`;
  const idSecp521r1 = `${idEllipticCurve}.35`;
  const idSecp256k1 = `${idEllipticCurve}.10`;
  const idVersionOne = "1.3.36.3.3.2.8.1.1";
  const idBrainpoolP160r1 = `${idVersionOne}.1`;
  const idBrainpoolP160t1 = `${idVersionOne}.2`;
  const idBrainpoolP192r1 = `${idVersionOne}.3`;
  const idBrainpoolP192t1 = `${idVersionOne}.4`;
  const idBrainpoolP224r1 = `${idVersionOne}.5`;
  const idBrainpoolP224t1 = `${idVersionOne}.6`;
  const idBrainpoolP256r1 = `${idVersionOne}.7`;
  const idBrainpoolP256t1 = `${idVersionOne}.8`;
  const idBrainpoolP320r1 = `${idVersionOne}.9`;
  const idBrainpoolP320t1 = `${idVersionOne}.10`;
  const idBrainpoolP384r1 = `${idVersionOne}.11`;
  const idBrainpoolP384t1 = `${idVersionOne}.12`;
  const idBrainpoolP512r1 = `${idVersionOne}.13`;
  const idBrainpoolP512t1 = `${idVersionOne}.14`;
  const idX25519 = "1.3.101.110";
  const idX448 = "1.3.101.111";
  const idEd25519 = "1.3.101.112";
  const idEd448 = "1.3.101.113";
  var index$1 = Object.freeze({
    __proto__: null,
    AlgorithmIdentifier: AlgorithmIdentifier,
    get CurvePrivateKey() {
      return CurvePrivateKey;
    },
    EcDsaSignature: EcDsaSignature,
    EcPrivateKey: EcPrivateKey,
    get EcPublicKey() {
      return EcPublicKey;
    },
    get EdPrivateKey() {
      return EdPrivateKey$1;
    },
    get EdPublicKey() {
      return EdPublicKey$1;
    },
    get ObjectIdentifier() {
      return ObjectIdentifier;
    },
    OneAsymmetricKey: OneAsymmetricKey,
    PrivateKeyInfo: PrivateKeyInfo,
    PublicKeyInfo: PublicKeyInfo,
    RsaPrivateKey: RsaPrivateKey,
    RsaPublicKey: RsaPublicKey,
    converters: index$2,
    idBrainpoolP160r1: idBrainpoolP160r1,
    idBrainpoolP160t1: idBrainpoolP160t1,
    idBrainpoolP192r1: idBrainpoolP192r1,
    idBrainpoolP192t1: idBrainpoolP192t1,
    idBrainpoolP224r1: idBrainpoolP224r1,
    idBrainpoolP224t1: idBrainpoolP224t1,
    idBrainpoolP256r1: idBrainpoolP256r1,
    idBrainpoolP256t1: idBrainpoolP256t1,
    idBrainpoolP320r1: idBrainpoolP320r1,
    idBrainpoolP320t1: idBrainpoolP320t1,
    idBrainpoolP384r1: idBrainpoolP384r1,
    idBrainpoolP384t1: idBrainpoolP384t1,
    idBrainpoolP512r1: idBrainpoolP512r1,
    idBrainpoolP512t1: idBrainpoolP512t1,
    idEd25519: idEd25519,
    idEd448: idEd448,
    idEllipticCurve: idEllipticCurve,
    idSecp256k1: idSecp256k1,
    idSecp256r1: idSecp256r1,
    idSecp384r1: idSecp384r1,
    idSecp521r1: idSecp521r1,
    idVersionOne: idVersionOne,
    idX25519: idX25519,
    idX448: idX448
  });
  class EcCurves {
    constructor() {}
    static register(item) {
      const oid = new ObjectIdentifier();
      oid.value = item.id;
      const raw = AsnConvert.serialize(oid);
      this.items.push({
        ...item,
        raw
      });
      this.names.push(item.name);
    }
    static find(nameOrId) {
      nameOrId = nameOrId.toUpperCase();
      for (const item of this.items) {
        if (item.name.toUpperCase() === nameOrId || item.id.toUpperCase() === nameOrId) {
          return item;
        }
      }
      return null;
    }
    static get(nameOrId) {
      const res = this.find(nameOrId);
      if (!res) {
        throw new Error(`Unsupported EC named curve '${nameOrId}'`);
      }
      return res;
    }
  }
  EcCurves.items = [];
  EcCurves.names = [];
  EcCurves.register({
    name: "P-256",
    id: idSecp256r1,
    size: 256
  });
  EcCurves.register({
    name: "P-384",
    id: idSecp384r1,
    size: 384
  });
  EcCurves.register({
    name: "P-521",
    id: idSecp521r1,
    size: 521
  });
  EcCurves.register({
    name: "K-256",
    id: idSecp256k1,
    size: 256
  });
  EcCurves.register({
    name: "brainpoolP160r1",
    id: idBrainpoolP160r1,
    size: 160
  });
  EcCurves.register({
    name: "brainpoolP160t1",
    id: idBrainpoolP160t1,
    size: 160
  });
  EcCurves.register({
    name: "brainpoolP192r1",
    id: idBrainpoolP192r1,
    size: 192
  });
  EcCurves.register({
    name: "brainpoolP192t1",
    id: idBrainpoolP192t1,
    size: 192
  });
  EcCurves.register({
    name: "brainpoolP224r1",
    id: idBrainpoolP224r1,
    size: 224
  });
  EcCurves.register({
    name: "brainpoolP224t1",
    id: idBrainpoolP224t1,
    size: 224
  });
  EcCurves.register({
    name: "brainpoolP256r1",
    id: idBrainpoolP256r1,
    size: 256
  });
  EcCurves.register({
    name: "brainpoolP256t1",
    id: idBrainpoolP256t1,
    size: 256
  });
  EcCurves.register({
    name: "brainpoolP320r1",
    id: idBrainpoolP320r1,
    size: 320
  });
  EcCurves.register({
    name: "brainpoolP320t1",
    id: idBrainpoolP320t1,
    size: 320
  });
  EcCurves.register({
    name: "brainpoolP384r1",
    id: idBrainpoolP384r1,
    size: 384
  });
  EcCurves.register({
    name: "brainpoolP384t1",
    id: idBrainpoolP384t1,
    size: 384
  });
  EcCurves.register({
    name: "brainpoolP512r1",
    id: idBrainpoolP512r1,
    size: 512
  });
  EcCurves.register({
    name: "brainpoolP512t1",
    id: idBrainpoolP512t1,
    size: 512
  });
  let HmacProvider$1 = class HmacProvider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.name = "HMAC";
      this.hashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
      this.usages = ["sign", "verify"];
    }
    getDefaultLength(algName) {
      switch (algName.toUpperCase()) {
        case "SHA-1":
        case "SHA-256":
        case "SHA-384":
        case "SHA-512":
          return 512;
        default:
          throw new Error(`Unknown algorithm name '${algName}'`);
      }
    }
    checkGenerateKeyParams(algorithm) {
      this.checkRequiredProperty(algorithm, "hash");
      this.checkHashAlgorithm(algorithm.hash, this.hashAlgorithms);
      if ("length" in algorithm) {
        if (typeof algorithm.length !== "number") {
          throw new TypeError("length: Is not a Number");
        }
        if (algorithm.length < 1) {
          throw new RangeError("length: Number is out of range");
        }
      }
    }
    checkImportParams(algorithm) {
      this.checkRequiredProperty(algorithm, "hash");
      this.checkHashAlgorithm(algorithm.hash, this.hashAlgorithms);
    }
  };
  let Pbkdf2Provider$1 = class Pbkdf2Provider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.name = "PBKDF2";
      this.hashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
      this.usages = ["deriveBits", "deriveKey"];
    }
    checkAlgorithmParams(algorithm) {
      this.checkRequiredProperty(algorithm, "hash");
      this.checkHashAlgorithm(algorithm.hash, this.hashAlgorithms);
      this.checkRequiredProperty(algorithm, "salt");
      if (!(algorithm.salt instanceof ArrayBuffer || ArrayBuffer.isView(algorithm.salt))) {
        throw new TypeError("salt: Is not of type '(ArrayBuffer or ArrayBufferView)'");
      }
      this.checkRequiredProperty(algorithm, "iterations");
      if (typeof algorithm.iterations !== "number") {
        throw new TypeError("iterations: Is not a Number");
      }
      if (algorithm.iterations < 1) {
        throw new TypeError("iterations: Is less than 1");
      }
    }
    checkImportKey(format, keyData, algorithm, extractable, keyUsages, ...args) {
      super.checkImportKey(format, keyData, algorithm, extractable, keyUsages, ...args);
      if (extractable) {
        throw new SyntaxError("extractable: Must be 'false'");
      }
    }
  };
  class ShakeProvider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.usages = [];
      this.defaultLength = 0;
    }
    digest(...args) {
      args[0] = {
        length: this.defaultLength,
        ...args[0]
      };
      return super.digest.apply(this, args);
    }
    checkDigest(algorithm, data) {
      super.checkDigest(algorithm, data);
      const length = algorithm.length || 0;
      if (typeof length !== "number") {
        throw new TypeError("length: Is not a Number");
      }
      if (length < 0) {
        throw new TypeError("length: Is negative");
      }
    }
  }
  let Shake128Provider$1 = class Shake128Provider extends ShakeProvider {
    constructor() {
      super(...arguments);
      this.name = "shake128";
      this.defaultLength = 16;
    }
  };
  let Shake256Provider$1 = class Shake256Provider extends ShakeProvider {
    constructor() {
      super(...arguments);
      this.name = "shake256";
      this.defaultLength = 32;
    }
  };
  let Crypto$1 = class Crypto {
    get [Symbol.toStringTag]() {
      return "Crypto";
    }
    randomUUID() {
      const b = this.getRandomValues(new Uint8Array(16));
      b[6] = b[6] & 0x0f | 0x40;
      b[8] = b[8] & 0x3f | 0x80;
      const uuid = Convert.ToHex(b).toLowerCase();
      return `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20)}`;
    }
  };
  class ProviderStorage {
    constructor() {
      this.items = {};
    }
    get(algorithmName) {
      return this.items[algorithmName.toLowerCase()] || null;
    }
    set(provider) {
      this.items[provider.name.toLowerCase()] = provider;
    }
    removeAt(algorithmName) {
      const provider = this.get(algorithmName.toLowerCase());
      if (provider) {
        delete this.items[algorithmName];
      }
      return provider;
    }
    has(name) {
      return !!this.get(name);
    }
    get length() {
      return Object.keys(this.items).length;
    }
    get algorithms() {
      const algorithms = [];
      for (const key in this.items) {
        const provider = this.items[key];
        algorithms.push(provider.name);
      }
      return algorithms.sort();
    }
  }
  let SubtleCrypto$1 = class SubtleCrypto {
    constructor() {
      this.providers = new ProviderStorage();
    }
    static isHashedAlgorithm(data) {
      return data && typeof data === "object" && "name" in data && "hash" in data ? true : false;
    }
    get [Symbol.toStringTag]() {
      return "SubtleCrypto";
    }
    async digest(...args) {
      this.checkRequiredArguments(args, 2, "digest");
      const [algorithm, data, ...params] = args;
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const preparedData = BufferSourceConverter.toArrayBuffer(data);
      const provider = this.getProvider(preparedAlgorithm.name);
      const result = await provider.digest(preparedAlgorithm, preparedData, ...params);
      return result;
    }
    async generateKey(...args) {
      this.checkRequiredArguments(args, 3, "generateKey");
      const [algorithm, extractable, keyUsages, ...params] = args;
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const provider = this.getProvider(preparedAlgorithm.name);
      const result = await provider.generateKey({
        ...preparedAlgorithm,
        name: provider.name
      }, extractable, keyUsages, ...params);
      return result;
    }
    async sign(...args) {
      this.checkRequiredArguments(args, 3, "sign");
      const [algorithm, key, data, ...params] = args;
      this.checkCryptoKey(key);
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const preparedData = BufferSourceConverter.toArrayBuffer(data);
      const provider = this.getProvider(preparedAlgorithm.name);
      const result = await provider.sign({
        ...preparedAlgorithm,
        name: provider.name
      }, key, preparedData, ...params);
      return result;
    }
    async verify(...args) {
      this.checkRequiredArguments(args, 4, "verify");
      const [algorithm, key, signature, data, ...params] = args;
      this.checkCryptoKey(key);
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const preparedData = BufferSourceConverter.toArrayBuffer(data);
      const preparedSignature = BufferSourceConverter.toArrayBuffer(signature);
      const provider = this.getProvider(preparedAlgorithm.name);
      const result = await provider.verify({
        ...preparedAlgorithm,
        name: provider.name
      }, key, preparedSignature, preparedData, ...params);
      return result;
    }
    async encrypt(...args) {
      this.checkRequiredArguments(args, 3, "encrypt");
      const [algorithm, key, data, ...params] = args;
      this.checkCryptoKey(key);
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const preparedData = BufferSourceConverter.toArrayBuffer(data);
      const provider = this.getProvider(preparedAlgorithm.name);
      const result = await provider.encrypt({
        ...preparedAlgorithm,
        name: provider.name
      }, key, preparedData, {
        keyUsage: true
      }, ...params);
      return result;
    }
    async decrypt(...args) {
      this.checkRequiredArguments(args, 3, "decrypt");
      const [algorithm, key, data, ...params] = args;
      this.checkCryptoKey(key);
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const preparedData = BufferSourceConverter.toArrayBuffer(data);
      const provider = this.getProvider(preparedAlgorithm.name);
      const result = await provider.decrypt({
        ...preparedAlgorithm,
        name: provider.name
      }, key, preparedData, {
        keyUsage: true
      }, ...params);
      return result;
    }
    async deriveBits(...args) {
      this.checkRequiredArguments(args, 3, "deriveBits");
      const [algorithm, baseKey, length, ...params] = args;
      this.checkCryptoKey(baseKey);
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const provider = this.getProvider(preparedAlgorithm.name);
      const result = await provider.deriveBits({
        ...preparedAlgorithm,
        name: provider.name
      }, baseKey, length, {
        keyUsage: true
      }, ...params);
      return result;
    }
    async deriveKey(...args) {
      this.checkRequiredArguments(args, 5, "deriveKey");
      const [algorithm, baseKey, derivedKeyType, extractable, keyUsages, ...params] = args;
      const preparedDerivedKeyType = this.prepareAlgorithm(derivedKeyType);
      const importProvider = this.getProvider(preparedDerivedKeyType.name);
      importProvider.checkDerivedKeyParams(preparedDerivedKeyType);
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const provider = this.getProvider(preparedAlgorithm.name);
      provider.checkCryptoKey(baseKey, "deriveKey");
      const derivedBits = await provider.deriveBits({
        ...preparedAlgorithm,
        name: provider.name
      }, baseKey, derivedKeyType.length || 512, {
        keyUsage: false
      }, ...params);
      return this.importKey("raw", derivedBits, derivedKeyType, extractable, keyUsages, ...params);
    }
    async exportKey(...args) {
      this.checkRequiredArguments(args, 2, "exportKey");
      const [format, key, ...params] = args;
      this.checkCryptoKey(key);
      const provider = this.getProvider(key.algorithm.name);
      const result = await provider.exportKey(format, key, ...params);
      return result;
    }
    async importKey(...args) {
      this.checkRequiredArguments(args, 5, "importKey");
      const [format, keyData, algorithm, extractable, keyUsages, ...params] = args;
      const preparedAlgorithm = this.prepareAlgorithm(algorithm);
      const provider = this.getProvider(preparedAlgorithm.name);
      if (["pkcs8", "spki", "raw"].indexOf(format) !== -1) {
        const preparedData = BufferSourceConverter.toArrayBuffer(keyData);
        return provider.importKey(format, preparedData, {
          ...preparedAlgorithm,
          name: provider.name
        }, extractable, keyUsages, ...params);
      } else {
        if (!keyData.kty) {
          throw new TypeError("keyData: Is not JSON");
        }
      }
      return provider.importKey(format, keyData, {
        ...preparedAlgorithm,
        name: provider.name
      }, extractable, keyUsages, ...params);
    }
    async wrapKey(format, key, wrappingKey, wrapAlgorithm, ...args) {
      let keyData = await this.exportKey(format, key, ...args);
      if (format === "jwk") {
        const json = JSON.stringify(keyData);
        keyData = Convert.FromUtf8String(json);
      }
      const preparedAlgorithm = this.prepareAlgorithm(wrapAlgorithm);
      const preparedData = BufferSourceConverter.toArrayBuffer(keyData);
      const provider = this.getProvider(preparedAlgorithm.name);
      return provider.encrypt({
        ...preparedAlgorithm,
        name: provider.name
      }, wrappingKey, preparedData, {
        keyUsage: false
      }, ...args);
    }
    async unwrapKey(format, wrappedKey, unwrappingKey, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages, ...args) {
      const preparedAlgorithm = this.prepareAlgorithm(unwrapAlgorithm);
      const preparedData = BufferSourceConverter.toArrayBuffer(wrappedKey);
      const provider = this.getProvider(preparedAlgorithm.name);
      let keyData = await provider.decrypt({
        ...preparedAlgorithm,
        name: provider.name
      }, unwrappingKey, preparedData, {
        keyUsage: false
      }, ...args);
      if (format === "jwk") {
        try {
          keyData = JSON.parse(Convert.ToUtf8String(keyData));
        } catch (e) {
          const error = new TypeError("wrappedKey: Is not a JSON");
          error.internal = e;
          throw error;
        }
      }
      return this.importKey(format, keyData, unwrappedKeyAlgorithm, extractable, keyUsages, ...args);
    }
    checkRequiredArguments(args, size, methodName) {
      if (args.length < size) {
        throw new TypeError(`Failed to execute '${methodName}' on 'SubtleCrypto': ${size} arguments required, but only ${args.length} present`);
      }
    }
    prepareAlgorithm(algorithm) {
      if (typeof algorithm === "string") {
        return {
          name: algorithm
        };
      }
      if (SubtleCrypto.isHashedAlgorithm(algorithm)) {
        const preparedAlgorithm = {
          ...algorithm
        };
        preparedAlgorithm.hash = this.prepareAlgorithm(algorithm.hash);
        return preparedAlgorithm;
      }
      return {
        ...algorithm
      };
    }
    getProvider(name) {
      const provider = this.providers.get(name);
      if (!provider) {
        throw new AlgorithmError("Unrecognized name");
      }
      return provider;
    }
    checkCryptoKey(key) {
      if (!(key instanceof CryptoKey$1)) {
        throw new TypeError(`Key is not of type 'CryptoKey'`);
      }
    }
  };
  class Debug {
    static get enabled() {
      return typeof self !== "undefined" && self.PV_WEBCRYPTO_LINER_LOG;
    }
    static log(...args) {
      if (this.enabled) {
        console.log(...args);
      }
    }
    static error(...args) {
      if (this.enabled) {
        console.error(...args);
      }
    }
    static info(...args) {
      if (this.enabled) {
        console.info(...args);
      }
    }
    static warn(...args) {
      if (this.enabled) {
        console.warn(...args);
      }
    }
    static trace(...args) {
      if (this.enabled) {
        console.trace(...args);
      }
    }
  }
  var Browser;
  (function (Browser) {
    Browser["Unknown"] = "Unknown";
    Browser["IE"] = "Internet Explorer";
    Browser["Safari"] = "Safari";
    Browser["Edge"] = "Edge";
    Browser["Chrome"] = "Chrome";
    Browser["Firefox"] = "Firefox Mozilla";
    Browser["Mobile"] = "Mobile";
  })(Browser || (Browser = {}));
  function BrowserInfo() {
    const res = {
      name: Browser.Unknown,
      version: "0"
    };
    if (typeof self === "undefined") {
      return res;
    }
    const userAgent = self.navigator.userAgent;
    const reg = /edge\/([\d.]+)/i.exec(userAgent);
    if (reg) {
      res.name = Browser.Edge;
      res.version = reg[1];
    } else if (/msie/i.test(userAgent)) {
      res.name = Browser.IE;
      res.version = /msie ([\d.]+)/i.exec(userAgent)[1];
    } else if (/Trident/i.test(userAgent)) {
      res.name = Browser.IE;
      res.version = /rv:([\d.]+)/i.exec(userAgent)[1];
    } else if (/chrome/i.test(userAgent)) {
      res.name = Browser.Chrome;
      res.version = /chrome\/([\d.]+)/i.exec(userAgent)[1];
    } else if (/firefox/i.test(userAgent)) {
      res.name = Browser.Firefox;
      res.version = /firefox\/([\d.]+)/i.exec(userAgent)[1];
    } else if (/mobile/i.test(userAgent)) {
      res.name = Browser.Mobile;
      res.version = /mobile\/([\w]+)/i.exec(userAgent)[1];
    } else if (/safari/i.test(userAgent)) {
      res.name = Browser.Safari;
      res.version = /version\/([\d.]+)/i.exec(userAgent)[1];
    }
    return res;
  }
  function concat(...buf) {
    const res = new Uint8Array(buf.map(item => item.length).reduce((prev, cur) => prev + cur));
    let offset = 0;
    buf.forEach(item => {
      for (let i = 0; i < item.length; i++) {
        res[offset + i] = item[i];
      }
      offset += item.length;
    });
    return res;
  }
  class CryptoKey extends CryptoKey$1 {
    constructor(algorithm, extractable, type, usages) {
      super();
      this.extractable = extractable;
      this.type = type;
      this.usages = usages;
      this.algorithm = Object.assign({}, algorithm);
    }
  }
  function string_to_bytes(str, utf8 = false) {
    var len = str.length,
      bytes = new Uint8Array(utf8 ? 4 * len : len);
    for (var i = 0, j = 0; i < len; i++) {
      var c = str.charCodeAt(i);
      if (utf8 && 0xd800 <= c && c <= 0xdbff) {
        if (++i >= len) throw new Error('Malformed string, low surrogate expected at position ' + i);
        c = (c ^ 0xd800) << 10 | 0x10000 | str.charCodeAt(i) ^ 0xdc00;
      } else if (!utf8 && c >>> 8) {
        throw new Error('Wide characters are not allowed.');
      }
      if (!utf8 || c <= 0x7f) {
        bytes[j++] = c;
      } else if (c <= 0x7ff) {
        bytes[j++] = 0xc0 | c >> 6;
        bytes[j++] = 0x80 | c & 0x3f;
      } else if (c <= 0xffff) {
        bytes[j++] = 0xe0 | c >> 12;
        bytes[j++] = 0x80 | c >> 6 & 0x3f;
        bytes[j++] = 0x80 | c & 0x3f;
      } else {
        bytes[j++] = 0xf0 | c >> 18;
        bytes[j++] = 0x80 | c >> 12 & 0x3f;
        bytes[j++] = 0x80 | c >> 6 & 0x3f;
        bytes[j++] = 0x80 | c & 0x3f;
      }
    }
    return bytes.subarray(0, j);
  }
  function is_bytes(a) {
    return a instanceof Uint8Array;
  }
  function _heap_init(heap, heapSize) {
    const size = heap ? heap.byteLength : heapSize || 65536;
    if (size & 0xfff || size <= 0) throw new Error('heap size must be a positive integer and a multiple of 4096');
    heap = heap || new Uint8Array(new ArrayBuffer(size));
    return heap;
  }
  function _heap_write(heap, hpos, data, dpos, dlen) {
    const hlen = heap.length - hpos;
    const wlen = hlen < dlen ? hlen : dlen;
    heap.set(data.subarray(dpos, dpos + wlen), hpos);
    return wlen;
  }
  function joinBytes(...arg) {
    const totalLenght = arg.reduce((sum, curr) => sum + curr.length, 0);
    const ret = new Uint8Array(totalLenght);
    let cursor = 0;
    for (let i = 0; i < arg.length; i++) {
      ret.set(arg[i], cursor);
      cursor += arg[i].length;
    }
    return ret;
  }
  class IllegalStateError extends Error {
    constructor(...args) {
      super(...args);
    }
  }
  class IllegalArgumentError extends Error {
    constructor(...args) {
      super(...args);
    }
  }
  class SecurityError extends Error {
    constructor(...args) {
      super(...args);
    }
  }

  /**
   * @file {@link http://asmjs.org Asm.js} implementation of the {@link https://en.wikipedia.org/wiki/Advanced_Encryption_Standard Advanced Encryption Standard}.
   * @author Artem S Vybornov <vybornov@gmail.com>
   * @license MIT
   */
  var AES_asm = function () {
    var ginit_done = false;
    var gexp3, glog3;
    function ginit() {
      gexp3 = [], glog3 = [];
      var a = 1,
        c,
        d;
      for (c = 0; c < 255; c++) {
        gexp3[c] = a;
        d = a & 0x80, a <<= 1, a &= 255;
        if (d === 0x80) a ^= 0x1b;
        a ^= gexp3[c];
        glog3[gexp3[c]] = c;
      }
      gexp3[255] = gexp3[0];
      glog3[0] = 0;
      ginit_done = true;
    }
    function gmul(a, b) {
      var c = gexp3[(glog3[a] + glog3[b]) % 255];
      if (a === 0 || b === 0) c = 0;
      return c;
    }
    function ginv(a) {
      var i = gexp3[255 - glog3[a]];
      if (a === 0) i = 0;
      return i;
    }
    var aes_init_done = false;
    var aes_sbox;
    var aes_sinv;
    var aes_enc;
    var aes_dec;
    function aes_init() {
      if (!ginit_done) ginit();
      function _s(a) {
        var c, s, x;
        s = x = ginv(a);
        for (c = 0; c < 4; c++) {
          s = (s << 1 | s >>> 7) & 255;
          x ^= s;
        }
        x ^= 99;
        return x;
      }
      aes_sbox = [], aes_sinv = [], aes_enc = [[], [], [], []], aes_dec = [[], [], [], []];
      for (var i = 0; i < 256; i++) {
        var s = _s(i);
        aes_sbox[i] = s;
        aes_sinv[s] = i;
        aes_enc[0][i] = gmul(2, s) << 24 | s << 16 | s << 8 | gmul(3, s);
        aes_dec[0][s] = gmul(14, i) << 24 | gmul(9, i) << 16 | gmul(13, i) << 8 | gmul(11, i);
        for (var t = 1; t < 4; t++) {
          aes_enc[t][i] = aes_enc[t - 1][i] >>> 8 | aes_enc[t - 1][i] << 24;
          aes_dec[t][s] = aes_dec[t - 1][s] >>> 8 | aes_dec[t - 1][s] << 24;
        }
      }
      aes_init_done = true;
    }
    var wrapper = function (foreign, buffer) {
      if (!aes_init_done) aes_init();
      var heap = new Uint32Array(buffer);
      heap.set(aes_sbox, 0x0800 >> 2);
      heap.set(aes_sinv, 0x0c00 >> 2);
      for (var i = 0; i < 4; i++) {
        heap.set(aes_enc[i], 0x1000 + 0x400 * i >> 2);
        heap.set(aes_dec[i], 0x2000 + 0x400 * i >> 2);
      }
      function set_key(ks, k0, k1, k2, k3, k4, k5, k6, k7) {
        var ekeys = heap.subarray(0x000, 60),
          dkeys = heap.subarray(0x100, 0x100 + 60);
        ekeys.set([k0, k1, k2, k3, k4, k5, k6, k7]);
        for (var i = ks, rcon = 1; i < 4 * ks + 28; i++) {
          var k = ekeys[i - 1];
          if (i % ks === 0 || ks === 8 && i % ks === 4) {
            k = aes_sbox[k >>> 24] << 24 ^ aes_sbox[k >>> 16 & 255] << 16 ^ aes_sbox[k >>> 8 & 255] << 8 ^ aes_sbox[k & 255];
          }
          if (i % ks === 0) {
            k = k << 8 ^ k >>> 24 ^ rcon << 24;
            rcon = rcon << 1 ^ (rcon & 0x80 ? 0x1b : 0);
          }
          ekeys[i] = ekeys[i - ks] ^ k;
        }
        for (var j = 0; j < i; j += 4) {
          for (var jj = 0; jj < 4; jj++) {
            var k = ekeys[i - (4 + j) + (4 - jj) % 4];
            if (j < 4 || j >= i - 4) {
              dkeys[j + jj] = k;
            } else {
              dkeys[j + jj] = aes_dec[0][aes_sbox[k >>> 24]] ^ aes_dec[1][aes_sbox[k >>> 16 & 255]] ^ aes_dec[2][aes_sbox[k >>> 8 & 255]] ^ aes_dec[3][aes_sbox[k & 255]];
            }
          }
        }
        asm.set_rounds(ks + 5);
      }
      var stdlib = {
        Uint8Array: Uint8Array,
        Uint32Array: Uint32Array
      };
      var asm = function (stdlib, foreign, buffer) {
        "use asm";

        var S0 = 0,
          S1 = 0,
          S2 = 0,
          S3 = 0,
          I0 = 0,
          I1 = 0,
          I2 = 0,
          I3 = 0,
          N0 = 0,
          N1 = 0,
          N2 = 0,
          N3 = 0,
          M0 = 0,
          M1 = 0,
          M2 = 0,
          M3 = 0,
          H0 = 0,
          H1 = 0,
          H2 = 0,
          H3 = 0,
          R = 0;
        var HEAP = new stdlib.Uint32Array(buffer),
          DATA = new stdlib.Uint8Array(buffer);
        function _core(k, s, t, r, x0, x1, x2, x3) {
          k = k | 0;
          s = s | 0;
          t = t | 0;
          r = r | 0;
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          var t1 = 0,
            t2 = 0,
            t3 = 0,
            y0 = 0,
            y1 = 0,
            y2 = 0,
            y3 = 0,
            i = 0;
          t1 = t | 0x400, t2 = t | 0x800, t3 = t | 0xc00;
          x0 = x0 ^ HEAP[(k | 0) >> 2], x1 = x1 ^ HEAP[(k | 4) >> 2], x2 = x2 ^ HEAP[(k | 8) >> 2], x3 = x3 ^ HEAP[(k | 12) >> 2];
          for (i = 16; (i | 0) <= r << 4; i = i + 16 | 0) {
            y0 = HEAP[(t | x0 >> 22 & 1020) >> 2] ^ HEAP[(t1 | x1 >> 14 & 1020) >> 2] ^ HEAP[(t2 | x2 >> 6 & 1020) >> 2] ^ HEAP[(t3 | x3 << 2 & 1020) >> 2] ^ HEAP[(k | i | 0) >> 2], y1 = HEAP[(t | x1 >> 22 & 1020) >> 2] ^ HEAP[(t1 | x2 >> 14 & 1020) >> 2] ^ HEAP[(t2 | x3 >> 6 & 1020) >> 2] ^ HEAP[(t3 | x0 << 2 & 1020) >> 2] ^ HEAP[(k | i | 4) >> 2], y2 = HEAP[(t | x2 >> 22 & 1020) >> 2] ^ HEAP[(t1 | x3 >> 14 & 1020) >> 2] ^ HEAP[(t2 | x0 >> 6 & 1020) >> 2] ^ HEAP[(t3 | x1 << 2 & 1020) >> 2] ^ HEAP[(k | i | 8) >> 2], y3 = HEAP[(t | x3 >> 22 & 1020) >> 2] ^ HEAP[(t1 | x0 >> 14 & 1020) >> 2] ^ HEAP[(t2 | x1 >> 6 & 1020) >> 2] ^ HEAP[(t3 | x2 << 2 & 1020) >> 2] ^ HEAP[(k | i | 12) >> 2];
            x0 = y0, x1 = y1, x2 = y2, x3 = y3;
          }
          S0 = HEAP[(s | x0 >> 22 & 1020) >> 2] << 24 ^ HEAP[(s | x1 >> 14 & 1020) >> 2] << 16 ^ HEAP[(s | x2 >> 6 & 1020) >> 2] << 8 ^ HEAP[(s | x3 << 2 & 1020) >> 2] ^ HEAP[(k | i | 0) >> 2], S1 = HEAP[(s | x1 >> 22 & 1020) >> 2] << 24 ^ HEAP[(s | x2 >> 14 & 1020) >> 2] << 16 ^ HEAP[(s | x3 >> 6 & 1020) >> 2] << 8 ^ HEAP[(s | x0 << 2 & 1020) >> 2] ^ HEAP[(k | i | 4) >> 2], S2 = HEAP[(s | x2 >> 22 & 1020) >> 2] << 24 ^ HEAP[(s | x3 >> 14 & 1020) >> 2] << 16 ^ HEAP[(s | x0 >> 6 & 1020) >> 2] << 8 ^ HEAP[(s | x1 << 2 & 1020) >> 2] ^ HEAP[(k | i | 8) >> 2], S3 = HEAP[(s | x3 >> 22 & 1020) >> 2] << 24 ^ HEAP[(s | x0 >> 14 & 1020) >> 2] << 16 ^ HEAP[(s | x1 >> 6 & 1020) >> 2] << 8 ^ HEAP[(s | x2 << 2 & 1020) >> 2] ^ HEAP[(k | i | 12) >> 2];
        }
        function _ecb_enc(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          _core(0x0000, 0x0800, 0x1000, R, x0, x1, x2, x3);
        }
        function _ecb_dec(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          var t = 0;
          _core(0x0400, 0x0c00, 0x2000, R, x0, x3, x2, x1);
          t = S1, S1 = S3, S3 = t;
        }
        function _cbc_enc(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          _core(0x0000, 0x0800, 0x1000, R, I0 ^ x0, I1 ^ x1, I2 ^ x2, I3 ^ x3);
          I0 = S0, I1 = S1, I2 = S2, I3 = S3;
        }
        function _cbc_dec(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          var t = 0;
          _core(0x0400, 0x0c00, 0x2000, R, x0, x3, x2, x1);
          t = S1, S1 = S3, S3 = t;
          S0 = S0 ^ I0, S1 = S1 ^ I1, S2 = S2 ^ I2, S3 = S3 ^ I3;
          I0 = x0, I1 = x1, I2 = x2, I3 = x3;
        }
        function _cfb_enc(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          _core(0x0000, 0x0800, 0x1000, R, I0, I1, I2, I3);
          I0 = S0 = S0 ^ x0, I1 = S1 = S1 ^ x1, I2 = S2 = S2 ^ x2, I3 = S3 = S3 ^ x3;
        }
        function _cfb_dec(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          _core(0x0000, 0x0800, 0x1000, R, I0, I1, I2, I3);
          S0 = S0 ^ x0, S1 = S1 ^ x1, S2 = S2 ^ x2, S3 = S3 ^ x3;
          I0 = x0, I1 = x1, I2 = x2, I3 = x3;
        }
        function _ofb(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          _core(0x0000, 0x0800, 0x1000, R, I0, I1, I2, I3);
          I0 = S0, I1 = S1, I2 = S2, I3 = S3;
          S0 = S0 ^ x0, S1 = S1 ^ x1, S2 = S2 ^ x2, S3 = S3 ^ x3;
        }
        function _ctr(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          _core(0x0000, 0x0800, 0x1000, R, N0, N1, N2, N3);
          N3 = ~M3 & N3 | M3 & N3 + 1;
          N2 = ~M2 & N2 | M2 & N2 + ((N3 | 0) == 0);
          N1 = ~M1 & N1 | M1 & N1 + ((N2 | 0) == 0);
          N0 = ~M0 & N0 | M0 & N0 + ((N1 | 0) == 0);
          S0 = S0 ^ x0;
          S1 = S1 ^ x1;
          S2 = S2 ^ x2;
          S3 = S3 ^ x3;
        }
        function _gcm_mac(x0, x1, x2, x3) {
          x0 = x0 | 0;
          x1 = x1 | 0;
          x2 = x2 | 0;
          x3 = x3 | 0;
          var y0 = 0,
            y1 = 0,
            y2 = 0,
            y3 = 0,
            z0 = 0,
            z1 = 0,
            z2 = 0,
            z3 = 0,
            i = 0,
            c = 0;
          x0 = x0 ^ I0, x1 = x1 ^ I1, x2 = x2 ^ I2, x3 = x3 ^ I3;
          y0 = H0 | 0, y1 = H1 | 0, y2 = H2 | 0, y3 = H3 | 0;
          for (; (i | 0) < 128; i = i + 1 | 0) {
            if (y0 >>> 31) {
              z0 = z0 ^ x0, z1 = z1 ^ x1, z2 = z2 ^ x2, z3 = z3 ^ x3;
            }
            y0 = y0 << 1 | y1 >>> 31, y1 = y1 << 1 | y2 >>> 31, y2 = y2 << 1 | y3 >>> 31, y3 = y3 << 1;
            c = x3 & 1;
            x3 = x3 >>> 1 | x2 << 31, x2 = x2 >>> 1 | x1 << 31, x1 = x1 >>> 1 | x0 << 31, x0 = x0 >>> 1;
            if (c) x0 = x0 ^ 0xe1000000;
          }
          I0 = z0, I1 = z1, I2 = z2, I3 = z3;
        }
        function set_rounds(r) {
          r = r | 0;
          R = r;
        }
        function set_state(s0, s1, s2, s3) {
          s0 = s0 | 0;
          s1 = s1 | 0;
          s2 = s2 | 0;
          s3 = s3 | 0;
          S0 = s0, S1 = s1, S2 = s2, S3 = s3;
        }
        function set_iv(i0, i1, i2, i3) {
          i0 = i0 | 0;
          i1 = i1 | 0;
          i2 = i2 | 0;
          i3 = i3 | 0;
          I0 = i0, I1 = i1, I2 = i2, I3 = i3;
        }
        function set_nonce(n0, n1, n2, n3) {
          n0 = n0 | 0;
          n1 = n1 | 0;
          n2 = n2 | 0;
          n3 = n3 | 0;
          N0 = n0, N1 = n1, N2 = n2, N3 = n3;
        }
        function set_mask(m0, m1, m2, m3) {
          m0 = m0 | 0;
          m1 = m1 | 0;
          m2 = m2 | 0;
          m3 = m3 | 0;
          M0 = m0, M1 = m1, M2 = m2, M3 = m3;
        }
        function set_counter(c0, c1, c2, c3) {
          c0 = c0 | 0;
          c1 = c1 | 0;
          c2 = c2 | 0;
          c3 = c3 | 0;
          N3 = ~M3 & N3 | M3 & c3, N2 = ~M2 & N2 | M2 & c2, N1 = ~M1 & N1 | M1 & c1, N0 = ~M0 & N0 | M0 & c0;
        }
        function get_state(pos) {
          pos = pos | 0;
          if (pos & 15) return -1;
          DATA[pos | 0] = S0 >>> 24, DATA[pos | 1] = S0 >>> 16 & 255, DATA[pos | 2] = S0 >>> 8 & 255, DATA[pos | 3] = S0 & 255, DATA[pos | 4] = S1 >>> 24, DATA[pos | 5] = S1 >>> 16 & 255, DATA[pos | 6] = S1 >>> 8 & 255, DATA[pos | 7] = S1 & 255, DATA[pos | 8] = S2 >>> 24, DATA[pos | 9] = S2 >>> 16 & 255, DATA[pos | 10] = S2 >>> 8 & 255, DATA[pos | 11] = S2 & 255, DATA[pos | 12] = S3 >>> 24, DATA[pos | 13] = S3 >>> 16 & 255, DATA[pos | 14] = S3 >>> 8 & 255, DATA[pos | 15] = S3 & 255;
          return 16;
        }
        function get_iv(pos) {
          pos = pos | 0;
          if (pos & 15) return -1;
          DATA[pos | 0] = I0 >>> 24, DATA[pos | 1] = I0 >>> 16 & 255, DATA[pos | 2] = I0 >>> 8 & 255, DATA[pos | 3] = I0 & 255, DATA[pos | 4] = I1 >>> 24, DATA[pos | 5] = I1 >>> 16 & 255, DATA[pos | 6] = I1 >>> 8 & 255, DATA[pos | 7] = I1 & 255, DATA[pos | 8] = I2 >>> 24, DATA[pos | 9] = I2 >>> 16 & 255, DATA[pos | 10] = I2 >>> 8 & 255, DATA[pos | 11] = I2 & 255, DATA[pos | 12] = I3 >>> 24, DATA[pos | 13] = I3 >>> 16 & 255, DATA[pos | 14] = I3 >>> 8 & 255, DATA[pos | 15] = I3 & 255;
          return 16;
        }
        function gcm_init() {
          _ecb_enc(0, 0, 0, 0);
          H0 = S0, H1 = S1, H2 = S2, H3 = S3;
        }
        function cipher(mode, pos, len) {
          mode = mode | 0;
          pos = pos | 0;
          len = len | 0;
          var ret = 0;
          if (pos & 15) return -1;
          while ((len | 0) >= 16) {
            _cipher_modes[mode & 7](DATA[pos | 0] << 24 | DATA[pos | 1] << 16 | DATA[pos | 2] << 8 | DATA[pos | 3], DATA[pos | 4] << 24 | DATA[pos | 5] << 16 | DATA[pos | 6] << 8 | DATA[pos | 7], DATA[pos | 8] << 24 | DATA[pos | 9] << 16 | DATA[pos | 10] << 8 | DATA[pos | 11], DATA[pos | 12] << 24 | DATA[pos | 13] << 16 | DATA[pos | 14] << 8 | DATA[pos | 15]);
            DATA[pos | 0] = S0 >>> 24, DATA[pos | 1] = S0 >>> 16 & 255, DATA[pos | 2] = S0 >>> 8 & 255, DATA[pos | 3] = S0 & 255, DATA[pos | 4] = S1 >>> 24, DATA[pos | 5] = S1 >>> 16 & 255, DATA[pos | 6] = S1 >>> 8 & 255, DATA[pos | 7] = S1 & 255, DATA[pos | 8] = S2 >>> 24, DATA[pos | 9] = S2 >>> 16 & 255, DATA[pos | 10] = S2 >>> 8 & 255, DATA[pos | 11] = S2 & 255, DATA[pos | 12] = S3 >>> 24, DATA[pos | 13] = S3 >>> 16 & 255, DATA[pos | 14] = S3 >>> 8 & 255, DATA[pos | 15] = S3 & 255;
            ret = ret + 16 | 0, pos = pos + 16 | 0, len = len - 16 | 0;
          }
          return ret | 0;
        }
        function mac(mode, pos, len) {
          mode = mode | 0;
          pos = pos | 0;
          len = len | 0;
          var ret = 0;
          if (pos & 15) return -1;
          while ((len | 0) >= 16) {
            _mac_modes[mode & 1](DATA[pos | 0] << 24 | DATA[pos | 1] << 16 | DATA[pos | 2] << 8 | DATA[pos | 3], DATA[pos | 4] << 24 | DATA[pos | 5] << 16 | DATA[pos | 6] << 8 | DATA[pos | 7], DATA[pos | 8] << 24 | DATA[pos | 9] << 16 | DATA[pos | 10] << 8 | DATA[pos | 11], DATA[pos | 12] << 24 | DATA[pos | 13] << 16 | DATA[pos | 14] << 8 | DATA[pos | 15]);
            ret = ret + 16 | 0, pos = pos + 16 | 0, len = len - 16 | 0;
          }
          return ret | 0;
        }
        var _cipher_modes = [_ecb_enc, _ecb_dec, _cbc_enc, _cbc_dec, _cfb_enc, _cfb_dec, _ofb, _ctr];
        var _mac_modes = [_cbc_enc, _gcm_mac];
        return {
          set_rounds: set_rounds,
          set_state: set_state,
          set_iv: set_iv,
          set_nonce: set_nonce,
          set_mask: set_mask,
          set_counter: set_counter,
          get_state: get_state,
          get_iv: get_iv,
          gcm_init: gcm_init,
          cipher: cipher,
          mac: mac
        };
      }(stdlib, foreign, buffer);
      asm.set_key = set_key;
      return asm;
    };
    wrapper.ENC = {
      ECB: 0,
      CBC: 2,
      CFB: 4,
      OFB: 6,
      CTR: 7
    }, wrapper.DEC = {
      ECB: 1,
      CBC: 3,
      CFB: 5,
      OFB: 6,
      CTR: 7
    }, wrapper.MAC = {
      CBC: 0,
      GCM: 1
    };
    wrapper.HEAP_DATA = 0x4000;
    return wrapper;
  }();
  class AES {
    constructor(key, iv, padding = true, mode) {
      this.pos = 0;
      this.len = 0;
      this.mode = mode;
      this.heap = _heap_init().subarray(AES_asm.HEAP_DATA);
      this.asm = new AES_asm(null, this.heap.buffer);
      this.pos = 0;
      this.len = 0;
      const keylen = key.length;
      if (keylen !== 16 && keylen !== 24 && keylen !== 32) throw new IllegalArgumentError('illegal key size');
      const keyview = new DataView(key.buffer, key.byteOffset, key.byteLength);
      this.asm.set_key(keylen >> 2, keyview.getUint32(0), keyview.getUint32(4), keyview.getUint32(8), keyview.getUint32(12), keylen > 16 ? keyview.getUint32(16) : 0, keylen > 16 ? keyview.getUint32(20) : 0, keylen > 24 ? keyview.getUint32(24) : 0, keylen > 24 ? keyview.getUint32(28) : 0);
      if (iv !== undefined) {
        if (iv.length !== 16) throw new IllegalArgumentError('illegal iv size');
        let ivview = new DataView(iv.buffer, iv.byteOffset, iv.byteLength);
        this.asm.set_iv(ivview.getUint32(0), ivview.getUint32(4), ivview.getUint32(8), ivview.getUint32(12));
      } else {
        this.asm.set_iv(0, 0, 0, 0);
      }
      this.padding = padding;
    }
    AES_Encrypt_process(data) {
      if (!is_bytes(data)) throw new TypeError("data isn't of expected type");
      let asm = this.asm;
      let heap = this.heap;
      let amode = AES_asm.ENC[this.mode];
      let hpos = AES_asm.HEAP_DATA;
      let pos = this.pos;
      let len = this.len;
      let dpos = 0;
      let dlen = data.length || 0;
      let rpos = 0;
      let rlen = len + dlen & -16;
      let wlen = 0;
      let result = new Uint8Array(rlen);
      while (dlen > 0) {
        wlen = _heap_write(heap, pos + len, data, dpos, dlen);
        len += wlen;
        dpos += wlen;
        dlen -= wlen;
        wlen = asm.cipher(amode, hpos + pos, len);
        if (wlen) result.set(heap.subarray(pos, pos + wlen), rpos);
        rpos += wlen;
        if (wlen < len) {
          pos += wlen;
          len -= wlen;
        } else {
          pos = 0;
          len = 0;
        }
      }
      this.pos = pos;
      this.len = len;
      return result;
    }
    AES_Encrypt_finish() {
      let asm = this.asm;
      let heap = this.heap;
      let amode = AES_asm.ENC[this.mode];
      let hpos = AES_asm.HEAP_DATA;
      let pos = this.pos;
      let len = this.len;
      let plen = 16 - len % 16;
      let rlen = len;
      if (this.hasOwnProperty('padding')) {
        if (this.padding) {
          for (let p = 0; p < plen; ++p) {
            heap[pos + len + p] = plen;
          }
          len += plen;
          rlen = len;
        } else if (len % 16) {
          throw new IllegalArgumentError('data length must be a multiple of the block size');
        }
      } else {
        len += plen;
      }
      const result = new Uint8Array(rlen);
      if (len) asm.cipher(amode, hpos + pos, len);
      if (rlen) result.set(heap.subarray(pos, pos + rlen));
      this.pos = 0;
      this.len = 0;
      return result;
    }
    AES_Decrypt_process(data) {
      if (!is_bytes(data)) throw new TypeError("data isn't of expected type");
      let asm = this.asm;
      let heap = this.heap;
      let amode = AES_asm.DEC[this.mode];
      let hpos = AES_asm.HEAP_DATA;
      let pos = this.pos;
      let len = this.len;
      let dpos = 0;
      let dlen = data.length || 0;
      let rpos = 0;
      let rlen = len + dlen & -16;
      let plen = 0;
      let wlen = 0;
      if (this.padding) {
        plen = len + dlen - rlen || 16;
        rlen -= plen;
      }
      const result = new Uint8Array(rlen);
      while (dlen > 0) {
        wlen = _heap_write(heap, pos + len, data, dpos, dlen);
        len += wlen;
        dpos += wlen;
        dlen -= wlen;
        wlen = asm.cipher(amode, hpos + pos, len - (!dlen ? plen : 0));
        if (wlen) result.set(heap.subarray(pos, pos + wlen), rpos);
        rpos += wlen;
        if (wlen < len) {
          pos += wlen;
          len -= wlen;
        } else {
          pos = 0;
          len = 0;
        }
      }
      this.pos = pos;
      this.len = len;
      return result;
    }
    AES_Decrypt_finish() {
      let asm = this.asm;
      let heap = this.heap;
      let amode = AES_asm.DEC[this.mode];
      let hpos = AES_asm.HEAP_DATA;
      let pos = this.pos;
      let len = this.len;
      let rlen = len;
      if (len > 0) {
        if (len % 16) {
          if (this.hasOwnProperty('padding')) {
            throw new IllegalArgumentError('data length must be a multiple of the block size');
          } else {
            len += 16 - len % 16;
          }
        }
        asm.cipher(amode, hpos + pos, len);
        if (this.hasOwnProperty('padding') && this.padding) {
          let pad = heap[pos + rlen - 1];
          if (pad < 1 || pad > 16 || pad > rlen) throw new SecurityError('bad padding');
          let pcheck = 0;
          for (let i = pad; i > 1; i--) pcheck |= pad ^ heap[pos + rlen - i];
          if (pcheck) throw new SecurityError('bad padding');
          rlen -= pad;
        }
      }
      const result = new Uint8Array(rlen);
      if (rlen > 0) {
        result.set(heap.subarray(pos, pos + rlen));
      }
      this.pos = 0;
      this.len = 0;
      return result;
    }
  }
  class AES_CBC extends AES {
    static encrypt(data, key, padding = true, iv) {
      return new AES_CBC(key, iv, padding).encrypt(data);
    }
    static decrypt(data, key, padding = true, iv) {
      return new AES_CBC(key, iv, padding).decrypt(data);
    }
    constructor(key, iv, padding = true) {
      super(key, iv, padding, 'CBC');
    }
    encrypt(data) {
      const r1 = this.AES_Encrypt_process(data);
      const r2 = this.AES_Encrypt_finish();
      return joinBytes(r1, r2);
    }
    decrypt(data) {
      const r1 = this.AES_Decrypt_process(data);
      const r2 = this.AES_Decrypt_finish();
      return joinBytes(r1, r2);
    }
  }
  class AES_ECB extends AES {
    static encrypt(data, key, padding = false) {
      return new AES_ECB(key, padding).encrypt(data);
    }
    static decrypt(data, key, padding = false) {
      return new AES_ECB(key, padding).decrypt(data);
    }
    constructor(key, padding = false) {
      super(key, undefined, padding, 'ECB');
    }
    encrypt(data) {
      const r1 = this.AES_Encrypt_process(data);
      const r2 = this.AES_Encrypt_finish();
      return joinBytes(r1, r2);
    }
    decrypt(data) {
      const r1 = this.AES_Decrypt_process(data);
      const r2 = this.AES_Decrypt_finish();
      return joinBytes(r1, r2);
    }
  }
  class AES_CTR extends AES {
    static encrypt(data, key, nonce) {
      return new AES_CTR(key, nonce).encrypt(data);
    }
    static decrypt(data, key, nonce) {
      return new AES_CTR(key, nonce).encrypt(data);
    }
    constructor(key, nonce) {
      super(key, undefined, false, 'CTR');
      delete this.padding;
      this.AES_CTR_set_options(nonce);
    }
    encrypt(data) {
      const r1 = this.AES_Encrypt_process(data);
      const r2 = this.AES_Encrypt_finish();
      return joinBytes(r1, r2);
    }
    decrypt(data) {
      const r1 = this.AES_Encrypt_process(data);
      const r2 = this.AES_Encrypt_finish();
      return joinBytes(r1, r2);
    }
    AES_CTR_set_options(nonce, counter, size) {
      if (size !== undefined) {
        if (size < 8 || size > 48) throw new IllegalArgumentError('illegal counter size');
        let mask = Math.pow(2, size) - 1;
        this.asm.set_mask(0, 0, mask / 0x100000000 | 0, mask | 0);
      } else {
        size = 48;
        this.asm.set_mask(0, 0, 0xffff, 0xffffffff);
      }
      if (nonce !== undefined) {
        let len = nonce.length;
        if (!len || len > 16) throw new IllegalArgumentError('illegal nonce size');
        let view = new DataView(new ArrayBuffer(16));
        new Uint8Array(view.buffer).set(nonce);
        this.asm.set_nonce(view.getUint32(0), view.getUint32(4), view.getUint32(8), view.getUint32(12));
      } else {
        throw new Error('nonce is required');
      }
      if (counter !== undefined) {
        if (counter < 0 || counter >= Math.pow(2, size)) throw new IllegalArgumentError('illegal counter value');
        this.asm.set_counter(0, 0, counter / 0x100000000 | 0, counter | 0);
      }
    }
  }
  const _AES_GCM_data_maxLength = 68719476704;
  class AES_GCM extends AES {
    constructor(key, nonce, adata, tagSize = 16) {
      super(key, undefined, false, 'CTR');
      this.tagSize = tagSize;
      this.gamma0 = 0;
      this.counter = 1;
      this.asm.gcm_init();
      if (this.tagSize < 4 || this.tagSize > 16) throw new IllegalArgumentError('illegal tagSize value');
      const noncelen = nonce.length || 0;
      const noncebuf = new Uint8Array(16);
      if (noncelen !== 12) {
        this._gcm_mac_process(nonce);
        this.heap[0] = 0;
        this.heap[1] = 0;
        this.heap[2] = 0;
        this.heap[3] = 0;
        this.heap[4] = 0;
        this.heap[5] = 0;
        this.heap[6] = 0;
        this.heap[7] = 0;
        this.heap[8] = 0;
        this.heap[9] = 0;
        this.heap[10] = 0;
        this.heap[11] = noncelen >>> 29;
        this.heap[12] = noncelen >>> 21 & 255;
        this.heap[13] = noncelen >>> 13 & 255;
        this.heap[14] = noncelen >>> 5 & 255;
        this.heap[15] = noncelen << 3 & 255;
        this.asm.mac(AES_asm.MAC.GCM, AES_asm.HEAP_DATA, 16);
        this.asm.get_iv(AES_asm.HEAP_DATA);
        this.asm.set_iv(0, 0, 0, 0);
        noncebuf.set(this.heap.subarray(0, 16));
      } else {
        noncebuf.set(nonce);
        noncebuf[15] = 1;
      }
      const nonceview = new DataView(noncebuf.buffer);
      this.gamma0 = nonceview.getUint32(12);
      this.asm.set_nonce(nonceview.getUint32(0), nonceview.getUint32(4), nonceview.getUint32(8), 0);
      this.asm.set_mask(0, 0, 0, 0xffffffff);
      if (adata !== undefined) {
        if (adata.length > _AES_GCM_data_maxLength) throw new IllegalArgumentError('illegal adata length');
        if (adata.length) {
          this.adata = adata;
          this._gcm_mac_process(adata);
        } else {
          this.adata = undefined;
        }
      } else {
        this.adata = undefined;
      }
      if (this.counter < 1 || this.counter > 0xffffffff) throw new RangeError('counter must be a positive 32-bit integer');
      this.asm.set_counter(0, 0, 0, this.gamma0 + this.counter | 0);
    }
    static encrypt(cleartext, key, nonce, adata, tagsize) {
      return new AES_GCM(key, nonce, adata, tagsize).encrypt(cleartext);
    }
    static decrypt(ciphertext, key, nonce, adata, tagsize) {
      return new AES_GCM(key, nonce, adata, tagsize).decrypt(ciphertext);
    }
    encrypt(data) {
      return this.AES_GCM_encrypt(data);
    }
    decrypt(data) {
      return this.AES_GCM_decrypt(data);
    }
    AES_GCM_Encrypt_process(data) {
      let dpos = 0;
      let dlen = data.length || 0;
      let asm = this.asm;
      let heap = this.heap;
      let counter = this.counter;
      let pos = this.pos;
      let len = this.len;
      let rpos = 0;
      let rlen = len + dlen & -16;
      let wlen = 0;
      if ((counter - 1 << 4) + len + dlen > _AES_GCM_data_maxLength) throw new RangeError('counter overflow');
      const result = new Uint8Array(rlen);
      while (dlen > 0) {
        wlen = _heap_write(heap, pos + len, data, dpos, dlen);
        len += wlen;
        dpos += wlen;
        dlen -= wlen;
        wlen = asm.cipher(AES_asm.ENC.CTR, AES_asm.HEAP_DATA + pos, len);
        wlen = asm.mac(AES_asm.MAC.GCM, AES_asm.HEAP_DATA + pos, wlen);
        if (wlen) result.set(heap.subarray(pos, pos + wlen), rpos);
        counter += wlen >>> 4;
        rpos += wlen;
        if (wlen < len) {
          pos += wlen;
          len -= wlen;
        } else {
          pos = 0;
          len = 0;
        }
      }
      this.counter = counter;
      this.pos = pos;
      this.len = len;
      return result;
    }
    AES_GCM_Encrypt_finish() {
      let asm = this.asm;
      let heap = this.heap;
      let counter = this.counter;
      let tagSize = this.tagSize;
      let adata = this.adata;
      let pos = this.pos;
      let len = this.len;
      const result = new Uint8Array(len + tagSize);
      asm.cipher(AES_asm.ENC.CTR, AES_asm.HEAP_DATA + pos, len + 15 & -16);
      if (len) result.set(heap.subarray(pos, pos + len));
      let i = len;
      for (; i & 15; i++) heap[pos + i] = 0;
      asm.mac(AES_asm.MAC.GCM, AES_asm.HEAP_DATA + pos, i);
      const alen = adata !== undefined ? adata.length : 0;
      const clen = (counter - 1 << 4) + len;
      heap[0] = 0;
      heap[1] = 0;
      heap[2] = 0;
      heap[3] = alen >>> 29;
      heap[4] = alen >>> 21;
      heap[5] = alen >>> 13 & 255;
      heap[6] = alen >>> 5 & 255;
      heap[7] = alen << 3 & 255;
      heap[8] = heap[9] = heap[10] = 0;
      heap[11] = clen >>> 29;
      heap[12] = clen >>> 21 & 255;
      heap[13] = clen >>> 13 & 255;
      heap[14] = clen >>> 5 & 255;
      heap[15] = clen << 3 & 255;
      asm.mac(AES_asm.MAC.GCM, AES_asm.HEAP_DATA, 16);
      asm.get_iv(AES_asm.HEAP_DATA);
      asm.set_counter(0, 0, 0, this.gamma0);
      asm.cipher(AES_asm.ENC.CTR, AES_asm.HEAP_DATA, 16);
      result.set(heap.subarray(0, tagSize), len);
      this.counter = 1;
      this.pos = 0;
      this.len = 0;
      return result;
    }
    AES_GCM_Decrypt_process(data) {
      let dpos = 0;
      let dlen = data.length || 0;
      let asm = this.asm;
      let heap = this.heap;
      let counter = this.counter;
      let tagSize = this.tagSize;
      let pos = this.pos;
      let len = this.len;
      let rpos = 0;
      let rlen = len + dlen > tagSize ? len + dlen - tagSize & -16 : 0;
      let tlen = len + dlen - rlen;
      let wlen = 0;
      if ((counter - 1 << 4) + len + dlen > _AES_GCM_data_maxLength) throw new RangeError('counter overflow');
      const result = new Uint8Array(rlen);
      while (dlen > tlen) {
        wlen = _heap_write(heap, pos + len, data, dpos, dlen - tlen);
        len += wlen;
        dpos += wlen;
        dlen -= wlen;
        wlen = asm.mac(AES_asm.MAC.GCM, AES_asm.HEAP_DATA + pos, wlen);
        wlen = asm.cipher(AES_asm.DEC.CTR, AES_asm.HEAP_DATA + pos, wlen);
        if (wlen) result.set(heap.subarray(pos, pos + wlen), rpos);
        counter += wlen >>> 4;
        rpos += wlen;
        pos = 0;
        len = 0;
      }
      if (dlen > 0) {
        len += _heap_write(heap, 0, data, dpos, dlen);
      }
      this.counter = counter;
      this.pos = pos;
      this.len = len;
      return result;
    }
    AES_GCM_Decrypt_finish() {
      let asm = this.asm;
      let heap = this.heap;
      let tagSize = this.tagSize;
      let adata = this.adata;
      let counter = this.counter;
      let pos = this.pos;
      let len = this.len;
      let rlen = len - tagSize;
      if (len < tagSize) throw new IllegalStateError('authentication tag not found');
      const result = new Uint8Array(rlen);
      const atag = new Uint8Array(heap.subarray(pos + rlen, pos + len));
      let i = rlen;
      for (; i & 15; i++) heap[pos + i] = 0;
      asm.mac(AES_asm.MAC.GCM, AES_asm.HEAP_DATA + pos, i);
      asm.cipher(AES_asm.DEC.CTR, AES_asm.HEAP_DATA + pos, i);
      if (rlen) result.set(heap.subarray(pos, pos + rlen));
      const alen = adata !== undefined ? adata.length : 0;
      const clen = (counter - 1 << 4) + len - tagSize;
      heap[0] = 0;
      heap[1] = 0;
      heap[2] = 0;
      heap[3] = alen >>> 29;
      heap[4] = alen >>> 21;
      heap[5] = alen >>> 13 & 255;
      heap[6] = alen >>> 5 & 255;
      heap[7] = alen << 3 & 255;
      heap[8] = heap[9] = heap[10] = 0;
      heap[11] = clen >>> 29;
      heap[12] = clen >>> 21 & 255;
      heap[13] = clen >>> 13 & 255;
      heap[14] = clen >>> 5 & 255;
      heap[15] = clen << 3 & 255;
      asm.mac(AES_asm.MAC.GCM, AES_asm.HEAP_DATA, 16);
      asm.get_iv(AES_asm.HEAP_DATA);
      asm.set_counter(0, 0, 0, this.gamma0);
      asm.cipher(AES_asm.ENC.CTR, AES_asm.HEAP_DATA, 16);
      let acheck = 0;
      for (let i = 0; i < tagSize; ++i) acheck |= atag[i] ^ heap[i];
      if (acheck) throw new SecurityError('data integrity check failed');
      this.counter = 1;
      this.pos = 0;
      this.len = 0;
      return result;
    }
    AES_GCM_decrypt(data) {
      const result1 = this.AES_GCM_Decrypt_process(data);
      const result2 = this.AES_GCM_Decrypt_finish();
      const result = new Uint8Array(result1.length + result2.length);
      if (result1.length) result.set(result1);
      if (result2.length) result.set(result2, result1.length);
      return result;
    }
    AES_GCM_encrypt(data) {
      const result1 = this.AES_GCM_Encrypt_process(data);
      const result2 = this.AES_GCM_Encrypt_finish();
      const result = new Uint8Array(result1.length + result2.length);
      if (result1.length) result.set(result1);
      if (result2.length) result.set(result2, result1.length);
      return result;
    }
    _gcm_mac_process(data) {
      const heap = this.heap;
      const asm = this.asm;
      let dpos = 0;
      let dlen = data.length || 0;
      let wlen = 0;
      while (dlen > 0) {
        wlen = _heap_write(heap, 0, data, dpos, dlen);
        dpos += wlen;
        dlen -= wlen;
        while (wlen & 15) heap[wlen++] = 0;
        asm.mac(AES_asm.MAC.GCM, AES_asm.HEAP_DATA, wlen);
      }
    }
  }
  var bigint_asm = function (stdlib, foreign, buffer) {
    "use asm";

    var SP = 0;
    var HEAP32 = new stdlib.Uint32Array(buffer);
    var imul = stdlib.Math.imul;
    function sreset(p) {
      p = p | 0;
      SP = p = p + 31 & -32;
      return p | 0;
    }
    function salloc(l) {
      l = l | 0;
      var p = 0;
      p = SP;
      SP = p + (l + 31 & -32) | 0;
      return p | 0;
    }
    function sfree(l) {
      l = l | 0;
      SP = SP - (l + 31 & -32) | 0;
    }
    function cp(l, A, B) {
      l = l | 0;
      A = A | 0;
      B = B | 0;
      var i = 0;
      if ((A | 0) > (B | 0)) {
        for (; (i | 0) < (l | 0); i = i + 4 | 0) {
          HEAP32[B + i >> 2] = HEAP32[A + i >> 2];
        }
      } else {
        for (i = l - 4 | 0; (i | 0) >= 0; i = i - 4 | 0) {
          HEAP32[B + i >> 2] = HEAP32[A + i >> 2];
        }
      }
    }
    function z(l, z, A) {
      l = l | 0;
      z = z | 0;
      A = A | 0;
      var i = 0;
      for (; (i | 0) < (l | 0); i = i + 4 | 0) {
        HEAP32[A + i >> 2] = z;
      }
    }
    function neg(A, lA, R, lR) {
      A = A | 0;
      lA = lA | 0;
      R = R | 0;
      lR = lR | 0;
      var a = 0,
        c = 0,
        t = 0,
        r = 0,
        i = 0;
      if ((lR | 0) <= 0) lR = lA;
      if ((lR | 0) < (lA | 0)) lA = lR;
      c = 1;
      for (; (i | 0) < (lA | 0); i = i + 4 | 0) {
        a = ~HEAP32[A + i >> 2];
        t = (a & 0xffff) + c | 0;
        r = (a >>> 16) + (t >>> 16) | 0;
        HEAP32[R + i >> 2] = r << 16 | t & 0xffff;
        c = r >>> 16;
      }
      for (; (i | 0) < (lR | 0); i = i + 4 | 0) {
        HEAP32[R + i >> 2] = c - 1 | 0;
      }
      return c | 0;
    }
    function cmp(A, lA, B, lB) {
      A = A | 0;
      lA = lA | 0;
      B = B | 0;
      lB = lB | 0;
      var a = 0,
        b = 0,
        i = 0;
      if ((lA | 0) > (lB | 0)) {
        for (i = lA - 4 | 0; (i | 0) >= (lB | 0); i = i - 4 | 0) {
          if (HEAP32[A + i >> 2] | 0) return 1;
        }
      } else {
        for (i = lB - 4 | 0; (i | 0) >= (lA | 0); i = i - 4 | 0) {
          if (HEAP32[B + i >> 2] | 0) return -1;
        }
      }
      for (; (i | 0) >= 0; i = i - 4 | 0) {
        a = HEAP32[A + i >> 2] | 0, b = HEAP32[B + i >> 2] | 0;
        if (a >>> 0 < b >>> 0) return -1;
        if (a >>> 0 > b >>> 0) return 1;
      }
      return 0;
    }
    function tst(A, lA) {
      A = A | 0;
      lA = lA | 0;
      var i = 0;
      for (i = lA - 4 | 0; (i | 0) >= 0; i = i - 4 | 0) {
        if (HEAP32[A + i >> 2] | 0) return i + 4 | 0;
      }
      return 0;
    }
    function add(A, lA, B, lB, R, lR) {
      A = A | 0;
      lA = lA | 0;
      B = B | 0;
      lB = lB | 0;
      R = R | 0;
      lR = lR | 0;
      var a = 0,
        b = 0,
        c = 0,
        t = 0,
        r = 0,
        i = 0;
      if ((lA | 0) < (lB | 0)) {
        t = A, A = B, B = t;
        t = lA, lA = lB, lB = t;
      }
      if ((lR | 0) <= 0) lR = lA + 4 | 0;
      if ((lR | 0) < (lB | 0)) lA = lB = lR;
      for (; (i | 0) < (lB | 0); i = i + 4 | 0) {
        a = HEAP32[A + i >> 2] | 0;
        b = HEAP32[B + i >> 2] | 0;
        t = ((a & 0xffff) + (b & 0xffff) | 0) + c | 0;
        r = ((a >>> 16) + (b >>> 16) | 0) + (t >>> 16) | 0;
        HEAP32[R + i >> 2] = t & 0xffff | r << 16;
        c = r >>> 16;
      }
      for (; (i | 0) < (lA | 0); i = i + 4 | 0) {
        a = HEAP32[A + i >> 2] | 0;
        t = (a & 0xffff) + c | 0;
        r = (a >>> 16) + (t >>> 16) | 0;
        HEAP32[R + i >> 2] = t & 0xffff | r << 16;
        c = r >>> 16;
      }
      for (; (i | 0) < (lR | 0); i = i + 4 | 0) {
        HEAP32[R + i >> 2] = c | 0;
        c = 0;
      }
      return c | 0;
    }
    function sub(A, lA, B, lB, R, lR) {
      A = A | 0;
      lA = lA | 0;
      B = B | 0;
      lB = lB | 0;
      R = R | 0;
      lR = lR | 0;
      var a = 0,
        b = 0,
        c = 0,
        t = 0,
        r = 0,
        i = 0;
      if ((lR | 0) <= 0) lR = (lA | 0) > (lB | 0) ? lA + 4 | 0 : lB + 4 | 0;
      if ((lR | 0) < (lA | 0)) lA = lR;
      if ((lR | 0) < (lB | 0)) lB = lR;
      if ((lA | 0) < (lB | 0)) {
        for (; (i | 0) < (lA | 0); i = i + 4 | 0) {
          a = HEAP32[A + i >> 2] | 0;
          b = HEAP32[B + i >> 2] | 0;
          t = ((a & 0xffff) - (b & 0xffff) | 0) + c | 0;
          r = ((a >>> 16) - (b >>> 16) | 0) + (t >> 16) | 0;
          HEAP32[R + i >> 2] = t & 0xffff | r << 16;
          c = r >> 16;
        }
        for (; (i | 0) < (lB | 0); i = i + 4 | 0) {
          b = HEAP32[B + i >> 2] | 0;
          t = c - (b & 0xffff) | 0;
          r = (t >> 16) - (b >>> 16) | 0;
          HEAP32[R + i >> 2] = t & 0xffff | r << 16;
          c = r >> 16;
        }
      } else {
        for (; (i | 0) < (lB | 0); i = i + 4 | 0) {
          a = HEAP32[A + i >> 2] | 0;
          b = HEAP32[B + i >> 2] | 0;
          t = ((a & 0xffff) - (b & 0xffff) | 0) + c | 0;
          r = ((a >>> 16) - (b >>> 16) | 0) + (t >> 16) | 0;
          HEAP32[R + i >> 2] = t & 0xffff | r << 16;
          c = r >> 16;
        }
        for (; (i | 0) < (lA | 0); i = i + 4 | 0) {
          a = HEAP32[A + i >> 2] | 0;
          t = (a & 0xffff) + c | 0;
          r = (a >>> 16) + (t >> 16) | 0;
          HEAP32[R + i >> 2] = t & 0xffff | r << 16;
          c = r >> 16;
        }
      }
      for (; (i | 0) < (lR | 0); i = i + 4 | 0) {
        HEAP32[R + i >> 2] = c | 0;
      }
      return c | 0;
    }
    function mul(A, lA, B, lB, R, lR) {
      A = A | 0;
      lA = lA | 0;
      B = B | 0;
      lB = lB | 0;
      R = R | 0;
      lR = lR | 0;
      var al0 = 0,
        al1 = 0,
        al2 = 0,
        al3 = 0,
        al4 = 0,
        al5 = 0,
        al6 = 0,
        al7 = 0,
        ah0 = 0,
        ah1 = 0,
        ah2 = 0,
        ah3 = 0,
        ah4 = 0,
        ah5 = 0,
        ah6 = 0,
        ah7 = 0,
        bl0 = 0,
        bl1 = 0,
        bl2 = 0,
        bl3 = 0,
        bl4 = 0,
        bl5 = 0,
        bl6 = 0,
        bl7 = 0,
        bh0 = 0,
        bh1 = 0,
        bh2 = 0,
        bh3 = 0,
        bh4 = 0,
        bh5 = 0,
        bh6 = 0,
        bh7 = 0,
        r0 = 0,
        r1 = 0,
        r2 = 0,
        r3 = 0,
        r4 = 0,
        r5 = 0,
        r6 = 0,
        r7 = 0,
        r8 = 0,
        r9 = 0,
        r10 = 0,
        r11 = 0,
        r12 = 0,
        r13 = 0,
        r14 = 0,
        r15 = 0,
        u = 0,
        v = 0,
        w = 0,
        m = 0,
        i = 0,
        Ai = 0,
        j = 0,
        Bj = 0,
        Rk = 0;
      if ((lA | 0) > (lB | 0)) {
        u = A, v = lA;
        A = B, lA = lB;
        B = u, lB = v;
      }
      m = lA + lB | 0;
      if ((lR | 0) > (m | 0) | (lR | 0) <= 0) lR = m;
      if ((lR | 0) < (lA | 0)) lA = lR;
      if ((lR | 0) < (lB | 0)) lB = lR;
      for (; (i | 0) < (lA | 0); i = i + 32 | 0) {
        Ai = A + i | 0;
        ah0 = HEAP32[(Ai | 0) >> 2] | 0, ah1 = HEAP32[(Ai | 4) >> 2] | 0, ah2 = HEAP32[(Ai | 8) >> 2] | 0, ah3 = HEAP32[(Ai | 12) >> 2] | 0, ah4 = HEAP32[(Ai | 16) >> 2] | 0, ah5 = HEAP32[(Ai | 20) >> 2] | 0, ah6 = HEAP32[(Ai | 24) >> 2] | 0, ah7 = HEAP32[(Ai | 28) >> 2] | 0, al0 = ah0 & 0xffff, al1 = ah1 & 0xffff, al2 = ah2 & 0xffff, al3 = ah3 & 0xffff, al4 = ah4 & 0xffff, al5 = ah5 & 0xffff, al6 = ah6 & 0xffff, al7 = ah7 & 0xffff, ah0 = ah0 >>> 16, ah1 = ah1 >>> 16, ah2 = ah2 >>> 16, ah3 = ah3 >>> 16, ah4 = ah4 >>> 16, ah5 = ah5 >>> 16, ah6 = ah6 >>> 16, ah7 = ah7 >>> 16;
        r8 = r9 = r10 = r11 = r12 = r13 = r14 = r15 = 0;
        for (j = 0; (j | 0) < (lB | 0); j = j + 32 | 0) {
          Bj = B + j | 0;
          Rk = R + (i + j | 0) | 0;
          bh0 = HEAP32[(Bj | 0) >> 2] | 0, bh1 = HEAP32[(Bj | 4) >> 2] | 0, bh2 = HEAP32[(Bj | 8) >> 2] | 0, bh3 = HEAP32[(Bj | 12) >> 2] | 0, bh4 = HEAP32[(Bj | 16) >> 2] | 0, bh5 = HEAP32[(Bj | 20) >> 2] | 0, bh6 = HEAP32[(Bj | 24) >> 2] | 0, bh7 = HEAP32[(Bj | 28) >> 2] | 0, bl0 = bh0 & 0xffff, bl1 = bh1 & 0xffff, bl2 = bh2 & 0xffff, bl3 = bh3 & 0xffff, bl4 = bh4 & 0xffff, bl5 = bh5 & 0xffff, bl6 = bh6 & 0xffff, bl7 = bh7 & 0xffff, bh0 = bh0 >>> 16, bh1 = bh1 >>> 16, bh2 = bh2 >>> 16, bh3 = bh3 >>> 16, bh4 = bh4 >>> 16, bh5 = bh5 >>> 16, bh6 = bh6 >>> 16, bh7 = bh7 >>> 16;
          r0 = HEAP32[(Rk | 0) >> 2] | 0, r1 = HEAP32[(Rk | 4) >> 2] | 0, r2 = HEAP32[(Rk | 8) >> 2] | 0, r3 = HEAP32[(Rk | 12) >> 2] | 0, r4 = HEAP32[(Rk | 16) >> 2] | 0, r5 = HEAP32[(Rk | 20) >> 2] | 0, r6 = HEAP32[(Rk | 24) >> 2] | 0, r7 = HEAP32[(Rk | 28) >> 2] | 0;
          u = ((imul(al0, bl0) | 0) + (r8 & 0xffff) | 0) + (r0 & 0xffff) | 0;
          v = ((imul(ah0, bl0) | 0) + (r8 >>> 16) | 0) + (r0 >>> 16) | 0;
          w = ((imul(al0, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r0 = w << 16 | u & 0xffff;
          u = ((imul(al0, bl1) | 0) + (m & 0xffff) | 0) + (r1 & 0xffff) | 0;
          v = ((imul(ah0, bl1) | 0) + (m >>> 16) | 0) + (r1 >>> 16) | 0;
          w = ((imul(al0, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r1 = w << 16 | u & 0xffff;
          u = ((imul(al0, bl2) | 0) + (m & 0xffff) | 0) + (r2 & 0xffff) | 0;
          v = ((imul(ah0, bl2) | 0) + (m >>> 16) | 0) + (r2 >>> 16) | 0;
          w = ((imul(al0, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r2 = w << 16 | u & 0xffff;
          u = ((imul(al0, bl3) | 0) + (m & 0xffff) | 0) + (r3 & 0xffff) | 0;
          v = ((imul(ah0, bl3) | 0) + (m >>> 16) | 0) + (r3 >>> 16) | 0;
          w = ((imul(al0, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r3 = w << 16 | u & 0xffff;
          u = ((imul(al0, bl4) | 0) + (m & 0xffff) | 0) + (r4 & 0xffff) | 0;
          v = ((imul(ah0, bl4) | 0) + (m >>> 16) | 0) + (r4 >>> 16) | 0;
          w = ((imul(al0, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah0, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r4 = w << 16 | u & 0xffff;
          u = ((imul(al0, bl5) | 0) + (m & 0xffff) | 0) + (r5 & 0xffff) | 0;
          v = ((imul(ah0, bl5) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
          w = ((imul(al0, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah0, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r5 = w << 16 | u & 0xffff;
          u = ((imul(al0, bl6) | 0) + (m & 0xffff) | 0) + (r6 & 0xffff) | 0;
          v = ((imul(ah0, bl6) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
          w = ((imul(al0, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah0, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r6 = w << 16 | u & 0xffff;
          u = ((imul(al0, bl7) | 0) + (m & 0xffff) | 0) + (r7 & 0xffff) | 0;
          v = ((imul(ah0, bl7) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
          w = ((imul(al0, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah0, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r7 = w << 16 | u & 0xffff;
          r8 = m;
          u = ((imul(al1, bl0) | 0) + (r9 & 0xffff) | 0) + (r1 & 0xffff) | 0;
          v = ((imul(ah1, bl0) | 0) + (r9 >>> 16) | 0) + (r1 >>> 16) | 0;
          w = ((imul(al1, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r1 = w << 16 | u & 0xffff;
          u = ((imul(al1, bl1) | 0) + (m & 0xffff) | 0) + (r2 & 0xffff) | 0;
          v = ((imul(ah1, bl1) | 0) + (m >>> 16) | 0) + (r2 >>> 16) | 0;
          w = ((imul(al1, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r2 = w << 16 | u & 0xffff;
          u = ((imul(al1, bl2) | 0) + (m & 0xffff) | 0) + (r3 & 0xffff) | 0;
          v = ((imul(ah1, bl2) | 0) + (m >>> 16) | 0) + (r3 >>> 16) | 0;
          w = ((imul(al1, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r3 = w << 16 | u & 0xffff;
          u = ((imul(al1, bl3) | 0) + (m & 0xffff) | 0) + (r4 & 0xffff) | 0;
          v = ((imul(ah1, bl3) | 0) + (m >>> 16) | 0) + (r4 >>> 16) | 0;
          w = ((imul(al1, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r4 = w << 16 | u & 0xffff;
          u = ((imul(al1, bl4) | 0) + (m & 0xffff) | 0) + (r5 & 0xffff) | 0;
          v = ((imul(ah1, bl4) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
          w = ((imul(al1, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah1, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r5 = w << 16 | u & 0xffff;
          u = ((imul(al1, bl5) | 0) + (m & 0xffff) | 0) + (r6 & 0xffff) | 0;
          v = ((imul(ah1, bl5) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
          w = ((imul(al1, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah1, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r6 = w << 16 | u & 0xffff;
          u = ((imul(al1, bl6) | 0) + (m & 0xffff) | 0) + (r7 & 0xffff) | 0;
          v = ((imul(ah1, bl6) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
          w = ((imul(al1, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah1, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r7 = w << 16 | u & 0xffff;
          u = ((imul(al1, bl7) | 0) + (m & 0xffff) | 0) + (r8 & 0xffff) | 0;
          v = ((imul(ah1, bl7) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
          w = ((imul(al1, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah1, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r8 = w << 16 | u & 0xffff;
          r9 = m;
          u = ((imul(al2, bl0) | 0) + (r10 & 0xffff) | 0) + (r2 & 0xffff) | 0;
          v = ((imul(ah2, bl0) | 0) + (r10 >>> 16) | 0) + (r2 >>> 16) | 0;
          w = ((imul(al2, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r2 = w << 16 | u & 0xffff;
          u = ((imul(al2, bl1) | 0) + (m & 0xffff) | 0) + (r3 & 0xffff) | 0;
          v = ((imul(ah2, bl1) | 0) + (m >>> 16) | 0) + (r3 >>> 16) | 0;
          w = ((imul(al2, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r3 = w << 16 | u & 0xffff;
          u = ((imul(al2, bl2) | 0) + (m & 0xffff) | 0) + (r4 & 0xffff) | 0;
          v = ((imul(ah2, bl2) | 0) + (m >>> 16) | 0) + (r4 >>> 16) | 0;
          w = ((imul(al2, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r4 = w << 16 | u & 0xffff;
          u = ((imul(al2, bl3) | 0) + (m & 0xffff) | 0) + (r5 & 0xffff) | 0;
          v = ((imul(ah2, bl3) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
          w = ((imul(al2, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r5 = w << 16 | u & 0xffff;
          u = ((imul(al2, bl4) | 0) + (m & 0xffff) | 0) + (r6 & 0xffff) | 0;
          v = ((imul(ah2, bl4) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
          w = ((imul(al2, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah2, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r6 = w << 16 | u & 0xffff;
          u = ((imul(al2, bl5) | 0) + (m & 0xffff) | 0) + (r7 & 0xffff) | 0;
          v = ((imul(ah2, bl5) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
          w = ((imul(al2, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah2, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r7 = w << 16 | u & 0xffff;
          u = ((imul(al2, bl6) | 0) + (m & 0xffff) | 0) + (r8 & 0xffff) | 0;
          v = ((imul(ah2, bl6) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
          w = ((imul(al2, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah2, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r8 = w << 16 | u & 0xffff;
          u = ((imul(al2, bl7) | 0) + (m & 0xffff) | 0) + (r9 & 0xffff) | 0;
          v = ((imul(ah2, bl7) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
          w = ((imul(al2, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah2, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r9 = w << 16 | u & 0xffff;
          r10 = m;
          u = ((imul(al3, bl0) | 0) + (r11 & 0xffff) | 0) + (r3 & 0xffff) | 0;
          v = ((imul(ah3, bl0) | 0) + (r11 >>> 16) | 0) + (r3 >>> 16) | 0;
          w = ((imul(al3, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r3 = w << 16 | u & 0xffff;
          u = ((imul(al3, bl1) | 0) + (m & 0xffff) | 0) + (r4 & 0xffff) | 0;
          v = ((imul(ah3, bl1) | 0) + (m >>> 16) | 0) + (r4 >>> 16) | 0;
          w = ((imul(al3, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r4 = w << 16 | u & 0xffff;
          u = ((imul(al3, bl2) | 0) + (m & 0xffff) | 0) + (r5 & 0xffff) | 0;
          v = ((imul(ah3, bl2) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
          w = ((imul(al3, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r5 = w << 16 | u & 0xffff;
          u = ((imul(al3, bl3) | 0) + (m & 0xffff) | 0) + (r6 & 0xffff) | 0;
          v = ((imul(ah3, bl3) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
          w = ((imul(al3, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r6 = w << 16 | u & 0xffff;
          u = ((imul(al3, bl4) | 0) + (m & 0xffff) | 0) + (r7 & 0xffff) | 0;
          v = ((imul(ah3, bl4) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
          w = ((imul(al3, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah3, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r7 = w << 16 | u & 0xffff;
          u = ((imul(al3, bl5) | 0) + (m & 0xffff) | 0) + (r8 & 0xffff) | 0;
          v = ((imul(ah3, bl5) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
          w = ((imul(al3, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah3, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r8 = w << 16 | u & 0xffff;
          u = ((imul(al3, bl6) | 0) + (m & 0xffff) | 0) + (r9 & 0xffff) | 0;
          v = ((imul(ah3, bl6) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
          w = ((imul(al3, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah3, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r9 = w << 16 | u & 0xffff;
          u = ((imul(al3, bl7) | 0) + (m & 0xffff) | 0) + (r10 & 0xffff) | 0;
          v = ((imul(ah3, bl7) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
          w = ((imul(al3, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah3, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r10 = w << 16 | u & 0xffff;
          r11 = m;
          u = ((imul(al4, bl0) | 0) + (r12 & 0xffff) | 0) + (r4 & 0xffff) | 0;
          v = ((imul(ah4, bl0) | 0) + (r12 >>> 16) | 0) + (r4 >>> 16) | 0;
          w = ((imul(al4, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah4, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r4 = w << 16 | u & 0xffff;
          u = ((imul(al4, bl1) | 0) + (m & 0xffff) | 0) + (r5 & 0xffff) | 0;
          v = ((imul(ah4, bl1) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
          w = ((imul(al4, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah4, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r5 = w << 16 | u & 0xffff;
          u = ((imul(al4, bl2) | 0) + (m & 0xffff) | 0) + (r6 & 0xffff) | 0;
          v = ((imul(ah4, bl2) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
          w = ((imul(al4, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah4, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r6 = w << 16 | u & 0xffff;
          u = ((imul(al4, bl3) | 0) + (m & 0xffff) | 0) + (r7 & 0xffff) | 0;
          v = ((imul(ah4, bl3) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
          w = ((imul(al4, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah4, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r7 = w << 16 | u & 0xffff;
          u = ((imul(al4, bl4) | 0) + (m & 0xffff) | 0) + (r8 & 0xffff) | 0;
          v = ((imul(ah4, bl4) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
          w = ((imul(al4, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah4, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r8 = w << 16 | u & 0xffff;
          u = ((imul(al4, bl5) | 0) + (m & 0xffff) | 0) + (r9 & 0xffff) | 0;
          v = ((imul(ah4, bl5) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
          w = ((imul(al4, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah4, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r9 = w << 16 | u & 0xffff;
          u = ((imul(al4, bl6) | 0) + (m & 0xffff) | 0) + (r10 & 0xffff) | 0;
          v = ((imul(ah4, bl6) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
          w = ((imul(al4, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah4, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r10 = w << 16 | u & 0xffff;
          u = ((imul(al4, bl7) | 0) + (m & 0xffff) | 0) + (r11 & 0xffff) | 0;
          v = ((imul(ah4, bl7) | 0) + (m >>> 16) | 0) + (r11 >>> 16) | 0;
          w = ((imul(al4, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah4, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r11 = w << 16 | u & 0xffff;
          r12 = m;
          u = ((imul(al5, bl0) | 0) + (r13 & 0xffff) | 0) + (r5 & 0xffff) | 0;
          v = ((imul(ah5, bl0) | 0) + (r13 >>> 16) | 0) + (r5 >>> 16) | 0;
          w = ((imul(al5, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah5, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r5 = w << 16 | u & 0xffff;
          u = ((imul(al5, bl1) | 0) + (m & 0xffff) | 0) + (r6 & 0xffff) | 0;
          v = ((imul(ah5, bl1) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
          w = ((imul(al5, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah5, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r6 = w << 16 | u & 0xffff;
          u = ((imul(al5, bl2) | 0) + (m & 0xffff) | 0) + (r7 & 0xffff) | 0;
          v = ((imul(ah5, bl2) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
          w = ((imul(al5, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah5, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r7 = w << 16 | u & 0xffff;
          u = ((imul(al5, bl3) | 0) + (m & 0xffff) | 0) + (r8 & 0xffff) | 0;
          v = ((imul(ah5, bl3) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
          w = ((imul(al5, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah5, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r8 = w << 16 | u & 0xffff;
          u = ((imul(al5, bl4) | 0) + (m & 0xffff) | 0) + (r9 & 0xffff) | 0;
          v = ((imul(ah5, bl4) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
          w = ((imul(al5, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah5, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r9 = w << 16 | u & 0xffff;
          u = ((imul(al5, bl5) | 0) + (m & 0xffff) | 0) + (r10 & 0xffff) | 0;
          v = ((imul(ah5, bl5) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
          w = ((imul(al5, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah5, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r10 = w << 16 | u & 0xffff;
          u = ((imul(al5, bl6) | 0) + (m & 0xffff) | 0) + (r11 & 0xffff) | 0;
          v = ((imul(ah5, bl6) | 0) + (m >>> 16) | 0) + (r11 >>> 16) | 0;
          w = ((imul(al5, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah5, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r11 = w << 16 | u & 0xffff;
          u = ((imul(al5, bl7) | 0) + (m & 0xffff) | 0) + (r12 & 0xffff) | 0;
          v = ((imul(ah5, bl7) | 0) + (m >>> 16) | 0) + (r12 >>> 16) | 0;
          w = ((imul(al5, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah5, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r12 = w << 16 | u & 0xffff;
          r13 = m;
          u = ((imul(al6, bl0) | 0) + (r14 & 0xffff) | 0) + (r6 & 0xffff) | 0;
          v = ((imul(ah6, bl0) | 0) + (r14 >>> 16) | 0) + (r6 >>> 16) | 0;
          w = ((imul(al6, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah6, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r6 = w << 16 | u & 0xffff;
          u = ((imul(al6, bl1) | 0) + (m & 0xffff) | 0) + (r7 & 0xffff) | 0;
          v = ((imul(ah6, bl1) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
          w = ((imul(al6, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah6, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r7 = w << 16 | u & 0xffff;
          u = ((imul(al6, bl2) | 0) + (m & 0xffff) | 0) + (r8 & 0xffff) | 0;
          v = ((imul(ah6, bl2) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
          w = ((imul(al6, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah6, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r8 = w << 16 | u & 0xffff;
          u = ((imul(al6, bl3) | 0) + (m & 0xffff) | 0) + (r9 & 0xffff) | 0;
          v = ((imul(ah6, bl3) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
          w = ((imul(al6, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah6, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r9 = w << 16 | u & 0xffff;
          u = ((imul(al6, bl4) | 0) + (m & 0xffff) | 0) + (r10 & 0xffff) | 0;
          v = ((imul(ah6, bl4) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
          w = ((imul(al6, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah6, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r10 = w << 16 | u & 0xffff;
          u = ((imul(al6, bl5) | 0) + (m & 0xffff) | 0) + (r11 & 0xffff) | 0;
          v = ((imul(ah6, bl5) | 0) + (m >>> 16) | 0) + (r11 >>> 16) | 0;
          w = ((imul(al6, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah6, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r11 = w << 16 | u & 0xffff;
          u = ((imul(al6, bl6) | 0) + (m & 0xffff) | 0) + (r12 & 0xffff) | 0;
          v = ((imul(ah6, bl6) | 0) + (m >>> 16) | 0) + (r12 >>> 16) | 0;
          w = ((imul(al6, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah6, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r12 = w << 16 | u & 0xffff;
          u = ((imul(al6, bl7) | 0) + (m & 0xffff) | 0) + (r13 & 0xffff) | 0;
          v = ((imul(ah6, bl7) | 0) + (m >>> 16) | 0) + (r13 >>> 16) | 0;
          w = ((imul(al6, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah6, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r13 = w << 16 | u & 0xffff;
          r14 = m;
          u = ((imul(al7, bl0) | 0) + (r15 & 0xffff) | 0) + (r7 & 0xffff) | 0;
          v = ((imul(ah7, bl0) | 0) + (r15 >>> 16) | 0) + (r7 >>> 16) | 0;
          w = ((imul(al7, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah7, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r7 = w << 16 | u & 0xffff;
          u = ((imul(al7, bl1) | 0) + (m & 0xffff) | 0) + (r8 & 0xffff) | 0;
          v = ((imul(ah7, bl1) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
          w = ((imul(al7, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah7, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r8 = w << 16 | u & 0xffff;
          u = ((imul(al7, bl2) | 0) + (m & 0xffff) | 0) + (r9 & 0xffff) | 0;
          v = ((imul(ah7, bl2) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
          w = ((imul(al7, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah7, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r9 = w << 16 | u & 0xffff;
          u = ((imul(al7, bl3) | 0) + (m & 0xffff) | 0) + (r10 & 0xffff) | 0;
          v = ((imul(ah7, bl3) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
          w = ((imul(al7, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah7, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r10 = w << 16 | u & 0xffff;
          u = ((imul(al7, bl4) | 0) + (m & 0xffff) | 0) + (r11 & 0xffff) | 0;
          v = ((imul(ah7, bl4) | 0) + (m >>> 16) | 0) + (r11 >>> 16) | 0;
          w = ((imul(al7, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah7, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r11 = w << 16 | u & 0xffff;
          u = ((imul(al7, bl5) | 0) + (m & 0xffff) | 0) + (r12 & 0xffff) | 0;
          v = ((imul(ah7, bl5) | 0) + (m >>> 16) | 0) + (r12 >>> 16) | 0;
          w = ((imul(al7, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah7, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r12 = w << 16 | u & 0xffff;
          u = ((imul(al7, bl6) | 0) + (m & 0xffff) | 0) + (r13 & 0xffff) | 0;
          v = ((imul(ah7, bl6) | 0) + (m >>> 16) | 0) + (r13 >>> 16) | 0;
          w = ((imul(al7, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah7, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r13 = w << 16 | u & 0xffff;
          u = ((imul(al7, bl7) | 0) + (m & 0xffff) | 0) + (r14 & 0xffff) | 0;
          v = ((imul(ah7, bl7) | 0) + (m >>> 16) | 0) + (r14 >>> 16) | 0;
          w = ((imul(al7, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
          m = ((imul(ah7, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
          r14 = w << 16 | u & 0xffff;
          r15 = m;
          HEAP32[(Rk | 0) >> 2] = r0, HEAP32[(Rk | 4) >> 2] = r1, HEAP32[(Rk | 8) >> 2] = r2, HEAP32[(Rk | 12) >> 2] = r3, HEAP32[(Rk | 16) >> 2] = r4, HEAP32[(Rk | 20) >> 2] = r5, HEAP32[(Rk | 24) >> 2] = r6, HEAP32[(Rk | 28) >> 2] = r7;
        }
        Rk = R + (i + j | 0) | 0;
        HEAP32[(Rk | 0) >> 2] = r8, HEAP32[(Rk | 4) >> 2] = r9, HEAP32[(Rk | 8) >> 2] = r10, HEAP32[(Rk | 12) >> 2] = r11, HEAP32[(Rk | 16) >> 2] = r12, HEAP32[(Rk | 20) >> 2] = r13, HEAP32[(Rk | 24) >> 2] = r14, HEAP32[(Rk | 28) >> 2] = r15;
      }
    }
    function sqr(A, lA, R) {
      A = A | 0;
      lA = lA | 0;
      R = R | 0;
      var al0 = 0,
        al1 = 0,
        al2 = 0,
        al3 = 0,
        al4 = 0,
        al5 = 0,
        al6 = 0,
        al7 = 0,
        ah0 = 0,
        ah1 = 0,
        ah2 = 0,
        ah3 = 0,
        ah4 = 0,
        ah5 = 0,
        ah6 = 0,
        ah7 = 0,
        bl0 = 0,
        bl1 = 0,
        bl2 = 0,
        bl3 = 0,
        bl4 = 0,
        bl5 = 0,
        bl6 = 0,
        bl7 = 0,
        bh0 = 0,
        bh1 = 0,
        bh2 = 0,
        bh3 = 0,
        bh4 = 0,
        bh5 = 0,
        bh6 = 0,
        bh7 = 0,
        r0 = 0,
        r1 = 0,
        r2 = 0,
        r3 = 0,
        r4 = 0,
        r5 = 0,
        r6 = 0,
        r7 = 0,
        r8 = 0,
        r9 = 0,
        r10 = 0,
        r11 = 0,
        r12 = 0,
        r13 = 0,
        r14 = 0,
        r15 = 0,
        u = 0,
        v = 0,
        w = 0,
        c = 0,
        h = 0,
        m = 0,
        r = 0,
        d = 0,
        dd = 0,
        p = 0,
        i = 0,
        j = 0,
        k = 0,
        Ai = 0,
        Aj = 0,
        Rk = 0;
      for (; (i | 0) < (lA | 0); i = i + 4 | 0) {
        Rk = R + (i << 1) | 0;
        ah0 = HEAP32[A + i >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16;
        u = imul(al0, al0) | 0;
        v = (imul(al0, ah0) | 0) + (u >>> 17) | 0;
        w = (imul(ah0, ah0) | 0) + (v >>> 15) | 0;
        HEAP32[Rk >> 2] = v << 17 | u & 0x1ffff;
        HEAP32[(Rk | 4) >> 2] = w;
      }
      for (p = 0; (p | 0) < (lA | 0); p = p + 8 | 0) {
        Ai = A + p | 0, Rk = R + (p << 1) | 0;
        ah0 = HEAP32[Ai >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16;
        bh0 = HEAP32[(Ai | 4) >> 2] | 0, bl0 = bh0 & 0xffff, bh0 = bh0 >>> 16;
        u = imul(al0, bl0) | 0;
        v = (imul(al0, bh0) | 0) + (u >>> 16) | 0;
        w = (imul(ah0, bl0) | 0) + (v & 0xffff) | 0;
        m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r = HEAP32[(Rk | 4) >> 2] | 0;
        u = (r & 0xffff) + ((u & 0xffff) << 1) | 0;
        w = ((r >>> 16) + ((w & 0xffff) << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 4) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[(Rk | 8) >> 2] | 0;
        u = ((r & 0xffff) + ((m & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (m >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 8) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        if (c) {
          r = HEAP32[(Rk | 12) >> 2] | 0;
          u = (r & 0xffff) + c | 0;
          w = (r >>> 16) + (u >>> 16) | 0;
          HEAP32[(Rk | 12) >> 2] = w << 16 | u & 0xffff;
        }
      }
      for (p = 0; (p | 0) < (lA | 0); p = p + 16 | 0) {
        Ai = A + p | 0, Rk = R + (p << 1) | 0;
        ah0 = HEAP32[Ai >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16, ah1 = HEAP32[(Ai | 4) >> 2] | 0, al1 = ah1 & 0xffff, ah1 = ah1 >>> 16;
        bh0 = HEAP32[(Ai | 8) >> 2] | 0, bl0 = bh0 & 0xffff, bh0 = bh0 >>> 16, bh1 = HEAP32[(Ai | 12) >> 2] | 0, bl1 = bh1 & 0xffff, bh1 = bh1 >>> 16;
        u = imul(al0, bl0) | 0;
        v = imul(ah0, bl0) | 0;
        w = ((imul(al0, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r0 = w << 16 | u & 0xffff;
        u = (imul(al0, bl1) | 0) + (m & 0xffff) | 0;
        v = (imul(ah0, bl1) | 0) + (m >>> 16) | 0;
        w = ((imul(al0, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r1 = w << 16 | u & 0xffff;
        r2 = m;
        u = (imul(al1, bl0) | 0) + (r1 & 0xffff) | 0;
        v = (imul(ah1, bl0) | 0) + (r1 >>> 16) | 0;
        w = ((imul(al1, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r1 = w << 16 | u & 0xffff;
        u = ((imul(al1, bl1) | 0) + (r2 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah1, bl1) | 0) + (r2 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al1, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r2 = w << 16 | u & 0xffff;
        r3 = m;
        r = HEAP32[(Rk | 8) >> 2] | 0;
        u = (r & 0xffff) + ((r0 & 0xffff) << 1) | 0;
        w = ((r >>> 16) + (r0 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 8) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[(Rk | 12) >> 2] | 0;
        u = ((r & 0xffff) + ((r1 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r1 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 12) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[(Rk | 16) >> 2] | 0;
        u = ((r & 0xffff) + ((r2 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r2 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 16) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[(Rk | 20) >> 2] | 0;
        u = ((r & 0xffff) + ((r3 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r3 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 20) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        for (k = 24; !!c & (k | 0) < 32; k = k + 4 | 0) {
          r = HEAP32[(Rk | k) >> 2] | 0;
          u = (r & 0xffff) + c | 0;
          w = (r >>> 16) + (u >>> 16) | 0;
          HEAP32[(Rk | k) >> 2] = w << 16 | u & 0xffff;
          c = w >>> 16;
        }
      }
      for (p = 0; (p | 0) < (lA | 0); p = p + 32 | 0) {
        Ai = A + p | 0, Rk = R + (p << 1) | 0;
        ah0 = HEAP32[Ai >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16, ah1 = HEAP32[(Ai | 4) >> 2] | 0, al1 = ah1 & 0xffff, ah1 = ah1 >>> 16, ah2 = HEAP32[(Ai | 8) >> 2] | 0, al2 = ah2 & 0xffff, ah2 = ah2 >>> 16, ah3 = HEAP32[(Ai | 12) >> 2] | 0, al3 = ah3 & 0xffff, ah3 = ah3 >>> 16;
        bh0 = HEAP32[(Ai | 16) >> 2] | 0, bl0 = bh0 & 0xffff, bh0 = bh0 >>> 16, bh1 = HEAP32[(Ai | 20) >> 2] | 0, bl1 = bh1 & 0xffff, bh1 = bh1 >>> 16, bh2 = HEAP32[(Ai | 24) >> 2] | 0, bl2 = bh2 & 0xffff, bh2 = bh2 >>> 16, bh3 = HEAP32[(Ai | 28) >> 2] | 0, bl3 = bh3 & 0xffff, bh3 = bh3 >>> 16;
        u = imul(al0, bl0) | 0;
        v = imul(ah0, bl0) | 0;
        w = ((imul(al0, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r0 = w << 16 | u & 0xffff;
        u = (imul(al0, bl1) | 0) + (m & 0xffff) | 0;
        v = (imul(ah0, bl1) | 0) + (m >>> 16) | 0;
        w = ((imul(al0, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r1 = w << 16 | u & 0xffff;
        u = (imul(al0, bl2) | 0) + (m & 0xffff) | 0;
        v = (imul(ah0, bl2) | 0) + (m >>> 16) | 0;
        w = ((imul(al0, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r2 = w << 16 | u & 0xffff;
        u = (imul(al0, bl3) | 0) + (m & 0xffff) | 0;
        v = (imul(ah0, bl3) | 0) + (m >>> 16) | 0;
        w = ((imul(al0, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r3 = w << 16 | u & 0xffff;
        r4 = m;
        u = (imul(al1, bl0) | 0) + (r1 & 0xffff) | 0;
        v = (imul(ah1, bl0) | 0) + (r1 >>> 16) | 0;
        w = ((imul(al1, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r1 = w << 16 | u & 0xffff;
        u = ((imul(al1, bl1) | 0) + (r2 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah1, bl1) | 0) + (r2 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al1, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r2 = w << 16 | u & 0xffff;
        u = ((imul(al1, bl2) | 0) + (r3 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah1, bl2) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al1, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r3 = w << 16 | u & 0xffff;
        u = ((imul(al1, bl3) | 0) + (r4 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah1, bl3) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al1, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r4 = w << 16 | u & 0xffff;
        r5 = m;
        u = (imul(al2, bl0) | 0) + (r2 & 0xffff) | 0;
        v = (imul(ah2, bl0) | 0) + (r2 >>> 16) | 0;
        w = ((imul(al2, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r2 = w << 16 | u & 0xffff;
        u = ((imul(al2, bl1) | 0) + (r3 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah2, bl1) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al2, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r3 = w << 16 | u & 0xffff;
        u = ((imul(al2, bl2) | 0) + (r4 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah2, bl2) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al2, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r4 = w << 16 | u & 0xffff;
        u = ((imul(al2, bl3) | 0) + (r5 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah2, bl3) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al2, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r5 = w << 16 | u & 0xffff;
        r6 = m;
        u = (imul(al3, bl0) | 0) + (r3 & 0xffff) | 0;
        v = (imul(ah3, bl0) | 0) + (r3 >>> 16) | 0;
        w = ((imul(al3, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r3 = w << 16 | u & 0xffff;
        u = ((imul(al3, bl1) | 0) + (r4 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah3, bl1) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al3, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r4 = w << 16 | u & 0xffff;
        u = ((imul(al3, bl2) | 0) + (r5 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah3, bl2) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al3, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r5 = w << 16 | u & 0xffff;
        u = ((imul(al3, bl3) | 0) + (r6 & 0xffff) | 0) + (m & 0xffff) | 0;
        v = ((imul(ah3, bl3) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
        w = ((imul(al3, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
        m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
        r6 = w << 16 | u & 0xffff;
        r7 = m;
        r = HEAP32[(Rk | 16) >> 2] | 0;
        u = (r & 0xffff) + ((r0 & 0xffff) << 1) | 0;
        w = ((r >>> 16) + (r0 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 16) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[(Rk | 20) >> 2] | 0;
        u = ((r & 0xffff) + ((r1 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r1 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 20) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[(Rk | 24) >> 2] | 0;
        u = ((r & 0xffff) + ((r2 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r2 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 24) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[(Rk | 28) >> 2] | 0;
        u = ((r & 0xffff) + ((r3 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r3 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[(Rk | 28) >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[Rk + 32 >> 2] | 0;
        u = ((r & 0xffff) + ((r4 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r4 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[Rk + 32 >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[Rk + 36 >> 2] | 0;
        u = ((r & 0xffff) + ((r5 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r5 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[Rk + 36 >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[Rk + 40 >> 2] | 0;
        u = ((r & 0xffff) + ((r6 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r6 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[Rk + 40 >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        r = HEAP32[Rk + 44 >> 2] | 0;
        u = ((r & 0xffff) + ((r7 & 0xffff) << 1) | 0) + c | 0;
        w = ((r >>> 16) + (r7 >>> 16 << 1) | 0) + (u >>> 16) | 0;
        HEAP32[Rk + 44 >> 2] = w << 16 | u & 0xffff;
        c = w >>> 16;
        for (k = 48; !!c & (k | 0) < 64; k = k + 4 | 0) {
          r = HEAP32[Rk + k >> 2] | 0;
          u = (r & 0xffff) + c | 0;
          w = (r >>> 16) + (u >>> 16) | 0;
          HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
          c = w >>> 16;
        }
      }
      for (d = 32; (d | 0) < (lA | 0); d = d << 1) {
        dd = d << 1;
        for (p = 0; (p | 0) < (lA | 0); p = p + dd | 0) {
          Rk = R + (p << 1) | 0;
          h = 0;
          for (i = 0; (i | 0) < (d | 0); i = i + 32 | 0) {
            Ai = (A + p | 0) + i | 0;
            ah0 = HEAP32[Ai >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16, ah1 = HEAP32[(Ai | 4) >> 2] | 0, al1 = ah1 & 0xffff, ah1 = ah1 >>> 16, ah2 = HEAP32[(Ai | 8) >> 2] | 0, al2 = ah2 & 0xffff, ah2 = ah2 >>> 16, ah3 = HEAP32[(Ai | 12) >> 2] | 0, al3 = ah3 & 0xffff, ah3 = ah3 >>> 16, ah4 = HEAP32[(Ai | 16) >> 2] | 0, al4 = ah4 & 0xffff, ah4 = ah4 >>> 16, ah5 = HEAP32[(Ai | 20) >> 2] | 0, al5 = ah5 & 0xffff, ah5 = ah5 >>> 16, ah6 = HEAP32[(Ai | 24) >> 2] | 0, al6 = ah6 & 0xffff, ah6 = ah6 >>> 16, ah7 = HEAP32[(Ai | 28) >> 2] | 0, al7 = ah7 & 0xffff, ah7 = ah7 >>> 16;
            r8 = r9 = r10 = r11 = r12 = r13 = r14 = r15 = c = 0;
            for (j = 0; (j | 0) < (d | 0); j = j + 32 | 0) {
              Aj = ((A + p | 0) + d | 0) + j | 0;
              bh0 = HEAP32[Aj >> 2] | 0, bl0 = bh0 & 0xffff, bh0 = bh0 >>> 16, bh1 = HEAP32[(Aj | 4) >> 2] | 0, bl1 = bh1 & 0xffff, bh1 = bh1 >>> 16, bh2 = HEAP32[(Aj | 8) >> 2] | 0, bl2 = bh2 & 0xffff, bh2 = bh2 >>> 16, bh3 = HEAP32[(Aj | 12) >> 2] | 0, bl3 = bh3 & 0xffff, bh3 = bh3 >>> 16, bh4 = HEAP32[(Aj | 16) >> 2] | 0, bl4 = bh4 & 0xffff, bh4 = bh4 >>> 16, bh5 = HEAP32[(Aj | 20) >> 2] | 0, bl5 = bh5 & 0xffff, bh5 = bh5 >>> 16, bh6 = HEAP32[(Aj | 24) >> 2] | 0, bl6 = bh6 & 0xffff, bh6 = bh6 >>> 16, bh7 = HEAP32[(Aj | 28) >> 2] | 0, bl7 = bh7 & 0xffff, bh7 = bh7 >>> 16;
              r0 = r1 = r2 = r3 = r4 = r5 = r6 = r7 = 0;
              u = ((imul(al0, bl0) | 0) + (r0 & 0xffff) | 0) + (r8 & 0xffff) | 0;
              v = ((imul(ah0, bl0) | 0) + (r0 >>> 16) | 0) + (r8 >>> 16) | 0;
              w = ((imul(al0, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r0 = w << 16 | u & 0xffff;
              u = ((imul(al0, bl1) | 0) + (r1 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah0, bl1) | 0) + (r1 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al0, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r1 = w << 16 | u & 0xffff;
              u = ((imul(al0, bl2) | 0) + (r2 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah0, bl2) | 0) + (r2 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al0, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r2 = w << 16 | u & 0xffff;
              u = ((imul(al0, bl3) | 0) + (r3 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah0, bl3) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al0, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r3 = w << 16 | u & 0xffff;
              u = ((imul(al0, bl4) | 0) + (r4 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah0, bl4) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al0, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah0, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r4 = w << 16 | u & 0xffff;
              u = ((imul(al0, bl5) | 0) + (r5 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah0, bl5) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al0, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah0, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r5 = w << 16 | u & 0xffff;
              u = ((imul(al0, bl6) | 0) + (r6 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah0, bl6) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al0, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah0, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r6 = w << 16 | u & 0xffff;
              u = ((imul(al0, bl7) | 0) + (r7 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah0, bl7) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al0, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah0, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r7 = w << 16 | u & 0xffff;
              r8 = m;
              u = ((imul(al1, bl0) | 0) + (r1 & 0xffff) | 0) + (r9 & 0xffff) | 0;
              v = ((imul(ah1, bl0) | 0) + (r1 >>> 16) | 0) + (r9 >>> 16) | 0;
              w = ((imul(al1, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r1 = w << 16 | u & 0xffff;
              u = ((imul(al1, bl1) | 0) + (r2 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah1, bl1) | 0) + (r2 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al1, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r2 = w << 16 | u & 0xffff;
              u = ((imul(al1, bl2) | 0) + (r3 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah1, bl2) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al1, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r3 = w << 16 | u & 0xffff;
              u = ((imul(al1, bl3) | 0) + (r4 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah1, bl3) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al1, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r4 = w << 16 | u & 0xffff;
              u = ((imul(al1, bl4) | 0) + (r5 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah1, bl4) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al1, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah1, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r5 = w << 16 | u & 0xffff;
              u = ((imul(al1, bl5) | 0) + (r6 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah1, bl5) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al1, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah1, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r6 = w << 16 | u & 0xffff;
              u = ((imul(al1, bl6) | 0) + (r7 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah1, bl6) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al1, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah1, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r7 = w << 16 | u & 0xffff;
              u = ((imul(al1, bl7) | 0) + (r8 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah1, bl7) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al1, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah1, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r8 = w << 16 | u & 0xffff;
              r9 = m;
              u = ((imul(al2, bl0) | 0) + (r2 & 0xffff) | 0) + (r10 & 0xffff) | 0;
              v = ((imul(ah2, bl0) | 0) + (r2 >>> 16) | 0) + (r10 >>> 16) | 0;
              w = ((imul(al2, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r2 = w << 16 | u & 0xffff;
              u = ((imul(al2, bl1) | 0) + (r3 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah2, bl1) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al2, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r3 = w << 16 | u & 0xffff;
              u = ((imul(al2, bl2) | 0) + (r4 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah2, bl2) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al2, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r4 = w << 16 | u & 0xffff;
              u = ((imul(al2, bl3) | 0) + (r5 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah2, bl3) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al2, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r5 = w << 16 | u & 0xffff;
              u = ((imul(al2, bl4) | 0) + (r6 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah2, bl4) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al2, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah2, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r6 = w << 16 | u & 0xffff;
              u = ((imul(al2, bl5) | 0) + (r7 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah2, bl5) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al2, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah2, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r7 = w << 16 | u & 0xffff;
              u = ((imul(al2, bl6) | 0) + (r8 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah2, bl6) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al2, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah2, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r8 = w << 16 | u & 0xffff;
              u = ((imul(al2, bl7) | 0) + (r9 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah2, bl7) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al2, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah2, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r9 = w << 16 | u & 0xffff;
              r10 = m;
              u = ((imul(al3, bl0) | 0) + (r3 & 0xffff) | 0) + (r11 & 0xffff) | 0;
              v = ((imul(ah3, bl0) | 0) + (r3 >>> 16) | 0) + (r11 >>> 16) | 0;
              w = ((imul(al3, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r3 = w << 16 | u & 0xffff;
              u = ((imul(al3, bl1) | 0) + (r4 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah3, bl1) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al3, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r4 = w << 16 | u & 0xffff;
              u = ((imul(al3, bl2) | 0) + (r5 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah3, bl2) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al3, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r5 = w << 16 | u & 0xffff;
              u = ((imul(al3, bl3) | 0) + (r6 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah3, bl3) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al3, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r6 = w << 16 | u & 0xffff;
              u = ((imul(al3, bl4) | 0) + (r7 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah3, bl4) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al3, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah3, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r7 = w << 16 | u & 0xffff;
              u = ((imul(al3, bl5) | 0) + (r8 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah3, bl5) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al3, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah3, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r8 = w << 16 | u & 0xffff;
              u = ((imul(al3, bl6) | 0) + (r9 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah3, bl6) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al3, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah3, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r9 = w << 16 | u & 0xffff;
              u = ((imul(al3, bl7) | 0) + (r10 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah3, bl7) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al3, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah3, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r10 = w << 16 | u & 0xffff;
              r11 = m;
              u = ((imul(al4, bl0) | 0) + (r4 & 0xffff) | 0) + (r12 & 0xffff) | 0;
              v = ((imul(ah4, bl0) | 0) + (r4 >>> 16) | 0) + (r12 >>> 16) | 0;
              w = ((imul(al4, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah4, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r4 = w << 16 | u & 0xffff;
              u = ((imul(al4, bl1) | 0) + (r5 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah4, bl1) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al4, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah4, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r5 = w << 16 | u & 0xffff;
              u = ((imul(al4, bl2) | 0) + (r6 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah4, bl2) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al4, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah4, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r6 = w << 16 | u & 0xffff;
              u = ((imul(al4, bl3) | 0) + (r7 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah4, bl3) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al4, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah4, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r7 = w << 16 | u & 0xffff;
              u = ((imul(al4, bl4) | 0) + (r8 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah4, bl4) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al4, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah4, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r8 = w << 16 | u & 0xffff;
              u = ((imul(al4, bl5) | 0) + (r9 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah4, bl5) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al4, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah4, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r9 = w << 16 | u & 0xffff;
              u = ((imul(al4, bl6) | 0) + (r10 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah4, bl6) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al4, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah4, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r10 = w << 16 | u & 0xffff;
              u = ((imul(al4, bl7) | 0) + (r11 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah4, bl7) | 0) + (r11 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al4, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah4, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r11 = w << 16 | u & 0xffff;
              r12 = m;
              u = ((imul(al5, bl0) | 0) + (r5 & 0xffff) | 0) + (r13 & 0xffff) | 0;
              v = ((imul(ah5, bl0) | 0) + (r5 >>> 16) | 0) + (r13 >>> 16) | 0;
              w = ((imul(al5, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah5, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r5 = w << 16 | u & 0xffff;
              u = ((imul(al5, bl1) | 0) + (r6 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah5, bl1) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al5, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah5, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r6 = w << 16 | u & 0xffff;
              u = ((imul(al5, bl2) | 0) + (r7 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah5, bl2) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al5, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah5, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r7 = w << 16 | u & 0xffff;
              u = ((imul(al5, bl3) | 0) + (r8 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah5, bl3) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al5, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah5, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r8 = w << 16 | u & 0xffff;
              u = ((imul(al5, bl4) | 0) + (r9 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah5, bl4) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al5, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah5, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r9 = w << 16 | u & 0xffff;
              u = ((imul(al5, bl5) | 0) + (r10 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah5, bl5) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al5, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah5, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r10 = w << 16 | u & 0xffff;
              u = ((imul(al5, bl6) | 0) + (r11 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah5, bl6) | 0) + (r11 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al5, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah5, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r11 = w << 16 | u & 0xffff;
              u = ((imul(al5, bl7) | 0) + (r12 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah5, bl7) | 0) + (r12 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al5, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah5, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r12 = w << 16 | u & 0xffff;
              r13 = m;
              u = ((imul(al6, bl0) | 0) + (r6 & 0xffff) | 0) + (r14 & 0xffff) | 0;
              v = ((imul(ah6, bl0) | 0) + (r6 >>> 16) | 0) + (r14 >>> 16) | 0;
              w = ((imul(al6, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah6, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r6 = w << 16 | u & 0xffff;
              u = ((imul(al6, bl1) | 0) + (r7 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah6, bl1) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al6, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah6, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r7 = w << 16 | u & 0xffff;
              u = ((imul(al6, bl2) | 0) + (r8 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah6, bl2) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al6, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah6, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r8 = w << 16 | u & 0xffff;
              u = ((imul(al6, bl3) | 0) + (r9 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah6, bl3) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al6, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah6, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r9 = w << 16 | u & 0xffff;
              u = ((imul(al6, bl4) | 0) + (r10 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah6, bl4) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al6, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah6, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r10 = w << 16 | u & 0xffff;
              u = ((imul(al6, bl5) | 0) + (r11 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah6, bl5) | 0) + (r11 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al6, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah6, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r11 = w << 16 | u & 0xffff;
              u = ((imul(al6, bl6) | 0) + (r12 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah6, bl6) | 0) + (r12 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al6, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah6, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r12 = w << 16 | u & 0xffff;
              u = ((imul(al6, bl7) | 0) + (r13 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah6, bl7) | 0) + (r13 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al6, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah6, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r13 = w << 16 | u & 0xffff;
              r14 = m;
              u = ((imul(al7, bl0) | 0) + (r7 & 0xffff) | 0) + (r15 & 0xffff) | 0;
              v = ((imul(ah7, bl0) | 0) + (r7 >>> 16) | 0) + (r15 >>> 16) | 0;
              w = ((imul(al7, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah7, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r7 = w << 16 | u & 0xffff;
              u = ((imul(al7, bl1) | 0) + (r8 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah7, bl1) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al7, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah7, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r8 = w << 16 | u & 0xffff;
              u = ((imul(al7, bl2) | 0) + (r9 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah7, bl2) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al7, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah7, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r9 = w << 16 | u & 0xffff;
              u = ((imul(al7, bl3) | 0) + (r10 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah7, bl3) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al7, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah7, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r10 = w << 16 | u & 0xffff;
              u = ((imul(al7, bl4) | 0) + (r11 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah7, bl4) | 0) + (r11 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al7, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah7, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r11 = w << 16 | u & 0xffff;
              u = ((imul(al7, bl5) | 0) + (r12 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah7, bl5) | 0) + (r12 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al7, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah7, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r12 = w << 16 | u & 0xffff;
              u = ((imul(al7, bl6) | 0) + (r13 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah7, bl6) | 0) + (r13 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al7, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah7, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r13 = w << 16 | u & 0xffff;
              u = ((imul(al7, bl7) | 0) + (r14 & 0xffff) | 0) + (m & 0xffff) | 0;
              v = ((imul(ah7, bl7) | 0) + (r14 >>> 16) | 0) + (m >>> 16) | 0;
              w = ((imul(al7, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
              m = ((imul(ah7, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
              r14 = w << 16 | u & 0xffff;
              r15 = m;
              k = d + (i + j | 0) | 0;
              r = HEAP32[Rk + k >> 2] | 0;
              u = ((r & 0xffff) + ((r0 & 0xffff) << 1) | 0) + c | 0;
              w = ((r >>> 16) + (r0 >>> 16 << 1) | 0) + (u >>> 16) | 0;
              HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
              c = w >>> 16;
              k = k + 4 | 0;
              r = HEAP32[Rk + k >> 2] | 0;
              u = ((r & 0xffff) + ((r1 & 0xffff) << 1) | 0) + c | 0;
              w = ((r >>> 16) + (r1 >>> 16 << 1) | 0) + (u >>> 16) | 0;
              HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
              c = w >>> 16;
              k = k + 4 | 0;
              r = HEAP32[Rk + k >> 2] | 0;
              u = ((r & 0xffff) + ((r2 & 0xffff) << 1) | 0) + c | 0;
              w = ((r >>> 16) + (r2 >>> 16 << 1) | 0) + (u >>> 16) | 0;
              HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
              c = w >>> 16;
              k = k + 4 | 0;
              r = HEAP32[Rk + k >> 2] | 0;
              u = ((r & 0xffff) + ((r3 & 0xffff) << 1) | 0) + c | 0;
              w = ((r >>> 16) + (r3 >>> 16 << 1) | 0) + (u >>> 16) | 0;
              HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
              c = w >>> 16;
              k = k + 4 | 0;
              r = HEAP32[Rk + k >> 2] | 0;
              u = ((r & 0xffff) + ((r4 & 0xffff) << 1) | 0) + c | 0;
              w = ((r >>> 16) + (r4 >>> 16 << 1) | 0) + (u >>> 16) | 0;
              HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
              c = w >>> 16;
              k = k + 4 | 0;
              r = HEAP32[Rk + k >> 2] | 0;
              u = ((r & 0xffff) + ((r5 & 0xffff) << 1) | 0) + c | 0;
              w = ((r >>> 16) + (r5 >>> 16 << 1) | 0) + (u >>> 16) | 0;
              HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
              c = w >>> 16;
              k = k + 4 | 0;
              r = HEAP32[Rk + k >> 2] | 0;
              u = ((r & 0xffff) + ((r6 & 0xffff) << 1) | 0) + c | 0;
              w = ((r >>> 16) + (r6 >>> 16 << 1) | 0) + (u >>> 16) | 0;
              HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
              c = w >>> 16;
              k = k + 4 | 0;
              r = HEAP32[Rk + k >> 2] | 0;
              u = ((r & 0xffff) + ((r7 & 0xffff) << 1) | 0) + c | 0;
              w = ((r >>> 16) + (r7 >>> 16 << 1) | 0) + (u >>> 16) | 0;
              HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
              c = w >>> 16;
            }
            k = d + (i + j | 0) | 0;
            r = HEAP32[Rk + k >> 2] | 0;
            u = (((r & 0xffff) + ((r8 & 0xffff) << 1) | 0) + c | 0) + h | 0;
            w = ((r >>> 16) + (r8 >>> 16 << 1) | 0) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            c = w >>> 16;
            k = k + 4 | 0;
            r = HEAP32[Rk + k >> 2] | 0;
            u = ((r & 0xffff) + ((r9 & 0xffff) << 1) | 0) + c | 0;
            w = ((r >>> 16) + (r9 >>> 16 << 1) | 0) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            c = w >>> 16;
            k = k + 4 | 0;
            r = HEAP32[Rk + k >> 2] | 0;
            u = ((r & 0xffff) + ((r10 & 0xffff) << 1) | 0) + c | 0;
            w = ((r >>> 16) + (r10 >>> 16 << 1) | 0) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            c = w >>> 16;
            k = k + 4 | 0;
            r = HEAP32[Rk + k >> 2] | 0;
            u = ((r & 0xffff) + ((r11 & 0xffff) << 1) | 0) + c | 0;
            w = ((r >>> 16) + (r11 >>> 16 << 1) | 0) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            c = w >>> 16;
            k = k + 4 | 0;
            r = HEAP32[Rk + k >> 2] | 0;
            u = ((r & 0xffff) + ((r12 & 0xffff) << 1) | 0) + c | 0;
            w = ((r >>> 16) + (r12 >>> 16 << 1) | 0) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            c = w >>> 16;
            k = k + 4 | 0;
            r = HEAP32[Rk + k >> 2] | 0;
            u = ((r & 0xffff) + ((r13 & 0xffff) << 1) | 0) + c | 0;
            w = ((r >>> 16) + (r13 >>> 16 << 1) | 0) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            c = w >>> 16;
            k = k + 4 | 0;
            r = HEAP32[Rk + k >> 2] | 0;
            u = ((r & 0xffff) + ((r14 & 0xffff) << 1) | 0) + c | 0;
            w = ((r >>> 16) + (r14 >>> 16 << 1) | 0) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            c = w >>> 16;
            k = k + 4 | 0;
            r = HEAP32[Rk + k >> 2] | 0;
            u = ((r & 0xffff) + ((r15 & 0xffff) << 1) | 0) + c | 0;
            w = ((r >>> 16) + (r15 >>> 16 << 1) | 0) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            h = w >>> 16;
          }
          for (k = k + 4 | 0; !!h & (k | 0) < dd << 1; k = k + 4 | 0) {
            r = HEAP32[Rk + k >> 2] | 0;
            u = (r & 0xffff) + h | 0;
            w = (r >>> 16) + (u >>> 16) | 0;
            HEAP32[Rk + k >> 2] = w << 16 | u & 0xffff;
            h = w >>> 16;
          }
        }
      }
    }
    function div(N, lN, D, lD, Q) {
      N = N | 0;
      lN = lN | 0;
      D = D | 0;
      lD = lD | 0;
      Q = Q | 0;
      var n = 0,
        d = 0,
        e = 0,
        u1 = 0,
        u0 = 0,
        v0 = 0,
        vh = 0,
        vl = 0,
        qh = 0,
        ql = 0,
        rh = 0,
        rl = 0,
        t1 = 0,
        t2 = 0,
        m = 0,
        c = 0,
        i = 0,
        j = 0,
        k = 0;
      for (i = lN - 1 & -4; (i | 0) >= 0; i = i - 4 | 0) {
        n = HEAP32[N + i >> 2] | 0;
        if (n) {
          lN = i;
          break;
        }
      }
      for (i = lD - 1 & -4; (i | 0) >= 0; i = i - 4 | 0) {
        d = HEAP32[D + i >> 2] | 0;
        if (d) {
          lD = i;
          break;
        }
      }
      while ((d & 0x80000000) == 0) {
        d = d << 1;
        e = e + 1 | 0;
      }
      u0 = HEAP32[N + lN >> 2] | 0;
      if (e) {
        u1 = u0 >>> (32 - e | 0);
        for (i = lN - 4 | 0; (i | 0) >= 0; i = i - 4 | 0) {
          n = HEAP32[N + i >> 2] | 0;
          HEAP32[N + i + 4 >> 2] = u0 << e | (e ? n >>> (32 - e | 0) : 0);
          u0 = n;
        }
        HEAP32[N >> 2] = u0 << e;
      }
      if (e) {
        v0 = HEAP32[D + lD >> 2] | 0;
        for (i = lD - 4 | 0; (i | 0) >= 0; i = i - 4 | 0) {
          d = HEAP32[D + i >> 2] | 0;
          HEAP32[D + i + 4 >> 2] = v0 << e | d >>> (32 - e | 0);
          v0 = d;
        }
        HEAP32[D >> 2] = v0 << e;
      }
      v0 = HEAP32[D + lD >> 2] | 0;
      vh = v0 >>> 16, vl = v0 & 0xffff;
      for (i = lN; (i | 0) >= (lD | 0); i = i - 4 | 0) {
        j = i - lD | 0;
        u0 = HEAP32[N + i >> 2] | 0;
        qh = (u1 >>> 0) / (vh >>> 0) | 0, rh = (u1 >>> 0) % (vh >>> 0) | 0, t1 = imul(qh, vl) | 0;
        while ((qh | 0) == 0x10000 | t1 >>> 0 > (rh << 16 | u0 >>> 16) >>> 0) {
          qh = qh - 1 | 0, rh = rh + vh | 0, t1 = t1 - vl | 0;
          if ((rh | 0) >= 0x10000) break;
        }
        m = 0, c = 0;
        for (k = 0; (k | 0) <= (lD | 0); k = k + 4 | 0) {
          d = HEAP32[D + k >> 2] | 0;
          t1 = (imul(qh, d & 0xffff) | 0) + (m >>> 16) | 0;
          t2 = (imul(qh, d >>> 16) | 0) + (t1 >>> 16) | 0;
          d = m & 0xffff | t1 << 16;
          m = t2;
          n = HEAP32[N + j + k >> 2] | 0;
          t1 = ((n & 0xffff) - (d & 0xffff) | 0) + c | 0;
          t2 = ((n >>> 16) - (d >>> 16) | 0) + (t1 >> 16) | 0;
          HEAP32[N + j + k >> 2] = t2 << 16 | t1 & 0xffff;
          c = t2 >> 16;
        }
        t1 = ((u1 & 0xffff) - (m & 0xffff) | 0) + c | 0;
        t2 = ((u1 >>> 16) - (m >>> 16) | 0) + (t1 >> 16) | 0;
        u1 = t2 << 16 | t1 & 0xffff;
        c = t2 >> 16;
        if (c) {
          qh = qh - 1 | 0;
          c = 0;
          for (k = 0; (k | 0) <= (lD | 0); k = k + 4 | 0) {
            d = HEAP32[D + k >> 2] | 0;
            n = HEAP32[N + j + k >> 2] | 0;
            t1 = (n & 0xffff) + c | 0;
            t2 = (n >>> 16) + d + (t1 >>> 16) | 0;
            HEAP32[N + j + k >> 2] = t2 << 16 | t1 & 0xffff;
            c = t2 >>> 16;
          }
          u1 = u1 + c | 0;
        }
        u0 = HEAP32[N + i >> 2] | 0;
        n = u1 << 16 | u0 >>> 16;
        ql = (n >>> 0) / (vh >>> 0) | 0, rl = (n >>> 0) % (vh >>> 0) | 0, t1 = imul(ql, vl) | 0;
        while ((ql | 0) == 0x10000 | t1 >>> 0 > (rl << 16 | u0 & 0xffff) >>> 0) {
          ql = ql - 1 | 0, rl = rl + vh | 0, t1 = t1 - vl | 0;
          if ((rl | 0) >= 0x10000) break;
        }
        m = 0, c = 0;
        for (k = 0; (k | 0) <= (lD | 0); k = k + 4 | 0) {
          d = HEAP32[D + k >> 2] | 0;
          t1 = (imul(ql, d & 0xffff) | 0) + (m & 0xffff) | 0;
          t2 = ((imul(ql, d >>> 16) | 0) + (t1 >>> 16) | 0) + (m >>> 16) | 0;
          d = t1 & 0xffff | t2 << 16;
          m = t2 >>> 16;
          n = HEAP32[N + j + k >> 2] | 0;
          t1 = ((n & 0xffff) - (d & 0xffff) | 0) + c | 0;
          t2 = ((n >>> 16) - (d >>> 16) | 0) + (t1 >> 16) | 0;
          c = t2 >> 16;
          HEAP32[N + j + k >> 2] = t2 << 16 | t1 & 0xffff;
        }
        t1 = ((u1 & 0xffff) - (m & 0xffff) | 0) + c | 0;
        t2 = ((u1 >>> 16) - (m >>> 16) | 0) + (t1 >> 16) | 0;
        c = t2 >> 16;
        if (c) {
          ql = ql - 1 | 0;
          c = 0;
          for (k = 0; (k | 0) <= (lD | 0); k = k + 4 | 0) {
            d = HEAP32[D + k >> 2] | 0;
            n = HEAP32[N + j + k >> 2] | 0;
            t1 = ((n & 0xffff) + (d & 0xffff) | 0) + c | 0;
            t2 = ((n >>> 16) + (d >>> 16) | 0) + (t1 >>> 16) | 0;
            c = t2 >>> 16;
            HEAP32[N + j + k >> 2] = t1 & 0xffff | t2 << 16;
          }
        }
        HEAP32[Q + j >> 2] = qh << 16 | ql;
        u1 = HEAP32[N + i >> 2] | 0;
      }
      if (e) {
        u0 = HEAP32[N >> 2] | 0;
        for (i = 4; (i | 0) <= (lD | 0); i = i + 4 | 0) {
          n = HEAP32[N + i >> 2] | 0;
          HEAP32[N + i - 4 >> 2] = n << (32 - e | 0) | u0 >>> e;
          u0 = n;
        }
        HEAP32[N + lD >> 2] = u0 >>> e;
      }
    }
    function mredc(A, lA, N, lN, y, R) {
      A = A | 0;
      lA = lA | 0;
      N = N | 0;
      lN = lN | 0;
      y = y | 0;
      R = R | 0;
      var T = 0,
        c = 0,
        uh = 0,
        ul = 0,
        vl = 0,
        vh = 0,
        w0 = 0,
        w1 = 0,
        w2 = 0,
        r0 = 0,
        r1 = 0,
        i = 0,
        j = 0,
        k = 0;
      T = salloc(lN << 1) | 0;
      z(lN << 1, 0, T);
      cp(lA, A, T);
      for (i = 0; (i | 0) < (lN | 0); i = i + 4 | 0) {
        uh = HEAP32[T + i >> 2] | 0, ul = uh & 0xffff, uh = uh >>> 16;
        vh = y >>> 16, vl = y & 0xffff;
        w0 = imul(ul, vl) | 0, w1 = ((imul(ul, vh) | 0) + (imul(uh, vl) | 0) | 0) + (w0 >>> 16) | 0;
        ul = w0 & 0xffff, uh = w1 & 0xffff;
        r1 = 0;
        for (j = 0; (j | 0) < (lN | 0); j = j + 4 | 0) {
          k = i + j | 0;
          vh = HEAP32[N + j >> 2] | 0, vl = vh & 0xffff, vh = vh >>> 16;
          r0 = HEAP32[T + k >> 2] | 0;
          w0 = ((imul(ul, vl) | 0) + (r1 & 0xffff) | 0) + (r0 & 0xffff) | 0;
          w1 = ((imul(ul, vh) | 0) + (r1 >>> 16) | 0) + (r0 >>> 16) | 0;
          w2 = ((imul(uh, vl) | 0) + (w1 & 0xffff) | 0) + (w0 >>> 16) | 0;
          r1 = ((imul(uh, vh) | 0) + (w2 >>> 16) | 0) + (w1 >>> 16) | 0;
          r0 = w2 << 16 | w0 & 0xffff;
          HEAP32[T + k >> 2] = r0;
        }
        k = i + j | 0;
        r0 = HEAP32[T + k >> 2] | 0;
        w0 = ((r0 & 0xffff) + (r1 & 0xffff) | 0) + c | 0;
        w1 = ((r0 >>> 16) + (r1 >>> 16) | 0) + (w0 >>> 16) | 0;
        HEAP32[T + k >> 2] = w1 << 16 | w0 & 0xffff;
        c = w1 >>> 16;
      }
      cp(lN, T + lN | 0, R);
      sfree(lN << 1);
      if (c | (cmp(N, lN, R, lN) | 0) <= 0) {
        sub(R, lN, N, lN, R, lN) | 0;
      }
    }
    return {
      sreset: sreset,
      salloc: salloc,
      sfree: sfree,
      z: z,
      tst: tst,
      neg: neg,
      cmp: cmp,
      add: add,
      sub: sub,
      mul: mul,
      sqr: sqr,
      div: div,
      mredc: mredc
    };
  };
  function Number_extGCD(a, b) {
    var sa = a < 0 ? -1 : 1,
      sb = b < 0 ? -1 : 1,
      xi = 1,
      xj = 0,
      yi = 0,
      yj = 1,
      r,
      q,
      t,
      a_cmp_b;
    a *= sa;
    b *= sb;
    a_cmp_b = a < b;
    if (a_cmp_b) {
      t = a;
      a = b, b = t;
      t = sa;
      sa = sb;
      sb = t;
    }
    q = Math.floor(a / b), r = a - q * b;
    while (r) {
      t = xi - q * xj, xi = xj, xj = t;
      t = yi - q * yj, yi = yj, yj = t;
      a = b, b = r;
      q = Math.floor(a / b), r = a - q * b;
    }
    xj *= sa;
    yj *= sb;
    if (a_cmp_b) {
      t = xj;
      xj = yj, yj = t;
    }
    return {
      gcd: b,
      x: xj,
      y: yj
    };
  }
  function BigNumber_extGCD(a, b) {
    let sa = a.sign;
    let sb = b.sign;
    if (sa < 0) a = a.negate();
    if (sb < 0) b = b.negate();
    const a_cmp_b = a.compare(b);
    if (a_cmp_b < 0) {
      let t = a;
      a = b, b = t;
      let t2 = sa;
      sa = sb;
      sb = t2;
    }
    var xi = BigNumber.ONE,
      xj = BigNumber.ZERO,
      lx = b.bitLength,
      yi = BigNumber.ZERO,
      yj = BigNumber.ONE,
      ly = a.bitLength,
      z,
      r,
      q;
    z = a.divide(b);
    while ((r = z.remainder) !== BigNumber.ZERO) {
      q = z.quotient;
      z = xi.subtract(q.multiply(xj).clamp(lx)).clamp(lx), xi = xj, xj = z;
      z = yi.subtract(q.multiply(yj).clamp(ly)).clamp(ly), yi = yj, yj = z;
      a = b, b = r;
      z = a.divide(b);
    }
    if (sa < 0) xj = xj.negate();
    if (sb < 0) yj = yj.negate();
    if (a_cmp_b < 0) {
      let t = xj;
      xj = yj, yj = t;
    }
    return {
      gcd: b,
      x: xj,
      y: yj
    };
  }
  function getRandomValues(buf) {
    if (typeof process !== 'undefined') {
      const nodeCrypto = require('crypto');
      const bytes = nodeCrypto.randomBytes(buf.length);
      buf.set(bytes);
      return;
    }
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(buf);
      return;
    }
    if (self.crypto && self.crypto.getRandomValues) {
      self.crypto.getRandomValues(buf);
      return;
    }
    if (window.msCrypto && window.msCrypto.getRandomValues) {
      window.msCrypto.getRandomValues(buf);
      return;
    }
    throw new Error('No secure random number generator available.');
  }
  const _bigint_stdlib = {
    Uint32Array: Uint32Array,
    Math: Math
  };
  const _bigint_heap = new Uint32Array(0x100000);
  let _bigint_asm;
  function _half_imul(a, b) {
    return a * b | 0;
  }
  if (_bigint_stdlib.Math.imul === undefined) {
    _bigint_stdlib.Math.imul = _half_imul;
    _bigint_asm = bigint_asm(_bigint_stdlib, null, _bigint_heap.buffer);
    delete _bigint_stdlib.Math.imul;
  } else {
    _bigint_asm = bigint_asm(_bigint_stdlib, null, _bigint_heap.buffer);
  }
  const _BigNumber_ZERO_limbs = new Uint32Array(0);
  class BigNumber {
    constructor(num) {
      let limbs = _BigNumber_ZERO_limbs;
      let bitlen = 0;
      let sign = 0;
      if (num === undefined) ;else {
        for (var i = 0; !num[i]; i++);
        bitlen = (num.length - i) * 8;
        if (!bitlen) return BigNumber.ZERO;
        limbs = new Uint32Array(bitlen + 31 >> 5);
        for (var j = num.length - 4; j >= i; j -= 4) {
          limbs[num.length - 4 - j >> 2] = num[j] << 24 | num[j + 1] << 16 | num[j + 2] << 8 | num[j + 3];
        }
        if (i - j === 3) {
          limbs[limbs.length - 1] = num[i];
        } else if (i - j === 2) {
          limbs[limbs.length - 1] = num[i] << 8 | num[i + 1];
        } else if (i - j === 1) {
          limbs[limbs.length - 1] = num[i] << 16 | num[i + 1] << 8 | num[i + 2];
        }
        sign = 1;
      }
      this.limbs = limbs;
      this.bitLength = bitlen;
      this.sign = sign;
    }
    static fromString(str) {
      const bytes = string_to_bytes(str);
      return new BigNumber(bytes);
    }
    static fromNumber(num) {
      let limbs = _BigNumber_ZERO_limbs;
      let bitlen = 0;
      let sign = 0;
      var absnum = Math.abs(num);
      if (absnum > 0xffffffff) {
        limbs = new Uint32Array(2);
        limbs[0] = absnum | 0;
        limbs[1] = absnum / 0x100000000 | 0;
        bitlen = 52;
      } else if (absnum > 0) {
        limbs = new Uint32Array(1);
        limbs[0] = absnum;
        bitlen = 32;
      } else {
        limbs = _BigNumber_ZERO_limbs;
        bitlen = 0;
      }
      sign = num < 0 ? -1 : 1;
      return BigNumber.fromConfig({
        limbs,
        bitLength: bitlen,
        sign
      });
    }
    static fromArrayBuffer(buffer) {
      return new BigNumber(new Uint8Array(buffer));
    }
    static fromConfig(obj) {
      const bn = new BigNumber();
      bn.limbs = new Uint32Array(obj.limbs);
      bn.bitLength = obj.bitLength;
      bn.sign = obj.sign;
      return bn;
    }
    toString(radix) {
      radix = radix || 16;
      const limbs = this.limbs;
      const bitlen = this.bitLength;
      let str = '';
      if (radix === 16) {
        for (var i = (bitlen + 31 >> 5) - 1; i >= 0; i--) {
          var h = limbs[i].toString(16);
          str += '00000000'.substr(h.length);
          str += h;
        }
        str = str.replace(/^0+/, '');
        if (!str.length) str = '0';
      } else {
        throw new IllegalArgumentError('bad radix');
      }
      if (this.sign < 0) str = '-' + str;
      return str;
    }
    toBytes() {
      const bitlen = this.bitLength;
      const limbs = this.limbs;
      if (bitlen === 0) return new Uint8Array(0);
      const bytelen = bitlen + 7 >> 3;
      const bytes = new Uint8Array(bytelen);
      for (let i = 0; i < bytelen; i++) {
        let j = bytelen - i - 1;
        bytes[i] = limbs[j >> 2] >> ((j & 3) << 3);
      }
      return bytes;
    }
    valueOf() {
      const limbs = this.limbs;
      const bits = this.bitLength;
      const sign = this.sign;
      if (!sign) return 0;
      if (bits <= 32) return sign * (limbs[0] >>> 0);
      if (bits <= 52) return sign * (0x100000000 * (limbs[1] >>> 0) + (limbs[0] >>> 0));
      let i,
        l,
        e = 0;
      for (i = limbs.length - 1; i >= 0; i--) {
        if ((l = limbs[i]) === 0) continue;
        while ((l << e & 0x80000000) === 0) e++;
        break;
      }
      if (i === 0) return sign * (limbs[0] >>> 0);
      return sign * (0x100000 * ((limbs[i] << e | (e ? limbs[i - 1] >>> 32 - e : 0)) >>> 0) + ((limbs[i - 1] << e | (e && i > 1 ? limbs[i - 2] >>> 32 - e : 0)) >>> 12)) * Math.pow(2, 32 * i - e - 52);
    }
    clamp(b) {
      const limbs = this.limbs;
      const bitlen = this.bitLength;
      if (b >= bitlen) return this;
      const clamped = new BigNumber();
      let n = b + 31 >> 5;
      let k = b % 32;
      clamped.limbs = new Uint32Array(limbs.subarray(0, n));
      clamped.bitLength = b;
      clamped.sign = this.sign;
      if (k) clamped.limbs[n - 1] &= -1 >>> 32 - k;
      return clamped;
    }
    slice(f, b) {
      const limbs = this.limbs;
      const bitlen = this.bitLength;
      if (f < 0) throw new RangeError('TODO');
      if (f >= bitlen) return BigNumber.ZERO;
      if (b === undefined || b > bitlen - f) b = bitlen - f;
      const sliced = new BigNumber();
      let n = f >> 5;
      let m = f + b + 31 >> 5;
      let l = b + 31 >> 5;
      let t = f % 32;
      let k = b % 32;
      const slimbs = new Uint32Array(l);
      if (t) {
        for (var i = 0; i < m - n - 1; i++) {
          slimbs[i] = limbs[n + i] >>> t | limbs[n + i + 1] << 32 - t;
        }
        slimbs[i] = limbs[n + i] >>> t;
      } else {
        slimbs.set(limbs.subarray(n, m));
      }
      if (k) {
        slimbs[l - 1] &= -1 >>> 32 - k;
      }
      sliced.limbs = slimbs;
      sliced.bitLength = b;
      sliced.sign = this.sign;
      return sliced;
    }
    negate() {
      const negative = new BigNumber();
      negative.limbs = this.limbs;
      negative.bitLength = this.bitLength;
      negative.sign = -1 * this.sign;
      return negative;
    }
    compare(that) {
      var alimbs = this.limbs,
        alimbcnt = alimbs.length,
        blimbs = that.limbs,
        blimbcnt = blimbs.length,
        z = 0;
      if (this.sign < that.sign) return -1;
      if (this.sign > that.sign) return 1;
      _bigint_heap.set(alimbs, 0);
      _bigint_heap.set(blimbs, alimbcnt);
      z = _bigint_asm.cmp(0, alimbcnt << 2, alimbcnt << 2, blimbcnt << 2);
      return z * this.sign;
    }
    add(that) {
      if (!this.sign) return that;
      if (!that.sign) return this;
      var abitlen = this.bitLength,
        alimbs = this.limbs,
        alimbcnt = alimbs.length,
        asign = this.sign,
        bbitlen = that.bitLength,
        blimbs = that.limbs,
        blimbcnt = blimbs.length,
        bsign = that.sign,
        rbitlen,
        rlimbcnt,
        rsign,
        rof,
        result = new BigNumber();
      rbitlen = (abitlen > bbitlen ? abitlen : bbitlen) + (asign * bsign > 0 ? 1 : 0);
      rlimbcnt = rbitlen + 31 >> 5;
      _bigint_asm.sreset();
      var pA = _bigint_asm.salloc(alimbcnt << 2),
        pB = _bigint_asm.salloc(blimbcnt << 2),
        pR = _bigint_asm.salloc(rlimbcnt << 2);
      _bigint_asm.z(pR - pA + (rlimbcnt << 2), 0, pA);
      _bigint_heap.set(alimbs, pA >> 2);
      _bigint_heap.set(blimbs, pB >> 2);
      if (asign * bsign > 0) {
        _bigint_asm.add(pA, alimbcnt << 2, pB, blimbcnt << 2, pR, rlimbcnt << 2);
        rsign = asign;
      } else if (asign > bsign) {
        rof = _bigint_asm.sub(pA, alimbcnt << 2, pB, blimbcnt << 2, pR, rlimbcnt << 2);
        rsign = rof ? bsign : asign;
      } else {
        rof = _bigint_asm.sub(pB, blimbcnt << 2, pA, alimbcnt << 2, pR, rlimbcnt << 2);
        rsign = rof ? asign : bsign;
      }
      if (rof) _bigint_asm.neg(pR, rlimbcnt << 2, pR, rlimbcnt << 2);
      if (_bigint_asm.tst(pR, rlimbcnt << 2) === 0) return BigNumber.ZERO;
      result.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + rlimbcnt));
      result.bitLength = rbitlen;
      result.sign = rsign;
      return result;
    }
    subtract(that) {
      return this.add(that.negate());
    }
    square() {
      if (!this.sign) return BigNumber.ZERO;
      var abitlen = this.bitLength,
        alimbs = this.limbs,
        alimbcnt = alimbs.length,
        rbitlen,
        rlimbcnt,
        result = new BigNumber();
      rbitlen = abitlen << 1;
      rlimbcnt = rbitlen + 31 >> 5;
      _bigint_asm.sreset();
      var pA = _bigint_asm.salloc(alimbcnt << 2),
        pR = _bigint_asm.salloc(rlimbcnt << 2);
      _bigint_asm.z(pR - pA + (rlimbcnt << 2), 0, pA);
      _bigint_heap.set(alimbs, pA >> 2);
      _bigint_asm.sqr(pA, alimbcnt << 2, pR);
      result.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + rlimbcnt));
      result.bitLength = rbitlen;
      result.sign = 1;
      return result;
    }
    divide(that) {
      var abitlen = this.bitLength,
        alimbs = this.limbs,
        alimbcnt = alimbs.length,
        bbitlen = that.bitLength,
        blimbs = that.limbs,
        blimbcnt = blimbs.length,
        qlimbcnt,
        rlimbcnt,
        quotient = BigNumber.ZERO,
        remainder = BigNumber.ZERO;
      _bigint_asm.sreset();
      var pA = _bigint_asm.salloc(alimbcnt << 2),
        pB = _bigint_asm.salloc(blimbcnt << 2),
        pQ = _bigint_asm.salloc(alimbcnt << 2);
      _bigint_asm.z(pQ - pA + (alimbcnt << 2), 0, pA);
      _bigint_heap.set(alimbs, pA >> 2);
      _bigint_heap.set(blimbs, pB >> 2);
      _bigint_asm.div(pA, alimbcnt << 2, pB, blimbcnt << 2, pQ);
      qlimbcnt = _bigint_asm.tst(pQ, alimbcnt << 2) >> 2;
      if (qlimbcnt) {
        quotient = new BigNumber();
        quotient.limbs = new Uint32Array(_bigint_heap.subarray(pQ >> 2, (pQ >> 2) + qlimbcnt));
        quotient.bitLength = abitlen < qlimbcnt << 5 ? abitlen : qlimbcnt << 5;
        quotient.sign = this.sign * that.sign;
      }
      rlimbcnt = _bigint_asm.tst(pA, blimbcnt << 2) >> 2;
      if (rlimbcnt) {
        remainder = new BigNumber();
        remainder.limbs = new Uint32Array(_bigint_heap.subarray(pA >> 2, (pA >> 2) + rlimbcnt));
        remainder.bitLength = bbitlen < rlimbcnt << 5 ? bbitlen : rlimbcnt << 5;
        remainder.sign = this.sign;
      }
      return {
        quotient: quotient,
        remainder: remainder
      };
    }
    multiply(that) {
      if (!this.sign || !that.sign) return BigNumber.ZERO;
      var abitlen = this.bitLength,
        alimbs = this.limbs,
        alimbcnt = alimbs.length,
        bbitlen = that.bitLength,
        blimbs = that.limbs,
        blimbcnt = blimbs.length,
        rbitlen,
        rlimbcnt,
        result = new BigNumber();
      rbitlen = abitlen + bbitlen;
      rlimbcnt = rbitlen + 31 >> 5;
      _bigint_asm.sreset();
      var pA = _bigint_asm.salloc(alimbcnt << 2),
        pB = _bigint_asm.salloc(blimbcnt << 2),
        pR = _bigint_asm.salloc(rlimbcnt << 2);
      _bigint_asm.z(pR - pA + (rlimbcnt << 2), 0, pA);
      _bigint_heap.set(alimbs, pA >> 2);
      _bigint_heap.set(blimbs, pB >> 2);
      _bigint_asm.mul(pA, alimbcnt << 2, pB, blimbcnt << 2, pR, rlimbcnt << 2);
      result.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + rlimbcnt));
      result.sign = this.sign * that.sign;
      result.bitLength = rbitlen;
      return result;
    }
    isMillerRabinProbablePrime(rounds) {
      var t = BigNumber.fromConfig(this),
        s = 0;
      t.limbs[0] -= 1;
      while (t.limbs[s >> 5] === 0) s += 32;
      while ((t.limbs[s >> 5] >> (s & 31) & 1) === 0) s++;
      t = t.slice(s);
      var m = new Modulus(this),
        m1 = this.subtract(BigNumber.ONE),
        a = BigNumber.fromConfig(this),
        l = this.limbs.length - 1;
      while (a.limbs[l] === 0) l--;
      while (--rounds >= 0) {
        getRandomValues(a.limbs);
        if (a.limbs[0] < 2) a.limbs[0] += 2;
        while (a.compare(m1) >= 0) a.limbs[l] >>>= 1;
        var x = m.power(a, t);
        if (x.compare(BigNumber.ONE) === 0) continue;
        if (x.compare(m1) === 0) continue;
        var c = s;
        while (--c > 0) {
          x = x.square().divide(m).remainder;
          if (x.compare(BigNumber.ONE) === 0) return false;
          if (x.compare(m1) === 0) break;
        }
        if (c === 0) return false;
      }
      return true;
    }
    isProbablePrime(paranoia = 80) {
      var limbs = this.limbs;
      var i = 0;
      if ((limbs[0] & 1) === 0) return false;
      if (paranoia <= 1) return true;
      var s3 = 0,
        s5 = 0,
        s17 = 0;
      for (i = 0; i < limbs.length; i++) {
        var l3 = limbs[i];
        while (l3) {
          s3 += l3 & 3;
          l3 >>>= 2;
        }
        var l5 = limbs[i];
        while (l5) {
          s5 += l5 & 3;
          l5 >>>= 2;
          s5 -= l5 & 3;
          l5 >>>= 2;
        }
        var l17 = limbs[i];
        while (l17) {
          s17 += l17 & 15;
          l17 >>>= 4;
          s17 -= l17 & 15;
          l17 >>>= 4;
        }
      }
      if (!(s3 % 3) || !(s5 % 5) || !(s17 % 17)) return false;
      if (paranoia <= 2) return true;
      return this.isMillerRabinProbablePrime(paranoia >>> 1);
    }
  }
  BigNumber.extGCD = BigNumber_extGCD;
  BigNumber.ZERO = BigNumber.fromNumber(0);
  BigNumber.ONE = BigNumber.fromNumber(1);
  class Modulus extends BigNumber {
    constructor(number) {
      super();
      this.limbs = number.limbs;
      this.bitLength = number.bitLength;
      this.sign = number.sign;
      if (this.valueOf() < 1) throw new RangeError();
      if (this.bitLength <= 32) return;
      let comodulus;
      if (this.limbs[0] & 1) {
        const bitlen = (this.bitLength + 31 & -32) + 1;
        const limbs = new Uint32Array(bitlen + 31 >> 5);
        limbs[limbs.length - 1] = 1;
        comodulus = new BigNumber();
        comodulus.sign = 1;
        comodulus.bitLength = bitlen;
        comodulus.limbs = limbs;
        const k = Number_extGCD(0x100000000, this.limbs[0]).y;
        this.coefficient = k < 0 ? -k : 0x100000000 - k;
      } else {
        return;
      }
      this.comodulus = comodulus;
      this.comodulusRemainder = comodulus.divide(this).remainder;
      this.comodulusRemainderSquare = comodulus.square().divide(this).remainder;
    }
    reduce(a) {
      if (a.bitLength <= 32 && this.bitLength <= 32) return BigNumber.fromNumber(a.valueOf() % this.valueOf());
      if (a.compare(this) < 0) return a;
      return a.divide(this).remainder;
    }
    inverse(a) {
      a = this.reduce(a);
      const r = BigNumber_extGCD(this, a);
      if (r.gcd.valueOf() !== 1) throw new Error('GCD is not 1');
      if (r.y.sign < 0) return r.y.add(this).clamp(this.bitLength);
      return r.y;
    }
    power(g, e) {
      let c = 0;
      for (let i = 0; i < e.limbs.length; i++) {
        let t = e.limbs[i];
        while (t) {
          if (t & 1) c++;
          t >>>= 1;
        }
      }
      let k = 8;
      if (e.bitLength <= 4536) k = 7;
      if (e.bitLength <= 1736) k = 6;
      if (e.bitLength <= 630) k = 5;
      if (e.bitLength <= 210) k = 4;
      if (e.bitLength <= 60) k = 3;
      if (e.bitLength <= 12) k = 2;
      if (c <= 1 << k - 1) k = 1;
      g = Modulus._Montgomery_reduce(this.reduce(g).multiply(this.comodulusRemainderSquare), this);
      const g2 = Modulus._Montgomery_reduce(g.square(), this),
        gn = new Array(1 << k - 1);
      gn[0] = g;
      gn[1] = Modulus._Montgomery_reduce(g.multiply(g2), this);
      for (let i = 2; i < 1 << k - 1; i++) {
        gn[i] = Modulus._Montgomery_reduce(gn[i - 1].multiply(g2), this);
      }
      const u = this.comodulusRemainder;
      let r = u;
      for (let i = e.limbs.length - 1; i >= 0; i--) {
        let t = e.limbs[i];
        for (let j = 32; j > 0;) {
          if (t & 0x80000000) {
            let n = t >>> 32 - k,
              l = k;
            while ((n & 1) === 0) {
              n >>>= 1;
              l--;
            }
            var m = gn[n >>> 1];
            while (n) {
              n >>>= 1;
              if (r !== u) r = Modulus._Montgomery_reduce(r.square(), this);
            }
            r = r !== u ? Modulus._Montgomery_reduce(r.multiply(m), this) : m;
            t <<= l, j -= l;
          } else {
            if (r !== u) r = Modulus._Montgomery_reduce(r.square(), this);
            t <<= 1, j--;
          }
        }
      }
      return Modulus._Montgomery_reduce(r, this);
    }
    static _Montgomery_reduce(a, n) {
      const alimbs = a.limbs;
      const alimbcnt = alimbs.length;
      const nlimbs = n.limbs;
      const nlimbcnt = nlimbs.length;
      const y = n.coefficient;
      _bigint_asm.sreset();
      const pA = _bigint_asm.salloc(alimbcnt << 2),
        pN = _bigint_asm.salloc(nlimbcnt << 2),
        pR = _bigint_asm.salloc(nlimbcnt << 2);
      _bigint_asm.z(pR - pA + (nlimbcnt << 2), 0, pA);
      _bigint_heap.set(alimbs, pA >> 2);
      _bigint_heap.set(nlimbs, pN >> 2);
      _bigint_asm.mredc(pA, alimbcnt << 2, pN, nlimbcnt << 2, y, pR);
      const result = new BigNumber();
      result.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + nlimbcnt));
      result.bitLength = n.bitLength;
      result.sign = 1;
      return result;
    }
  }
  var sha1_asm = function (stdlib, foreign, buffer) {
    "use asm";
    var H0 = 0,
      H1 = 0,
      H2 = 0,
      H3 = 0,
      H4 = 0,
      TOTAL0 = 0,
      TOTAL1 = 0;
    var I0 = 0,
      I1 = 0,
      I2 = 0,
      I3 = 0,
      I4 = 0,
      O0 = 0,
      O1 = 0,
      O2 = 0,
      O3 = 0,
      O4 = 0;
    var HEAP = new stdlib.Uint8Array(buffer);
    function _core(w0, w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15) {
      w0 = w0 | 0;
      w1 = w1 | 0;
      w2 = w2 | 0;
      w3 = w3 | 0;
      w4 = w4 | 0;
      w5 = w5 | 0;
      w6 = w6 | 0;
      w7 = w7 | 0;
      w8 = w8 | 0;
      w9 = w9 | 0;
      w10 = w10 | 0;
      w11 = w11 | 0;
      w12 = w12 | 0;
      w13 = w13 | 0;
      w14 = w14 | 0;
      w15 = w15 | 0;
      var a = 0,
        b = 0,
        c = 0,
        d = 0,
        e = 0,
        n = 0,
        t = 0,
        w16 = 0,
        w17 = 0,
        w18 = 0,
        w19 = 0,
        w20 = 0,
        w21 = 0,
        w22 = 0,
        w23 = 0,
        w24 = 0,
        w25 = 0,
        w26 = 0,
        w27 = 0,
        w28 = 0,
        w29 = 0,
        w30 = 0,
        w31 = 0,
        w32 = 0,
        w33 = 0,
        w34 = 0,
        w35 = 0,
        w36 = 0,
        w37 = 0,
        w38 = 0,
        w39 = 0,
        w40 = 0,
        w41 = 0,
        w42 = 0,
        w43 = 0,
        w44 = 0,
        w45 = 0,
        w46 = 0,
        w47 = 0,
        w48 = 0,
        w49 = 0,
        w50 = 0,
        w51 = 0,
        w52 = 0,
        w53 = 0,
        w54 = 0,
        w55 = 0,
        w56 = 0,
        w57 = 0,
        w58 = 0,
        w59 = 0,
        w60 = 0,
        w61 = 0,
        w62 = 0,
        w63 = 0,
        w64 = 0,
        w65 = 0,
        w66 = 0,
        w67 = 0,
        w68 = 0,
        w69 = 0,
        w70 = 0,
        w71 = 0,
        w72 = 0,
        w73 = 0,
        w74 = 0,
        w75 = 0,
        w76 = 0,
        w77 = 0,
        w78 = 0,
        w79 = 0;
      a = H0;
      b = H1;
      c = H2;
      d = H3;
      e = H4;
      t = w0 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w1 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w2 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w3 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w4 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w5 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w6 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w7 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w8 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w9 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w10 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w11 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w12 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w13 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w14 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      t = w15 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w13 ^ w8 ^ w2 ^ w0;
      w16 = n << 1 | n >>> 31;
      t = w16 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w14 ^ w9 ^ w3 ^ w1;
      w17 = n << 1 | n >>> 31;
      t = w17 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w15 ^ w10 ^ w4 ^ w2;
      w18 = n << 1 | n >>> 31;
      t = w18 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w16 ^ w11 ^ w5 ^ w3;
      w19 = n << 1 | n >>> 31;
      t = w19 + (a << 5 | a >>> 27) + e + (b & c | ~b & d) + 0x5a827999 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w17 ^ w12 ^ w6 ^ w4;
      w20 = n << 1 | n >>> 31;
      t = w20 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w18 ^ w13 ^ w7 ^ w5;
      w21 = n << 1 | n >>> 31;
      t = w21 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w19 ^ w14 ^ w8 ^ w6;
      w22 = n << 1 | n >>> 31;
      t = w22 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w20 ^ w15 ^ w9 ^ w7;
      w23 = n << 1 | n >>> 31;
      t = w23 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w21 ^ w16 ^ w10 ^ w8;
      w24 = n << 1 | n >>> 31;
      t = w24 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w22 ^ w17 ^ w11 ^ w9;
      w25 = n << 1 | n >>> 31;
      t = w25 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w23 ^ w18 ^ w12 ^ w10;
      w26 = n << 1 | n >>> 31;
      t = w26 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w24 ^ w19 ^ w13 ^ w11;
      w27 = n << 1 | n >>> 31;
      t = w27 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w25 ^ w20 ^ w14 ^ w12;
      w28 = n << 1 | n >>> 31;
      t = w28 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w26 ^ w21 ^ w15 ^ w13;
      w29 = n << 1 | n >>> 31;
      t = w29 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w27 ^ w22 ^ w16 ^ w14;
      w30 = n << 1 | n >>> 31;
      t = w30 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w28 ^ w23 ^ w17 ^ w15;
      w31 = n << 1 | n >>> 31;
      t = w31 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w29 ^ w24 ^ w18 ^ w16;
      w32 = n << 1 | n >>> 31;
      t = w32 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w30 ^ w25 ^ w19 ^ w17;
      w33 = n << 1 | n >>> 31;
      t = w33 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w31 ^ w26 ^ w20 ^ w18;
      w34 = n << 1 | n >>> 31;
      t = w34 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w32 ^ w27 ^ w21 ^ w19;
      w35 = n << 1 | n >>> 31;
      t = w35 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w33 ^ w28 ^ w22 ^ w20;
      w36 = n << 1 | n >>> 31;
      t = w36 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w34 ^ w29 ^ w23 ^ w21;
      w37 = n << 1 | n >>> 31;
      t = w37 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w35 ^ w30 ^ w24 ^ w22;
      w38 = n << 1 | n >>> 31;
      t = w38 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w36 ^ w31 ^ w25 ^ w23;
      w39 = n << 1 | n >>> 31;
      t = w39 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) + 0x6ed9eba1 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w37 ^ w32 ^ w26 ^ w24;
      w40 = n << 1 | n >>> 31;
      t = w40 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w38 ^ w33 ^ w27 ^ w25;
      w41 = n << 1 | n >>> 31;
      t = w41 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w39 ^ w34 ^ w28 ^ w26;
      w42 = n << 1 | n >>> 31;
      t = w42 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w40 ^ w35 ^ w29 ^ w27;
      w43 = n << 1 | n >>> 31;
      t = w43 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w41 ^ w36 ^ w30 ^ w28;
      w44 = n << 1 | n >>> 31;
      t = w44 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w42 ^ w37 ^ w31 ^ w29;
      w45 = n << 1 | n >>> 31;
      t = w45 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w43 ^ w38 ^ w32 ^ w30;
      w46 = n << 1 | n >>> 31;
      t = w46 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w44 ^ w39 ^ w33 ^ w31;
      w47 = n << 1 | n >>> 31;
      t = w47 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w45 ^ w40 ^ w34 ^ w32;
      w48 = n << 1 | n >>> 31;
      t = w48 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w46 ^ w41 ^ w35 ^ w33;
      w49 = n << 1 | n >>> 31;
      t = w49 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w47 ^ w42 ^ w36 ^ w34;
      w50 = n << 1 | n >>> 31;
      t = w50 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w48 ^ w43 ^ w37 ^ w35;
      w51 = n << 1 | n >>> 31;
      t = w51 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w49 ^ w44 ^ w38 ^ w36;
      w52 = n << 1 | n >>> 31;
      t = w52 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w50 ^ w45 ^ w39 ^ w37;
      w53 = n << 1 | n >>> 31;
      t = w53 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w51 ^ w46 ^ w40 ^ w38;
      w54 = n << 1 | n >>> 31;
      t = w54 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w52 ^ w47 ^ w41 ^ w39;
      w55 = n << 1 | n >>> 31;
      t = w55 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w53 ^ w48 ^ w42 ^ w40;
      w56 = n << 1 | n >>> 31;
      t = w56 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w54 ^ w49 ^ w43 ^ w41;
      w57 = n << 1 | n >>> 31;
      t = w57 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w55 ^ w50 ^ w44 ^ w42;
      w58 = n << 1 | n >>> 31;
      t = w58 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w56 ^ w51 ^ w45 ^ w43;
      w59 = n << 1 | n >>> 31;
      t = w59 + (a << 5 | a >>> 27) + e + (b & c | b & d | c & d) - 0x70e44324 | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w57 ^ w52 ^ w46 ^ w44;
      w60 = n << 1 | n >>> 31;
      t = w60 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w58 ^ w53 ^ w47 ^ w45;
      w61 = n << 1 | n >>> 31;
      t = w61 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w59 ^ w54 ^ w48 ^ w46;
      w62 = n << 1 | n >>> 31;
      t = w62 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w60 ^ w55 ^ w49 ^ w47;
      w63 = n << 1 | n >>> 31;
      t = w63 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w61 ^ w56 ^ w50 ^ w48;
      w64 = n << 1 | n >>> 31;
      t = w64 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w62 ^ w57 ^ w51 ^ w49;
      w65 = n << 1 | n >>> 31;
      t = w65 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w63 ^ w58 ^ w52 ^ w50;
      w66 = n << 1 | n >>> 31;
      t = w66 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w64 ^ w59 ^ w53 ^ w51;
      w67 = n << 1 | n >>> 31;
      t = w67 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w65 ^ w60 ^ w54 ^ w52;
      w68 = n << 1 | n >>> 31;
      t = w68 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w66 ^ w61 ^ w55 ^ w53;
      w69 = n << 1 | n >>> 31;
      t = w69 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w67 ^ w62 ^ w56 ^ w54;
      w70 = n << 1 | n >>> 31;
      t = w70 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w68 ^ w63 ^ w57 ^ w55;
      w71 = n << 1 | n >>> 31;
      t = w71 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w69 ^ w64 ^ w58 ^ w56;
      w72 = n << 1 | n >>> 31;
      t = w72 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w70 ^ w65 ^ w59 ^ w57;
      w73 = n << 1 | n >>> 31;
      t = w73 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w71 ^ w66 ^ w60 ^ w58;
      w74 = n << 1 | n >>> 31;
      t = w74 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w72 ^ w67 ^ w61 ^ w59;
      w75 = n << 1 | n >>> 31;
      t = w75 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w73 ^ w68 ^ w62 ^ w60;
      w76 = n << 1 | n >>> 31;
      t = w76 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w74 ^ w69 ^ w63 ^ w61;
      w77 = n << 1 | n >>> 31;
      t = w77 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w75 ^ w70 ^ w64 ^ w62;
      w78 = n << 1 | n >>> 31;
      t = w78 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      n = w76 ^ w71 ^ w65 ^ w63;
      w79 = n << 1 | n >>> 31;
      t = w79 + (a << 5 | a >>> 27) + e + (b ^ c ^ d) - 0x359d3e2a | 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = t;
      H0 = H0 + a | 0;
      H1 = H1 + b | 0;
      H2 = H2 + c | 0;
      H3 = H3 + d | 0;
      H4 = H4 + e | 0;
    }
    function _core_heap(offset) {
      offset = offset | 0;
      _core(HEAP[offset | 0] << 24 | HEAP[offset | 1] << 16 | HEAP[offset | 2] << 8 | HEAP[offset | 3], HEAP[offset | 4] << 24 | HEAP[offset | 5] << 16 | HEAP[offset | 6] << 8 | HEAP[offset | 7], HEAP[offset | 8] << 24 | HEAP[offset | 9] << 16 | HEAP[offset | 10] << 8 | HEAP[offset | 11], HEAP[offset | 12] << 24 | HEAP[offset | 13] << 16 | HEAP[offset | 14] << 8 | HEAP[offset | 15], HEAP[offset | 16] << 24 | HEAP[offset | 17] << 16 | HEAP[offset | 18] << 8 | HEAP[offset | 19], HEAP[offset | 20] << 24 | HEAP[offset | 21] << 16 | HEAP[offset | 22] << 8 | HEAP[offset | 23], HEAP[offset | 24] << 24 | HEAP[offset | 25] << 16 | HEAP[offset | 26] << 8 | HEAP[offset | 27], HEAP[offset | 28] << 24 | HEAP[offset | 29] << 16 | HEAP[offset | 30] << 8 | HEAP[offset | 31], HEAP[offset | 32] << 24 | HEAP[offset | 33] << 16 | HEAP[offset | 34] << 8 | HEAP[offset | 35], HEAP[offset | 36] << 24 | HEAP[offset | 37] << 16 | HEAP[offset | 38] << 8 | HEAP[offset | 39], HEAP[offset | 40] << 24 | HEAP[offset | 41] << 16 | HEAP[offset | 42] << 8 | HEAP[offset | 43], HEAP[offset | 44] << 24 | HEAP[offset | 45] << 16 | HEAP[offset | 46] << 8 | HEAP[offset | 47], HEAP[offset | 48] << 24 | HEAP[offset | 49] << 16 | HEAP[offset | 50] << 8 | HEAP[offset | 51], HEAP[offset | 52] << 24 | HEAP[offset | 53] << 16 | HEAP[offset | 54] << 8 | HEAP[offset | 55], HEAP[offset | 56] << 24 | HEAP[offset | 57] << 16 | HEAP[offset | 58] << 8 | HEAP[offset | 59], HEAP[offset | 60] << 24 | HEAP[offset | 61] << 16 | HEAP[offset | 62] << 8 | HEAP[offset | 63]);
    }
    function _state_to_heap(output) {
      output = output | 0;
      HEAP[output | 0] = H0 >>> 24;
      HEAP[output | 1] = H0 >>> 16 & 255;
      HEAP[output | 2] = H0 >>> 8 & 255;
      HEAP[output | 3] = H0 & 255;
      HEAP[output | 4] = H1 >>> 24;
      HEAP[output | 5] = H1 >>> 16 & 255;
      HEAP[output | 6] = H1 >>> 8 & 255;
      HEAP[output | 7] = H1 & 255;
      HEAP[output | 8] = H2 >>> 24;
      HEAP[output | 9] = H2 >>> 16 & 255;
      HEAP[output | 10] = H2 >>> 8 & 255;
      HEAP[output | 11] = H2 & 255;
      HEAP[output | 12] = H3 >>> 24;
      HEAP[output | 13] = H3 >>> 16 & 255;
      HEAP[output | 14] = H3 >>> 8 & 255;
      HEAP[output | 15] = H3 & 255;
      HEAP[output | 16] = H4 >>> 24;
      HEAP[output | 17] = H4 >>> 16 & 255;
      HEAP[output | 18] = H4 >>> 8 & 255;
      HEAP[output | 19] = H4 & 255;
    }
    function reset() {
      H0 = 0x67452301;
      H1 = 0xefcdab89;
      H2 = 0x98badcfe;
      H3 = 0x10325476;
      H4 = 0xc3d2e1f0;
      TOTAL0 = TOTAL1 = 0;
    }
    function init(h0, h1, h2, h3, h4, total0, total1) {
      h0 = h0 | 0;
      h1 = h1 | 0;
      h2 = h2 | 0;
      h3 = h3 | 0;
      h4 = h4 | 0;
      total0 = total0 | 0;
      total1 = total1 | 0;
      H0 = h0;
      H1 = h1;
      H2 = h2;
      H3 = h3;
      H4 = h4;
      TOTAL0 = total0;
      TOTAL1 = total1;
    }
    function process(offset, length) {
      offset = offset | 0;
      length = length | 0;
      var hashed = 0;
      if (offset & 63) return -1;
      while ((length | 0) >= 64) {
        _core_heap(offset);
        offset = offset + 64 | 0;
        length = length - 64 | 0;
        hashed = hashed + 64 | 0;
      }
      TOTAL0 = TOTAL0 + hashed | 0;
      if (TOTAL0 >>> 0 < hashed >>> 0) TOTAL1 = TOTAL1 + 1 | 0;
      return hashed | 0;
    }
    function finish(offset, length, output) {
      offset = offset | 0;
      length = length | 0;
      output = output | 0;
      var hashed = 0,
        i = 0;
      if (offset & 63) return -1;
      if (~output) if (output & 31) return -1;
      if ((length | 0) >= 64) {
        hashed = process(offset, length) | 0;
        if ((hashed | 0) == -1) return -1;
        offset = offset + hashed | 0;
        length = length - hashed | 0;
      }
      hashed = hashed + length | 0;
      TOTAL0 = TOTAL0 + length | 0;
      if (TOTAL0 >>> 0 < length >>> 0) TOTAL1 = TOTAL1 + 1 | 0;
      HEAP[offset | length] = 0x80;
      if ((length | 0) >= 56) {
        for (i = length + 1 | 0; (i | 0) < 64; i = i + 1 | 0) HEAP[offset | i] = 0x00;
        _core_heap(offset);
        length = 0;
        HEAP[offset | 0] = 0;
      }
      for (i = length + 1 | 0; (i | 0) < 59; i = i + 1 | 0) HEAP[offset | i] = 0;
      HEAP[offset | 56] = TOTAL1 >>> 21 & 255;
      HEAP[offset | 57] = TOTAL1 >>> 13 & 255;
      HEAP[offset | 58] = TOTAL1 >>> 5 & 255;
      HEAP[offset | 59] = TOTAL1 << 3 & 255 | TOTAL0 >>> 29;
      HEAP[offset | 60] = TOTAL0 >>> 21 & 255;
      HEAP[offset | 61] = TOTAL0 >>> 13 & 255;
      HEAP[offset | 62] = TOTAL0 >>> 5 & 255;
      HEAP[offset | 63] = TOTAL0 << 3 & 255;
      _core_heap(offset);
      if (~output) _state_to_heap(output);
      return hashed | 0;
    }
    function hmac_reset() {
      H0 = I0;
      H1 = I1;
      H2 = I2;
      H3 = I3;
      H4 = I4;
      TOTAL0 = 64;
      TOTAL1 = 0;
    }
    function _hmac_opad() {
      H0 = O0;
      H1 = O1;
      H2 = O2;
      H3 = O3;
      H4 = O4;
      TOTAL0 = 64;
      TOTAL1 = 0;
    }
    function hmac_init(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15) {
      p0 = p0 | 0;
      p1 = p1 | 0;
      p2 = p2 | 0;
      p3 = p3 | 0;
      p4 = p4 | 0;
      p5 = p5 | 0;
      p6 = p6 | 0;
      p7 = p7 | 0;
      p8 = p8 | 0;
      p9 = p9 | 0;
      p10 = p10 | 0;
      p11 = p11 | 0;
      p12 = p12 | 0;
      p13 = p13 | 0;
      p14 = p14 | 0;
      p15 = p15 | 0;
      reset();
      _core(p0 ^ 0x5c5c5c5c, p1 ^ 0x5c5c5c5c, p2 ^ 0x5c5c5c5c, p3 ^ 0x5c5c5c5c, p4 ^ 0x5c5c5c5c, p5 ^ 0x5c5c5c5c, p6 ^ 0x5c5c5c5c, p7 ^ 0x5c5c5c5c, p8 ^ 0x5c5c5c5c, p9 ^ 0x5c5c5c5c, p10 ^ 0x5c5c5c5c, p11 ^ 0x5c5c5c5c, p12 ^ 0x5c5c5c5c, p13 ^ 0x5c5c5c5c, p14 ^ 0x5c5c5c5c, p15 ^ 0x5c5c5c5c);
      O0 = H0;
      O1 = H1;
      O2 = H2;
      O3 = H3;
      O4 = H4;
      reset();
      _core(p0 ^ 0x36363636, p1 ^ 0x36363636, p2 ^ 0x36363636, p3 ^ 0x36363636, p4 ^ 0x36363636, p5 ^ 0x36363636, p6 ^ 0x36363636, p7 ^ 0x36363636, p8 ^ 0x36363636, p9 ^ 0x36363636, p10 ^ 0x36363636, p11 ^ 0x36363636, p12 ^ 0x36363636, p13 ^ 0x36363636, p14 ^ 0x36363636, p15 ^ 0x36363636);
      I0 = H0;
      I1 = H1;
      I2 = H2;
      I3 = H3;
      I4 = H4;
      TOTAL0 = 64;
      TOTAL1 = 0;
    }
    function hmac_finish(offset, length, output) {
      offset = offset | 0;
      length = length | 0;
      output = output | 0;
      var t0 = 0,
        t1 = 0,
        t2 = 0,
        t3 = 0,
        t4 = 0,
        hashed = 0;
      if (offset & 63) return -1;
      if (~output) if (output & 31) return -1;
      hashed = finish(offset, length, -1) | 0;
      t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4;
      _hmac_opad();
      _core(t0, t1, t2, t3, t4, 0x80000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 672);
      if (~output) _state_to_heap(output);
      return hashed | 0;
    }
    function pbkdf2_generate_block(offset, length, block, count, output) {
      offset = offset | 0;
      length = length | 0;
      block = block | 0;
      count = count | 0;
      output = output | 0;
      var h0 = 0,
        h1 = 0,
        h2 = 0,
        h3 = 0,
        h4 = 0,
        t0 = 0,
        t1 = 0,
        t2 = 0,
        t3 = 0,
        t4 = 0;
      if (offset & 63) return -1;
      if (~output) if (output & 31) return -1;
      HEAP[offset + length | 0] = block >>> 24;
      HEAP[offset + length + 1 | 0] = block >>> 16 & 255;
      HEAP[offset + length + 2 | 0] = block >>> 8 & 255;
      HEAP[offset + length + 3 | 0] = block & 255;
      hmac_finish(offset, length + 4 | 0, -1) | 0;
      h0 = t0 = H0, h1 = t1 = H1, h2 = t2 = H2, h3 = t3 = H3, h4 = t4 = H4;
      count = count - 1 | 0;
      while ((count | 0) > 0) {
        hmac_reset();
        _core(t0, t1, t2, t3, t4, 0x80000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 672);
        t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4;
        _hmac_opad();
        _core(t0, t1, t2, t3, t4, 0x80000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 672);
        t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4;
        h0 = h0 ^ H0;
        h1 = h1 ^ H1;
        h2 = h2 ^ H2;
        h3 = h3 ^ H3;
        h4 = h4 ^ H4;
        count = count - 1 | 0;
      }
      H0 = h0;
      H1 = h1;
      H2 = h2;
      H3 = h3;
      H4 = h4;
      if (~output) _state_to_heap(output);
      return 0;
    }
    return {
      reset: reset,
      init: init,
      process: process,
      finish: finish,
      hmac_reset: hmac_reset,
      hmac_init: hmac_init,
      hmac_finish: hmac_finish,
      pbkdf2_generate_block: pbkdf2_generate_block
    };
  };
  class Hash {
    constructor() {
      this.pos = 0;
      this.len = 0;
    }
    reset() {
      this.result = null;
      this.pos = 0;
      this.len = 0;
      this.asm.reset();
      return this;
    }
    process(data) {
      if (this.result !== null) throw new IllegalStateError('state must be reset before processing new data');
      let asm = this.asm;
      let heap = this.heap;
      let hpos = this.pos;
      let hlen = this.len;
      let dpos = 0;
      let dlen = data.length;
      let wlen = 0;
      while (dlen > 0) {
        wlen = _heap_write(heap, hpos + hlen, data, dpos, dlen);
        hlen += wlen;
        dpos += wlen;
        dlen -= wlen;
        wlen = asm.process(hpos, hlen);
        hpos += wlen;
        hlen -= wlen;
        if (!hlen) hpos = 0;
      }
      this.pos = hpos;
      this.len = hlen;
      return this;
    }
    finish() {
      if (this.result !== null) throw new IllegalStateError('state must be reset before processing new data');
      this.asm.finish(this.pos, this.len, 0);
      this.result = new Uint8Array(this.HASH_SIZE);
      this.result.set(this.heap.subarray(0, this.HASH_SIZE));
      this.pos = 0;
      this.len = 0;
      return this;
    }
  }
  const _sha1_block_size = 64;
  const _sha1_hash_size = 20;
  class Sha1 extends Hash {
    constructor() {
      super();
      this.NAME = 'sha1';
      this.BLOCK_SIZE = _sha1_block_size;
      this.HASH_SIZE = _sha1_hash_size;
      this.heap = _heap_init();
      this.asm = sha1_asm({
        Uint8Array: Uint8Array
      }, null, this.heap.buffer);
      this.reset();
    }
  }
  Sha1.NAME = 'sha1';
  var sha256_asm = function (stdlib, foreign, buffer) {
    "use asm";
    var H0 = 0,
      H1 = 0,
      H2 = 0,
      H3 = 0,
      H4 = 0,
      H5 = 0,
      H6 = 0,
      H7 = 0,
      TOTAL0 = 0,
      TOTAL1 = 0;
    var I0 = 0,
      I1 = 0,
      I2 = 0,
      I3 = 0,
      I4 = 0,
      I5 = 0,
      I6 = 0,
      I7 = 0,
      O0 = 0,
      O1 = 0,
      O2 = 0,
      O3 = 0,
      O4 = 0,
      O5 = 0,
      O6 = 0,
      O7 = 0;
    var HEAP = new stdlib.Uint8Array(buffer);
    function _core(w0, w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15) {
      w0 = w0 | 0;
      w1 = w1 | 0;
      w2 = w2 | 0;
      w3 = w3 | 0;
      w4 = w4 | 0;
      w5 = w5 | 0;
      w6 = w6 | 0;
      w7 = w7 | 0;
      w8 = w8 | 0;
      w9 = w9 | 0;
      w10 = w10 | 0;
      w11 = w11 | 0;
      w12 = w12 | 0;
      w13 = w13 | 0;
      w14 = w14 | 0;
      w15 = w15 | 0;
      var a = 0,
        b = 0,
        c = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      a = H0;
      b = H1;
      c = H2;
      d = H3;
      e = H4;
      f = H5;
      g = H6;
      h = H7;
      h = w0 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 0x428a2f98 | 0;
      d = d + h | 0;
      h = h + (a & b ^ c & (a ^ b)) + (a >>> 2 ^ a >>> 13 ^ a >>> 22 ^ a << 30 ^ a << 19 ^ a << 10) | 0;
      g = w1 + g + (d >>> 6 ^ d >>> 11 ^ d >>> 25 ^ d << 26 ^ d << 21 ^ d << 7) + (f ^ d & (e ^ f)) + 0x71374491 | 0;
      c = c + g | 0;
      g = g + (h & a ^ b & (h ^ a)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0;
      f = w2 + f + (c >>> 6 ^ c >>> 11 ^ c >>> 25 ^ c << 26 ^ c << 21 ^ c << 7) + (e ^ c & (d ^ e)) + 0xb5c0fbcf | 0;
      b = b + f | 0;
      f = f + (g & h ^ a & (g ^ h)) + (g >>> 2 ^ g >>> 13 ^ g >>> 22 ^ g << 30 ^ g << 19 ^ g << 10) | 0;
      e = w3 + e + (b >>> 6 ^ b >>> 11 ^ b >>> 25 ^ b << 26 ^ b << 21 ^ b << 7) + (d ^ b & (c ^ d)) + 0xe9b5dba5 | 0;
      a = a + e | 0;
      e = e + (f & g ^ h & (f ^ g)) + (f >>> 2 ^ f >>> 13 ^ f >>> 22 ^ f << 30 ^ f << 19 ^ f << 10) | 0;
      d = w4 + d + (a >>> 6 ^ a >>> 11 ^ a >>> 25 ^ a << 26 ^ a << 21 ^ a << 7) + (c ^ a & (b ^ c)) + 0x3956c25b | 0;
      h = h + d | 0;
      d = d + (e & f ^ g & (e ^ f)) + (e >>> 2 ^ e >>> 13 ^ e >>> 22 ^ e << 30 ^ e << 19 ^ e << 10) | 0;
      c = w5 + c + (h >>> 6 ^ h >>> 11 ^ h >>> 25 ^ h << 26 ^ h << 21 ^ h << 7) + (b ^ h & (a ^ b)) + 0x59f111f1 | 0;
      g = g + c | 0;
      c = c + (d & e ^ f & (d ^ e)) + (d >>> 2 ^ d >>> 13 ^ d >>> 22 ^ d << 30 ^ d << 19 ^ d << 10) | 0;
      b = w6 + b + (g >>> 6 ^ g >>> 11 ^ g >>> 25 ^ g << 26 ^ g << 21 ^ g << 7) + (a ^ g & (h ^ a)) + 0x923f82a4 | 0;
      f = f + b | 0;
      b = b + (c & d ^ e & (c ^ d)) + (c >>> 2 ^ c >>> 13 ^ c >>> 22 ^ c << 30 ^ c << 19 ^ c << 10) | 0;
      a = w7 + a + (f >>> 6 ^ f >>> 11 ^ f >>> 25 ^ f << 26 ^ f << 21 ^ f << 7) + (h ^ f & (g ^ h)) + 0xab1c5ed5 | 0;
      e = e + a | 0;
      a = a + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
      h = w8 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 0xd807aa98 | 0;
      d = d + h | 0;
      h = h + (a & b ^ c & (a ^ b)) + (a >>> 2 ^ a >>> 13 ^ a >>> 22 ^ a << 30 ^ a << 19 ^ a << 10) | 0;
      g = w9 + g + (d >>> 6 ^ d >>> 11 ^ d >>> 25 ^ d << 26 ^ d << 21 ^ d << 7) + (f ^ d & (e ^ f)) + 0x12835b01 | 0;
      c = c + g | 0;
      g = g + (h & a ^ b & (h ^ a)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0;
      f = w10 + f + (c >>> 6 ^ c >>> 11 ^ c >>> 25 ^ c << 26 ^ c << 21 ^ c << 7) + (e ^ c & (d ^ e)) + 0x243185be | 0;
      b = b + f | 0;
      f = f + (g & h ^ a & (g ^ h)) + (g >>> 2 ^ g >>> 13 ^ g >>> 22 ^ g << 30 ^ g << 19 ^ g << 10) | 0;
      e = w11 + e + (b >>> 6 ^ b >>> 11 ^ b >>> 25 ^ b << 26 ^ b << 21 ^ b << 7) + (d ^ b & (c ^ d)) + 0x550c7dc3 | 0;
      a = a + e | 0;
      e = e + (f & g ^ h & (f ^ g)) + (f >>> 2 ^ f >>> 13 ^ f >>> 22 ^ f << 30 ^ f << 19 ^ f << 10) | 0;
      d = w12 + d + (a >>> 6 ^ a >>> 11 ^ a >>> 25 ^ a << 26 ^ a << 21 ^ a << 7) + (c ^ a & (b ^ c)) + 0x72be5d74 | 0;
      h = h + d | 0;
      d = d + (e & f ^ g & (e ^ f)) + (e >>> 2 ^ e >>> 13 ^ e >>> 22 ^ e << 30 ^ e << 19 ^ e << 10) | 0;
      c = w13 + c + (h >>> 6 ^ h >>> 11 ^ h >>> 25 ^ h << 26 ^ h << 21 ^ h << 7) + (b ^ h & (a ^ b)) + 0x80deb1fe | 0;
      g = g + c | 0;
      c = c + (d & e ^ f & (d ^ e)) + (d >>> 2 ^ d >>> 13 ^ d >>> 22 ^ d << 30 ^ d << 19 ^ d << 10) | 0;
      b = w14 + b + (g >>> 6 ^ g >>> 11 ^ g >>> 25 ^ g << 26 ^ g << 21 ^ g << 7) + (a ^ g & (h ^ a)) + 0x9bdc06a7 | 0;
      f = f + b | 0;
      b = b + (c & d ^ e & (c ^ d)) + (c >>> 2 ^ c >>> 13 ^ c >>> 22 ^ c << 30 ^ c << 19 ^ c << 10) | 0;
      a = w15 + a + (f >>> 6 ^ f >>> 11 ^ f >>> 25 ^ f << 26 ^ f << 21 ^ f << 7) + (h ^ f & (g ^ h)) + 0xc19bf174 | 0;
      e = e + a | 0;
      a = a + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
      w0 = (w1 >>> 7 ^ w1 >>> 18 ^ w1 >>> 3 ^ w1 << 25 ^ w1 << 14) + (w14 >>> 17 ^ w14 >>> 19 ^ w14 >>> 10 ^ w14 << 15 ^ w14 << 13) + w0 + w9 | 0;
      h = w0 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 0xe49b69c1 | 0;
      d = d + h | 0;
      h = h + (a & b ^ c & (a ^ b)) + (a >>> 2 ^ a >>> 13 ^ a >>> 22 ^ a << 30 ^ a << 19 ^ a << 10) | 0;
      w1 = (w2 >>> 7 ^ w2 >>> 18 ^ w2 >>> 3 ^ w2 << 25 ^ w2 << 14) + (w15 >>> 17 ^ w15 >>> 19 ^ w15 >>> 10 ^ w15 << 15 ^ w15 << 13) + w1 + w10 | 0;
      g = w1 + g + (d >>> 6 ^ d >>> 11 ^ d >>> 25 ^ d << 26 ^ d << 21 ^ d << 7) + (f ^ d & (e ^ f)) + 0xefbe4786 | 0;
      c = c + g | 0;
      g = g + (h & a ^ b & (h ^ a)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0;
      w2 = (w3 >>> 7 ^ w3 >>> 18 ^ w3 >>> 3 ^ w3 << 25 ^ w3 << 14) + (w0 >>> 17 ^ w0 >>> 19 ^ w0 >>> 10 ^ w0 << 15 ^ w0 << 13) + w2 + w11 | 0;
      f = w2 + f + (c >>> 6 ^ c >>> 11 ^ c >>> 25 ^ c << 26 ^ c << 21 ^ c << 7) + (e ^ c & (d ^ e)) + 0x0fc19dc6 | 0;
      b = b + f | 0;
      f = f + (g & h ^ a & (g ^ h)) + (g >>> 2 ^ g >>> 13 ^ g >>> 22 ^ g << 30 ^ g << 19 ^ g << 10) | 0;
      w3 = (w4 >>> 7 ^ w4 >>> 18 ^ w4 >>> 3 ^ w4 << 25 ^ w4 << 14) + (w1 >>> 17 ^ w1 >>> 19 ^ w1 >>> 10 ^ w1 << 15 ^ w1 << 13) + w3 + w12 | 0;
      e = w3 + e + (b >>> 6 ^ b >>> 11 ^ b >>> 25 ^ b << 26 ^ b << 21 ^ b << 7) + (d ^ b & (c ^ d)) + 0x240ca1cc | 0;
      a = a + e | 0;
      e = e + (f & g ^ h & (f ^ g)) + (f >>> 2 ^ f >>> 13 ^ f >>> 22 ^ f << 30 ^ f << 19 ^ f << 10) | 0;
      w4 = (w5 >>> 7 ^ w5 >>> 18 ^ w5 >>> 3 ^ w5 << 25 ^ w5 << 14) + (w2 >>> 17 ^ w2 >>> 19 ^ w2 >>> 10 ^ w2 << 15 ^ w2 << 13) + w4 + w13 | 0;
      d = w4 + d + (a >>> 6 ^ a >>> 11 ^ a >>> 25 ^ a << 26 ^ a << 21 ^ a << 7) + (c ^ a & (b ^ c)) + 0x2de92c6f | 0;
      h = h + d | 0;
      d = d + (e & f ^ g & (e ^ f)) + (e >>> 2 ^ e >>> 13 ^ e >>> 22 ^ e << 30 ^ e << 19 ^ e << 10) | 0;
      w5 = (w6 >>> 7 ^ w6 >>> 18 ^ w6 >>> 3 ^ w6 << 25 ^ w6 << 14) + (w3 >>> 17 ^ w3 >>> 19 ^ w3 >>> 10 ^ w3 << 15 ^ w3 << 13) + w5 + w14 | 0;
      c = w5 + c + (h >>> 6 ^ h >>> 11 ^ h >>> 25 ^ h << 26 ^ h << 21 ^ h << 7) + (b ^ h & (a ^ b)) + 0x4a7484aa | 0;
      g = g + c | 0;
      c = c + (d & e ^ f & (d ^ e)) + (d >>> 2 ^ d >>> 13 ^ d >>> 22 ^ d << 30 ^ d << 19 ^ d << 10) | 0;
      w6 = (w7 >>> 7 ^ w7 >>> 18 ^ w7 >>> 3 ^ w7 << 25 ^ w7 << 14) + (w4 >>> 17 ^ w4 >>> 19 ^ w4 >>> 10 ^ w4 << 15 ^ w4 << 13) + w6 + w15 | 0;
      b = w6 + b + (g >>> 6 ^ g >>> 11 ^ g >>> 25 ^ g << 26 ^ g << 21 ^ g << 7) + (a ^ g & (h ^ a)) + 0x5cb0a9dc | 0;
      f = f + b | 0;
      b = b + (c & d ^ e & (c ^ d)) + (c >>> 2 ^ c >>> 13 ^ c >>> 22 ^ c << 30 ^ c << 19 ^ c << 10) | 0;
      w7 = (w8 >>> 7 ^ w8 >>> 18 ^ w8 >>> 3 ^ w8 << 25 ^ w8 << 14) + (w5 >>> 17 ^ w5 >>> 19 ^ w5 >>> 10 ^ w5 << 15 ^ w5 << 13) + w7 + w0 | 0;
      a = w7 + a + (f >>> 6 ^ f >>> 11 ^ f >>> 25 ^ f << 26 ^ f << 21 ^ f << 7) + (h ^ f & (g ^ h)) + 0x76f988da | 0;
      e = e + a | 0;
      a = a + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
      w8 = (w9 >>> 7 ^ w9 >>> 18 ^ w9 >>> 3 ^ w9 << 25 ^ w9 << 14) + (w6 >>> 17 ^ w6 >>> 19 ^ w6 >>> 10 ^ w6 << 15 ^ w6 << 13) + w8 + w1 | 0;
      h = w8 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 0x983e5152 | 0;
      d = d + h | 0;
      h = h + (a & b ^ c & (a ^ b)) + (a >>> 2 ^ a >>> 13 ^ a >>> 22 ^ a << 30 ^ a << 19 ^ a << 10) | 0;
      w9 = (w10 >>> 7 ^ w10 >>> 18 ^ w10 >>> 3 ^ w10 << 25 ^ w10 << 14) + (w7 >>> 17 ^ w7 >>> 19 ^ w7 >>> 10 ^ w7 << 15 ^ w7 << 13) + w9 + w2 | 0;
      g = w9 + g + (d >>> 6 ^ d >>> 11 ^ d >>> 25 ^ d << 26 ^ d << 21 ^ d << 7) + (f ^ d & (e ^ f)) + 0xa831c66d | 0;
      c = c + g | 0;
      g = g + (h & a ^ b & (h ^ a)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0;
      w10 = (w11 >>> 7 ^ w11 >>> 18 ^ w11 >>> 3 ^ w11 << 25 ^ w11 << 14) + (w8 >>> 17 ^ w8 >>> 19 ^ w8 >>> 10 ^ w8 << 15 ^ w8 << 13) + w10 + w3 | 0;
      f = w10 + f + (c >>> 6 ^ c >>> 11 ^ c >>> 25 ^ c << 26 ^ c << 21 ^ c << 7) + (e ^ c & (d ^ e)) + 0xb00327c8 | 0;
      b = b + f | 0;
      f = f + (g & h ^ a & (g ^ h)) + (g >>> 2 ^ g >>> 13 ^ g >>> 22 ^ g << 30 ^ g << 19 ^ g << 10) | 0;
      w11 = (w12 >>> 7 ^ w12 >>> 18 ^ w12 >>> 3 ^ w12 << 25 ^ w12 << 14) + (w9 >>> 17 ^ w9 >>> 19 ^ w9 >>> 10 ^ w9 << 15 ^ w9 << 13) + w11 + w4 | 0;
      e = w11 + e + (b >>> 6 ^ b >>> 11 ^ b >>> 25 ^ b << 26 ^ b << 21 ^ b << 7) + (d ^ b & (c ^ d)) + 0xbf597fc7 | 0;
      a = a + e | 0;
      e = e + (f & g ^ h & (f ^ g)) + (f >>> 2 ^ f >>> 13 ^ f >>> 22 ^ f << 30 ^ f << 19 ^ f << 10) | 0;
      w12 = (w13 >>> 7 ^ w13 >>> 18 ^ w13 >>> 3 ^ w13 << 25 ^ w13 << 14) + (w10 >>> 17 ^ w10 >>> 19 ^ w10 >>> 10 ^ w10 << 15 ^ w10 << 13) + w12 + w5 | 0;
      d = w12 + d + (a >>> 6 ^ a >>> 11 ^ a >>> 25 ^ a << 26 ^ a << 21 ^ a << 7) + (c ^ a & (b ^ c)) + 0xc6e00bf3 | 0;
      h = h + d | 0;
      d = d + (e & f ^ g & (e ^ f)) + (e >>> 2 ^ e >>> 13 ^ e >>> 22 ^ e << 30 ^ e << 19 ^ e << 10) | 0;
      w13 = (w14 >>> 7 ^ w14 >>> 18 ^ w14 >>> 3 ^ w14 << 25 ^ w14 << 14) + (w11 >>> 17 ^ w11 >>> 19 ^ w11 >>> 10 ^ w11 << 15 ^ w11 << 13) + w13 + w6 | 0;
      c = w13 + c + (h >>> 6 ^ h >>> 11 ^ h >>> 25 ^ h << 26 ^ h << 21 ^ h << 7) + (b ^ h & (a ^ b)) + 0xd5a79147 | 0;
      g = g + c | 0;
      c = c + (d & e ^ f & (d ^ e)) + (d >>> 2 ^ d >>> 13 ^ d >>> 22 ^ d << 30 ^ d << 19 ^ d << 10) | 0;
      w14 = (w15 >>> 7 ^ w15 >>> 18 ^ w15 >>> 3 ^ w15 << 25 ^ w15 << 14) + (w12 >>> 17 ^ w12 >>> 19 ^ w12 >>> 10 ^ w12 << 15 ^ w12 << 13) + w14 + w7 | 0;
      b = w14 + b + (g >>> 6 ^ g >>> 11 ^ g >>> 25 ^ g << 26 ^ g << 21 ^ g << 7) + (a ^ g & (h ^ a)) + 0x06ca6351 | 0;
      f = f + b | 0;
      b = b + (c & d ^ e & (c ^ d)) + (c >>> 2 ^ c >>> 13 ^ c >>> 22 ^ c << 30 ^ c << 19 ^ c << 10) | 0;
      w15 = (w0 >>> 7 ^ w0 >>> 18 ^ w0 >>> 3 ^ w0 << 25 ^ w0 << 14) + (w13 >>> 17 ^ w13 >>> 19 ^ w13 >>> 10 ^ w13 << 15 ^ w13 << 13) + w15 + w8 | 0;
      a = w15 + a + (f >>> 6 ^ f >>> 11 ^ f >>> 25 ^ f << 26 ^ f << 21 ^ f << 7) + (h ^ f & (g ^ h)) + 0x14292967 | 0;
      e = e + a | 0;
      a = a + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
      w0 = (w1 >>> 7 ^ w1 >>> 18 ^ w1 >>> 3 ^ w1 << 25 ^ w1 << 14) + (w14 >>> 17 ^ w14 >>> 19 ^ w14 >>> 10 ^ w14 << 15 ^ w14 << 13) + w0 + w9 | 0;
      h = w0 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 0x27b70a85 | 0;
      d = d + h | 0;
      h = h + (a & b ^ c & (a ^ b)) + (a >>> 2 ^ a >>> 13 ^ a >>> 22 ^ a << 30 ^ a << 19 ^ a << 10) | 0;
      w1 = (w2 >>> 7 ^ w2 >>> 18 ^ w2 >>> 3 ^ w2 << 25 ^ w2 << 14) + (w15 >>> 17 ^ w15 >>> 19 ^ w15 >>> 10 ^ w15 << 15 ^ w15 << 13) + w1 + w10 | 0;
      g = w1 + g + (d >>> 6 ^ d >>> 11 ^ d >>> 25 ^ d << 26 ^ d << 21 ^ d << 7) + (f ^ d & (e ^ f)) + 0x2e1b2138 | 0;
      c = c + g | 0;
      g = g + (h & a ^ b & (h ^ a)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0;
      w2 = (w3 >>> 7 ^ w3 >>> 18 ^ w3 >>> 3 ^ w3 << 25 ^ w3 << 14) + (w0 >>> 17 ^ w0 >>> 19 ^ w0 >>> 10 ^ w0 << 15 ^ w0 << 13) + w2 + w11 | 0;
      f = w2 + f + (c >>> 6 ^ c >>> 11 ^ c >>> 25 ^ c << 26 ^ c << 21 ^ c << 7) + (e ^ c & (d ^ e)) + 0x4d2c6dfc | 0;
      b = b + f | 0;
      f = f + (g & h ^ a & (g ^ h)) + (g >>> 2 ^ g >>> 13 ^ g >>> 22 ^ g << 30 ^ g << 19 ^ g << 10) | 0;
      w3 = (w4 >>> 7 ^ w4 >>> 18 ^ w4 >>> 3 ^ w4 << 25 ^ w4 << 14) + (w1 >>> 17 ^ w1 >>> 19 ^ w1 >>> 10 ^ w1 << 15 ^ w1 << 13) + w3 + w12 | 0;
      e = w3 + e + (b >>> 6 ^ b >>> 11 ^ b >>> 25 ^ b << 26 ^ b << 21 ^ b << 7) + (d ^ b & (c ^ d)) + 0x53380d13 | 0;
      a = a + e | 0;
      e = e + (f & g ^ h & (f ^ g)) + (f >>> 2 ^ f >>> 13 ^ f >>> 22 ^ f << 30 ^ f << 19 ^ f << 10) | 0;
      w4 = (w5 >>> 7 ^ w5 >>> 18 ^ w5 >>> 3 ^ w5 << 25 ^ w5 << 14) + (w2 >>> 17 ^ w2 >>> 19 ^ w2 >>> 10 ^ w2 << 15 ^ w2 << 13) + w4 + w13 | 0;
      d = w4 + d + (a >>> 6 ^ a >>> 11 ^ a >>> 25 ^ a << 26 ^ a << 21 ^ a << 7) + (c ^ a & (b ^ c)) + 0x650a7354 | 0;
      h = h + d | 0;
      d = d + (e & f ^ g & (e ^ f)) + (e >>> 2 ^ e >>> 13 ^ e >>> 22 ^ e << 30 ^ e << 19 ^ e << 10) | 0;
      w5 = (w6 >>> 7 ^ w6 >>> 18 ^ w6 >>> 3 ^ w6 << 25 ^ w6 << 14) + (w3 >>> 17 ^ w3 >>> 19 ^ w3 >>> 10 ^ w3 << 15 ^ w3 << 13) + w5 + w14 | 0;
      c = w5 + c + (h >>> 6 ^ h >>> 11 ^ h >>> 25 ^ h << 26 ^ h << 21 ^ h << 7) + (b ^ h & (a ^ b)) + 0x766a0abb | 0;
      g = g + c | 0;
      c = c + (d & e ^ f & (d ^ e)) + (d >>> 2 ^ d >>> 13 ^ d >>> 22 ^ d << 30 ^ d << 19 ^ d << 10) | 0;
      w6 = (w7 >>> 7 ^ w7 >>> 18 ^ w7 >>> 3 ^ w7 << 25 ^ w7 << 14) + (w4 >>> 17 ^ w4 >>> 19 ^ w4 >>> 10 ^ w4 << 15 ^ w4 << 13) + w6 + w15 | 0;
      b = w6 + b + (g >>> 6 ^ g >>> 11 ^ g >>> 25 ^ g << 26 ^ g << 21 ^ g << 7) + (a ^ g & (h ^ a)) + 0x81c2c92e | 0;
      f = f + b | 0;
      b = b + (c & d ^ e & (c ^ d)) + (c >>> 2 ^ c >>> 13 ^ c >>> 22 ^ c << 30 ^ c << 19 ^ c << 10) | 0;
      w7 = (w8 >>> 7 ^ w8 >>> 18 ^ w8 >>> 3 ^ w8 << 25 ^ w8 << 14) + (w5 >>> 17 ^ w5 >>> 19 ^ w5 >>> 10 ^ w5 << 15 ^ w5 << 13) + w7 + w0 | 0;
      a = w7 + a + (f >>> 6 ^ f >>> 11 ^ f >>> 25 ^ f << 26 ^ f << 21 ^ f << 7) + (h ^ f & (g ^ h)) + 0x92722c85 | 0;
      e = e + a | 0;
      a = a + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
      w8 = (w9 >>> 7 ^ w9 >>> 18 ^ w9 >>> 3 ^ w9 << 25 ^ w9 << 14) + (w6 >>> 17 ^ w6 >>> 19 ^ w6 >>> 10 ^ w6 << 15 ^ w6 << 13) + w8 + w1 | 0;
      h = w8 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 0xa2bfe8a1 | 0;
      d = d + h | 0;
      h = h + (a & b ^ c & (a ^ b)) + (a >>> 2 ^ a >>> 13 ^ a >>> 22 ^ a << 30 ^ a << 19 ^ a << 10) | 0;
      w9 = (w10 >>> 7 ^ w10 >>> 18 ^ w10 >>> 3 ^ w10 << 25 ^ w10 << 14) + (w7 >>> 17 ^ w7 >>> 19 ^ w7 >>> 10 ^ w7 << 15 ^ w7 << 13) + w9 + w2 | 0;
      g = w9 + g + (d >>> 6 ^ d >>> 11 ^ d >>> 25 ^ d << 26 ^ d << 21 ^ d << 7) + (f ^ d & (e ^ f)) + 0xa81a664b | 0;
      c = c + g | 0;
      g = g + (h & a ^ b & (h ^ a)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0;
      w10 = (w11 >>> 7 ^ w11 >>> 18 ^ w11 >>> 3 ^ w11 << 25 ^ w11 << 14) + (w8 >>> 17 ^ w8 >>> 19 ^ w8 >>> 10 ^ w8 << 15 ^ w8 << 13) + w10 + w3 | 0;
      f = w10 + f + (c >>> 6 ^ c >>> 11 ^ c >>> 25 ^ c << 26 ^ c << 21 ^ c << 7) + (e ^ c & (d ^ e)) + 0xc24b8b70 | 0;
      b = b + f | 0;
      f = f + (g & h ^ a & (g ^ h)) + (g >>> 2 ^ g >>> 13 ^ g >>> 22 ^ g << 30 ^ g << 19 ^ g << 10) | 0;
      w11 = (w12 >>> 7 ^ w12 >>> 18 ^ w12 >>> 3 ^ w12 << 25 ^ w12 << 14) + (w9 >>> 17 ^ w9 >>> 19 ^ w9 >>> 10 ^ w9 << 15 ^ w9 << 13) + w11 + w4 | 0;
      e = w11 + e + (b >>> 6 ^ b >>> 11 ^ b >>> 25 ^ b << 26 ^ b << 21 ^ b << 7) + (d ^ b & (c ^ d)) + 0xc76c51a3 | 0;
      a = a + e | 0;
      e = e + (f & g ^ h & (f ^ g)) + (f >>> 2 ^ f >>> 13 ^ f >>> 22 ^ f << 30 ^ f << 19 ^ f << 10) | 0;
      w12 = (w13 >>> 7 ^ w13 >>> 18 ^ w13 >>> 3 ^ w13 << 25 ^ w13 << 14) + (w10 >>> 17 ^ w10 >>> 19 ^ w10 >>> 10 ^ w10 << 15 ^ w10 << 13) + w12 + w5 | 0;
      d = w12 + d + (a >>> 6 ^ a >>> 11 ^ a >>> 25 ^ a << 26 ^ a << 21 ^ a << 7) + (c ^ a & (b ^ c)) + 0xd192e819 | 0;
      h = h + d | 0;
      d = d + (e & f ^ g & (e ^ f)) + (e >>> 2 ^ e >>> 13 ^ e >>> 22 ^ e << 30 ^ e << 19 ^ e << 10) | 0;
      w13 = (w14 >>> 7 ^ w14 >>> 18 ^ w14 >>> 3 ^ w14 << 25 ^ w14 << 14) + (w11 >>> 17 ^ w11 >>> 19 ^ w11 >>> 10 ^ w11 << 15 ^ w11 << 13) + w13 + w6 | 0;
      c = w13 + c + (h >>> 6 ^ h >>> 11 ^ h >>> 25 ^ h << 26 ^ h << 21 ^ h << 7) + (b ^ h & (a ^ b)) + 0xd6990624 | 0;
      g = g + c | 0;
      c = c + (d & e ^ f & (d ^ e)) + (d >>> 2 ^ d >>> 13 ^ d >>> 22 ^ d << 30 ^ d << 19 ^ d << 10) | 0;
      w14 = (w15 >>> 7 ^ w15 >>> 18 ^ w15 >>> 3 ^ w15 << 25 ^ w15 << 14) + (w12 >>> 17 ^ w12 >>> 19 ^ w12 >>> 10 ^ w12 << 15 ^ w12 << 13) + w14 + w7 | 0;
      b = w14 + b + (g >>> 6 ^ g >>> 11 ^ g >>> 25 ^ g << 26 ^ g << 21 ^ g << 7) + (a ^ g & (h ^ a)) + 0xf40e3585 | 0;
      f = f + b | 0;
      b = b + (c & d ^ e & (c ^ d)) + (c >>> 2 ^ c >>> 13 ^ c >>> 22 ^ c << 30 ^ c << 19 ^ c << 10) | 0;
      w15 = (w0 >>> 7 ^ w0 >>> 18 ^ w0 >>> 3 ^ w0 << 25 ^ w0 << 14) + (w13 >>> 17 ^ w13 >>> 19 ^ w13 >>> 10 ^ w13 << 15 ^ w13 << 13) + w15 + w8 | 0;
      a = w15 + a + (f >>> 6 ^ f >>> 11 ^ f >>> 25 ^ f << 26 ^ f << 21 ^ f << 7) + (h ^ f & (g ^ h)) + 0x106aa070 | 0;
      e = e + a | 0;
      a = a + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
      w0 = (w1 >>> 7 ^ w1 >>> 18 ^ w1 >>> 3 ^ w1 << 25 ^ w1 << 14) + (w14 >>> 17 ^ w14 >>> 19 ^ w14 >>> 10 ^ w14 << 15 ^ w14 << 13) + w0 + w9 | 0;
      h = w0 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 0x19a4c116 | 0;
      d = d + h | 0;
      h = h + (a & b ^ c & (a ^ b)) + (a >>> 2 ^ a >>> 13 ^ a >>> 22 ^ a << 30 ^ a << 19 ^ a << 10) | 0;
      w1 = (w2 >>> 7 ^ w2 >>> 18 ^ w2 >>> 3 ^ w2 << 25 ^ w2 << 14) + (w15 >>> 17 ^ w15 >>> 19 ^ w15 >>> 10 ^ w15 << 15 ^ w15 << 13) + w1 + w10 | 0;
      g = w1 + g + (d >>> 6 ^ d >>> 11 ^ d >>> 25 ^ d << 26 ^ d << 21 ^ d << 7) + (f ^ d & (e ^ f)) + 0x1e376c08 | 0;
      c = c + g | 0;
      g = g + (h & a ^ b & (h ^ a)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0;
      w2 = (w3 >>> 7 ^ w3 >>> 18 ^ w3 >>> 3 ^ w3 << 25 ^ w3 << 14) + (w0 >>> 17 ^ w0 >>> 19 ^ w0 >>> 10 ^ w0 << 15 ^ w0 << 13) + w2 + w11 | 0;
      f = w2 + f + (c >>> 6 ^ c >>> 11 ^ c >>> 25 ^ c << 26 ^ c << 21 ^ c << 7) + (e ^ c & (d ^ e)) + 0x2748774c | 0;
      b = b + f | 0;
      f = f + (g & h ^ a & (g ^ h)) + (g >>> 2 ^ g >>> 13 ^ g >>> 22 ^ g << 30 ^ g << 19 ^ g << 10) | 0;
      w3 = (w4 >>> 7 ^ w4 >>> 18 ^ w4 >>> 3 ^ w4 << 25 ^ w4 << 14) + (w1 >>> 17 ^ w1 >>> 19 ^ w1 >>> 10 ^ w1 << 15 ^ w1 << 13) + w3 + w12 | 0;
      e = w3 + e + (b >>> 6 ^ b >>> 11 ^ b >>> 25 ^ b << 26 ^ b << 21 ^ b << 7) + (d ^ b & (c ^ d)) + 0x34b0bcb5 | 0;
      a = a + e | 0;
      e = e + (f & g ^ h & (f ^ g)) + (f >>> 2 ^ f >>> 13 ^ f >>> 22 ^ f << 30 ^ f << 19 ^ f << 10) | 0;
      w4 = (w5 >>> 7 ^ w5 >>> 18 ^ w5 >>> 3 ^ w5 << 25 ^ w5 << 14) + (w2 >>> 17 ^ w2 >>> 19 ^ w2 >>> 10 ^ w2 << 15 ^ w2 << 13) + w4 + w13 | 0;
      d = w4 + d + (a >>> 6 ^ a >>> 11 ^ a >>> 25 ^ a << 26 ^ a << 21 ^ a << 7) + (c ^ a & (b ^ c)) + 0x391c0cb3 | 0;
      h = h + d | 0;
      d = d + (e & f ^ g & (e ^ f)) + (e >>> 2 ^ e >>> 13 ^ e >>> 22 ^ e << 30 ^ e << 19 ^ e << 10) | 0;
      w5 = (w6 >>> 7 ^ w6 >>> 18 ^ w6 >>> 3 ^ w6 << 25 ^ w6 << 14) + (w3 >>> 17 ^ w3 >>> 19 ^ w3 >>> 10 ^ w3 << 15 ^ w3 << 13) + w5 + w14 | 0;
      c = w5 + c + (h >>> 6 ^ h >>> 11 ^ h >>> 25 ^ h << 26 ^ h << 21 ^ h << 7) + (b ^ h & (a ^ b)) + 0x4ed8aa4a | 0;
      g = g + c | 0;
      c = c + (d & e ^ f & (d ^ e)) + (d >>> 2 ^ d >>> 13 ^ d >>> 22 ^ d << 30 ^ d << 19 ^ d << 10) | 0;
      w6 = (w7 >>> 7 ^ w7 >>> 18 ^ w7 >>> 3 ^ w7 << 25 ^ w7 << 14) + (w4 >>> 17 ^ w4 >>> 19 ^ w4 >>> 10 ^ w4 << 15 ^ w4 << 13) + w6 + w15 | 0;
      b = w6 + b + (g >>> 6 ^ g >>> 11 ^ g >>> 25 ^ g << 26 ^ g << 21 ^ g << 7) + (a ^ g & (h ^ a)) + 0x5b9cca4f | 0;
      f = f + b | 0;
      b = b + (c & d ^ e & (c ^ d)) + (c >>> 2 ^ c >>> 13 ^ c >>> 22 ^ c << 30 ^ c << 19 ^ c << 10) | 0;
      w7 = (w8 >>> 7 ^ w8 >>> 18 ^ w8 >>> 3 ^ w8 << 25 ^ w8 << 14) + (w5 >>> 17 ^ w5 >>> 19 ^ w5 >>> 10 ^ w5 << 15 ^ w5 << 13) + w7 + w0 | 0;
      a = w7 + a + (f >>> 6 ^ f >>> 11 ^ f >>> 25 ^ f << 26 ^ f << 21 ^ f << 7) + (h ^ f & (g ^ h)) + 0x682e6ff3 | 0;
      e = e + a | 0;
      a = a + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
      w8 = (w9 >>> 7 ^ w9 >>> 18 ^ w9 >>> 3 ^ w9 << 25 ^ w9 << 14) + (w6 >>> 17 ^ w6 >>> 19 ^ w6 >>> 10 ^ w6 << 15 ^ w6 << 13) + w8 + w1 | 0;
      h = w8 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 0x748f82ee | 0;
      d = d + h | 0;
      h = h + (a & b ^ c & (a ^ b)) + (a >>> 2 ^ a >>> 13 ^ a >>> 22 ^ a << 30 ^ a << 19 ^ a << 10) | 0;
      w9 = (w10 >>> 7 ^ w10 >>> 18 ^ w10 >>> 3 ^ w10 << 25 ^ w10 << 14) + (w7 >>> 17 ^ w7 >>> 19 ^ w7 >>> 10 ^ w7 << 15 ^ w7 << 13) + w9 + w2 | 0;
      g = w9 + g + (d >>> 6 ^ d >>> 11 ^ d >>> 25 ^ d << 26 ^ d << 21 ^ d << 7) + (f ^ d & (e ^ f)) + 0x78a5636f | 0;
      c = c + g | 0;
      g = g + (h & a ^ b & (h ^ a)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0;
      w10 = (w11 >>> 7 ^ w11 >>> 18 ^ w11 >>> 3 ^ w11 << 25 ^ w11 << 14) + (w8 >>> 17 ^ w8 >>> 19 ^ w8 >>> 10 ^ w8 << 15 ^ w8 << 13) + w10 + w3 | 0;
      f = w10 + f + (c >>> 6 ^ c >>> 11 ^ c >>> 25 ^ c << 26 ^ c << 21 ^ c << 7) + (e ^ c & (d ^ e)) + 0x84c87814 | 0;
      b = b + f | 0;
      f = f + (g & h ^ a & (g ^ h)) + (g >>> 2 ^ g >>> 13 ^ g >>> 22 ^ g << 30 ^ g << 19 ^ g << 10) | 0;
      w11 = (w12 >>> 7 ^ w12 >>> 18 ^ w12 >>> 3 ^ w12 << 25 ^ w12 << 14) + (w9 >>> 17 ^ w9 >>> 19 ^ w9 >>> 10 ^ w9 << 15 ^ w9 << 13) + w11 + w4 | 0;
      e = w11 + e + (b >>> 6 ^ b >>> 11 ^ b >>> 25 ^ b << 26 ^ b << 21 ^ b << 7) + (d ^ b & (c ^ d)) + 0x8cc70208 | 0;
      a = a + e | 0;
      e = e + (f & g ^ h & (f ^ g)) + (f >>> 2 ^ f >>> 13 ^ f >>> 22 ^ f << 30 ^ f << 19 ^ f << 10) | 0;
      w12 = (w13 >>> 7 ^ w13 >>> 18 ^ w13 >>> 3 ^ w13 << 25 ^ w13 << 14) + (w10 >>> 17 ^ w10 >>> 19 ^ w10 >>> 10 ^ w10 << 15 ^ w10 << 13) + w12 + w5 | 0;
      d = w12 + d + (a >>> 6 ^ a >>> 11 ^ a >>> 25 ^ a << 26 ^ a << 21 ^ a << 7) + (c ^ a & (b ^ c)) + 0x90befffa | 0;
      h = h + d | 0;
      d = d + (e & f ^ g & (e ^ f)) + (e >>> 2 ^ e >>> 13 ^ e >>> 22 ^ e << 30 ^ e << 19 ^ e << 10) | 0;
      w13 = (w14 >>> 7 ^ w14 >>> 18 ^ w14 >>> 3 ^ w14 << 25 ^ w14 << 14) + (w11 >>> 17 ^ w11 >>> 19 ^ w11 >>> 10 ^ w11 << 15 ^ w11 << 13) + w13 + w6 | 0;
      c = w13 + c + (h >>> 6 ^ h >>> 11 ^ h >>> 25 ^ h << 26 ^ h << 21 ^ h << 7) + (b ^ h & (a ^ b)) + 0xa4506ceb | 0;
      g = g + c | 0;
      c = c + (d & e ^ f & (d ^ e)) + (d >>> 2 ^ d >>> 13 ^ d >>> 22 ^ d << 30 ^ d << 19 ^ d << 10) | 0;
      w14 = (w15 >>> 7 ^ w15 >>> 18 ^ w15 >>> 3 ^ w15 << 25 ^ w15 << 14) + (w12 >>> 17 ^ w12 >>> 19 ^ w12 >>> 10 ^ w12 << 15 ^ w12 << 13) + w14 + w7 | 0;
      b = w14 + b + (g >>> 6 ^ g >>> 11 ^ g >>> 25 ^ g << 26 ^ g << 21 ^ g << 7) + (a ^ g & (h ^ a)) + 0xbef9a3f7 | 0;
      f = f + b | 0;
      b = b + (c & d ^ e & (c ^ d)) + (c >>> 2 ^ c >>> 13 ^ c >>> 22 ^ c << 30 ^ c << 19 ^ c << 10) | 0;
      w15 = (w0 >>> 7 ^ w0 >>> 18 ^ w0 >>> 3 ^ w0 << 25 ^ w0 << 14) + (w13 >>> 17 ^ w13 >>> 19 ^ w13 >>> 10 ^ w13 << 15 ^ w13 << 13) + w15 + w8 | 0;
      a = w15 + a + (f >>> 6 ^ f >>> 11 ^ f >>> 25 ^ f << 26 ^ f << 21 ^ f << 7) + (h ^ f & (g ^ h)) + 0xc67178f2 | 0;
      e = e + a | 0;
      a = a + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
      H0 = H0 + a | 0;
      H1 = H1 + b | 0;
      H2 = H2 + c | 0;
      H3 = H3 + d | 0;
      H4 = H4 + e | 0;
      H5 = H5 + f | 0;
      H6 = H6 + g | 0;
      H7 = H7 + h | 0;
    }
    function _core_heap(offset) {
      offset = offset | 0;
      _core(HEAP[offset | 0] << 24 | HEAP[offset | 1] << 16 | HEAP[offset | 2] << 8 | HEAP[offset | 3], HEAP[offset | 4] << 24 | HEAP[offset | 5] << 16 | HEAP[offset | 6] << 8 | HEAP[offset | 7], HEAP[offset | 8] << 24 | HEAP[offset | 9] << 16 | HEAP[offset | 10] << 8 | HEAP[offset | 11], HEAP[offset | 12] << 24 | HEAP[offset | 13] << 16 | HEAP[offset | 14] << 8 | HEAP[offset | 15], HEAP[offset | 16] << 24 | HEAP[offset | 17] << 16 | HEAP[offset | 18] << 8 | HEAP[offset | 19], HEAP[offset | 20] << 24 | HEAP[offset | 21] << 16 | HEAP[offset | 22] << 8 | HEAP[offset | 23], HEAP[offset | 24] << 24 | HEAP[offset | 25] << 16 | HEAP[offset | 26] << 8 | HEAP[offset | 27], HEAP[offset | 28] << 24 | HEAP[offset | 29] << 16 | HEAP[offset | 30] << 8 | HEAP[offset | 31], HEAP[offset | 32] << 24 | HEAP[offset | 33] << 16 | HEAP[offset | 34] << 8 | HEAP[offset | 35], HEAP[offset | 36] << 24 | HEAP[offset | 37] << 16 | HEAP[offset | 38] << 8 | HEAP[offset | 39], HEAP[offset | 40] << 24 | HEAP[offset | 41] << 16 | HEAP[offset | 42] << 8 | HEAP[offset | 43], HEAP[offset | 44] << 24 | HEAP[offset | 45] << 16 | HEAP[offset | 46] << 8 | HEAP[offset | 47], HEAP[offset | 48] << 24 | HEAP[offset | 49] << 16 | HEAP[offset | 50] << 8 | HEAP[offset | 51], HEAP[offset | 52] << 24 | HEAP[offset | 53] << 16 | HEAP[offset | 54] << 8 | HEAP[offset | 55], HEAP[offset | 56] << 24 | HEAP[offset | 57] << 16 | HEAP[offset | 58] << 8 | HEAP[offset | 59], HEAP[offset | 60] << 24 | HEAP[offset | 61] << 16 | HEAP[offset | 62] << 8 | HEAP[offset | 63]);
    }
    function _state_to_heap(output) {
      output = output | 0;
      HEAP[output | 0] = H0 >>> 24;
      HEAP[output | 1] = H0 >>> 16 & 255;
      HEAP[output | 2] = H0 >>> 8 & 255;
      HEAP[output | 3] = H0 & 255;
      HEAP[output | 4] = H1 >>> 24;
      HEAP[output | 5] = H1 >>> 16 & 255;
      HEAP[output | 6] = H1 >>> 8 & 255;
      HEAP[output | 7] = H1 & 255;
      HEAP[output | 8] = H2 >>> 24;
      HEAP[output | 9] = H2 >>> 16 & 255;
      HEAP[output | 10] = H2 >>> 8 & 255;
      HEAP[output | 11] = H2 & 255;
      HEAP[output | 12] = H3 >>> 24;
      HEAP[output | 13] = H3 >>> 16 & 255;
      HEAP[output | 14] = H3 >>> 8 & 255;
      HEAP[output | 15] = H3 & 255;
      HEAP[output | 16] = H4 >>> 24;
      HEAP[output | 17] = H4 >>> 16 & 255;
      HEAP[output | 18] = H4 >>> 8 & 255;
      HEAP[output | 19] = H4 & 255;
      HEAP[output | 20] = H5 >>> 24;
      HEAP[output | 21] = H5 >>> 16 & 255;
      HEAP[output | 22] = H5 >>> 8 & 255;
      HEAP[output | 23] = H5 & 255;
      HEAP[output | 24] = H6 >>> 24;
      HEAP[output | 25] = H6 >>> 16 & 255;
      HEAP[output | 26] = H6 >>> 8 & 255;
      HEAP[output | 27] = H6 & 255;
      HEAP[output | 28] = H7 >>> 24;
      HEAP[output | 29] = H7 >>> 16 & 255;
      HEAP[output | 30] = H7 >>> 8 & 255;
      HEAP[output | 31] = H7 & 255;
    }
    function reset() {
      H0 = 0x6a09e667;
      H1 = 0xbb67ae85;
      H2 = 0x3c6ef372;
      H3 = 0xa54ff53a;
      H4 = 0x510e527f;
      H5 = 0x9b05688c;
      H6 = 0x1f83d9ab;
      H7 = 0x5be0cd19;
      TOTAL0 = TOTAL1 = 0;
    }
    function init(h0, h1, h2, h3, h4, h5, h6, h7, total0, total1) {
      h0 = h0 | 0;
      h1 = h1 | 0;
      h2 = h2 | 0;
      h3 = h3 | 0;
      h4 = h4 | 0;
      h5 = h5 | 0;
      h6 = h6 | 0;
      h7 = h7 | 0;
      total0 = total0 | 0;
      total1 = total1 | 0;
      H0 = h0;
      H1 = h1;
      H2 = h2;
      H3 = h3;
      H4 = h4;
      H5 = h5;
      H6 = h6;
      H7 = h7;
      TOTAL0 = total0;
      TOTAL1 = total1;
    }
    function process(offset, length) {
      offset = offset | 0;
      length = length | 0;
      var hashed = 0;
      if (offset & 63) return -1;
      while ((length | 0) >= 64) {
        _core_heap(offset);
        offset = offset + 64 | 0;
        length = length - 64 | 0;
        hashed = hashed + 64 | 0;
      }
      TOTAL0 = TOTAL0 + hashed | 0;
      if (TOTAL0 >>> 0 < hashed >>> 0) TOTAL1 = TOTAL1 + 1 | 0;
      return hashed | 0;
    }
    function finish(offset, length, output) {
      offset = offset | 0;
      length = length | 0;
      output = output | 0;
      var hashed = 0,
        i = 0;
      if (offset & 63) return -1;
      if (~output) if (output & 31) return -1;
      if ((length | 0) >= 64) {
        hashed = process(offset, length) | 0;
        if ((hashed | 0) == -1) return -1;
        offset = offset + hashed | 0;
        length = length - hashed | 0;
      }
      hashed = hashed + length | 0;
      TOTAL0 = TOTAL0 + length | 0;
      if (TOTAL0 >>> 0 < length >>> 0) TOTAL1 = TOTAL1 + 1 | 0;
      HEAP[offset | length] = 0x80;
      if ((length | 0) >= 56) {
        for (i = length + 1 | 0; (i | 0) < 64; i = i + 1 | 0) HEAP[offset | i] = 0x00;
        _core_heap(offset);
        length = 0;
        HEAP[offset | 0] = 0;
      }
      for (i = length + 1 | 0; (i | 0) < 59; i = i + 1 | 0) HEAP[offset | i] = 0;
      HEAP[offset | 56] = TOTAL1 >>> 21 & 255;
      HEAP[offset | 57] = TOTAL1 >>> 13 & 255;
      HEAP[offset | 58] = TOTAL1 >>> 5 & 255;
      HEAP[offset | 59] = TOTAL1 << 3 & 255 | TOTAL0 >>> 29;
      HEAP[offset | 60] = TOTAL0 >>> 21 & 255;
      HEAP[offset | 61] = TOTAL0 >>> 13 & 255;
      HEAP[offset | 62] = TOTAL0 >>> 5 & 255;
      HEAP[offset | 63] = TOTAL0 << 3 & 255;
      _core_heap(offset);
      if (~output) _state_to_heap(output);
      return hashed | 0;
    }
    function hmac_reset() {
      H0 = I0;
      H1 = I1;
      H2 = I2;
      H3 = I3;
      H4 = I4;
      H5 = I5;
      H6 = I6;
      H7 = I7;
      TOTAL0 = 64;
      TOTAL1 = 0;
    }
    function _hmac_opad() {
      H0 = O0;
      H1 = O1;
      H2 = O2;
      H3 = O3;
      H4 = O4;
      H5 = O5;
      H6 = O6;
      H7 = O7;
      TOTAL0 = 64;
      TOTAL1 = 0;
    }
    function hmac_init(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15) {
      p0 = p0 | 0;
      p1 = p1 | 0;
      p2 = p2 | 0;
      p3 = p3 | 0;
      p4 = p4 | 0;
      p5 = p5 | 0;
      p6 = p6 | 0;
      p7 = p7 | 0;
      p8 = p8 | 0;
      p9 = p9 | 0;
      p10 = p10 | 0;
      p11 = p11 | 0;
      p12 = p12 | 0;
      p13 = p13 | 0;
      p14 = p14 | 0;
      p15 = p15 | 0;
      reset();
      _core(p0 ^ 0x5c5c5c5c, p1 ^ 0x5c5c5c5c, p2 ^ 0x5c5c5c5c, p3 ^ 0x5c5c5c5c, p4 ^ 0x5c5c5c5c, p5 ^ 0x5c5c5c5c, p6 ^ 0x5c5c5c5c, p7 ^ 0x5c5c5c5c, p8 ^ 0x5c5c5c5c, p9 ^ 0x5c5c5c5c, p10 ^ 0x5c5c5c5c, p11 ^ 0x5c5c5c5c, p12 ^ 0x5c5c5c5c, p13 ^ 0x5c5c5c5c, p14 ^ 0x5c5c5c5c, p15 ^ 0x5c5c5c5c);
      O0 = H0;
      O1 = H1;
      O2 = H2;
      O3 = H3;
      O4 = H4;
      O5 = H5;
      O6 = H6;
      O7 = H7;
      reset();
      _core(p0 ^ 0x36363636, p1 ^ 0x36363636, p2 ^ 0x36363636, p3 ^ 0x36363636, p4 ^ 0x36363636, p5 ^ 0x36363636, p6 ^ 0x36363636, p7 ^ 0x36363636, p8 ^ 0x36363636, p9 ^ 0x36363636, p10 ^ 0x36363636, p11 ^ 0x36363636, p12 ^ 0x36363636, p13 ^ 0x36363636, p14 ^ 0x36363636, p15 ^ 0x36363636);
      I0 = H0;
      I1 = H1;
      I2 = H2;
      I3 = H3;
      I4 = H4;
      I5 = H5;
      I6 = H6;
      I7 = H7;
      TOTAL0 = 64;
      TOTAL1 = 0;
    }
    function hmac_finish(offset, length, output) {
      offset = offset | 0;
      length = length | 0;
      output = output | 0;
      var t0 = 0,
        t1 = 0,
        t2 = 0,
        t3 = 0,
        t4 = 0,
        t5 = 0,
        t6 = 0,
        t7 = 0,
        hashed = 0;
      if (offset & 63) return -1;
      if (~output) if (output & 31) return -1;
      hashed = finish(offset, length, -1) | 0;
      t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4, t5 = H5, t6 = H6, t7 = H7;
      _hmac_opad();
      _core(t0, t1, t2, t3, t4, t5, t6, t7, 0x80000000, 0, 0, 0, 0, 0, 0, 768);
      if (~output) _state_to_heap(output);
      return hashed | 0;
    }
    function pbkdf2_generate_block(offset, length, block, count, output) {
      offset = offset | 0;
      length = length | 0;
      block = block | 0;
      count = count | 0;
      output = output | 0;
      var h0 = 0,
        h1 = 0,
        h2 = 0,
        h3 = 0,
        h4 = 0,
        h5 = 0,
        h6 = 0,
        h7 = 0,
        t0 = 0,
        t1 = 0,
        t2 = 0,
        t3 = 0,
        t4 = 0,
        t5 = 0,
        t6 = 0,
        t7 = 0;
      if (offset & 63) return -1;
      if (~output) if (output & 31) return -1;
      HEAP[offset + length | 0] = block >>> 24;
      HEAP[offset + length + 1 | 0] = block >>> 16 & 255;
      HEAP[offset + length + 2 | 0] = block >>> 8 & 255;
      HEAP[offset + length + 3 | 0] = block & 255;
      hmac_finish(offset, length + 4 | 0, -1) | 0;
      h0 = t0 = H0, h1 = t1 = H1, h2 = t2 = H2, h3 = t3 = H3, h4 = t4 = H4, h5 = t5 = H5, h6 = t6 = H6, h7 = t7 = H7;
      count = count - 1 | 0;
      while ((count | 0) > 0) {
        hmac_reset();
        _core(t0, t1, t2, t3, t4, t5, t6, t7, 0x80000000, 0, 0, 0, 0, 0, 0, 768);
        t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4, t5 = H5, t6 = H6, t7 = H7;
        _hmac_opad();
        _core(t0, t1, t2, t3, t4, t5, t6, t7, 0x80000000, 0, 0, 0, 0, 0, 0, 768);
        t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4, t5 = H5, t6 = H6, t7 = H7;
        h0 = h0 ^ H0;
        h1 = h1 ^ H1;
        h2 = h2 ^ H2;
        h3 = h3 ^ H3;
        h4 = h4 ^ H4;
        h5 = h5 ^ H5;
        h6 = h6 ^ H6;
        h7 = h7 ^ H7;
        count = count - 1 | 0;
      }
      H0 = h0;
      H1 = h1;
      H2 = h2;
      H3 = h3;
      H4 = h4;
      H5 = h5;
      H6 = h6;
      H7 = h7;
      if (~output) _state_to_heap(output);
      return 0;
    }
    return {
      reset: reset,
      init: init,
      process: process,
      finish: finish,
      hmac_reset: hmac_reset,
      hmac_init: hmac_init,
      hmac_finish: hmac_finish,
      pbkdf2_generate_block: pbkdf2_generate_block
    };
  };
  const _sha256_block_size = 64;
  const _sha256_hash_size = 32;
  class Sha256 extends Hash {
    constructor() {
      super();
      this.NAME = 'sha256';
      this.BLOCK_SIZE = _sha256_block_size;
      this.HASH_SIZE = _sha256_hash_size;
      this.heap = _heap_init();
      this.asm = sha256_asm({
        Uint8Array: Uint8Array
      }, null, this.heap.buffer);
      this.reset();
    }
  }
  Sha256.NAME = 'sha256';
  var sha512_asm = function (stdlib, foreign, buffer) {
    "use asm";
    var H0h = 0,
      H0l = 0,
      H1h = 0,
      H1l = 0,
      H2h = 0,
      H2l = 0,
      H3h = 0,
      H3l = 0,
      H4h = 0,
      H4l = 0,
      H5h = 0,
      H5l = 0,
      H6h = 0,
      H6l = 0,
      H7h = 0,
      H7l = 0,
      TOTAL0 = 0,
      TOTAL1 = 0;
    var I0h = 0,
      I0l = 0,
      I1h = 0,
      I1l = 0,
      I2h = 0,
      I2l = 0,
      I3h = 0,
      I3l = 0,
      I4h = 0,
      I4l = 0,
      I5h = 0,
      I5l = 0,
      I6h = 0,
      I6l = 0,
      I7h = 0,
      I7l = 0,
      O0h = 0,
      O0l = 0,
      O1h = 0,
      O1l = 0,
      O2h = 0,
      O2l = 0,
      O3h = 0,
      O3l = 0,
      O4h = 0,
      O4l = 0,
      O5h = 0,
      O5l = 0,
      O6h = 0,
      O6l = 0,
      O7h = 0,
      O7l = 0;
    var HEAP = new stdlib.Uint8Array(buffer);
    function _core(w0h, w0l, w1h, w1l, w2h, w2l, w3h, w3l, w4h, w4l, w5h, w5l, w6h, w6l, w7h, w7l, w8h, w8l, w9h, w9l, w10h, w10l, w11h, w11l, w12h, w12l, w13h, w13l, w14h, w14l, w15h, w15l) {
      w0h = w0h | 0;
      w0l = w0l | 0;
      w1h = w1h | 0;
      w1l = w1l | 0;
      w2h = w2h | 0;
      w2l = w2l | 0;
      w3h = w3h | 0;
      w3l = w3l | 0;
      w4h = w4h | 0;
      w4l = w4l | 0;
      w5h = w5h | 0;
      w5l = w5l | 0;
      w6h = w6h | 0;
      w6l = w6l | 0;
      w7h = w7h | 0;
      w7l = w7l | 0;
      w8h = w8h | 0;
      w8l = w8l | 0;
      w9h = w9h | 0;
      w9l = w9l | 0;
      w10h = w10h | 0;
      w10l = w10l | 0;
      w11h = w11h | 0;
      w11l = w11l | 0;
      w12h = w12h | 0;
      w12l = w12l | 0;
      w13h = w13h | 0;
      w13l = w13l | 0;
      w14h = w14h | 0;
      w14l = w14l | 0;
      w15h = w15h | 0;
      w15l = w15l | 0;
      var ah = 0,
        al = 0,
        bh = 0,
        bl = 0,
        ch = 0,
        cl = 0,
        dh = 0,
        dl = 0,
        eh = 0,
        el = 0,
        fh = 0,
        fl = 0,
        gh = 0,
        gl = 0,
        hh = 0,
        hl = 0,
        th = 0,
        tl = 0,
        xl = 0;
      ah = H0h;
      al = H0l;
      bh = H1h;
      bl = H1l;
      ch = H2h;
      cl = H2l;
      dh = H3h;
      dl = H3l;
      eh = H4h;
      el = H4l;
      fh = H5h;
      fl = H5l;
      gh = H6h;
      gl = H6l;
      hh = H7h;
      hl = H7l;
      tl = 0xd728ae22 + w0l | 0;
      th = 0x428a2f98 + w0h + (tl >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x23ef65cd + w1l | 0;
      th = 0x71374491 + w1h + (tl >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xec4d3b2f + w2l | 0;
      th = 0xb5c0fbcf + w2h + (tl >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x8189dbbc + w3l | 0;
      th = 0xe9b5dba5 + w3h + (tl >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xf348b538 + w4l | 0;
      th = 0x3956c25b + w4h + (tl >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xb605d019 + w5l | 0;
      th = 0x59f111f1 + w5h + (tl >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xaf194f9b + w6l | 0;
      th = 0x923f82a4 + w6h + (tl >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xda6d8118 + w7l | 0;
      th = 0xab1c5ed5 + w7h + (tl >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xa3030242 + w8l | 0;
      th = 0xd807aa98 + w8h + (tl >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x45706fbe + w9l | 0;
      th = 0x12835b01 + w9h + (tl >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x4ee4b28c + w10l | 0;
      th = 0x243185be + w10h + (tl >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xd5ffb4e2 + w11l | 0;
      th = 0x550c7dc3 + w11h + (tl >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xf27b896f + w12l | 0;
      th = 0x72be5d74 + w12h + (tl >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x3b1696b1 + w13l | 0;
      th = 0x80deb1fe + w13h + (tl >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x25c71235 + w14l | 0;
      th = 0x9bdc06a7 + w14h + (tl >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xcf692694 + w15l | 0;
      th = 0xc19bf174 + w15h + (tl >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w0l = w0l + w9l | 0;
      w0h = w0h + w9h + (w0l >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      xl = (w1l >>> 1 | w1h << 31) ^ (w1l >>> 8 | w1h << 24) ^ (w1l >>> 7 | w1h << 25) | 0;
      w0l = w0l + xl | 0;
      w0h = w0h + ((w1h >>> 1 | w1l << 31) ^ (w1h >>> 8 | w1l << 24) ^ w1h >>> 7) + (w0l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w14l >>> 19 | w14h << 13) ^ (w14l << 3 | w14h >>> 29) ^ (w14l >>> 6 | w14h << 26) | 0;
      w0l = w0l + xl | 0;
      w0h = w0h + ((w14h >>> 19 | w14l << 13) ^ (w14h << 3 | w14l >>> 29) ^ w14h >>> 6) + (w0l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x9ef14ad2 + w0l | 0;
      th = 0xe49b69c1 + w0h + (tl >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w1l = w1l + w10l | 0;
      w1h = w1h + w10h + (w1l >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      xl = (w2l >>> 1 | w2h << 31) ^ (w2l >>> 8 | w2h << 24) ^ (w2l >>> 7 | w2h << 25) | 0;
      w1l = w1l + xl | 0;
      w1h = w1h + ((w2h >>> 1 | w2l << 31) ^ (w2h >>> 8 | w2l << 24) ^ w2h >>> 7) + (w1l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w15l >>> 19 | w15h << 13) ^ (w15l << 3 | w15h >>> 29) ^ (w15l >>> 6 | w15h << 26) | 0;
      w1l = w1l + xl | 0;
      w1h = w1h + ((w15h >>> 19 | w15l << 13) ^ (w15h << 3 | w15l >>> 29) ^ w15h >>> 6) + (w1l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x384f25e3 + w1l | 0;
      th = 0xefbe4786 + w1h + (tl >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w2l = w2l + w11l | 0;
      w2h = w2h + w11h + (w2l >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      xl = (w3l >>> 1 | w3h << 31) ^ (w3l >>> 8 | w3h << 24) ^ (w3l >>> 7 | w3h << 25) | 0;
      w2l = w2l + xl | 0;
      w2h = w2h + ((w3h >>> 1 | w3l << 31) ^ (w3h >>> 8 | w3l << 24) ^ w3h >>> 7) + (w2l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w0l >>> 19 | w0h << 13) ^ (w0l << 3 | w0h >>> 29) ^ (w0l >>> 6 | w0h << 26) | 0;
      w2l = w2l + xl | 0;
      w2h = w2h + ((w0h >>> 19 | w0l << 13) ^ (w0h << 3 | w0l >>> 29) ^ w0h >>> 6) + (w2l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x8b8cd5b5 + w2l | 0;
      th = 0xfc19dc6 + w2h + (tl >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w3l = w3l + w12l | 0;
      w3h = w3h + w12h + (w3l >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      xl = (w4l >>> 1 | w4h << 31) ^ (w4l >>> 8 | w4h << 24) ^ (w4l >>> 7 | w4h << 25) | 0;
      w3l = w3l + xl | 0;
      w3h = w3h + ((w4h >>> 1 | w4l << 31) ^ (w4h >>> 8 | w4l << 24) ^ w4h >>> 7) + (w3l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w1l >>> 19 | w1h << 13) ^ (w1l << 3 | w1h >>> 29) ^ (w1l >>> 6 | w1h << 26) | 0;
      w3l = w3l + xl | 0;
      w3h = w3h + ((w1h >>> 19 | w1l << 13) ^ (w1h << 3 | w1l >>> 29) ^ w1h >>> 6) + (w3l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x77ac9c65 + w3l | 0;
      th = 0x240ca1cc + w3h + (tl >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w4l = w4l + w13l | 0;
      w4h = w4h + w13h + (w4l >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      xl = (w5l >>> 1 | w5h << 31) ^ (w5l >>> 8 | w5h << 24) ^ (w5l >>> 7 | w5h << 25) | 0;
      w4l = w4l + xl | 0;
      w4h = w4h + ((w5h >>> 1 | w5l << 31) ^ (w5h >>> 8 | w5l << 24) ^ w5h >>> 7) + (w4l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w2l >>> 19 | w2h << 13) ^ (w2l << 3 | w2h >>> 29) ^ (w2l >>> 6 | w2h << 26) | 0;
      w4l = w4l + xl | 0;
      w4h = w4h + ((w2h >>> 19 | w2l << 13) ^ (w2h << 3 | w2l >>> 29) ^ w2h >>> 6) + (w4l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x592b0275 + w4l | 0;
      th = 0x2de92c6f + w4h + (tl >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w5l = w5l + w14l | 0;
      w5h = w5h + w14h + (w5l >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      xl = (w6l >>> 1 | w6h << 31) ^ (w6l >>> 8 | w6h << 24) ^ (w6l >>> 7 | w6h << 25) | 0;
      w5l = w5l + xl | 0;
      w5h = w5h + ((w6h >>> 1 | w6l << 31) ^ (w6h >>> 8 | w6l << 24) ^ w6h >>> 7) + (w5l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w3l >>> 19 | w3h << 13) ^ (w3l << 3 | w3h >>> 29) ^ (w3l >>> 6 | w3h << 26) | 0;
      w5l = w5l + xl | 0;
      w5h = w5h + ((w3h >>> 19 | w3l << 13) ^ (w3h << 3 | w3l >>> 29) ^ w3h >>> 6) + (w5l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x6ea6e483 + w5l | 0;
      th = 0x4a7484aa + w5h + (tl >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w6l = w6l + w15l | 0;
      w6h = w6h + w15h + (w6l >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      xl = (w7l >>> 1 | w7h << 31) ^ (w7l >>> 8 | w7h << 24) ^ (w7l >>> 7 | w7h << 25) | 0;
      w6l = w6l + xl | 0;
      w6h = w6h + ((w7h >>> 1 | w7l << 31) ^ (w7h >>> 8 | w7l << 24) ^ w7h >>> 7) + (w6l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w4l >>> 19 | w4h << 13) ^ (w4l << 3 | w4h >>> 29) ^ (w4l >>> 6 | w4h << 26) | 0;
      w6l = w6l + xl | 0;
      w6h = w6h + ((w4h >>> 19 | w4l << 13) ^ (w4h << 3 | w4l >>> 29) ^ w4h >>> 6) + (w6l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xbd41fbd4 + w6l | 0;
      th = 0x5cb0a9dc + w6h + (tl >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w7l = w7l + w0l | 0;
      w7h = w7h + w0h + (w7l >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      xl = (w8l >>> 1 | w8h << 31) ^ (w8l >>> 8 | w8h << 24) ^ (w8l >>> 7 | w8h << 25) | 0;
      w7l = w7l + xl | 0;
      w7h = w7h + ((w8h >>> 1 | w8l << 31) ^ (w8h >>> 8 | w8l << 24) ^ w8h >>> 7) + (w7l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w5l >>> 19 | w5h << 13) ^ (w5l << 3 | w5h >>> 29) ^ (w5l >>> 6 | w5h << 26) | 0;
      w7l = w7l + xl | 0;
      w7h = w7h + ((w5h >>> 19 | w5l << 13) ^ (w5h << 3 | w5l >>> 29) ^ w5h >>> 6) + (w7l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x831153b5 + w7l | 0;
      th = 0x76f988da + w7h + (tl >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w8l = w8l + w1l | 0;
      w8h = w8h + w1h + (w8l >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      xl = (w9l >>> 1 | w9h << 31) ^ (w9l >>> 8 | w9h << 24) ^ (w9l >>> 7 | w9h << 25) | 0;
      w8l = w8l + xl | 0;
      w8h = w8h + ((w9h >>> 1 | w9l << 31) ^ (w9h >>> 8 | w9l << 24) ^ w9h >>> 7) + (w8l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w6l >>> 19 | w6h << 13) ^ (w6l << 3 | w6h >>> 29) ^ (w6l >>> 6 | w6h << 26) | 0;
      w8l = w8l + xl | 0;
      w8h = w8h + ((w6h >>> 19 | w6l << 13) ^ (w6h << 3 | w6l >>> 29) ^ w6h >>> 6) + (w8l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xee66dfab + w8l | 0;
      th = 0x983e5152 + w8h + (tl >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w9l = w9l + w2l | 0;
      w9h = w9h + w2h + (w9l >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      xl = (w10l >>> 1 | w10h << 31) ^ (w10l >>> 8 | w10h << 24) ^ (w10l >>> 7 | w10h << 25) | 0;
      w9l = w9l + xl | 0;
      w9h = w9h + ((w10h >>> 1 | w10l << 31) ^ (w10h >>> 8 | w10l << 24) ^ w10h >>> 7) + (w9l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w7l >>> 19 | w7h << 13) ^ (w7l << 3 | w7h >>> 29) ^ (w7l >>> 6 | w7h << 26) | 0;
      w9l = w9l + xl | 0;
      w9h = w9h + ((w7h >>> 19 | w7l << 13) ^ (w7h << 3 | w7l >>> 29) ^ w7h >>> 6) + (w9l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x2db43210 + w9l | 0;
      th = 0xa831c66d + w9h + (tl >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w10l = w10l + w3l | 0;
      w10h = w10h + w3h + (w10l >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      xl = (w11l >>> 1 | w11h << 31) ^ (w11l >>> 8 | w11h << 24) ^ (w11l >>> 7 | w11h << 25) | 0;
      w10l = w10l + xl | 0;
      w10h = w10h + ((w11h >>> 1 | w11l << 31) ^ (w11h >>> 8 | w11l << 24) ^ w11h >>> 7) + (w10l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w8l >>> 19 | w8h << 13) ^ (w8l << 3 | w8h >>> 29) ^ (w8l >>> 6 | w8h << 26) | 0;
      w10l = w10l + xl | 0;
      w10h = w10h + ((w8h >>> 19 | w8l << 13) ^ (w8h << 3 | w8l >>> 29) ^ w8h >>> 6) + (w10l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x98fb213f + w10l | 0;
      th = 0xb00327c8 + w10h + (tl >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w11l = w11l + w4l | 0;
      w11h = w11h + w4h + (w11l >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      xl = (w12l >>> 1 | w12h << 31) ^ (w12l >>> 8 | w12h << 24) ^ (w12l >>> 7 | w12h << 25) | 0;
      w11l = w11l + xl | 0;
      w11h = w11h + ((w12h >>> 1 | w12l << 31) ^ (w12h >>> 8 | w12l << 24) ^ w12h >>> 7) + (w11l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w9l >>> 19 | w9h << 13) ^ (w9l << 3 | w9h >>> 29) ^ (w9l >>> 6 | w9h << 26) | 0;
      w11l = w11l + xl | 0;
      w11h = w11h + ((w9h >>> 19 | w9l << 13) ^ (w9h << 3 | w9l >>> 29) ^ w9h >>> 6) + (w11l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xbeef0ee4 + w11l | 0;
      th = 0xbf597fc7 + w11h + (tl >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w12l = w12l + w5l | 0;
      w12h = w12h + w5h + (w12l >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      xl = (w13l >>> 1 | w13h << 31) ^ (w13l >>> 8 | w13h << 24) ^ (w13l >>> 7 | w13h << 25) | 0;
      w12l = w12l + xl | 0;
      w12h = w12h + ((w13h >>> 1 | w13l << 31) ^ (w13h >>> 8 | w13l << 24) ^ w13h >>> 7) + (w12l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w10l >>> 19 | w10h << 13) ^ (w10l << 3 | w10h >>> 29) ^ (w10l >>> 6 | w10h << 26) | 0;
      w12l = w12l + xl | 0;
      w12h = w12h + ((w10h >>> 19 | w10l << 13) ^ (w10h << 3 | w10l >>> 29) ^ w10h >>> 6) + (w12l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x3da88fc2 + w12l | 0;
      th = 0xc6e00bf3 + w12h + (tl >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w13l = w13l + w6l | 0;
      w13h = w13h + w6h + (w13l >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      xl = (w14l >>> 1 | w14h << 31) ^ (w14l >>> 8 | w14h << 24) ^ (w14l >>> 7 | w14h << 25) | 0;
      w13l = w13l + xl | 0;
      w13h = w13h + ((w14h >>> 1 | w14l << 31) ^ (w14h >>> 8 | w14l << 24) ^ w14h >>> 7) + (w13l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w11l >>> 19 | w11h << 13) ^ (w11l << 3 | w11h >>> 29) ^ (w11l >>> 6 | w11h << 26) | 0;
      w13l = w13l + xl | 0;
      w13h = w13h + ((w11h >>> 19 | w11l << 13) ^ (w11h << 3 | w11l >>> 29) ^ w11h >>> 6) + (w13l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x930aa725 + w13l | 0;
      th = 0xd5a79147 + w13h + (tl >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w14l = w14l + w7l | 0;
      w14h = w14h + w7h + (w14l >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      xl = (w15l >>> 1 | w15h << 31) ^ (w15l >>> 8 | w15h << 24) ^ (w15l >>> 7 | w15h << 25) | 0;
      w14l = w14l + xl | 0;
      w14h = w14h + ((w15h >>> 1 | w15l << 31) ^ (w15h >>> 8 | w15l << 24) ^ w15h >>> 7) + (w14l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w12l >>> 19 | w12h << 13) ^ (w12l << 3 | w12h >>> 29) ^ (w12l >>> 6 | w12h << 26) | 0;
      w14l = w14l + xl | 0;
      w14h = w14h + ((w12h >>> 19 | w12l << 13) ^ (w12h << 3 | w12l >>> 29) ^ w12h >>> 6) + (w14l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xe003826f + w14l | 0;
      th = 0x6ca6351 + w14h + (tl >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w15l = w15l + w8l | 0;
      w15h = w15h + w8h + (w15l >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      xl = (w0l >>> 1 | w0h << 31) ^ (w0l >>> 8 | w0h << 24) ^ (w0l >>> 7 | w0h << 25) | 0;
      w15l = w15l + xl | 0;
      w15h = w15h + ((w0h >>> 1 | w0l << 31) ^ (w0h >>> 8 | w0l << 24) ^ w0h >>> 7) + (w15l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w13l >>> 19 | w13h << 13) ^ (w13l << 3 | w13h >>> 29) ^ (w13l >>> 6 | w13h << 26) | 0;
      w15l = w15l + xl | 0;
      w15h = w15h + ((w13h >>> 19 | w13l << 13) ^ (w13h << 3 | w13l >>> 29) ^ w13h >>> 6) + (w15l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xa0e6e70 + w15l | 0;
      th = 0x14292967 + w15h + (tl >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w0l = w0l + w9l | 0;
      w0h = w0h + w9h + (w0l >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      xl = (w1l >>> 1 | w1h << 31) ^ (w1l >>> 8 | w1h << 24) ^ (w1l >>> 7 | w1h << 25) | 0;
      w0l = w0l + xl | 0;
      w0h = w0h + ((w1h >>> 1 | w1l << 31) ^ (w1h >>> 8 | w1l << 24) ^ w1h >>> 7) + (w0l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w14l >>> 19 | w14h << 13) ^ (w14l << 3 | w14h >>> 29) ^ (w14l >>> 6 | w14h << 26) | 0;
      w0l = w0l + xl | 0;
      w0h = w0h + ((w14h >>> 19 | w14l << 13) ^ (w14h << 3 | w14l >>> 29) ^ w14h >>> 6) + (w0l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x46d22ffc + w0l | 0;
      th = 0x27b70a85 + w0h + (tl >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w1l = w1l + w10l | 0;
      w1h = w1h + w10h + (w1l >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      xl = (w2l >>> 1 | w2h << 31) ^ (w2l >>> 8 | w2h << 24) ^ (w2l >>> 7 | w2h << 25) | 0;
      w1l = w1l + xl | 0;
      w1h = w1h + ((w2h >>> 1 | w2l << 31) ^ (w2h >>> 8 | w2l << 24) ^ w2h >>> 7) + (w1l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w15l >>> 19 | w15h << 13) ^ (w15l << 3 | w15h >>> 29) ^ (w15l >>> 6 | w15h << 26) | 0;
      w1l = w1l + xl | 0;
      w1h = w1h + ((w15h >>> 19 | w15l << 13) ^ (w15h << 3 | w15l >>> 29) ^ w15h >>> 6) + (w1l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x5c26c926 + w1l | 0;
      th = 0x2e1b2138 + w1h + (tl >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w2l = w2l + w11l | 0;
      w2h = w2h + w11h + (w2l >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      xl = (w3l >>> 1 | w3h << 31) ^ (w3l >>> 8 | w3h << 24) ^ (w3l >>> 7 | w3h << 25) | 0;
      w2l = w2l + xl | 0;
      w2h = w2h + ((w3h >>> 1 | w3l << 31) ^ (w3h >>> 8 | w3l << 24) ^ w3h >>> 7) + (w2l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w0l >>> 19 | w0h << 13) ^ (w0l << 3 | w0h >>> 29) ^ (w0l >>> 6 | w0h << 26) | 0;
      w2l = w2l + xl | 0;
      w2h = w2h + ((w0h >>> 19 | w0l << 13) ^ (w0h << 3 | w0l >>> 29) ^ w0h >>> 6) + (w2l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x5ac42aed + w2l | 0;
      th = 0x4d2c6dfc + w2h + (tl >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w3l = w3l + w12l | 0;
      w3h = w3h + w12h + (w3l >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      xl = (w4l >>> 1 | w4h << 31) ^ (w4l >>> 8 | w4h << 24) ^ (w4l >>> 7 | w4h << 25) | 0;
      w3l = w3l + xl | 0;
      w3h = w3h + ((w4h >>> 1 | w4l << 31) ^ (w4h >>> 8 | w4l << 24) ^ w4h >>> 7) + (w3l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w1l >>> 19 | w1h << 13) ^ (w1l << 3 | w1h >>> 29) ^ (w1l >>> 6 | w1h << 26) | 0;
      w3l = w3l + xl | 0;
      w3h = w3h + ((w1h >>> 19 | w1l << 13) ^ (w1h << 3 | w1l >>> 29) ^ w1h >>> 6) + (w3l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x9d95b3df + w3l | 0;
      th = 0x53380d13 + w3h + (tl >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w4l = w4l + w13l | 0;
      w4h = w4h + w13h + (w4l >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      xl = (w5l >>> 1 | w5h << 31) ^ (w5l >>> 8 | w5h << 24) ^ (w5l >>> 7 | w5h << 25) | 0;
      w4l = w4l + xl | 0;
      w4h = w4h + ((w5h >>> 1 | w5l << 31) ^ (w5h >>> 8 | w5l << 24) ^ w5h >>> 7) + (w4l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w2l >>> 19 | w2h << 13) ^ (w2l << 3 | w2h >>> 29) ^ (w2l >>> 6 | w2h << 26) | 0;
      w4l = w4l + xl | 0;
      w4h = w4h + ((w2h >>> 19 | w2l << 13) ^ (w2h << 3 | w2l >>> 29) ^ w2h >>> 6) + (w4l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x8baf63de + w4l | 0;
      th = 0x650a7354 + w4h + (tl >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w5l = w5l + w14l | 0;
      w5h = w5h + w14h + (w5l >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      xl = (w6l >>> 1 | w6h << 31) ^ (w6l >>> 8 | w6h << 24) ^ (w6l >>> 7 | w6h << 25) | 0;
      w5l = w5l + xl | 0;
      w5h = w5h + ((w6h >>> 1 | w6l << 31) ^ (w6h >>> 8 | w6l << 24) ^ w6h >>> 7) + (w5l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w3l >>> 19 | w3h << 13) ^ (w3l << 3 | w3h >>> 29) ^ (w3l >>> 6 | w3h << 26) | 0;
      w5l = w5l + xl | 0;
      w5h = w5h + ((w3h >>> 19 | w3l << 13) ^ (w3h << 3 | w3l >>> 29) ^ w3h >>> 6) + (w5l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x3c77b2a8 + w5l | 0;
      th = 0x766a0abb + w5h + (tl >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w6l = w6l + w15l | 0;
      w6h = w6h + w15h + (w6l >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      xl = (w7l >>> 1 | w7h << 31) ^ (w7l >>> 8 | w7h << 24) ^ (w7l >>> 7 | w7h << 25) | 0;
      w6l = w6l + xl | 0;
      w6h = w6h + ((w7h >>> 1 | w7l << 31) ^ (w7h >>> 8 | w7l << 24) ^ w7h >>> 7) + (w6l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w4l >>> 19 | w4h << 13) ^ (w4l << 3 | w4h >>> 29) ^ (w4l >>> 6 | w4h << 26) | 0;
      w6l = w6l + xl | 0;
      w6h = w6h + ((w4h >>> 19 | w4l << 13) ^ (w4h << 3 | w4l >>> 29) ^ w4h >>> 6) + (w6l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x47edaee6 + w6l | 0;
      th = 0x81c2c92e + w6h + (tl >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w7l = w7l + w0l | 0;
      w7h = w7h + w0h + (w7l >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      xl = (w8l >>> 1 | w8h << 31) ^ (w8l >>> 8 | w8h << 24) ^ (w8l >>> 7 | w8h << 25) | 0;
      w7l = w7l + xl | 0;
      w7h = w7h + ((w8h >>> 1 | w8l << 31) ^ (w8h >>> 8 | w8l << 24) ^ w8h >>> 7) + (w7l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w5l >>> 19 | w5h << 13) ^ (w5l << 3 | w5h >>> 29) ^ (w5l >>> 6 | w5h << 26) | 0;
      w7l = w7l + xl | 0;
      w7h = w7h + ((w5h >>> 19 | w5l << 13) ^ (w5h << 3 | w5l >>> 29) ^ w5h >>> 6) + (w7l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x1482353b + w7l | 0;
      th = 0x92722c85 + w7h + (tl >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w8l = w8l + w1l | 0;
      w8h = w8h + w1h + (w8l >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      xl = (w9l >>> 1 | w9h << 31) ^ (w9l >>> 8 | w9h << 24) ^ (w9l >>> 7 | w9h << 25) | 0;
      w8l = w8l + xl | 0;
      w8h = w8h + ((w9h >>> 1 | w9l << 31) ^ (w9h >>> 8 | w9l << 24) ^ w9h >>> 7) + (w8l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w6l >>> 19 | w6h << 13) ^ (w6l << 3 | w6h >>> 29) ^ (w6l >>> 6 | w6h << 26) | 0;
      w8l = w8l + xl | 0;
      w8h = w8h + ((w6h >>> 19 | w6l << 13) ^ (w6h << 3 | w6l >>> 29) ^ w6h >>> 6) + (w8l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x4cf10364 + w8l | 0;
      th = 0xa2bfe8a1 + w8h + (tl >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w9l = w9l + w2l | 0;
      w9h = w9h + w2h + (w9l >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      xl = (w10l >>> 1 | w10h << 31) ^ (w10l >>> 8 | w10h << 24) ^ (w10l >>> 7 | w10h << 25) | 0;
      w9l = w9l + xl | 0;
      w9h = w9h + ((w10h >>> 1 | w10l << 31) ^ (w10h >>> 8 | w10l << 24) ^ w10h >>> 7) + (w9l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w7l >>> 19 | w7h << 13) ^ (w7l << 3 | w7h >>> 29) ^ (w7l >>> 6 | w7h << 26) | 0;
      w9l = w9l + xl | 0;
      w9h = w9h + ((w7h >>> 19 | w7l << 13) ^ (w7h << 3 | w7l >>> 29) ^ w7h >>> 6) + (w9l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xbc423001 + w9l | 0;
      th = 0xa81a664b + w9h + (tl >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w10l = w10l + w3l | 0;
      w10h = w10h + w3h + (w10l >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      xl = (w11l >>> 1 | w11h << 31) ^ (w11l >>> 8 | w11h << 24) ^ (w11l >>> 7 | w11h << 25) | 0;
      w10l = w10l + xl | 0;
      w10h = w10h + ((w11h >>> 1 | w11l << 31) ^ (w11h >>> 8 | w11l << 24) ^ w11h >>> 7) + (w10l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w8l >>> 19 | w8h << 13) ^ (w8l << 3 | w8h >>> 29) ^ (w8l >>> 6 | w8h << 26) | 0;
      w10l = w10l + xl | 0;
      w10h = w10h + ((w8h >>> 19 | w8l << 13) ^ (w8h << 3 | w8l >>> 29) ^ w8h >>> 6) + (w10l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xd0f89791 + w10l | 0;
      th = 0xc24b8b70 + w10h + (tl >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w11l = w11l + w4l | 0;
      w11h = w11h + w4h + (w11l >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      xl = (w12l >>> 1 | w12h << 31) ^ (w12l >>> 8 | w12h << 24) ^ (w12l >>> 7 | w12h << 25) | 0;
      w11l = w11l + xl | 0;
      w11h = w11h + ((w12h >>> 1 | w12l << 31) ^ (w12h >>> 8 | w12l << 24) ^ w12h >>> 7) + (w11l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w9l >>> 19 | w9h << 13) ^ (w9l << 3 | w9h >>> 29) ^ (w9l >>> 6 | w9h << 26) | 0;
      w11l = w11l + xl | 0;
      w11h = w11h + ((w9h >>> 19 | w9l << 13) ^ (w9h << 3 | w9l >>> 29) ^ w9h >>> 6) + (w11l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x654be30 + w11l | 0;
      th = 0xc76c51a3 + w11h + (tl >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w12l = w12l + w5l | 0;
      w12h = w12h + w5h + (w12l >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      xl = (w13l >>> 1 | w13h << 31) ^ (w13l >>> 8 | w13h << 24) ^ (w13l >>> 7 | w13h << 25) | 0;
      w12l = w12l + xl | 0;
      w12h = w12h + ((w13h >>> 1 | w13l << 31) ^ (w13h >>> 8 | w13l << 24) ^ w13h >>> 7) + (w12l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w10l >>> 19 | w10h << 13) ^ (w10l << 3 | w10h >>> 29) ^ (w10l >>> 6 | w10h << 26) | 0;
      w12l = w12l + xl | 0;
      w12h = w12h + ((w10h >>> 19 | w10l << 13) ^ (w10h << 3 | w10l >>> 29) ^ w10h >>> 6) + (w12l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xd6ef5218 + w12l | 0;
      th = 0xd192e819 + w12h + (tl >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w13l = w13l + w6l | 0;
      w13h = w13h + w6h + (w13l >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      xl = (w14l >>> 1 | w14h << 31) ^ (w14l >>> 8 | w14h << 24) ^ (w14l >>> 7 | w14h << 25) | 0;
      w13l = w13l + xl | 0;
      w13h = w13h + ((w14h >>> 1 | w14l << 31) ^ (w14h >>> 8 | w14l << 24) ^ w14h >>> 7) + (w13l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w11l >>> 19 | w11h << 13) ^ (w11l << 3 | w11h >>> 29) ^ (w11l >>> 6 | w11h << 26) | 0;
      w13l = w13l + xl | 0;
      w13h = w13h + ((w11h >>> 19 | w11l << 13) ^ (w11h << 3 | w11l >>> 29) ^ w11h >>> 6) + (w13l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x5565a910 + w13l | 0;
      th = 0xd6990624 + w13h + (tl >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w14l = w14l + w7l | 0;
      w14h = w14h + w7h + (w14l >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      xl = (w15l >>> 1 | w15h << 31) ^ (w15l >>> 8 | w15h << 24) ^ (w15l >>> 7 | w15h << 25) | 0;
      w14l = w14l + xl | 0;
      w14h = w14h + ((w15h >>> 1 | w15l << 31) ^ (w15h >>> 8 | w15l << 24) ^ w15h >>> 7) + (w14l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w12l >>> 19 | w12h << 13) ^ (w12l << 3 | w12h >>> 29) ^ (w12l >>> 6 | w12h << 26) | 0;
      w14l = w14l + xl | 0;
      w14h = w14h + ((w12h >>> 19 | w12l << 13) ^ (w12h << 3 | w12l >>> 29) ^ w12h >>> 6) + (w14l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x5771202a + w14l | 0;
      th = 0xf40e3585 + w14h + (tl >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w15l = w15l + w8l | 0;
      w15h = w15h + w8h + (w15l >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      xl = (w0l >>> 1 | w0h << 31) ^ (w0l >>> 8 | w0h << 24) ^ (w0l >>> 7 | w0h << 25) | 0;
      w15l = w15l + xl | 0;
      w15h = w15h + ((w0h >>> 1 | w0l << 31) ^ (w0h >>> 8 | w0l << 24) ^ w0h >>> 7) + (w15l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w13l >>> 19 | w13h << 13) ^ (w13l << 3 | w13h >>> 29) ^ (w13l >>> 6 | w13h << 26) | 0;
      w15l = w15l + xl | 0;
      w15h = w15h + ((w13h >>> 19 | w13l << 13) ^ (w13h << 3 | w13l >>> 29) ^ w13h >>> 6) + (w15l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x32bbd1b8 + w15l | 0;
      th = 0x106aa070 + w15h + (tl >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w0l = w0l + w9l | 0;
      w0h = w0h + w9h + (w0l >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      xl = (w1l >>> 1 | w1h << 31) ^ (w1l >>> 8 | w1h << 24) ^ (w1l >>> 7 | w1h << 25) | 0;
      w0l = w0l + xl | 0;
      w0h = w0h + ((w1h >>> 1 | w1l << 31) ^ (w1h >>> 8 | w1l << 24) ^ w1h >>> 7) + (w0l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w14l >>> 19 | w14h << 13) ^ (w14l << 3 | w14h >>> 29) ^ (w14l >>> 6 | w14h << 26) | 0;
      w0l = w0l + xl | 0;
      w0h = w0h + ((w14h >>> 19 | w14l << 13) ^ (w14h << 3 | w14l >>> 29) ^ w14h >>> 6) + (w0l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xb8d2d0c8 + w0l | 0;
      th = 0x19a4c116 + w0h + (tl >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w1l = w1l + w10l | 0;
      w1h = w1h + w10h + (w1l >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      xl = (w2l >>> 1 | w2h << 31) ^ (w2l >>> 8 | w2h << 24) ^ (w2l >>> 7 | w2h << 25) | 0;
      w1l = w1l + xl | 0;
      w1h = w1h + ((w2h >>> 1 | w2l << 31) ^ (w2h >>> 8 | w2l << 24) ^ w2h >>> 7) + (w1l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w15l >>> 19 | w15h << 13) ^ (w15l << 3 | w15h >>> 29) ^ (w15l >>> 6 | w15h << 26) | 0;
      w1l = w1l + xl | 0;
      w1h = w1h + ((w15h >>> 19 | w15l << 13) ^ (w15h << 3 | w15l >>> 29) ^ w15h >>> 6) + (w1l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x5141ab53 + w1l | 0;
      th = 0x1e376c08 + w1h + (tl >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w2l = w2l + w11l | 0;
      w2h = w2h + w11h + (w2l >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      xl = (w3l >>> 1 | w3h << 31) ^ (w3l >>> 8 | w3h << 24) ^ (w3l >>> 7 | w3h << 25) | 0;
      w2l = w2l + xl | 0;
      w2h = w2h + ((w3h >>> 1 | w3l << 31) ^ (w3h >>> 8 | w3l << 24) ^ w3h >>> 7) + (w2l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w0l >>> 19 | w0h << 13) ^ (w0l << 3 | w0h >>> 29) ^ (w0l >>> 6 | w0h << 26) | 0;
      w2l = w2l + xl | 0;
      w2h = w2h + ((w0h >>> 19 | w0l << 13) ^ (w0h << 3 | w0l >>> 29) ^ w0h >>> 6) + (w2l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xdf8eeb99 + w2l | 0;
      th = 0x2748774c + w2h + (tl >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w3l = w3l + w12l | 0;
      w3h = w3h + w12h + (w3l >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      xl = (w4l >>> 1 | w4h << 31) ^ (w4l >>> 8 | w4h << 24) ^ (w4l >>> 7 | w4h << 25) | 0;
      w3l = w3l + xl | 0;
      w3h = w3h + ((w4h >>> 1 | w4l << 31) ^ (w4h >>> 8 | w4l << 24) ^ w4h >>> 7) + (w3l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w1l >>> 19 | w1h << 13) ^ (w1l << 3 | w1h >>> 29) ^ (w1l >>> 6 | w1h << 26) | 0;
      w3l = w3l + xl | 0;
      w3h = w3h + ((w1h >>> 19 | w1l << 13) ^ (w1h << 3 | w1l >>> 29) ^ w1h >>> 6) + (w3l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xe19b48a8 + w3l | 0;
      th = 0x34b0bcb5 + w3h + (tl >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w4l = w4l + w13l | 0;
      w4h = w4h + w13h + (w4l >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      xl = (w5l >>> 1 | w5h << 31) ^ (w5l >>> 8 | w5h << 24) ^ (w5l >>> 7 | w5h << 25) | 0;
      w4l = w4l + xl | 0;
      w4h = w4h + ((w5h >>> 1 | w5l << 31) ^ (w5h >>> 8 | w5l << 24) ^ w5h >>> 7) + (w4l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w2l >>> 19 | w2h << 13) ^ (w2l << 3 | w2h >>> 29) ^ (w2l >>> 6 | w2h << 26) | 0;
      w4l = w4l + xl | 0;
      w4h = w4h + ((w2h >>> 19 | w2l << 13) ^ (w2h << 3 | w2l >>> 29) ^ w2h >>> 6) + (w4l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xc5c95a63 + w4l | 0;
      th = 0x391c0cb3 + w4h + (tl >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w5l = w5l + w14l | 0;
      w5h = w5h + w14h + (w5l >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      xl = (w6l >>> 1 | w6h << 31) ^ (w6l >>> 8 | w6h << 24) ^ (w6l >>> 7 | w6h << 25) | 0;
      w5l = w5l + xl | 0;
      w5h = w5h + ((w6h >>> 1 | w6l << 31) ^ (w6h >>> 8 | w6l << 24) ^ w6h >>> 7) + (w5l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w3l >>> 19 | w3h << 13) ^ (w3l << 3 | w3h >>> 29) ^ (w3l >>> 6 | w3h << 26) | 0;
      w5l = w5l + xl | 0;
      w5h = w5h + ((w3h >>> 19 | w3l << 13) ^ (w3h << 3 | w3l >>> 29) ^ w3h >>> 6) + (w5l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xe3418acb + w5l | 0;
      th = 0x4ed8aa4a + w5h + (tl >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w6l = w6l + w15l | 0;
      w6h = w6h + w15h + (w6l >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      xl = (w7l >>> 1 | w7h << 31) ^ (w7l >>> 8 | w7h << 24) ^ (w7l >>> 7 | w7h << 25) | 0;
      w6l = w6l + xl | 0;
      w6h = w6h + ((w7h >>> 1 | w7l << 31) ^ (w7h >>> 8 | w7l << 24) ^ w7h >>> 7) + (w6l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w4l >>> 19 | w4h << 13) ^ (w4l << 3 | w4h >>> 29) ^ (w4l >>> 6 | w4h << 26) | 0;
      w6l = w6l + xl | 0;
      w6h = w6h + ((w4h >>> 19 | w4l << 13) ^ (w4h << 3 | w4l >>> 29) ^ w4h >>> 6) + (w6l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x7763e373 + w6l | 0;
      th = 0x5b9cca4f + w6h + (tl >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w7l = w7l + w0l | 0;
      w7h = w7h + w0h + (w7l >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      xl = (w8l >>> 1 | w8h << 31) ^ (w8l >>> 8 | w8h << 24) ^ (w8l >>> 7 | w8h << 25) | 0;
      w7l = w7l + xl | 0;
      w7h = w7h + ((w8h >>> 1 | w8l << 31) ^ (w8h >>> 8 | w8l << 24) ^ w8h >>> 7) + (w7l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w5l >>> 19 | w5h << 13) ^ (w5l << 3 | w5h >>> 29) ^ (w5l >>> 6 | w5h << 26) | 0;
      w7l = w7l + xl | 0;
      w7h = w7h + ((w5h >>> 19 | w5l << 13) ^ (w5h << 3 | w5l >>> 29) ^ w5h >>> 6) + (w7l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xd6b2b8a3 + w7l | 0;
      th = 0x682e6ff3 + w7h + (tl >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w8l = w8l + w1l | 0;
      w8h = w8h + w1h + (w8l >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      xl = (w9l >>> 1 | w9h << 31) ^ (w9l >>> 8 | w9h << 24) ^ (w9l >>> 7 | w9h << 25) | 0;
      w8l = w8l + xl | 0;
      w8h = w8h + ((w9h >>> 1 | w9l << 31) ^ (w9h >>> 8 | w9l << 24) ^ w9h >>> 7) + (w8l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w6l >>> 19 | w6h << 13) ^ (w6l << 3 | w6h >>> 29) ^ (w6l >>> 6 | w6h << 26) | 0;
      w8l = w8l + xl | 0;
      w8h = w8h + ((w6h >>> 19 | w6l << 13) ^ (w6h << 3 | w6l >>> 29) ^ w6h >>> 6) + (w8l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x5defb2fc + w8l | 0;
      th = 0x748f82ee + w8h + (tl >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w9l = w9l + w2l | 0;
      w9h = w9h + w2h + (w9l >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      xl = (w10l >>> 1 | w10h << 31) ^ (w10l >>> 8 | w10h << 24) ^ (w10l >>> 7 | w10h << 25) | 0;
      w9l = w9l + xl | 0;
      w9h = w9h + ((w10h >>> 1 | w10l << 31) ^ (w10h >>> 8 | w10l << 24) ^ w10h >>> 7) + (w9l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w7l >>> 19 | w7h << 13) ^ (w7l << 3 | w7h >>> 29) ^ (w7l >>> 6 | w7h << 26) | 0;
      w9l = w9l + xl | 0;
      w9h = w9h + ((w7h >>> 19 | w7l << 13) ^ (w7h << 3 | w7l >>> 29) ^ w7h >>> 6) + (w9l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x43172f60 + w9l | 0;
      th = 0x78a5636f + w9h + (tl >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w10l = w10l + w3l | 0;
      w10h = w10h + w3h + (w10l >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      xl = (w11l >>> 1 | w11h << 31) ^ (w11l >>> 8 | w11h << 24) ^ (w11l >>> 7 | w11h << 25) | 0;
      w10l = w10l + xl | 0;
      w10h = w10h + ((w11h >>> 1 | w11l << 31) ^ (w11h >>> 8 | w11l << 24) ^ w11h >>> 7) + (w10l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w8l >>> 19 | w8h << 13) ^ (w8l << 3 | w8h >>> 29) ^ (w8l >>> 6 | w8h << 26) | 0;
      w10l = w10l + xl | 0;
      w10h = w10h + ((w8h >>> 19 | w8l << 13) ^ (w8h << 3 | w8l >>> 29) ^ w8h >>> 6) + (w10l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xa1f0ab72 + w10l | 0;
      th = 0x84c87814 + w10h + (tl >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w11l = w11l + w4l | 0;
      w11h = w11h + w4h + (w11l >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      xl = (w12l >>> 1 | w12h << 31) ^ (w12l >>> 8 | w12h << 24) ^ (w12l >>> 7 | w12h << 25) | 0;
      w11l = w11l + xl | 0;
      w11h = w11h + ((w12h >>> 1 | w12l << 31) ^ (w12h >>> 8 | w12l << 24) ^ w12h >>> 7) + (w11l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w9l >>> 19 | w9h << 13) ^ (w9l << 3 | w9h >>> 29) ^ (w9l >>> 6 | w9h << 26) | 0;
      w11l = w11l + xl | 0;
      w11h = w11h + ((w9h >>> 19 | w9l << 13) ^ (w9h << 3 | w9l >>> 29) ^ w9h >>> 6) + (w11l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x1a6439ec + w11l | 0;
      th = 0x8cc70208 + w11h + (tl >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w12l = w12l + w5l | 0;
      w12h = w12h + w5h + (w12l >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      xl = (w13l >>> 1 | w13h << 31) ^ (w13l >>> 8 | w13h << 24) ^ (w13l >>> 7 | w13h << 25) | 0;
      w12l = w12l + xl | 0;
      w12h = w12h + ((w13h >>> 1 | w13l << 31) ^ (w13h >>> 8 | w13l << 24) ^ w13h >>> 7) + (w12l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w10l >>> 19 | w10h << 13) ^ (w10l << 3 | w10h >>> 29) ^ (w10l >>> 6 | w10h << 26) | 0;
      w12l = w12l + xl | 0;
      w12h = w12h + ((w10h >>> 19 | w10l << 13) ^ (w10h << 3 | w10l >>> 29) ^ w10h >>> 6) + (w12l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x23631e28 + w12l | 0;
      th = 0x90befffa + w12h + (tl >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w13l = w13l + w6l | 0;
      w13h = w13h + w6h + (w13l >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      xl = (w14l >>> 1 | w14h << 31) ^ (w14l >>> 8 | w14h << 24) ^ (w14l >>> 7 | w14h << 25) | 0;
      w13l = w13l + xl | 0;
      w13h = w13h + ((w14h >>> 1 | w14l << 31) ^ (w14h >>> 8 | w14l << 24) ^ w14h >>> 7) + (w13l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w11l >>> 19 | w11h << 13) ^ (w11l << 3 | w11h >>> 29) ^ (w11l >>> 6 | w11h << 26) | 0;
      w13l = w13l + xl | 0;
      w13h = w13h + ((w11h >>> 19 | w11l << 13) ^ (w11h << 3 | w11l >>> 29) ^ w11h >>> 6) + (w13l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xde82bde9 + w13l | 0;
      th = 0xa4506ceb + w13h + (tl >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w14l = w14l + w7l | 0;
      w14h = w14h + w7h + (w14l >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      xl = (w15l >>> 1 | w15h << 31) ^ (w15l >>> 8 | w15h << 24) ^ (w15l >>> 7 | w15h << 25) | 0;
      w14l = w14l + xl | 0;
      w14h = w14h + ((w15h >>> 1 | w15l << 31) ^ (w15h >>> 8 | w15l << 24) ^ w15h >>> 7) + (w14l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w12l >>> 19 | w12h << 13) ^ (w12l << 3 | w12h >>> 29) ^ (w12l >>> 6 | w12h << 26) | 0;
      w14l = w14l + xl | 0;
      w14h = w14h + ((w12h >>> 19 | w12l << 13) ^ (w12h << 3 | w12l >>> 29) ^ w12h >>> 6) + (w14l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xb2c67915 + w14l | 0;
      th = 0xbef9a3f7 + w14h + (tl >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w15l = w15l + w8l | 0;
      w15h = w15h + w8h + (w15l >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      xl = (w0l >>> 1 | w0h << 31) ^ (w0l >>> 8 | w0h << 24) ^ (w0l >>> 7 | w0h << 25) | 0;
      w15l = w15l + xl | 0;
      w15h = w15h + ((w0h >>> 1 | w0l << 31) ^ (w0h >>> 8 | w0l << 24) ^ w0h >>> 7) + (w15l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w13l >>> 19 | w13h << 13) ^ (w13l << 3 | w13h >>> 29) ^ (w13l >>> 6 | w13h << 26) | 0;
      w15l = w15l + xl | 0;
      w15h = w15h + ((w13h >>> 19 | w13l << 13) ^ (w13h << 3 | w13l >>> 29) ^ w13h >>> 6) + (w15l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xe372532b + w15l | 0;
      th = 0xc67178f2 + w15h + (tl >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w0l = w0l + w9l | 0;
      w0h = w0h + w9h + (w0l >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      xl = (w1l >>> 1 | w1h << 31) ^ (w1l >>> 8 | w1h << 24) ^ (w1l >>> 7 | w1h << 25) | 0;
      w0l = w0l + xl | 0;
      w0h = w0h + ((w1h >>> 1 | w1l << 31) ^ (w1h >>> 8 | w1l << 24) ^ w1h >>> 7) + (w0l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w14l >>> 19 | w14h << 13) ^ (w14l << 3 | w14h >>> 29) ^ (w14l >>> 6 | w14h << 26) | 0;
      w0l = w0l + xl | 0;
      w0h = w0h + ((w14h >>> 19 | w14l << 13) ^ (w14h << 3 | w14l >>> 29) ^ w14h >>> 6) + (w0l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xea26619c + w0l | 0;
      th = 0xca273ece + w0h + (tl >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w1l = w1l + w10l | 0;
      w1h = w1h + w10h + (w1l >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      xl = (w2l >>> 1 | w2h << 31) ^ (w2l >>> 8 | w2h << 24) ^ (w2l >>> 7 | w2h << 25) | 0;
      w1l = w1l + xl | 0;
      w1h = w1h + ((w2h >>> 1 | w2l << 31) ^ (w2h >>> 8 | w2l << 24) ^ w2h >>> 7) + (w1l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w15l >>> 19 | w15h << 13) ^ (w15l << 3 | w15h >>> 29) ^ (w15l >>> 6 | w15h << 26) | 0;
      w1l = w1l + xl | 0;
      w1h = w1h + ((w15h >>> 19 | w15l << 13) ^ (w15h << 3 | w15l >>> 29) ^ w15h >>> 6) + (w1l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x21c0c207 + w1l | 0;
      th = 0xd186b8c7 + w1h + (tl >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w2l = w2l + w11l | 0;
      w2h = w2h + w11h + (w2l >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      xl = (w3l >>> 1 | w3h << 31) ^ (w3l >>> 8 | w3h << 24) ^ (w3l >>> 7 | w3h << 25) | 0;
      w2l = w2l + xl | 0;
      w2h = w2h + ((w3h >>> 1 | w3l << 31) ^ (w3h >>> 8 | w3l << 24) ^ w3h >>> 7) + (w2l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w0l >>> 19 | w0h << 13) ^ (w0l << 3 | w0h >>> 29) ^ (w0l >>> 6 | w0h << 26) | 0;
      w2l = w2l + xl | 0;
      w2h = w2h + ((w0h >>> 19 | w0l << 13) ^ (w0h << 3 | w0l >>> 29) ^ w0h >>> 6) + (w2l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xcde0eb1e + w2l | 0;
      th = 0xeada7dd6 + w2h + (tl >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w3l = w3l + w12l | 0;
      w3h = w3h + w12h + (w3l >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      xl = (w4l >>> 1 | w4h << 31) ^ (w4l >>> 8 | w4h << 24) ^ (w4l >>> 7 | w4h << 25) | 0;
      w3l = w3l + xl | 0;
      w3h = w3h + ((w4h >>> 1 | w4l << 31) ^ (w4h >>> 8 | w4l << 24) ^ w4h >>> 7) + (w3l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w1l >>> 19 | w1h << 13) ^ (w1l << 3 | w1h >>> 29) ^ (w1l >>> 6 | w1h << 26) | 0;
      w3l = w3l + xl | 0;
      w3h = w3h + ((w1h >>> 19 | w1l << 13) ^ (w1h << 3 | w1l >>> 29) ^ w1h >>> 6) + (w3l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xee6ed178 + w3l | 0;
      th = 0xf57d4f7f + w3h + (tl >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w4l = w4l + w13l | 0;
      w4h = w4h + w13h + (w4l >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      xl = (w5l >>> 1 | w5h << 31) ^ (w5l >>> 8 | w5h << 24) ^ (w5l >>> 7 | w5h << 25) | 0;
      w4l = w4l + xl | 0;
      w4h = w4h + ((w5h >>> 1 | w5l << 31) ^ (w5h >>> 8 | w5l << 24) ^ w5h >>> 7) + (w4l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w2l >>> 19 | w2h << 13) ^ (w2l << 3 | w2h >>> 29) ^ (w2l >>> 6 | w2h << 26) | 0;
      w4l = w4l + xl | 0;
      w4h = w4h + ((w2h >>> 19 | w2l << 13) ^ (w2h << 3 | w2l >>> 29) ^ w2h >>> 6) + (w4l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x72176fba + w4l | 0;
      th = 0x6f067aa + w4h + (tl >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w5l = w5l + w14l | 0;
      w5h = w5h + w14h + (w5l >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      xl = (w6l >>> 1 | w6h << 31) ^ (w6l >>> 8 | w6h << 24) ^ (w6l >>> 7 | w6h << 25) | 0;
      w5l = w5l + xl | 0;
      w5h = w5h + ((w6h >>> 1 | w6l << 31) ^ (w6h >>> 8 | w6l << 24) ^ w6h >>> 7) + (w5l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w3l >>> 19 | w3h << 13) ^ (w3l << 3 | w3h >>> 29) ^ (w3l >>> 6 | w3h << 26) | 0;
      w5l = w5l + xl | 0;
      w5h = w5h + ((w3h >>> 19 | w3l << 13) ^ (w3h << 3 | w3l >>> 29) ^ w3h >>> 6) + (w5l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xa2c898a6 + w5l | 0;
      th = 0xa637dc5 + w5h + (tl >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w6l = w6l + w15l | 0;
      w6h = w6h + w15h + (w6l >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      xl = (w7l >>> 1 | w7h << 31) ^ (w7l >>> 8 | w7h << 24) ^ (w7l >>> 7 | w7h << 25) | 0;
      w6l = w6l + xl | 0;
      w6h = w6h + ((w7h >>> 1 | w7l << 31) ^ (w7h >>> 8 | w7l << 24) ^ w7h >>> 7) + (w6l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w4l >>> 19 | w4h << 13) ^ (w4l << 3 | w4h >>> 29) ^ (w4l >>> 6 | w4h << 26) | 0;
      w6l = w6l + xl | 0;
      w6h = w6h + ((w4h >>> 19 | w4l << 13) ^ (w4h << 3 | w4l >>> 29) ^ w4h >>> 6) + (w6l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xbef90dae + w6l | 0;
      th = 0x113f9804 + w6h + (tl >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w7l = w7l + w0l | 0;
      w7h = w7h + w0h + (w7l >>> 0 < w0l >>> 0 ? 1 : 0) | 0;
      xl = (w8l >>> 1 | w8h << 31) ^ (w8l >>> 8 | w8h << 24) ^ (w8l >>> 7 | w8h << 25) | 0;
      w7l = w7l + xl | 0;
      w7h = w7h + ((w8h >>> 1 | w8l << 31) ^ (w8h >>> 8 | w8l << 24) ^ w8h >>> 7) + (w7l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w5l >>> 19 | w5h << 13) ^ (w5l << 3 | w5h >>> 29) ^ (w5l >>> 6 | w5h << 26) | 0;
      w7l = w7l + xl | 0;
      w7h = w7h + ((w5h >>> 19 | w5l << 13) ^ (w5h << 3 | w5l >>> 29) ^ w5h >>> 6) + (w7l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x131c471b + w7l | 0;
      th = 0x1b710b35 + w7h + (tl >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w8l = w8l + w1l | 0;
      w8h = w8h + w1h + (w8l >>> 0 < w1l >>> 0 ? 1 : 0) | 0;
      xl = (w9l >>> 1 | w9h << 31) ^ (w9l >>> 8 | w9h << 24) ^ (w9l >>> 7 | w9h << 25) | 0;
      w8l = w8l + xl | 0;
      w8h = w8h + ((w9h >>> 1 | w9l << 31) ^ (w9h >>> 8 | w9l << 24) ^ w9h >>> 7) + (w8l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w6l >>> 19 | w6h << 13) ^ (w6l << 3 | w6h >>> 29) ^ (w6l >>> 6 | w6h << 26) | 0;
      w8l = w8l + xl | 0;
      w8h = w8h + ((w6h >>> 19 | w6l << 13) ^ (w6h << 3 | w6l >>> 29) ^ w6h >>> 6) + (w8l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x23047d84 + w8l | 0;
      th = 0x28db77f5 + w8h + (tl >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w9l = w9l + w2l | 0;
      w9h = w9h + w2h + (w9l >>> 0 < w2l >>> 0 ? 1 : 0) | 0;
      xl = (w10l >>> 1 | w10h << 31) ^ (w10l >>> 8 | w10h << 24) ^ (w10l >>> 7 | w10h << 25) | 0;
      w9l = w9l + xl | 0;
      w9h = w9h + ((w10h >>> 1 | w10l << 31) ^ (w10h >>> 8 | w10l << 24) ^ w10h >>> 7) + (w9l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w7l >>> 19 | w7h << 13) ^ (w7l << 3 | w7h >>> 29) ^ (w7l >>> 6 | w7h << 26) | 0;
      w9l = w9l + xl | 0;
      w9h = w9h + ((w7h >>> 19 | w7l << 13) ^ (w7h << 3 | w7l >>> 29) ^ w7h >>> 6) + (w9l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x40c72493 + w9l | 0;
      th = 0x32caab7b + w9h + (tl >>> 0 < w9l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w10l = w10l + w3l | 0;
      w10h = w10h + w3h + (w10l >>> 0 < w3l >>> 0 ? 1 : 0) | 0;
      xl = (w11l >>> 1 | w11h << 31) ^ (w11l >>> 8 | w11h << 24) ^ (w11l >>> 7 | w11h << 25) | 0;
      w10l = w10l + xl | 0;
      w10h = w10h + ((w11h >>> 1 | w11l << 31) ^ (w11h >>> 8 | w11l << 24) ^ w11h >>> 7) + (w10l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w8l >>> 19 | w8h << 13) ^ (w8l << 3 | w8h >>> 29) ^ (w8l >>> 6 | w8h << 26) | 0;
      w10l = w10l + xl | 0;
      w10h = w10h + ((w8h >>> 19 | w8l << 13) ^ (w8h << 3 | w8l >>> 29) ^ w8h >>> 6) + (w10l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x15c9bebc + w10l | 0;
      th = 0x3c9ebe0a + w10h + (tl >>> 0 < w10l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w11l = w11l + w4l | 0;
      w11h = w11h + w4h + (w11l >>> 0 < w4l >>> 0 ? 1 : 0) | 0;
      xl = (w12l >>> 1 | w12h << 31) ^ (w12l >>> 8 | w12h << 24) ^ (w12l >>> 7 | w12h << 25) | 0;
      w11l = w11l + xl | 0;
      w11h = w11h + ((w12h >>> 1 | w12l << 31) ^ (w12h >>> 8 | w12l << 24) ^ w12h >>> 7) + (w11l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w9l >>> 19 | w9h << 13) ^ (w9l << 3 | w9h >>> 29) ^ (w9l >>> 6 | w9h << 26) | 0;
      w11l = w11l + xl | 0;
      w11h = w11h + ((w9h >>> 19 | w9l << 13) ^ (w9h << 3 | w9l >>> 29) ^ w9h >>> 6) + (w11l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x9c100d4c + w11l | 0;
      th = 0x431d67c4 + w11h + (tl >>> 0 < w11l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w12l = w12l + w5l | 0;
      w12h = w12h + w5h + (w12l >>> 0 < w5l >>> 0 ? 1 : 0) | 0;
      xl = (w13l >>> 1 | w13h << 31) ^ (w13l >>> 8 | w13h << 24) ^ (w13l >>> 7 | w13h << 25) | 0;
      w12l = w12l + xl | 0;
      w12h = w12h + ((w13h >>> 1 | w13l << 31) ^ (w13h >>> 8 | w13l << 24) ^ w13h >>> 7) + (w12l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w10l >>> 19 | w10h << 13) ^ (w10l << 3 | w10h >>> 29) ^ (w10l >>> 6 | w10h << 26) | 0;
      w12l = w12l + xl | 0;
      w12h = w12h + ((w10h >>> 19 | w10l << 13) ^ (w10h << 3 | w10l >>> 29) ^ w10h >>> 6) + (w12l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xcb3e42b6 + w12l | 0;
      th = 0x4cc5d4be + w12h + (tl >>> 0 < w12l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w13l = w13l + w6l | 0;
      w13h = w13h + w6h + (w13l >>> 0 < w6l >>> 0 ? 1 : 0) | 0;
      xl = (w14l >>> 1 | w14h << 31) ^ (w14l >>> 8 | w14h << 24) ^ (w14l >>> 7 | w14h << 25) | 0;
      w13l = w13l + xl | 0;
      w13h = w13h + ((w14h >>> 1 | w14l << 31) ^ (w14h >>> 8 | w14l << 24) ^ w14h >>> 7) + (w13l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w11l >>> 19 | w11h << 13) ^ (w11l << 3 | w11h >>> 29) ^ (w11l >>> 6 | w11h << 26) | 0;
      w13l = w13l + xl | 0;
      w13h = w13h + ((w11h >>> 19 | w11l << 13) ^ (w11h << 3 | w11l >>> 29) ^ w11h >>> 6) + (w13l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0xfc657e2a + w13l | 0;
      th = 0x597f299c + w13h + (tl >>> 0 < w13l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w14l = w14l + w7l | 0;
      w14h = w14h + w7h + (w14l >>> 0 < w7l >>> 0 ? 1 : 0) | 0;
      xl = (w15l >>> 1 | w15h << 31) ^ (w15l >>> 8 | w15h << 24) ^ (w15l >>> 7 | w15h << 25) | 0;
      w14l = w14l + xl | 0;
      w14h = w14h + ((w15h >>> 1 | w15l << 31) ^ (w15h >>> 8 | w15l << 24) ^ w15h >>> 7) + (w14l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w12l >>> 19 | w12h << 13) ^ (w12l << 3 | w12h >>> 29) ^ (w12l >>> 6 | w12h << 26) | 0;
      w14l = w14l + xl | 0;
      w14h = w14h + ((w12h >>> 19 | w12l << 13) ^ (w12h << 3 | w12l >>> 29) ^ w12h >>> 6) + (w14l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x3ad6faec + w14l | 0;
      th = 0x5fcb6fab + w14h + (tl >>> 0 < w14l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      w15l = w15l + w8l | 0;
      w15h = w15h + w8h + (w15l >>> 0 < w8l >>> 0 ? 1 : 0) | 0;
      xl = (w0l >>> 1 | w0h << 31) ^ (w0l >>> 8 | w0h << 24) ^ (w0l >>> 7 | w0h << 25) | 0;
      w15l = w15l + xl | 0;
      w15h = w15h + ((w0h >>> 1 | w0l << 31) ^ (w0h >>> 8 | w0l << 24) ^ w0h >>> 7) + (w15l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = (w13l >>> 19 | w13h << 13) ^ (w13l << 3 | w13h >>> 29) ^ (w13l >>> 6 | w13h << 26) | 0;
      w15l = w15l + xl | 0;
      w15h = w15h + ((w13h >>> 19 | w13l << 13) ^ (w13h << 3 | w13l >>> 29) ^ w13h >>> 6) + (w15l >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      tl = 0x4a475817 + w15l | 0;
      th = 0x6c44198c + w15h + (tl >>> 0 < w15l >>> 0 ? 1 : 0) | 0;
      tl = tl + hl | 0;
      th = th + hh + (tl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
      xl = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9) | 0;
      tl = tl + xl | 0;
      th = th + ((eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      xl = gl ^ el & (fl ^ gl) | 0;
      tl = tl + xl | 0;
      th = th + (gh ^ eh & (fh ^ gh)) + (tl >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      hl = gl;
      hh = gh;
      gl = fl;
      gh = fh;
      fl = el;
      fh = eh;
      el = dl + tl | 0;
      eh = dh + th + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      dl = cl;
      dh = ch;
      cl = bl;
      ch = bh;
      bl = al;
      bh = ah;
      al = tl + (bl & cl ^ dl & (bl ^ cl)) | 0;
      ah = th + (bh & ch ^ dh & (bh ^ ch)) + (al >>> 0 < tl >>> 0 ? 1 : 0) | 0;
      xl = (bl >>> 28 | bh << 4) ^ (bl << 30 | bh >>> 2) ^ (bl << 25 | bh >>> 7) | 0;
      al = al + xl | 0;
      ah = ah + ((bh >>> 28 | bl << 4) ^ (bh << 30 | bl >>> 2) ^ (bh << 25 | bl >>> 7)) + (al >>> 0 < xl >>> 0 ? 1 : 0) | 0;
      H0l = H0l + al | 0;
      H0h = H0h + ah + (H0l >>> 0 < al >>> 0 ? 1 : 0) | 0;
      H1l = H1l + bl | 0;
      H1h = H1h + bh + (H1l >>> 0 < bl >>> 0 ? 1 : 0) | 0;
      H2l = H2l + cl | 0;
      H2h = H2h + ch + (H2l >>> 0 < cl >>> 0 ? 1 : 0) | 0;
      H3l = H3l + dl | 0;
      H3h = H3h + dh + (H3l >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      H4l = H4l + el | 0;
      H4h = H4h + eh + (H4l >>> 0 < el >>> 0 ? 1 : 0) | 0;
      H5l = H5l + fl | 0;
      H5h = H5h + fh + (H5l >>> 0 < fl >>> 0 ? 1 : 0) | 0;
      H6l = H6l + gl | 0;
      H6h = H6h + gh + (H6l >>> 0 < gl >>> 0 ? 1 : 0) | 0;
      H7l = H7l + hl | 0;
      H7h = H7h + hh + (H7l >>> 0 < hl >>> 0 ? 1 : 0) | 0;
    }
    function _core_heap(offset) {
      offset = offset | 0;
      _core(HEAP[offset | 0] << 24 | HEAP[offset | 1] << 16 | HEAP[offset | 2] << 8 | HEAP[offset | 3], HEAP[offset | 4] << 24 | HEAP[offset | 5] << 16 | HEAP[offset | 6] << 8 | HEAP[offset | 7], HEAP[offset | 8] << 24 | HEAP[offset | 9] << 16 | HEAP[offset | 10] << 8 | HEAP[offset | 11], HEAP[offset | 12] << 24 | HEAP[offset | 13] << 16 | HEAP[offset | 14] << 8 | HEAP[offset | 15], HEAP[offset | 16] << 24 | HEAP[offset | 17] << 16 | HEAP[offset | 18] << 8 | HEAP[offset | 19], HEAP[offset | 20] << 24 | HEAP[offset | 21] << 16 | HEAP[offset | 22] << 8 | HEAP[offset | 23], HEAP[offset | 24] << 24 | HEAP[offset | 25] << 16 | HEAP[offset | 26] << 8 | HEAP[offset | 27], HEAP[offset | 28] << 24 | HEAP[offset | 29] << 16 | HEAP[offset | 30] << 8 | HEAP[offset | 31], HEAP[offset | 32] << 24 | HEAP[offset | 33] << 16 | HEAP[offset | 34] << 8 | HEAP[offset | 35], HEAP[offset | 36] << 24 | HEAP[offset | 37] << 16 | HEAP[offset | 38] << 8 | HEAP[offset | 39], HEAP[offset | 40] << 24 | HEAP[offset | 41] << 16 | HEAP[offset | 42] << 8 | HEAP[offset | 43], HEAP[offset | 44] << 24 | HEAP[offset | 45] << 16 | HEAP[offset | 46] << 8 | HEAP[offset | 47], HEAP[offset | 48] << 24 | HEAP[offset | 49] << 16 | HEAP[offset | 50] << 8 | HEAP[offset | 51], HEAP[offset | 52] << 24 | HEAP[offset | 53] << 16 | HEAP[offset | 54] << 8 | HEAP[offset | 55], HEAP[offset | 56] << 24 | HEAP[offset | 57] << 16 | HEAP[offset | 58] << 8 | HEAP[offset | 59], HEAP[offset | 60] << 24 | HEAP[offset | 61] << 16 | HEAP[offset | 62] << 8 | HEAP[offset | 63], HEAP[offset | 64] << 24 | HEAP[offset | 65] << 16 | HEAP[offset | 66] << 8 | HEAP[offset | 67], HEAP[offset | 68] << 24 | HEAP[offset | 69] << 16 | HEAP[offset | 70] << 8 | HEAP[offset | 71], HEAP[offset | 72] << 24 | HEAP[offset | 73] << 16 | HEAP[offset | 74] << 8 | HEAP[offset | 75], HEAP[offset | 76] << 24 | HEAP[offset | 77] << 16 | HEAP[offset | 78] << 8 | HEAP[offset | 79], HEAP[offset | 80] << 24 | HEAP[offset | 81] << 16 | HEAP[offset | 82] << 8 | HEAP[offset | 83], HEAP[offset | 84] << 24 | HEAP[offset | 85] << 16 | HEAP[offset | 86] << 8 | HEAP[offset | 87], HEAP[offset | 88] << 24 | HEAP[offset | 89] << 16 | HEAP[offset | 90] << 8 | HEAP[offset | 91], HEAP[offset | 92] << 24 | HEAP[offset | 93] << 16 | HEAP[offset | 94] << 8 | HEAP[offset | 95], HEAP[offset | 96] << 24 | HEAP[offset | 97] << 16 | HEAP[offset | 98] << 8 | HEAP[offset | 99], HEAP[offset | 100] << 24 | HEAP[offset | 101] << 16 | HEAP[offset | 102] << 8 | HEAP[offset | 103], HEAP[offset | 104] << 24 | HEAP[offset | 105] << 16 | HEAP[offset | 106] << 8 | HEAP[offset | 107], HEAP[offset | 108] << 24 | HEAP[offset | 109] << 16 | HEAP[offset | 110] << 8 | HEAP[offset | 111], HEAP[offset | 112] << 24 | HEAP[offset | 113] << 16 | HEAP[offset | 114] << 8 | HEAP[offset | 115], HEAP[offset | 116] << 24 | HEAP[offset | 117] << 16 | HEAP[offset | 118] << 8 | HEAP[offset | 119], HEAP[offset | 120] << 24 | HEAP[offset | 121] << 16 | HEAP[offset | 122] << 8 | HEAP[offset | 123], HEAP[offset | 124] << 24 | HEAP[offset | 125] << 16 | HEAP[offset | 126] << 8 | HEAP[offset | 127]);
    }
    function _state_to_heap(output) {
      output = output | 0;
      HEAP[output | 0] = H0h >>> 24;
      HEAP[output | 1] = H0h >>> 16 & 255;
      HEAP[output | 2] = H0h >>> 8 & 255;
      HEAP[output | 3] = H0h & 255;
      HEAP[output | 4] = H0l >>> 24;
      HEAP[output | 5] = H0l >>> 16 & 255;
      HEAP[output | 6] = H0l >>> 8 & 255;
      HEAP[output | 7] = H0l & 255;
      HEAP[output | 8] = H1h >>> 24;
      HEAP[output | 9] = H1h >>> 16 & 255;
      HEAP[output | 10] = H1h >>> 8 & 255;
      HEAP[output | 11] = H1h & 255;
      HEAP[output | 12] = H1l >>> 24;
      HEAP[output | 13] = H1l >>> 16 & 255;
      HEAP[output | 14] = H1l >>> 8 & 255;
      HEAP[output | 15] = H1l & 255;
      HEAP[output | 16] = H2h >>> 24;
      HEAP[output | 17] = H2h >>> 16 & 255;
      HEAP[output | 18] = H2h >>> 8 & 255;
      HEAP[output | 19] = H2h & 255;
      HEAP[output | 20] = H2l >>> 24;
      HEAP[output | 21] = H2l >>> 16 & 255;
      HEAP[output | 22] = H2l >>> 8 & 255;
      HEAP[output | 23] = H2l & 255;
      HEAP[output | 24] = H3h >>> 24;
      HEAP[output | 25] = H3h >>> 16 & 255;
      HEAP[output | 26] = H3h >>> 8 & 255;
      HEAP[output | 27] = H3h & 255;
      HEAP[output | 28] = H3l >>> 24;
      HEAP[output | 29] = H3l >>> 16 & 255;
      HEAP[output | 30] = H3l >>> 8 & 255;
      HEAP[output | 31] = H3l & 255;
      HEAP[output | 32] = H4h >>> 24;
      HEAP[output | 33] = H4h >>> 16 & 255;
      HEAP[output | 34] = H4h >>> 8 & 255;
      HEAP[output | 35] = H4h & 255;
      HEAP[output | 36] = H4l >>> 24;
      HEAP[output | 37] = H4l >>> 16 & 255;
      HEAP[output | 38] = H4l >>> 8 & 255;
      HEAP[output | 39] = H4l & 255;
      HEAP[output | 40] = H5h >>> 24;
      HEAP[output | 41] = H5h >>> 16 & 255;
      HEAP[output | 42] = H5h >>> 8 & 255;
      HEAP[output | 43] = H5h & 255;
      HEAP[output | 44] = H5l >>> 24;
      HEAP[output | 45] = H5l >>> 16 & 255;
      HEAP[output | 46] = H5l >>> 8 & 255;
      HEAP[output | 47] = H5l & 255;
      HEAP[output | 48] = H6h >>> 24;
      HEAP[output | 49] = H6h >>> 16 & 255;
      HEAP[output | 50] = H6h >>> 8 & 255;
      HEAP[output | 51] = H6h & 255;
      HEAP[output | 52] = H6l >>> 24;
      HEAP[output | 53] = H6l >>> 16 & 255;
      HEAP[output | 54] = H6l >>> 8 & 255;
      HEAP[output | 55] = H6l & 255;
      HEAP[output | 56] = H7h >>> 24;
      HEAP[output | 57] = H7h >>> 16 & 255;
      HEAP[output | 58] = H7h >>> 8 & 255;
      HEAP[output | 59] = H7h & 255;
      HEAP[output | 60] = H7l >>> 24;
      HEAP[output | 61] = H7l >>> 16 & 255;
      HEAP[output | 62] = H7l >>> 8 & 255;
      HEAP[output | 63] = H7l & 255;
    }
    function reset() {
      H0h = 0x6a09e667;
      H0l = 0xf3bcc908;
      H1h = 0xbb67ae85;
      H1l = 0x84caa73b;
      H2h = 0x3c6ef372;
      H2l = 0xfe94f82b;
      H3h = 0xa54ff53a;
      H3l = 0x5f1d36f1;
      H4h = 0x510e527f;
      H4l = 0xade682d1;
      H5h = 0x9b05688c;
      H5l = 0x2b3e6c1f;
      H6h = 0x1f83d9ab;
      H6l = 0xfb41bd6b;
      H7h = 0x5be0cd19;
      H7l = 0x137e2179;
      TOTAL0 = TOTAL1 = 0;
    }
    function init(h0h, h0l, h1h, h1l, h2h, h2l, h3h, h3l, h4h, h4l, h5h, h5l, h6h, h6l, h7h, h7l, total0, total1) {
      h0h = h0h | 0;
      h0l = h0l | 0;
      h1h = h1h | 0;
      h1l = h1l | 0;
      h2h = h2h | 0;
      h2l = h2l | 0;
      h3h = h3h | 0;
      h3l = h3l | 0;
      h4h = h4h | 0;
      h4l = h4l | 0;
      h5h = h5h | 0;
      h5l = h5l | 0;
      h6h = h6h | 0;
      h6l = h6l | 0;
      h7h = h7h | 0;
      h7l = h7l | 0;
      total0 = total0 | 0;
      total1 = total1 | 0;
      H0h = h0h;
      H0l = h0l;
      H1h = h1h;
      H1l = h1l;
      H2h = h2h;
      H2l = h2l;
      H3h = h3h;
      H3l = h3l;
      H4h = h4h;
      H4l = h4l;
      H5h = h5h;
      H5l = h5l;
      H6h = h6h;
      H6l = h6l;
      H7h = h7h;
      H7l = h7l;
      TOTAL0 = total0;
      TOTAL1 = total1;
    }
    function process(offset, length) {
      offset = offset | 0;
      length = length | 0;
      var hashed = 0;
      if (offset & 127) return -1;
      while ((length | 0) >= 128) {
        _core_heap(offset);
        offset = offset + 128 | 0;
        length = length - 128 | 0;
        hashed = hashed + 128 | 0;
      }
      TOTAL0 = TOTAL0 + hashed | 0;
      if (TOTAL0 >>> 0 < hashed >>> 0) TOTAL1 = TOTAL1 + 1 | 0;
      return hashed | 0;
    }
    function finish(offset, length, output) {
      offset = offset | 0;
      length = length | 0;
      output = output | 0;
      var hashed = 0,
        i = 0;
      if (offset & 127) return -1;
      if (~output) if (output & 63) return -1;
      if ((length | 0) >= 128) {
        hashed = process(offset, length) | 0;
        if ((hashed | 0) == -1) return -1;
        offset = offset + hashed | 0;
        length = length - hashed | 0;
      }
      hashed = hashed + length | 0;
      TOTAL0 = TOTAL0 + length | 0;
      if (TOTAL0 >>> 0 < length >>> 0) TOTAL1 = TOTAL1 + 1 | 0;
      HEAP[offset | length] = 0x80;
      if ((length | 0) >= 112) {
        for (i = length + 1 | 0; (i | 0) < 128; i = i + 1 | 0) HEAP[offset | i] = 0x00;
        _core_heap(offset);
        length = 0;
        HEAP[offset | 0] = 0;
      }
      for (i = length + 1 | 0; (i | 0) < 123; i = i + 1 | 0) HEAP[offset | i] = 0;
      HEAP[offset | 120] = TOTAL1 >>> 21 & 255;
      HEAP[offset | 121] = TOTAL1 >>> 13 & 255;
      HEAP[offset | 122] = TOTAL1 >>> 5 & 255;
      HEAP[offset | 123] = TOTAL1 << 3 & 255 | TOTAL0 >>> 29;
      HEAP[offset | 124] = TOTAL0 >>> 21 & 255;
      HEAP[offset | 125] = TOTAL0 >>> 13 & 255;
      HEAP[offset | 126] = TOTAL0 >>> 5 & 255;
      HEAP[offset | 127] = TOTAL0 << 3 & 255;
      _core_heap(offset);
      if (~output) _state_to_heap(output);
      return hashed | 0;
    }
    function hmac_reset() {
      H0h = I0h;
      H0l = I0l;
      H1h = I1h;
      H1l = I1l;
      H2h = I2h;
      H2l = I2l;
      H3h = I3h;
      H3l = I3l;
      H4h = I4h;
      H4l = I4l;
      H5h = I5h;
      H5l = I5l;
      H6h = I6h;
      H6l = I6l;
      H7h = I7h;
      H7l = I7l;
      TOTAL0 = 128;
      TOTAL1 = 0;
    }
    function _hmac_opad() {
      H0h = O0h;
      H0l = O0l;
      H1h = O1h;
      H1l = O1l;
      H2h = O2h;
      H2l = O2l;
      H3h = O3h;
      H3l = O3l;
      H4h = O4h;
      H4l = O4l;
      H5h = O5h;
      H5l = O5l;
      H6h = O6h;
      H6l = O6l;
      H7h = O7h;
      H7l = O7l;
      TOTAL0 = 128;
      TOTAL1 = 0;
    }
    function hmac_init(p0h, p0l, p1h, p1l, p2h, p2l, p3h, p3l, p4h, p4l, p5h, p5l, p6h, p6l, p7h, p7l, p8h, p8l, p9h, p9l, p10h, p10l, p11h, p11l, p12h, p12l, p13h, p13l, p14h, p14l, p15h, p15l) {
      p0h = p0h | 0;
      p0l = p0l | 0;
      p1h = p1h | 0;
      p1l = p1l | 0;
      p2h = p2h | 0;
      p2l = p2l | 0;
      p3h = p3h | 0;
      p3l = p3l | 0;
      p4h = p4h | 0;
      p4l = p4l | 0;
      p5h = p5h | 0;
      p5l = p5l | 0;
      p6h = p6h | 0;
      p6l = p6l | 0;
      p7h = p7h | 0;
      p7l = p7l | 0;
      p8h = p8h | 0;
      p8l = p8l | 0;
      p9h = p9h | 0;
      p9l = p9l | 0;
      p10h = p10h | 0;
      p10l = p10l | 0;
      p11h = p11h | 0;
      p11l = p11l | 0;
      p12h = p12h | 0;
      p12l = p12l | 0;
      p13h = p13h | 0;
      p13l = p13l | 0;
      p14h = p14h | 0;
      p14l = p14l | 0;
      p15h = p15h | 0;
      p15l = p15l | 0;
      reset();
      _core(p0h ^ 0x5c5c5c5c, p0l ^ 0x5c5c5c5c, p1h ^ 0x5c5c5c5c, p1l ^ 0x5c5c5c5c, p2h ^ 0x5c5c5c5c, p2l ^ 0x5c5c5c5c, p3h ^ 0x5c5c5c5c, p3l ^ 0x5c5c5c5c, p4h ^ 0x5c5c5c5c, p4l ^ 0x5c5c5c5c, p5h ^ 0x5c5c5c5c, p5l ^ 0x5c5c5c5c, p6h ^ 0x5c5c5c5c, p6l ^ 0x5c5c5c5c, p7h ^ 0x5c5c5c5c, p7l ^ 0x5c5c5c5c, p8h ^ 0x5c5c5c5c, p8l ^ 0x5c5c5c5c, p9h ^ 0x5c5c5c5c, p9l ^ 0x5c5c5c5c, p10h ^ 0x5c5c5c5c, p10l ^ 0x5c5c5c5c, p11h ^ 0x5c5c5c5c, p11l ^ 0x5c5c5c5c, p12h ^ 0x5c5c5c5c, p12l ^ 0x5c5c5c5c, p13h ^ 0x5c5c5c5c, p13l ^ 0x5c5c5c5c, p14h ^ 0x5c5c5c5c, p14l ^ 0x5c5c5c5c, p15h ^ 0x5c5c5c5c, p15l ^ 0x5c5c5c5c);
      O0h = H0h;
      O0l = H0l;
      O1h = H1h;
      O1l = H1l;
      O2h = H2h;
      O2l = H2l;
      O3h = H3h;
      O3l = H3l;
      O4h = H4h;
      O4l = H4l;
      O5h = H5h;
      O5l = H5l;
      O6h = H6h;
      O6l = H6l;
      O7h = H7h;
      O7l = H7l;
      reset();
      _core(p0h ^ 0x36363636, p0l ^ 0x36363636, p1h ^ 0x36363636, p1l ^ 0x36363636, p2h ^ 0x36363636, p2l ^ 0x36363636, p3h ^ 0x36363636, p3l ^ 0x36363636, p4h ^ 0x36363636, p4l ^ 0x36363636, p5h ^ 0x36363636, p5l ^ 0x36363636, p6h ^ 0x36363636, p6l ^ 0x36363636, p7h ^ 0x36363636, p7l ^ 0x36363636, p8h ^ 0x36363636, p8l ^ 0x36363636, p9h ^ 0x36363636, p9l ^ 0x36363636, p10h ^ 0x36363636, p10l ^ 0x36363636, p11h ^ 0x36363636, p11l ^ 0x36363636, p12h ^ 0x36363636, p12l ^ 0x36363636, p13h ^ 0x36363636, p13l ^ 0x36363636, p14h ^ 0x36363636, p14l ^ 0x36363636, p15h ^ 0x36363636, p15l ^ 0x36363636);
      I0h = H0h;
      I0l = H0l;
      I1h = H1h;
      I1l = H1l;
      I2h = H2h;
      I2l = H2l;
      I3h = H3h;
      I3l = H3l;
      I4h = H4h;
      I4l = H4l;
      I5h = H5h;
      I5l = H5l;
      I6h = H6h;
      I6l = H6l;
      I7h = H7h;
      I7l = H7l;
      TOTAL0 = 128;
      TOTAL1 = 0;
    }
    function hmac_finish(offset, length, output) {
      offset = offset | 0;
      length = length | 0;
      output = output | 0;
      var t0h = 0,
        t0l = 0,
        t1h = 0,
        t1l = 0,
        t2h = 0,
        t2l = 0,
        t3h = 0,
        t3l = 0,
        t4h = 0,
        t4l = 0,
        t5h = 0,
        t5l = 0,
        t6h = 0,
        t6l = 0,
        t7h = 0,
        t7l = 0,
        hashed = 0;
      if (offset & 127) return -1;
      if (~output) if (output & 63) return -1;
      hashed = finish(offset, length, -1) | 0;
      t0h = H0h;
      t0l = H0l;
      t1h = H1h;
      t1l = H1l;
      t2h = H2h;
      t2l = H2l;
      t3h = H3h;
      t3l = H3l;
      t4h = H4h;
      t4l = H4l;
      t5h = H5h;
      t5l = H5l;
      t6h = H6h;
      t6l = H6l;
      t7h = H7h;
      t7l = H7l;
      _hmac_opad();
      _core(t0h, t0l, t1h, t1l, t2h, t2l, t3h, t3l, t4h, t4l, t5h, t5l, t6h, t6l, t7h, t7l, 0x80000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1536);
      if (~output) _state_to_heap(output);
      return hashed | 0;
    }
    function pbkdf2_generate_block(offset, length, block, count, output) {
      offset = offset | 0;
      length = length | 0;
      block = block | 0;
      count = count | 0;
      output = output | 0;
      var h0h = 0,
        h0l = 0,
        h1h = 0,
        h1l = 0,
        h2h = 0,
        h2l = 0,
        h3h = 0,
        h3l = 0,
        h4h = 0,
        h4l = 0,
        h5h = 0,
        h5l = 0,
        h6h = 0,
        h6l = 0,
        h7h = 0,
        h7l = 0,
        t0h = 0,
        t0l = 0,
        t1h = 0,
        t1l = 0,
        t2h = 0,
        t2l = 0,
        t3h = 0,
        t3l = 0,
        t4h = 0,
        t4l = 0,
        t5h = 0,
        t5l = 0,
        t6h = 0,
        t6l = 0,
        t7h = 0,
        t7l = 0;
      if (offset & 127) return -1;
      if (~output) if (output & 63) return -1;
      HEAP[offset + length | 0] = block >>> 24;
      HEAP[offset + length + 1 | 0] = block >>> 16 & 255;
      HEAP[offset + length + 2 | 0] = block >>> 8 & 255;
      HEAP[offset + length + 3 | 0] = block & 255;
      hmac_finish(offset, length + 4 | 0, -1) | 0;
      h0h = t0h = H0h;
      h0l = t0l = H0l;
      h1h = t1h = H1h;
      h1l = t1l = H1l;
      h2h = t2h = H2h;
      h2l = t2l = H2l;
      h3h = t3h = H3h;
      h3l = t3l = H3l;
      h4h = t4h = H4h;
      h4l = t4l = H4l;
      h5h = t5h = H5h;
      h5l = t5l = H5l;
      h6h = t6h = H6h;
      h6l = t6l = H6l;
      h7h = t7h = H7h;
      h7l = t7l = H7l;
      count = count - 1 | 0;
      while ((count | 0) > 0) {
        hmac_reset();
        _core(t0h, t0l, t1h, t1l, t2h, t2l, t3h, t3l, t4h, t4l, t5h, t5l, t6h, t6l, t7h, t7l, 0x80000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1536);
        t0h = H0h;
        t0l = H0l;
        t1h = H1h;
        t1l = H1l;
        t2h = H2h;
        t2l = H2l;
        t3h = H3h;
        t3l = H3l;
        t4h = H4h;
        t4l = H4l;
        t5h = H5h;
        t5l = H5l;
        t6h = H6h;
        t6l = H6l;
        t7h = H7h;
        t7l = H7l;
        _hmac_opad();
        _core(t0h, t0l, t1h, t1l, t2h, t2l, t3h, t3l, t4h, t4l, t5h, t5l, t6h, t6l, t7h, t7l, 0x80000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1536);
        t0h = H0h;
        t0l = H0l;
        t1h = H1h;
        t1l = H1l;
        t2h = H2h;
        t2l = H2l;
        t3h = H3h;
        t3l = H3l;
        t4h = H4h;
        t4l = H4l;
        t5h = H5h;
        t5l = H5l;
        t6h = H6h;
        t6l = H6l;
        t7h = H7h;
        t7l = H7l;
        h0h = h0h ^ H0h;
        h0l = h0l ^ H0l;
        h1h = h1h ^ H1h;
        h1l = h1l ^ H1l;
        h2h = h2h ^ H2h;
        h2l = h2l ^ H2l;
        h3h = h3h ^ H3h;
        h3l = h3l ^ H3l;
        h4h = h4h ^ H4h;
        h4l = h4l ^ H4l;
        h5h = h5h ^ H5h;
        h5l = h5l ^ H5l;
        h6h = h6h ^ H6h;
        h6l = h6l ^ H6l;
        h7h = h7h ^ H7h;
        h7l = h7l ^ H7l;
        count = count - 1 | 0;
      }
      H0h = h0h;
      H0l = h0l;
      H1h = h1h;
      H1l = h1l;
      H2h = h2h;
      H2l = h2l;
      H3h = h3h;
      H3l = h3l;
      H4h = h4h;
      H4l = h4l;
      H5h = h5h;
      H5l = h5l;
      H6h = h6h;
      H6l = h6l;
      H7h = h7h;
      H7l = h7l;
      if (~output) _state_to_heap(output);
      return 0;
    }
    return {
      reset: reset,
      init: init,
      process: process,
      finish: finish,
      hmac_reset: hmac_reset,
      hmac_init: hmac_init,
      hmac_finish: hmac_finish,
      pbkdf2_generate_block: pbkdf2_generate_block
    };
  };
  const _sha512_block_size = 128;
  const _sha512_hash_size = 64;
  class Sha512 extends Hash {
    constructor() {
      super();
      this.NAME = 'sha512';
      this.BLOCK_SIZE = _sha512_block_size;
      this.HASH_SIZE = _sha512_hash_size;
      this.heap = _heap_init();
      this.asm = sha512_asm({
        Uint8Array: Uint8Array
      }, null, this.heap.buffer);
      this.reset();
    }
  }
  Sha512.NAME = 'sha512';
  let Hmac$1 = class Hmac {
    constructor(hash, password, verify) {
      if (!hash.HASH_SIZE) throw new SyntaxError("option 'hash' supplied doesn't seem to be a valid hash function");
      this.hash = hash;
      this.BLOCK_SIZE = this.hash.BLOCK_SIZE;
      this.HMAC_SIZE = this.hash.HASH_SIZE;
      this.result = null;
      this.key = _hmac_key(this.hash, password);
      const ipad = new Uint8Array(this.key);
      for (let i = 0; i < ipad.length; ++i) ipad[i] ^= 0x36;
      this.hash.reset().process(ipad);
      if (verify !== undefined) {
        this._hmac_init_verify(verify);
      } else {
        this.verify = null;
      }
    }
    process(data) {
      if (this.result !== null) throw new IllegalStateError('state must be reset before processing new data');
      this.hash.process(data);
      return this;
    }
    finish() {
      if (this.result !== null) throw new IllegalStateError('state must be reset before processing new data');
      const inner_result = this.hash.finish().result;
      const opad = new Uint8Array(this.key);
      for (let i = 0; i < opad.length; ++i) opad[i] ^= 0x5c;
      const verify = this.verify;
      const result = this.hash.reset().process(opad).process(inner_result).finish().result;
      if (verify) {
        if (verify.length === result.length) {
          let diff = 0;
          for (let i = 0; i < verify.length; i++) {
            diff |= verify[i] ^ result[i];
          }
          if (diff !== 0) throw new Error("HMAC verification failed, hash value doesn't match");
        } else {
          throw new Error("HMAC verification failed, lengths doesn't match");
        }
      }
      this.result = result;
      return this;
    }
    _hmac_init_verify(verify) {
      if (verify.length !== this.HMAC_SIZE) throw new IllegalArgumentError('illegal verification tag size');
      this.verify = verify;
    }
  };
  function _hmac_key(hash, password) {
    const key = new Uint8Array(hash.BLOCK_SIZE);
    if (password.length > hash.BLOCK_SIZE) {
      key.set(hash.reset().process(password).finish().result);
    } else {
      key.set(password);
    }
    return key;
  }
  class HmacSha1 extends Hmac$1 {
    constructor(password, verify) {
      const hash = new Sha1();
      super(hash, password, verify);
      this.reset();
      if (verify !== undefined) {
        this._hmac_init_verify(verify);
      } else {
        this.verify = null;
      }
      return this;
    }
    reset() {
      this.result = null;
      const key = this.key;
      this.hash.reset().asm.hmac_init(key[0] << 24 | key[1] << 16 | key[2] << 8 | key[3], key[4] << 24 | key[5] << 16 | key[6] << 8 | key[7], key[8] << 24 | key[9] << 16 | key[10] << 8 | key[11], key[12] << 24 | key[13] << 16 | key[14] << 8 | key[15], key[16] << 24 | key[17] << 16 | key[18] << 8 | key[19], key[20] << 24 | key[21] << 16 | key[22] << 8 | key[23], key[24] << 24 | key[25] << 16 | key[26] << 8 | key[27], key[28] << 24 | key[29] << 16 | key[30] << 8 | key[31], key[32] << 24 | key[33] << 16 | key[34] << 8 | key[35], key[36] << 24 | key[37] << 16 | key[38] << 8 | key[39], key[40] << 24 | key[41] << 16 | key[42] << 8 | key[43], key[44] << 24 | key[45] << 16 | key[46] << 8 | key[47], key[48] << 24 | key[49] << 16 | key[50] << 8 | key[51], key[52] << 24 | key[53] << 16 | key[54] << 8 | key[55], key[56] << 24 | key[57] << 16 | key[58] << 8 | key[59], key[60] << 24 | key[61] << 16 | key[62] << 8 | key[63]);
      return this;
    }
    finish() {
      if (this.result !== null) throw new IllegalStateError('state must be reset before processing new data');
      const hash = this.hash;
      const asm = this.hash.asm;
      const heap = this.hash.heap;
      asm.hmac_finish(hash.pos, hash.len, 0);
      const verify = this.verify;
      const result = new Uint8Array(_sha1_hash_size);
      result.set(heap.subarray(0, _sha1_hash_size));
      if (verify) {
        if (verify.length === result.length) {
          let diff = 0;
          for (let i = 0; i < verify.length; i++) {
            diff |= verify[i] ^ result[i];
          }
          if (diff !== 0) throw new Error("HMAC verification failed, hash value doesn't match");
        } else {
          throw new Error("HMAC verification failed, lengths doesn't match");
        }
      } else {
        this.result = result;
      }
      return this;
    }
  }
  class HmacSha256 extends Hmac$1 {
    constructor(password, verify) {
      const hash = new Sha256();
      super(hash, password, verify);
      this.reset();
      if (verify !== undefined) {
        this._hmac_init_verify(verify);
      } else {
        this.verify = null;
      }
      return this;
    }
    reset() {
      const key = this.key;
      this.hash.reset().asm.hmac_init(key[0] << 24 | key[1] << 16 | key[2] << 8 | key[3], key[4] << 24 | key[5] << 16 | key[6] << 8 | key[7], key[8] << 24 | key[9] << 16 | key[10] << 8 | key[11], key[12] << 24 | key[13] << 16 | key[14] << 8 | key[15], key[16] << 24 | key[17] << 16 | key[18] << 8 | key[19], key[20] << 24 | key[21] << 16 | key[22] << 8 | key[23], key[24] << 24 | key[25] << 16 | key[26] << 8 | key[27], key[28] << 24 | key[29] << 16 | key[30] << 8 | key[31], key[32] << 24 | key[33] << 16 | key[34] << 8 | key[35], key[36] << 24 | key[37] << 16 | key[38] << 8 | key[39], key[40] << 24 | key[41] << 16 | key[42] << 8 | key[43], key[44] << 24 | key[45] << 16 | key[46] << 8 | key[47], key[48] << 24 | key[49] << 16 | key[50] << 8 | key[51], key[52] << 24 | key[53] << 16 | key[54] << 8 | key[55], key[56] << 24 | key[57] << 16 | key[58] << 8 | key[59], key[60] << 24 | key[61] << 16 | key[62] << 8 | key[63]);
      return this;
    }
    finish() {
      if (this.key === null) throw new IllegalStateError('no key is associated with the instance');
      if (this.result !== null) throw new IllegalStateError('state must be reset before processing new data');
      const hash = this.hash;
      const asm = this.hash.asm;
      const heap = this.hash.heap;
      asm.hmac_finish(hash.pos, hash.len, 0);
      const verify = this.verify;
      const result = new Uint8Array(_sha256_hash_size);
      result.set(heap.subarray(0, _sha256_hash_size));
      if (verify) {
        if (verify.length === result.length) {
          let diff = 0;
          for (let i = 0; i < verify.length; i++) {
            diff |= verify[i] ^ result[i];
          }
          if (diff !== 0) throw new Error("HMAC verification failed, hash value doesn't match");
        } else {
          throw new Error("HMAC verification failed, lengths doesn't match");
        }
      } else {
        this.result = result;
      }
      return this;
    }
  }
  class HmacSha512 extends Hmac$1 {
    constructor(password, verify) {
      const hash = new Sha512();
      super(hash, password, verify);
      this.reset();
      if (verify !== undefined) {
        this._hmac_init_verify(verify);
      } else {
        this.verify = null;
      }
      return this;
    }
    reset() {
      const key = this.key;
      this.hash.reset().asm.hmac_init(key[0] << 24 | key[1] << 16 | key[2] << 8 | key[3], key[4] << 24 | key[5] << 16 | key[6] << 8 | key[7], key[8] << 24 | key[9] << 16 | key[10] << 8 | key[11], key[12] << 24 | key[13] << 16 | key[14] << 8 | key[15], key[16] << 24 | key[17] << 16 | key[18] << 8 | key[19], key[20] << 24 | key[21] << 16 | key[22] << 8 | key[23], key[24] << 24 | key[25] << 16 | key[26] << 8 | key[27], key[28] << 24 | key[29] << 16 | key[30] << 8 | key[31], key[32] << 24 | key[33] << 16 | key[34] << 8 | key[35], key[36] << 24 | key[37] << 16 | key[38] << 8 | key[39], key[40] << 24 | key[41] << 16 | key[42] << 8 | key[43], key[44] << 24 | key[45] << 16 | key[46] << 8 | key[47], key[48] << 24 | key[49] << 16 | key[50] << 8 | key[51], key[52] << 24 | key[53] << 16 | key[54] << 8 | key[55], key[56] << 24 | key[57] << 16 | key[58] << 8 | key[59], key[60] << 24 | key[61] << 16 | key[62] << 8 | key[63], key[64] << 24 | key[65] << 16 | key[66] << 8 | key[67], key[68] << 24 | key[69] << 16 | key[70] << 8 | key[71], key[72] << 24 | key[73] << 16 | key[74] << 8 | key[75], key[76] << 24 | key[77] << 16 | key[78] << 8 | key[79], key[80] << 24 | key[81] << 16 | key[82] << 8 | key[83], key[84] << 24 | key[85] << 16 | key[86] << 8 | key[87], key[88] << 24 | key[89] << 16 | key[90] << 8 | key[91], key[92] << 24 | key[93] << 16 | key[94] << 8 | key[95], key[96] << 24 | key[97] << 16 | key[98] << 8 | key[99], key[100] << 24 | key[101] << 16 | key[102] << 8 | key[103], key[104] << 24 | key[105] << 16 | key[106] << 8 | key[107], key[108] << 24 | key[109] << 16 | key[110] << 8 | key[111], key[112] << 24 | key[113] << 16 | key[114] << 8 | key[115], key[116] << 24 | key[117] << 16 | key[118] << 8 | key[119], key[120] << 24 | key[121] << 16 | key[122] << 8 | key[123], key[124] << 24 | key[125] << 16 | key[126] << 8 | key[127]);
      return this;
    }
    finish() {
      if (this.key === null) throw new IllegalStateError('no key is associated with the instance');
      if (this.result !== null) throw new IllegalStateError('state must be reset before processing new data');
      const hash = this.hash;
      const asm = this.hash.asm;
      const heap = this.hash.heap;
      asm.hmac_finish(hash.pos, hash.len, 0);
      const verify = this.verify;
      const result = new Uint8Array(_sha512_hash_size);
      result.set(heap.subarray(0, _sha512_hash_size));
      if (verify) {
        if (verify.length === result.length) {
          let diff = 0;
          for (let i = 0; i < verify.length; i++) {
            diff |= verify[i] ^ result[i];
          }
          if (diff !== 0) throw new Error("HMAC verification failed, hash value doesn't match");
        } else {
          throw new Error("HMAC verification failed, lengths doesn't match");
        }
      } else {
        this.result = result;
      }
      return this;
    }
  }
  function Pbkdf2HmacSha1(password, salt, count, length) {
    const hmac = new HmacSha1(password);
    const result = new Uint8Array(length);
    const blocks = Math.ceil(length / hmac.HMAC_SIZE);
    for (let i = 1; i <= blocks; ++i) {
      const j = (i - 1) * hmac.HMAC_SIZE;
      const l = (i < blocks ? 0 : length % hmac.HMAC_SIZE) || hmac.HMAC_SIZE;
      hmac.reset().process(salt);
      hmac.hash.asm.pbkdf2_generate_block(hmac.hash.pos, hmac.hash.len, i, count, 0);
      result.set(hmac.hash.heap.subarray(0, l), j);
    }
    return result;
  }
  function Pbkdf2HmacSha256(password, salt, count, length) {
    const hmac = new HmacSha256(password);
    const result = new Uint8Array(length);
    const blocks = Math.ceil(length / hmac.HMAC_SIZE);
    for (let i = 1; i <= blocks; ++i) {
      const j = (i - 1) * hmac.HMAC_SIZE;
      const l = (i < blocks ? 0 : length % hmac.HMAC_SIZE) || hmac.HMAC_SIZE;
      hmac.reset().process(salt);
      hmac.hash.asm.pbkdf2_generate_block(hmac.hash.pos, hmac.hash.len, i, count, 0);
      result.set(hmac.hash.heap.subarray(0, l), j);
    }
    return result;
  }
  function Pbkdf2HmacSha512(password, salt, count, length) {
    const hmac = new HmacSha512(password);
    const result = new Uint8Array(length);
    const blocks = Math.ceil(length / hmac.HMAC_SIZE);
    for (let i = 1; i <= blocks; ++i) {
      const j = (i - 1) * hmac.HMAC_SIZE;
      const l = (i < blocks ? 0 : length % hmac.HMAC_SIZE) || hmac.HMAC_SIZE;
      hmac.reset().process(salt);
      hmac.hash.asm.pbkdf2_generate_block(hmac.hash.pos, hmac.hash.len, i, count, 0);
      result.set(hmac.hash.heap.subarray(0, l), j);
    }
    return result;
  }
  class RSA {
    constructor(key) {
      const l = key.length;
      if (l !== 2 && l !== 3 && l !== 8) throw new SyntaxError('unexpected key type');
      const k0 = new Modulus(new BigNumber(key[0]));
      const k1 = new BigNumber(key[1]);
      this.key = {
        0: k0,
        1: k1
      };
      if (l > 2) {
        this.key[2] = new BigNumber(key[2]);
      }
      if (l > 3) {
        this.key[3] = new Modulus(new BigNumber(key[3]));
        this.key[4] = new Modulus(new BigNumber(key[4]));
        this.key[5] = new BigNumber(key[5]);
        this.key[6] = new BigNumber(key[6]);
        this.key[7] = new BigNumber(key[7]);
      }
    }
    encrypt(msg) {
      if (!this.key) throw new IllegalStateError('no key is associated with the instance');
      if (this.key[0].compare(msg) <= 0) throw new RangeError('data too large');
      const m = this.key[0];
      const e = this.key[1];
      let result = m.power(msg, e).toBytes();
      const bytelen = m.bitLength + 7 >> 3;
      if (result.length < bytelen) {
        const r = new Uint8Array(bytelen);
        r.set(result, bytelen - result.length);
        result = r;
      }
      this.result = result;
      return this;
    }
    decrypt(msg) {
      if (this.key[0].compare(msg) <= 0) throw new RangeError('data too large');
      let result;
      let m;
      if (this.key[3] !== undefined) {
        m = this.key[0];
        const p = this.key[3];
        const q = this.key[4];
        const dp = this.key[5];
        const dq = this.key[6];
        const u = this.key[7];
        const x = p.power(msg, dp);
        const y = q.power(msg, dq);
        let t = x.subtract(y);
        while (t.sign < 0) t = t.add(p);
        const h = p.reduce(u.multiply(t));
        result = h.multiply(q).add(y).clamp(m.bitLength).toBytes();
      } else {
        m = this.key[0];
        const d = this.key[2];
        result = m.power(msg, d).toBytes();
      }
      const bytelen = m.bitLength + 7 >> 3;
      if (result.length < bytelen) {
        let r = new Uint8Array(bytelen);
        r.set(result, bytelen - result.length);
        result = r;
      }
      this.result = result;
      return this;
    }
  }
  class RSA_OAEP {
    constructor(key, hash, label) {
      this.rsa = new RSA(key);
      this.hash = hash;
      if (label !== undefined) {
        this.label = label.length > 0 ? label : null;
      } else {
        this.label = null;
      }
    }
    encrypt(data, random) {
      const key_size = Math.ceil(this.rsa.key[0].bitLength / 8);
      const hash_size = this.hash.HASH_SIZE;
      const data_length = data.byteLength || data.length || 0;
      const ps_length = key_size - data_length - 2 * hash_size - 2;
      if (data_length > key_size - 2 * this.hash.HASH_SIZE - 2) throw new IllegalArgumentError('data too large');
      const message = new Uint8Array(key_size);
      const seed = message.subarray(1, hash_size + 1);
      const data_block = message.subarray(hash_size + 1);
      data_block.set(data, hash_size + ps_length + 1);
      data_block.set(this.hash.process(this.label || new Uint8Array(0)).finish().result, 0);
      data_block[hash_size + ps_length] = 1;
      if (random !== undefined) {
        if (seed.length !== random.length) throw new IllegalArgumentError('random size must equal the hash size');
        seed.set(random);
      } else {
        getRandomValues(seed);
      }
      const data_block_mask = this.RSA_MGF1_generate(seed, data_block.length);
      for (let i = 0; i < data_block.length; i++) data_block[i] ^= data_block_mask[i];
      const seed_mask = this.RSA_MGF1_generate(data_block, seed.length);
      for (let i = 0; i < seed.length; i++) seed[i] ^= seed_mask[i];
      this.rsa.encrypt(new BigNumber(message));
      return new Uint8Array(this.rsa.result);
    }
    decrypt(data) {
      if (!this.rsa.key) throw new IllegalStateError('no key is associated with the instance');
      const key_size = Math.ceil(this.rsa.key[0].bitLength / 8);
      const hash_size = this.hash.HASH_SIZE;
      const data_length = data.byteLength || data.length || 0;
      if (data_length !== key_size) throw new IllegalArgumentError('bad data');
      this.rsa.decrypt(new BigNumber(data));
      const z = this.rsa.result[0];
      const seed = this.rsa.result.subarray(1, hash_size + 1);
      const data_block = this.rsa.result.subarray(hash_size + 1);
      if (z !== 0) throw new SecurityError('decryption failed');
      const seed_mask = this.RSA_MGF1_generate(data_block, seed.length);
      for (let i = 0; i < seed.length; i++) seed[i] ^= seed_mask[i];
      const data_block_mask = this.RSA_MGF1_generate(seed, data_block.length);
      for (let i = 0; i < data_block.length; i++) data_block[i] ^= data_block_mask[i];
      const lhash = this.hash.reset().process(this.label || new Uint8Array(0)).finish().result;
      for (let i = 0; i < hash_size; i++) {
        if (lhash[i] !== data_block[i]) throw new SecurityError('decryption failed');
      }
      let ps_end = hash_size;
      for (; ps_end < data_block.length; ps_end++) {
        const psz = data_block[ps_end];
        if (psz === 1) break;
        if (psz !== 0) throw new SecurityError('decryption failed');
      }
      if (ps_end === data_block.length) throw new SecurityError('decryption failed');
      this.rsa.result = data_block.subarray(ps_end + 1);
      return new Uint8Array(this.rsa.result);
    }
    RSA_MGF1_generate(seed, length = 0) {
      const hash_size = this.hash.HASH_SIZE;
      const mask = new Uint8Array(length);
      const counter = new Uint8Array(4);
      const chunks = Math.ceil(length / hash_size);
      for (let i = 0; i < chunks; i++) {
        counter[0] = i >>> 24, counter[1] = i >>> 16 & 255, counter[2] = i >>> 8 & 255, counter[3] = i & 255;
        const submask = mask.subarray(i * hash_size);
        let chunk = this.hash.reset().process(seed).process(counter).finish().result;
        if (chunk.length > submask.length) chunk = chunk.subarray(0, submask.length);
        submask.set(chunk);
      }
      return mask;
    }
  }
  class RSA_PSS {
    constructor(key, hash, saltLength = 4) {
      this.rsa = new RSA(key);
      this.hash = hash;
      this.saltLength = saltLength;
      if (this.saltLength < 0) throw new TypeError('saltLength should be a non-negative number');
      if (this.rsa.key !== null && Math.ceil((this.rsa.key[0].bitLength - 1) / 8) < this.hash.HASH_SIZE + this.saltLength + 2) throw new SyntaxError('saltLength is too large');
    }
    sign(data, random) {
      const key_bits = this.rsa.key[0].bitLength;
      const hash_size = this.hash.HASH_SIZE;
      const message_length = Math.ceil((key_bits - 1) / 8);
      const salt_length = this.saltLength;
      const ps_length = message_length - salt_length - hash_size - 2;
      const message = new Uint8Array(message_length);
      const h_block = message.subarray(message_length - hash_size - 1, message_length - 1);
      const d_block = message.subarray(0, message_length - hash_size - 1);
      const d_salt = d_block.subarray(ps_length + 1);
      const m_block = new Uint8Array(8 + hash_size + salt_length);
      const m_hash = m_block.subarray(8, 8 + hash_size);
      const m_salt = m_block.subarray(8 + hash_size);
      m_hash.set(this.hash.process(data).finish().result);
      if (salt_length > 0) {
        if (random !== undefined) {
          if (m_salt.length !== random.length) throw new IllegalArgumentError('random size must equal the salt size');
          m_salt.set(random);
        } else {
          getRandomValues(m_salt);
        }
      }
      d_block[ps_length] = 1;
      d_salt.set(m_salt);
      h_block.set(this.hash.reset().process(m_block).finish().result);
      const d_block_mask = this.RSA_MGF1_generate(h_block, d_block.length);
      for (let i = 0; i < d_block.length; i++) d_block[i] ^= d_block_mask[i];
      message[message_length - 1] = 0xbc;
      const zbits = 8 * message_length - key_bits + 1;
      if (zbits % 8) message[0] &= 0xff >>> zbits;
      this.rsa.decrypt(new BigNumber(message));
      return this.rsa.result;
    }
    verify(signature, data) {
      const key_bits = this.rsa.key[0].bitLength;
      const hash_size = this.hash.HASH_SIZE;
      const message_length = Math.ceil((key_bits - 1) / 8);
      const salt_length = this.saltLength;
      const ps_length = message_length - salt_length - hash_size - 2;
      this.rsa.encrypt(new BigNumber(signature));
      const message = this.rsa.result;
      if (message[message_length - 1] !== 0xbc) throw new SecurityError('bad signature');
      const h_block = message.subarray(message_length - hash_size - 1, message_length - 1);
      const d_block = message.subarray(0, message_length - hash_size - 1);
      const d_salt = d_block.subarray(ps_length + 1);
      const zbits = 8 * message_length - key_bits + 1;
      if (zbits % 8 && message[0] >>> 8 - zbits) throw new SecurityError('bad signature');
      const d_block_mask = this.RSA_MGF1_generate(h_block, d_block.length);
      for (let i = 0; i < d_block.length; i++) d_block[i] ^= d_block_mask[i];
      if (zbits % 8) message[0] &= 0xff >>> zbits;
      for (let i = 0; i < ps_length; i++) {
        if (d_block[i] !== 0) throw new SecurityError('bad signature');
      }
      if (d_block[ps_length] !== 1) throw new SecurityError('bad signature');
      const m_block = new Uint8Array(8 + hash_size + salt_length);
      const m_hash = m_block.subarray(8, 8 + hash_size);
      const m_salt = m_block.subarray(8 + hash_size);
      m_hash.set(this.hash.reset().process(data).finish().result);
      m_salt.set(d_salt);
      const h_block_verify = this.hash.reset().process(m_block).finish().result;
      for (let i = 0; i < hash_size; i++) {
        if (h_block[i] !== h_block_verify[i]) throw new SecurityError('bad signature');
      }
    }
    RSA_MGF1_generate(seed, length = 0) {
      const hash_size = this.hash.HASH_SIZE;
      const mask = new Uint8Array(length);
      const counter = new Uint8Array(4);
      const chunks = Math.ceil(length / hash_size);
      for (let i = 0; i < chunks; i++) {
        counter[0] = i >>> 24, counter[1] = i >>> 16 & 255, counter[2] = i >>> 8 & 255, counter[3] = i & 255;
        const submask = mask.subarray(i * hash_size);
        let chunk = this.hash.reset().process(seed).process(counter).finish().result;
        if (chunk.length > submask.length) chunk = chunk.subarray(0, submask.length);
        submask.set(chunk);
      }
      return mask;
    }
  }
  class RSA_PKCS1_v1_5 {
    constructor(key, hash) {
      this.rsa = new RSA(key);
      this.hash = hash;
    }
    sign(data) {
      if (!this.rsa.key) {
        throw new IllegalStateError('no key is associated with the instance');
      }
      const prefix = getHashPrefix(this.hash);
      const hash_size = this.hash.HASH_SIZE;
      const t_len = prefix.length + hash_size;
      const k = this.rsa.key[0].bitLength + 7 >> 3;
      if (k < t_len + 11) {
        throw new Error('Message too long');
      }
      const m_hash = new Uint8Array(hash_size);
      m_hash.set(this.hash.process(data).finish().result);
      const em = new Uint8Array(k);
      let i = 0;
      em[i++] = 0;
      em[i++] = 1;
      for (i; i < k - t_len - 1; i++) {
        em[i] = 0xff;
      }
      em[i++] = 0;
      em.set(prefix, i);
      em.set(m_hash, em.length - hash_size);
      this.rsa.decrypt(new BigNumber(em));
      return this.rsa.result;
    }
    verify(signature, data) {
      const prefix = getHashPrefix(this.hash);
      const hash_size = this.hash.HASH_SIZE;
      const t_len = prefix.length + hash_size;
      const k = this.rsa.key[0].bitLength + 7 >> 3;
      if (k < t_len + 11) {
        throw new SecurityError('Bad signature');
      }
      this.rsa.encrypt(new BigNumber(signature));
      const m_hash = new Uint8Array(hash_size);
      m_hash.set(this.hash.process(data).finish().result);
      let res = 1;
      const decryptedSignature = this.rsa.result;
      let i = 0;
      res &= decryptedSignature[i++] === 0 ? 1 : 0;
      res &= decryptedSignature[i++] === 1 ? 1 : 0;
      for (i; i < k - t_len - 1; i++) {
        res &= decryptedSignature[i] === 0xff ? 1 : 0;
      }
      res &= decryptedSignature[i++] === 0 ? 1 : 0;
      let j = 0;
      let n = i + prefix.length;
      for (i; i < n; i++) {
        res &= decryptedSignature[i] === prefix[j++] ? 1 : 0;
      }
      j = 0;
      n = i + m_hash.length;
      for (i; i < n; i++) {
        res &= decryptedSignature[i] === m_hash[j++] ? 1 : 0;
      }
      if (!res) {
        throw new SecurityError('Bad signature');
      }
    }
  }
  const HASH_PREFIXES = {
    sha1: new Uint8Array([0x30, 0x21, 0x30, 0x09, 0x06, 0x05, 0x2b, 0x0e, 0x03, 0x02, 0x1a, 0x05, 0x00, 0x04, 0x14]),
    sha256: new Uint8Array([0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20]),
    sha384: new Uint8Array([0x30, 0x41, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x02, 0x05, 0x00, 0x04, 0x30]),
    sha512: new Uint8Array([0x30, 0x51, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x03, 0x05, 0x00, 0x04, 0x40])
  };
  function getHashPrefix(hash) {
    const prefix = HASH_PREFIXES[hash.NAME];
    if (!prefix) {
      throw new Error("Cannot get hash prefix for hash algorithm '" + hash.NAME + "'");
    }
    return prefix;
  }
  function isAlgorithm(algorithm, name) {
    return algorithm.name.toUpperCase() === name.toUpperCase();
  }
  class AesCryptoKey extends CryptoKey {
    constructor(algorithm, extractable, usages, raw) {
      super(algorithm, extractable, "secret", usages);
      this.raw = raw;
    }
    toJSON() {
      const jwk = {
        kty: "oct",
        alg: this.getJwkAlgorithm(),
        k: Convert.ToBase64Url(this.raw),
        ext: this.extractable,
        key_ops: this.usages
      };
      return jwk;
    }
    getJwkAlgorithm() {
      switch (this.algorithm.name.toUpperCase()) {
        case "AES-CBC":
          return `A${this.algorithm.length}CBC`;
        case "AES-CTR":
          return `A${this.algorithm.length}CTR`;
        case "AES-GCM":
          return `A${this.algorithm.length}GCM`;
        case "AES-ECB":
          return `A${this.algorithm.length}ECB`;
        default:
          throw new AlgorithmError("Unsupported algorithm name");
      }
    }
  }
  class AesCrypto {
    static checkCryptoKey(key) {
      if (!(key instanceof AesCryptoKey)) {
        throw new TypeError("key: Is not AesCryptoKey");
      }
    }
    static generateKey(algorithm, extractable, usages) {
      return __awaiter(this, void 0, void 0, function* () {
        const raw = exports.nativeCrypto.getRandomValues(new Uint8Array(algorithm.length / 8));
        return new AesCryptoKey(algorithm, extractable, usages, raw);
      });
    }
    static encrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.cipher(algorithm, key, BufferSourceConverter.toUint8Array(data), true);
      });
    }
    static decrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.cipher(algorithm, key, BufferSourceConverter.toUint8Array(data), false);
      });
    }
    static exportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        switch (format) {
          case "jwk":
            return key.toJSON();
          case "raw":
            return key.raw.buffer;
          default:
            throw new OperationError("format: Must be 'jwk' or 'raw'");
        }
      });
    }
    static importKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        let raw;
        if (isJWK(keyData)) {
          raw = Convert.FromBase64Url(keyData.k);
        } else {
          raw = BufferSourceConverter.toArrayBuffer(keyData);
        }
        switch (raw.byteLength << 3) {
          case 128:
          case 192:
          case 256:
            break;
          default:
            throw new OperationError("keyData: Is wrong key length");
        }
        const key = new AesCryptoKey({
          name: algorithm.name,
          length: raw.byteLength << 3
        }, extractable, keyUsages, new Uint8Array(raw));
        return key;
      });
    }
    static cipher(algorithm, key, data, encrypt) {
      return __awaiter(this, void 0, void 0, function* () {
        const action = encrypt ? "encrypt" : "decrypt";
        let result;
        if (isAlgorithm(algorithm, AesCrypto.AesCBC)) {
          const iv = BufferSourceConverter.toUint8Array(algorithm.iv);
          result = AES_CBC[action](data, key.raw, undefined, iv);
        } else if (isAlgorithm(algorithm, AesCrypto.AesGCM)) {
          const iv = BufferSourceConverter.toUint8Array(algorithm.iv);
          let additionalData;
          if (algorithm.additionalData) {
            additionalData = BufferSourceConverter.toUint8Array(algorithm.additionalData);
          }
          const tagLength = (algorithm.tagLength || 128) / 8;
          result = AES_GCM[action](data, key.raw, iv, additionalData, tagLength);
        } else if (isAlgorithm(algorithm, AesCrypto.AesECB)) {
          result = AES_ECB[action](data, key.raw, true);
        } else {
          throw new OperationError(`algorithm: Is not recognized`);
        }
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
  }
  AesCrypto.AesCBC = "AES-CBC";
  AesCrypto.AesECB = "AES-ECB";
  AesCrypto.AesGCM = "AES-GCM";
  class AesCbcProvider extends AesCbcProvider$1 {
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onEncrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.encrypt(algorithm, key, data);
      });
    }
    onDecrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.decrypt(algorithm, key, data);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      AesCrypto.checkCryptoKey(key);
    }
  }
  class AesEcbProvider extends AesEcbProvider$1 {
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onEncrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.encrypt(algorithm, key, data);
      });
    }
    onDecrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.decrypt(algorithm, key, data);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      AesCrypto.checkCryptoKey(key);
    }
  }
  class AesGcmProvider extends AesGcmProvider$1 {
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onEncrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.encrypt(algorithm, key, data);
      });
    }
    onDecrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.decrypt(algorithm, key, data);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      AesCrypto.checkCryptoKey(key);
    }
  }
  class AesCtrProvider extends AesCtrProvider$1 {
    onEncrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const result = new AES_CTR(key.raw, BufferSourceConverter.toUint8Array(algorithm.counter)).encrypt(BufferSourceConverter.toUint8Array(data));
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
    onDecrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const result = new AES_CTR(key.raw, BufferSourceConverter.toUint8Array(algorithm.counter)).decrypt(BufferSourceConverter.toUint8Array(data));
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return AesCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      AesCrypto.checkCryptoKey(key);
    }
  }
  class AesKwProvider extends AesKwProvider$1 {
    onEncrypt(_algorithm, _key, _data) {
      return __awaiter(this, void 0, void 0, function* () {
        throw new Error("Method not implemented.");
      });
    }
    onDecrypt(_algorithm, _key, _data) {
      return __awaiter(this, void 0, void 0, function* () {
        throw new Error("Method not implemented.");
      });
    }
    onGenerateKey(_algorithm, _extractable, _keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        throw new Error("Method not implemented.");
      });
    }
    onExportKey(_format, _key) {
      return __awaiter(this, void 0, void 0, function* () {
        throw new Error("Method not implemented.");
      });
    }
    onImportKey(_format, _keyData, _algorithm, _extractable, _keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        throw new Error("Method not implemented.");
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      AesCrypto.checkCryptoKey(key);
    }
  }
  class RsaCryptoKey extends CryptoKey {
    constructor(algorithm, extractable, type, usages, data) {
      super(algorithm, extractable, type, usages);
      this.data = data;
    }
  }
  class RsaCrypto {
    static checkCryptoKey(key) {
      if (!(key instanceof RsaCryptoKey)) {
        throw new TypeError("key: Is not RsaCryptoKey");
      }
    }
    static generateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        const alg = {
          name: "RSA-PSS",
          hash: "SHA-256",
          publicExponent: algorithm.publicExponent,
          modulusLength: algorithm.modulusLength
        };
        const keys = yield exports.nativeSubtle.generateKey(alg, true, ["sign", "verify"]);
        const crypto = new Crypto();
        const pkcs8 = yield crypto.subtle.exportKey("pkcs8", keys.privateKey);
        const privateKey = yield crypto.subtle.importKey("pkcs8", pkcs8, algorithm, extractable, keyUsages.filter(o => this.privateUsages.includes(o)));
        const spki = yield crypto.subtle.exportKey("spki", keys.publicKey);
        const publicKey = yield crypto.subtle.importKey("spki", spki, algorithm, true, keyUsages.filter(o => this.publicUsages.includes(o)));
        return {
          privateKey,
          publicKey
        };
      });
    }
    static exportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        switch (format) {
          case "pkcs8":
            return this.exportPkcs8Key(key);
          case "spki":
            return this.exportSpkiKey(key);
          case "jwk":
            return this.exportJwkKey(key);
          default:
            throw new OperationError("format: Must be 'jwk', 'pkcs8' or 'spki'");
        }
      });
    }
    static importKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        let asmKey;
        switch (format) {
          case "pkcs8":
            asmKey = this.importPkcs8Key(keyData);
            break;
          case "spki":
            asmKey = this.importSpkiKey(keyData);
            break;
          case "jwk":
            asmKey = this.importJwkKey(keyData);
            break;
          default:
            throw new OperationError("format: Must be 'jwk', 'pkcs8' or 'spki'");
        }
        const key = new RsaCryptoKey(Object.assign({
          publicExponent: asmKey[1][1] === 1 ? asmKey[1].slice(1) : asmKey[1].slice(3),
          modulusLength: asmKey[0].byteLength << 3
        }, algorithm), extractable, asmKey.length === 2 ? "public" : "private", keyUsages, asmKey);
        return key;
      });
    }
    static randomNonZeroValues(data) {
      data = exports.nativeCrypto.getRandomValues(data);
      return data.map(n => {
        while (!n) {
          n = exports.nativeCrypto.getRandomValues(new Uint8Array(1))[0];
        }
        return n;
      });
    }
    static exportPkcs8Key(key) {
      const keyInfo = new index$1.PrivateKeyInfo();
      keyInfo.privateKeyAlgorithm.algorithm = "1.2.840.113549.1.1.1";
      keyInfo.privateKeyAlgorithm.parameters = null;
      keyInfo.privateKey = AsnConvert.serialize(this.exportAsmKey(key.data));
      return AsnConvert.serialize(keyInfo);
    }
    static importPkcs8Key(data) {
      const keyInfo = AsnConvert.parse(data, index$1.PrivateKeyInfo);
      const privateKey = AsnConvert.parse(keyInfo.privateKey, index$1.RsaPrivateKey);
      return this.importAsmKey(privateKey);
    }
    static importSpkiKey(data) {
      const keyInfo = AsnConvert.parse(data, index$1.PublicKeyInfo);
      const publicKey = AsnConvert.parse(keyInfo.publicKey, index$1.RsaPublicKey);
      return this.importAsmKey(publicKey);
    }
    static exportSpkiKey(key) {
      const publicKey = new index$1.RsaPublicKey();
      publicKey.modulus = key.data[0].buffer;
      publicKey.publicExponent = key.data[1][1] === 1 ? key.data[1].buffer.slice(1) : key.data[1].buffer.slice(3);
      const keyInfo = new index$1.PublicKeyInfo();
      keyInfo.publicKeyAlgorithm.algorithm = "1.2.840.113549.1.1.1";
      keyInfo.publicKeyAlgorithm.parameters = null;
      keyInfo.publicKey = AsnConvert.serialize(publicKey);
      return AsnConvert.serialize(keyInfo);
    }
    static importJwkKey(data) {
      let key;
      if (data.d) {
        key = JsonParser.fromJSON(data, {
          targetSchema: index$1.RsaPrivateKey
        });
      } else {
        key = JsonParser.fromJSON(data, {
          targetSchema: index$1.RsaPublicKey
        });
      }
      return this.importAsmKey(key);
    }
    static exportJwkKey(key) {
      const asnKey = this.exportAsmKey(key.data);
      const jwk = JsonSerializer.toJSON(asnKey);
      jwk.ext = true;
      jwk.key_ops = key.usages;
      jwk.kty = "RSA";
      jwk.alg = this.getJwkAlgorithm(key.algorithm);
      return jwk;
    }
    static getJwkAlgorithm(algorithm) {
      switch (algorithm.name.toUpperCase()) {
        case "RSA-OAEP":
          {
            const mdSize = /(\d+)$/.exec(algorithm.hash.name)[1];
            return `RSA-OAEP${mdSize !== "1" ? `-${mdSize}` : ""}`;
          }
        case "RSASSA-PKCS1-V1_5":
          return `RS${/(\d+)$/.exec(algorithm.hash.name)[1]}`;
        case "RSA-PSS":
          return `PS${/(\d+)$/.exec(algorithm.hash.name)[1]}`;
        case "RSAES-PKCS1-V1_5":
          return `PS1`;
        default:
          throw new OperationError("algorithm: Is not recognized");
      }
    }
    static exportAsmKey(asmKey) {
      let key;
      if (asmKey.length > 2) {
        const privateKey = new index$1.RsaPrivateKey();
        privateKey.privateExponent = asmKey[2].buffer;
        privateKey.prime1 = asmKey[3].buffer;
        privateKey.prime2 = asmKey[4].buffer;
        privateKey.exponent1 = asmKey[5].buffer;
        privateKey.exponent2 = asmKey[6].buffer;
        privateKey.coefficient = asmKey[7].buffer;
        key = privateKey;
      } else {
        key = new index$1.RsaPublicKey();
      }
      key.modulus = asmKey[0].buffer;
      key.publicExponent = asmKey[1][1] === 1 ? asmKey[1].buffer.slice(1) : asmKey[1].buffer.slice(3);
      return key;
    }
    static importAsmKey(key) {
      const expPadding = new Uint8Array(4 - key.publicExponent.byteLength);
      const asmKey = [new Uint8Array(key.modulus), concat(expPadding, new Uint8Array(key.publicExponent))];
      if (key instanceof index$1.RsaPrivateKey) {
        asmKey.push(new Uint8Array(key.privateExponent));
        asmKey.push(new Uint8Array(key.prime1));
        asmKey.push(new Uint8Array(key.prime2));
        asmKey.push(new Uint8Array(key.exponent1));
        asmKey.push(new Uint8Array(key.exponent2));
        asmKey.push(new Uint8Array(key.coefficient));
      }
      return asmKey;
    }
  }
  RsaCrypto.RsaSsa = "RSASSA-PKCS1-v1_5";
  RsaCrypto.RsaPss = "RSA-PSS";
  RsaCrypto.RsaOaep = "RSA-OAEP";
  RsaCrypto.privateUsages = ["sign", "decrypt", "unwrapKey"];
  RsaCrypto.publicUsages = ["verify", "encrypt", "wrapKey"];
  class ShaCrypto {
    static getDigest(name) {
      switch (name) {
        case "SHA-1":
          return new Sha1();
        case "SHA-256":
          return new Sha256();
        case "SHA-512":
          return new Sha512();
        default:
          throw new AlgorithmError("keyAlgorithm.hash: Is not recognized");
      }
    }
    static digest(algorithm, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const mech = this.getDigest(algorithm.name);
        const result = mech.process(BufferSourceConverter.toUint8Array(data)).finish().result;
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
  }
  class RsaOaepProvider extends RsaOaepProvider$1 {
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    onEncrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.cipher(algorithm, key, data);
      });
    }
    onDecrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.cipher(algorithm, key, data);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      RsaCrypto.checkCryptoKey(key);
    }
    cipher(algorithm, key, data) {
      const digest = ShaCrypto.getDigest(key.algorithm.hash.name);
      let label;
      if (algorithm.label) {
        label = BufferSourceConverter.toUint8Array(algorithm.label);
      }
      const cipher = new RSA_OAEP(key.data, digest, label);
      let res;
      const u8Data = BufferSourceConverter.toUint8Array(data);
      if (key.type === "public") {
        res = cipher.encrypt(u8Data);
      } else {
        res = cipher.decrypt(u8Data);
      }
      return BufferSourceConverter.toArrayBuffer(res);
    }
  }
  class RsaPssProvider extends RsaPssProvider$1 {
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    onSign(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const rsa = new RSA_PSS(key.data, ShaCrypto.getDigest(key.algorithm.hash.name), algorithm.saltLength);
        const result = rsa.sign(BufferSourceConverter.toUint8Array(data));
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
    onVerify(algorithm, key, signature, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const rsa = new RSA_PSS(key.data, ShaCrypto.getDigest(key.algorithm.hash.name), algorithm.saltLength);
        try {
          rsa.verify(BufferSourceConverter.toUint8Array(signature), BufferSourceConverter.toUint8Array(data));
        } catch (_a) {
          return false;
        }
        return true;
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      RsaCrypto.checkCryptoKey(key);
    }
  }
  class RsaSsaProvider extends RsaSsaProvider$1 {
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    onSign(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const rsa = new RSA_PKCS1_v1_5(key.data, ShaCrypto.getDigest(key.algorithm.hash.name));
        const result = rsa.sign(BufferSourceConverter.toUint8Array(data));
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
    onVerify(algorithm, key, signature, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const rsa = new RSA_PKCS1_v1_5(key.data, ShaCrypto.getDigest(key.algorithm.hash.name));
        try {
          rsa.verify(BufferSourceConverter.toUint8Array(signature), BufferSourceConverter.toUint8Array(data));
        } catch (_a) {
          return false;
        }
        return true;
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      RsaCrypto.checkCryptoKey(key);
    }
  }
  class RsaEsProvider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.name = "RSAES-PKCS1-v1_5";
      this.usages = {
        publicKey: ["encrypt", "wrapKey"],
        privateKey: ["decrypt", "unwrapKey"]
      };
      this.hashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    }
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    checkGenerateKeyParams(algorithm) {
      this.checkRequiredProperty(algorithm, "publicExponent");
      if (!(algorithm.publicExponent && algorithm.publicExponent instanceof Uint8Array)) {
        throw new TypeError("publicExponent: Missing or not a Uint8Array");
      }
      const publicExponent = Convert.ToBase64(algorithm.publicExponent);
      if (!(publicExponent === "Aw==" || publicExponent === "AQAB")) {
        throw new TypeError("publicExponent: Must be [3] or [1,0,1]");
      }
      this.checkRequiredProperty(algorithm, "modulusLength");
      switch (algorithm.modulusLength) {
        case 1024:
        case 2048:
        case 4096:
          break;
        default:
          throw new TypeError("modulusLength: Must be 1024, 2048, or 4096");
      }
    }
    onDecrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const EM = new RSA(key.data).decrypt(new BigNumber(BufferSourceConverter.toUint8Array(data))).result;
        const k = key.algorithm.modulusLength >> 3;
        if (data.byteLength !== k) {
          throw new CryptoError("Decryption error. Encrypted message size doesn't match to key length");
        }
        let offset = 0;
        if (EM[offset++] || EM[offset++] !== 2) {
          throw new CryptoError("Decryption error");
        }
        do {
          if (EM[offset++] === 0) {
            break;
          }
        } while (offset < EM.length);
        if (offset < 11) {
          throw new CryptoError("Decryption error. PS is less than 8 octets.");
        }
        if (offset === EM.length) {
          throw new CryptoError("Decryption error. There is no octet with hexadecimal value 0x00 to separate PS from M");
        }
        return EM.buffer.slice(offset);
      });
    }
    onEncrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const k = key.algorithm.modulusLength >> 3;
        if (data.byteLength > k - 11) {
          throw new CryptoError("Message too long");
        }
        const psLen = k - data.byteLength - 3;
        const PS = RsaCrypto.randomNonZeroValues(new Uint8Array(psLen));
        const EM = new Uint8Array(k);
        EM[0] = 0;
        EM[1] = 2;
        EM.set(PS, 2);
        EM[2 + psLen] = 0;
        EM.set(new Uint8Array(data), 3 + psLen);
        const result = new RSA(key.data).encrypt(new BigNumber(EM)).result;
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return RsaCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        const key = yield RsaCrypto.importKey(format, keyData, Object.assign(Object.assign({}, algorithm), {
          name: this.name
        }), extractable, keyUsages);
        return key;
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      RsaCrypto.checkCryptoKey(key);
    }
  }
  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }
  var elliptic$2 = {};
  var utils$o = {};
  var bn = {
    exports: {}
  };
  bn.exports;
  (function (module) {
    (function (module, exports) {
      function assert(val, msg) {
        if (!val) throw new Error(msg || 'Assertion failed');
      }
      function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function () {};
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
      function BN(number, base, endian) {
        if (BN.isBN(number)) {
          return number;
        }
        this.negative = 0;
        this.words = null;
        this.length = 0;
        this.red = null;
        if (number !== null) {
          if (base === 'le' || base === 'be') {
            endian = base;
            base = 10;
          }
          this._init(number || 0, base || 10, endian || 'be');
        }
      }
      if (typeof module === 'object') {
        module.exports = BN;
      } else {
        exports.BN = BN;
      }
      BN.BN = BN;
      BN.wordSize = 26;
      var Buffer;
      try {
        if (typeof window !== 'undefined' && typeof window.Buffer !== 'undefined') {
          Buffer = window.Buffer;
        } else {
          Buffer = require('buffer').Buffer;
        }
      } catch (e) {}
      BN.isBN = function isBN(num) {
        if (num instanceof BN) {
          return true;
        }
        return num !== null && typeof num === 'object' && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
      };
      BN.max = function max(left, right) {
        if (left.cmp(right) > 0) return left;
        return right;
      };
      BN.min = function min(left, right) {
        if (left.cmp(right) < 0) return left;
        return right;
      };
      BN.prototype._init = function init(number, base, endian) {
        if (typeof number === 'number') {
          return this._initNumber(number, base, endian);
        }
        if (typeof number === 'object') {
          return this._initArray(number, base, endian);
        }
        if (base === 'hex') {
          base = 16;
        }
        assert(base === (base | 0) && base >= 2 && base <= 36);
        number = number.toString().replace(/\s+/g, '');
        var start = 0;
        if (number[0] === '-') {
          start++;
          this.negative = 1;
        }
        if (start < number.length) {
          if (base === 16) {
            this._parseHex(number, start, endian);
          } else {
            this._parseBase(number, base, start);
            if (endian === 'le') {
              this._initArray(this.toArray(), base, endian);
            }
          }
        }
      };
      BN.prototype._initNumber = function _initNumber(number, base, endian) {
        if (number < 0) {
          this.negative = 1;
          number = -number;
        }
        if (number < 0x4000000) {
          this.words = [number & 0x3ffffff];
          this.length = 1;
        } else if (number < 0x10000000000000) {
          this.words = [number & 0x3ffffff, number / 0x4000000 & 0x3ffffff];
          this.length = 2;
        } else {
          assert(number < 0x20000000000000);
          this.words = [number & 0x3ffffff, number / 0x4000000 & 0x3ffffff, 1];
          this.length = 3;
        }
        if (endian !== 'le') return;
        this._initArray(this.toArray(), base, endian);
      };
      BN.prototype._initArray = function _initArray(number, base, endian) {
        assert(typeof number.length === 'number');
        if (number.length <= 0) {
          this.words = [0];
          this.length = 1;
          return this;
        }
        this.length = Math.ceil(number.length / 3);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var j, w;
        var off = 0;
        if (endian === 'be') {
          for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
            w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
            this.words[j] |= w << off & 0x3ffffff;
            this.words[j + 1] = w >>> 26 - off & 0x3ffffff;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        } else if (endian === 'le') {
          for (i = 0, j = 0; i < number.length; i += 3) {
            w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
            this.words[j] |= w << off & 0x3ffffff;
            this.words[j + 1] = w >>> 26 - off & 0x3ffffff;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        }
        return this.strip();
      };
      function parseHex4Bits(string, index) {
        var c = string.charCodeAt(index);
        if (c >= 65 && c <= 70) {
          return c - 55;
        } else if (c >= 97 && c <= 102) {
          return c - 87;
        } else {
          return c - 48 & 0xf;
        }
      }
      function parseHexByte(string, lowerBound, index) {
        var r = parseHex4Bits(string, index);
        if (index - 1 >= lowerBound) {
          r |= parseHex4Bits(string, index - 1) << 4;
        }
        return r;
      }
      BN.prototype._parseHex = function _parseHex(number, start, endian) {
        this.length = Math.ceil((number.length - start) / 6);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var off = 0;
        var j = 0;
        var w;
        if (endian === 'be') {
          for (i = number.length - 1; i >= start; i -= 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 0x3ffffff;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        } else {
          var parseLength = number.length - start;
          for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 0x3ffffff;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        }
        this.strip();
      };
      function parseBase(str, start, end, mul) {
        var r = 0;
        var len = Math.min(str.length, end);
        for (var i = start; i < len; i++) {
          var c = str.charCodeAt(i) - 48;
          r *= mul;
          if (c >= 49) {
            r += c - 49 + 0xa;
          } else if (c >= 17) {
            r += c - 17 + 0xa;
          } else {
            r += c;
          }
        }
        return r;
      }
      BN.prototype._parseBase = function _parseBase(number, base, start) {
        this.words = [0];
        this.length = 1;
        for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
          limbLen++;
        }
        limbLen--;
        limbPow = limbPow / base | 0;
        var total = number.length - start;
        var mod = total % limbLen;
        var end = Math.min(total, total - mod) + start;
        var word = 0;
        for (var i = start; i < end; i += limbLen) {
          word = parseBase(number, i, i + limbLen, base);
          this.imuln(limbPow);
          if (this.words[0] + word < 0x4000000) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        if (mod !== 0) {
          var pow = 1;
          word = parseBase(number, i, number.length, base);
          for (i = 0; i < mod; i++) {
            pow *= base;
          }
          this.imuln(pow);
          if (this.words[0] + word < 0x4000000) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        this.strip();
      };
      BN.prototype.copy = function copy(dest) {
        dest.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          dest.words[i] = this.words[i];
        }
        dest.length = this.length;
        dest.negative = this.negative;
        dest.red = this.red;
      };
      BN.prototype.clone = function clone() {
        var r = new BN(null);
        this.copy(r);
        return r;
      };
      BN.prototype._expand = function _expand(size) {
        while (this.length < size) {
          this.words[this.length++] = 0;
        }
        return this;
      };
      BN.prototype.strip = function strip() {
        while (this.length > 1 && this.words[this.length - 1] === 0) {
          this.length--;
        }
        return this._normSign();
      };
      BN.prototype._normSign = function _normSign() {
        if (this.length === 1 && this.words[0] === 0) {
          this.negative = 0;
        }
        return this;
      };
      BN.prototype.inspect = function inspect() {
        return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
      };
      var zeros = ['', '0', '00', '000', '0000', '00000', '000000', '0000000', '00000000', '000000000', '0000000000', '00000000000', '000000000000', '0000000000000', '00000000000000', '000000000000000', '0000000000000000', '00000000000000000', '000000000000000000', '0000000000000000000', '00000000000000000000', '000000000000000000000', '0000000000000000000000', '00000000000000000000000', '000000000000000000000000', '0000000000000000000000000'];
      var groupSizes = [0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      var groupBases = [0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632, 6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149, 24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176];
      BN.prototype.toString = function toString(base, padding) {
        base = base || 10;
        padding = padding | 0 || 1;
        var out;
        if (base === 16 || base === 'hex') {
          out = '';
          var off = 0;
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = this.words[i];
            var word = ((w << off | carry) & 0xffffff).toString(16);
            carry = w >>> 24 - off & 0xffffff;
            if (carry !== 0 || i !== this.length - 1) {
              out = zeros[6 - word.length] + word + out;
            } else {
              out = word + out;
            }
            off += 2;
            if (off >= 26) {
              off -= 26;
              i--;
            }
          }
          if (carry !== 0) {
            out = carry.toString(16) + out;
          }
          while (out.length % padding !== 0) {
            out = '0' + out;
          }
          if (this.negative !== 0) {
            out = '-' + out;
          }
          return out;
        }
        if (base === (base | 0) && base >= 2 && base <= 36) {
          var groupSize = groupSizes[base];
          var groupBase = groupBases[base];
          out = '';
          var c = this.clone();
          c.negative = 0;
          while (!c.isZero()) {
            var r = c.modn(groupBase).toString(base);
            c = c.idivn(groupBase);
            if (!c.isZero()) {
              out = zeros[groupSize - r.length] + r + out;
            } else {
              out = r + out;
            }
          }
          if (this.isZero()) {
            out = '0' + out;
          }
          while (out.length % padding !== 0) {
            out = '0' + out;
          }
          if (this.negative !== 0) {
            out = '-' + out;
          }
          return out;
        }
        assert(false, 'Base should be between 2 and 36');
      };
      BN.prototype.toNumber = function toNumber() {
        var ret = this.words[0];
        if (this.length === 2) {
          ret += this.words[1] * 0x4000000;
        } else if (this.length === 3 && this.words[2] === 0x01) {
          ret += 0x10000000000000 + this.words[1] * 0x4000000;
        } else if (this.length > 2) {
          assert(false, 'Number can only safely store up to 53 bits');
        }
        return this.negative !== 0 ? -ret : ret;
      };
      BN.prototype.toJSON = function toJSON() {
        return this.toString(16);
      };
      BN.prototype.toBuffer = function toBuffer(endian, length) {
        assert(typeof Buffer !== 'undefined');
        return this.toArrayLike(Buffer, endian, length);
      };
      BN.prototype.toArray = function toArray(endian, length) {
        return this.toArrayLike(Array, endian, length);
      };
      BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
        var byteLength = this.byteLength();
        var reqLength = length || Math.max(1, byteLength);
        assert(byteLength <= reqLength, 'byte array longer than desired length');
        assert(reqLength > 0, 'Requested array length <= 0');
        this.strip();
        var littleEndian = endian === 'le';
        var res = new ArrayType(reqLength);
        var b, i;
        var q = this.clone();
        if (!littleEndian) {
          for (i = 0; i < reqLength - byteLength; i++) {
            res[i] = 0;
          }
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(0xff);
            q.iushrn(8);
            res[reqLength - i - 1] = b;
          }
        } else {
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(0xff);
            q.iushrn(8);
            res[i] = b;
          }
          for (; i < reqLength; i++) {
            res[i] = 0;
          }
        }
        return res;
      };
      if (Math.clz32) {
        BN.prototype._countBits = function _countBits(w) {
          return 32 - Math.clz32(w);
        };
      } else {
        BN.prototype._countBits = function _countBits(w) {
          var t = w;
          var r = 0;
          if (t >= 0x1000) {
            r += 13;
            t >>>= 13;
          }
          if (t >= 0x40) {
            r += 7;
            t >>>= 7;
          }
          if (t >= 0x8) {
            r += 4;
            t >>>= 4;
          }
          if (t >= 0x02) {
            r += 2;
            t >>>= 2;
          }
          return r + t;
        };
      }
      BN.prototype._zeroBits = function _zeroBits(w) {
        if (w === 0) return 26;
        var t = w;
        var r = 0;
        if ((t & 0x1fff) === 0) {
          r += 13;
          t >>>= 13;
        }
        if ((t & 0x7f) === 0) {
          r += 7;
          t >>>= 7;
        }
        if ((t & 0xf) === 0) {
          r += 4;
          t >>>= 4;
        }
        if ((t & 0x3) === 0) {
          r += 2;
          t >>>= 2;
        }
        if ((t & 0x1) === 0) {
          r++;
        }
        return r;
      };
      BN.prototype.bitLength = function bitLength() {
        var w = this.words[this.length - 1];
        var hi = this._countBits(w);
        return (this.length - 1) * 26 + hi;
      };
      function toBitArray(num) {
        var w = new Array(num.bitLength());
        for (var bit = 0; bit < w.length; bit++) {
          var off = bit / 26 | 0;
          var wbit = bit % 26;
          w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
        }
        return w;
      }
      BN.prototype.zeroBits = function zeroBits() {
        if (this.isZero()) return 0;
        var r = 0;
        for (var i = 0; i < this.length; i++) {
          var b = this._zeroBits(this.words[i]);
          r += b;
          if (b !== 26) break;
        }
        return r;
      };
      BN.prototype.byteLength = function byteLength() {
        return Math.ceil(this.bitLength() / 8);
      };
      BN.prototype.toTwos = function toTwos(width) {
        if (this.negative !== 0) {
          return this.abs().inotn(width).iaddn(1);
        }
        return this.clone();
      };
      BN.prototype.fromTwos = function fromTwos(width) {
        if (this.testn(width - 1)) {
          return this.notn(width).iaddn(1).ineg();
        }
        return this.clone();
      };
      BN.prototype.isNeg = function isNeg() {
        return this.negative !== 0;
      };
      BN.prototype.neg = function neg() {
        return this.clone().ineg();
      };
      BN.prototype.ineg = function ineg() {
        if (!this.isZero()) {
          this.negative ^= 1;
        }
        return this;
      };
      BN.prototype.iuor = function iuor(num) {
        while (this.length < num.length) {
          this.words[this.length++] = 0;
        }
        for (var i = 0; i < num.length; i++) {
          this.words[i] = this.words[i] | num.words[i];
        }
        return this.strip();
      };
      BN.prototype.ior = function ior(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuor(num);
      };
      BN.prototype.or = function or(num) {
        if (this.length > num.length) return this.clone().ior(num);
        return num.clone().ior(this);
      };
      BN.prototype.uor = function uor(num) {
        if (this.length > num.length) return this.clone().iuor(num);
        return num.clone().iuor(this);
      };
      BN.prototype.iuand = function iuand(num) {
        var b;
        if (this.length > num.length) {
          b = num;
        } else {
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = this.words[i] & num.words[i];
        }
        this.length = b.length;
        return this.strip();
      };
      BN.prototype.iand = function iand(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuand(num);
      };
      BN.prototype.and = function and(num) {
        if (this.length > num.length) return this.clone().iand(num);
        return num.clone().iand(this);
      };
      BN.prototype.uand = function uand(num) {
        if (this.length > num.length) return this.clone().iuand(num);
        return num.clone().iuand(this);
      };
      BN.prototype.iuxor = function iuxor(num) {
        var a;
        var b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = a.words[i] ^ b.words[i];
        }
        if (this !== a) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = a.length;
        return this.strip();
      };
      BN.prototype.ixor = function ixor(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuxor(num);
      };
      BN.prototype.xor = function xor(num) {
        if (this.length > num.length) return this.clone().ixor(num);
        return num.clone().ixor(this);
      };
      BN.prototype.uxor = function uxor(num) {
        if (this.length > num.length) return this.clone().iuxor(num);
        return num.clone().iuxor(this);
      };
      BN.prototype.inotn = function inotn(width) {
        assert(typeof width === 'number' && width >= 0);
        var bytesNeeded = Math.ceil(width / 26) | 0;
        var bitsLeft = width % 26;
        this._expand(bytesNeeded);
        if (bitsLeft > 0) {
          bytesNeeded--;
        }
        for (var i = 0; i < bytesNeeded; i++) {
          this.words[i] = ~this.words[i] & 0x3ffffff;
        }
        if (bitsLeft > 0) {
          this.words[i] = ~this.words[i] & 0x3ffffff >> 26 - bitsLeft;
        }
        return this.strip();
      };
      BN.prototype.notn = function notn(width) {
        return this.clone().inotn(width);
      };
      BN.prototype.setn = function setn(bit, val) {
        assert(typeof bit === 'number' && bit >= 0);
        var off = bit / 26 | 0;
        var wbit = bit % 26;
        this._expand(off + 1);
        if (val) {
          this.words[off] = this.words[off] | 1 << wbit;
        } else {
          this.words[off] = this.words[off] & ~(1 << wbit);
        }
        return this.strip();
      };
      BN.prototype.iadd = function iadd(num) {
        var r;
        if (this.negative !== 0 && num.negative === 0) {
          this.negative = 0;
          r = this.isub(num);
          this.negative ^= 1;
          return this._normSign();
        } else if (this.negative === 0 && num.negative !== 0) {
          num.negative = 0;
          r = this.isub(num);
          num.negative = 1;
          return r._normSign();
        }
        var a, b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
          this.words[i] = r & 0x3ffffff;
          carry = r >>> 26;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          this.words[i] = r & 0x3ffffff;
          carry = r >>> 26;
        }
        this.length = a.length;
        if (carry !== 0) {
          this.words[this.length] = carry;
          this.length++;
        } else if (a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        return this;
      };
      BN.prototype.add = function add(num) {
        var res;
        if (num.negative !== 0 && this.negative === 0) {
          num.negative = 0;
          res = this.sub(num);
          num.negative ^= 1;
          return res;
        } else if (num.negative === 0 && this.negative !== 0) {
          this.negative = 0;
          res = num.sub(this);
          this.negative = 1;
          return res;
        }
        if (this.length > num.length) return this.clone().iadd(num);
        return num.clone().iadd(this);
      };
      BN.prototype.isub = function isub(num) {
        if (num.negative !== 0) {
          num.negative = 0;
          var r = this.iadd(num);
          num.negative = 1;
          return r._normSign();
        } else if (this.negative !== 0) {
          this.negative = 0;
          this.iadd(num);
          this.negative = 1;
          return this._normSign();
        }
        var cmp = this.cmp(num);
        if (cmp === 0) {
          this.negative = 0;
          this.length = 1;
          this.words[0] = 0;
          return this;
        }
        var a, b;
        if (cmp > 0) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 0x3ffffff;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 0x3ffffff;
        }
        if (carry === 0 && i < a.length && a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = Math.max(this.length, i);
        if (a !== this) {
          this.negative = 1;
        }
        return this.strip();
      };
      BN.prototype.sub = function sub(num) {
        return this.clone().isub(num);
      };
      function smallMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        var len = self.length + num.length | 0;
        out.length = len;
        len = len - 1 | 0;
        var a = self.words[0] | 0;
        var b = num.words[0] | 0;
        var r = a * b;
        var lo = r & 0x3ffffff;
        var carry = r / 0x4000000 | 0;
        out.words[0] = lo;
        for (var k = 1; k < len; k++) {
          var ncarry = carry >>> 26;
          var rword = carry & 0x3ffffff;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j | 0;
            a = self.words[i] | 0;
            b = num.words[j] | 0;
            r = a * b + rword;
            ncarry += r / 0x4000000 | 0;
            rword = r & 0x3ffffff;
          }
          out.words[k] = rword | 0;
          carry = ncarry | 0;
        }
        if (carry !== 0) {
          out.words[k] = carry | 0;
        } else {
          out.length--;
        }
        return out.strip();
      }
      var comb10MulTo = function comb10MulTo(self, num, out) {
        var a = self.words;
        var b = num.words;
        var o = out.words;
        var c = 0;
        var lo;
        var mid;
        var hi;
        var a0 = a[0] | 0;
        var al0 = a0 & 0x1fff;
        var ah0 = a0 >>> 13;
        var a1 = a[1] | 0;
        var al1 = a1 & 0x1fff;
        var ah1 = a1 >>> 13;
        var a2 = a[2] | 0;
        var al2 = a2 & 0x1fff;
        var ah2 = a2 >>> 13;
        var a3 = a[3] | 0;
        var al3 = a3 & 0x1fff;
        var ah3 = a3 >>> 13;
        var a4 = a[4] | 0;
        var al4 = a4 & 0x1fff;
        var ah4 = a4 >>> 13;
        var a5 = a[5] | 0;
        var al5 = a5 & 0x1fff;
        var ah5 = a5 >>> 13;
        var a6 = a[6] | 0;
        var al6 = a6 & 0x1fff;
        var ah6 = a6 >>> 13;
        var a7 = a[7] | 0;
        var al7 = a7 & 0x1fff;
        var ah7 = a7 >>> 13;
        var a8 = a[8] | 0;
        var al8 = a8 & 0x1fff;
        var ah8 = a8 >>> 13;
        var a9 = a[9] | 0;
        var al9 = a9 & 0x1fff;
        var ah9 = a9 >>> 13;
        var b0 = b[0] | 0;
        var bl0 = b0 & 0x1fff;
        var bh0 = b0 >>> 13;
        var b1 = b[1] | 0;
        var bl1 = b1 & 0x1fff;
        var bh1 = b1 >>> 13;
        var b2 = b[2] | 0;
        var bl2 = b2 & 0x1fff;
        var bh2 = b2 >>> 13;
        var b3 = b[3] | 0;
        var bl3 = b3 & 0x1fff;
        var bh3 = b3 >>> 13;
        var b4 = b[4] | 0;
        var bl4 = b4 & 0x1fff;
        var bh4 = b4 >>> 13;
        var b5 = b[5] | 0;
        var bl5 = b5 & 0x1fff;
        var bh5 = b5 >>> 13;
        var b6 = b[6] | 0;
        var bl6 = b6 & 0x1fff;
        var bh6 = b6 >>> 13;
        var b7 = b[7] | 0;
        var bl7 = b7 & 0x1fff;
        var bh7 = b7 >>> 13;
        var b8 = b[8] | 0;
        var bl8 = b8 & 0x1fff;
        var bh8 = b8 >>> 13;
        var b9 = b[9] | 0;
        var bl9 = b9 & 0x1fff;
        var bh9 = b9 >>> 13;
        out.negative = self.negative ^ num.negative;
        out.length = 19;
        lo = Math.imul(al0, bl0);
        mid = Math.imul(al0, bh0);
        mid = mid + Math.imul(ah0, bl0) | 0;
        hi = Math.imul(ah0, bh0);
        var w0 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
        w0 &= 0x3ffffff;
        lo = Math.imul(al1, bl0);
        mid = Math.imul(al1, bh0);
        mid = mid + Math.imul(ah1, bl0) | 0;
        hi = Math.imul(ah1, bh0);
        lo = lo + Math.imul(al0, bl1) | 0;
        mid = mid + Math.imul(al0, bh1) | 0;
        mid = mid + Math.imul(ah0, bl1) | 0;
        hi = hi + Math.imul(ah0, bh1) | 0;
        var w1 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
        w1 &= 0x3ffffff;
        lo = Math.imul(al2, bl0);
        mid = Math.imul(al2, bh0);
        mid = mid + Math.imul(ah2, bl0) | 0;
        hi = Math.imul(ah2, bh0);
        lo = lo + Math.imul(al1, bl1) | 0;
        mid = mid + Math.imul(al1, bh1) | 0;
        mid = mid + Math.imul(ah1, bl1) | 0;
        hi = hi + Math.imul(ah1, bh1) | 0;
        lo = lo + Math.imul(al0, bl2) | 0;
        mid = mid + Math.imul(al0, bh2) | 0;
        mid = mid + Math.imul(ah0, bl2) | 0;
        hi = hi + Math.imul(ah0, bh2) | 0;
        var w2 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
        w2 &= 0x3ffffff;
        lo = Math.imul(al3, bl0);
        mid = Math.imul(al3, bh0);
        mid = mid + Math.imul(ah3, bl0) | 0;
        hi = Math.imul(ah3, bh0);
        lo = lo + Math.imul(al2, bl1) | 0;
        mid = mid + Math.imul(al2, bh1) | 0;
        mid = mid + Math.imul(ah2, bl1) | 0;
        hi = hi + Math.imul(ah2, bh1) | 0;
        lo = lo + Math.imul(al1, bl2) | 0;
        mid = mid + Math.imul(al1, bh2) | 0;
        mid = mid + Math.imul(ah1, bl2) | 0;
        hi = hi + Math.imul(ah1, bh2) | 0;
        lo = lo + Math.imul(al0, bl3) | 0;
        mid = mid + Math.imul(al0, bh3) | 0;
        mid = mid + Math.imul(ah0, bl3) | 0;
        hi = hi + Math.imul(ah0, bh3) | 0;
        var w3 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
        w3 &= 0x3ffffff;
        lo = Math.imul(al4, bl0);
        mid = Math.imul(al4, bh0);
        mid = mid + Math.imul(ah4, bl0) | 0;
        hi = Math.imul(ah4, bh0);
        lo = lo + Math.imul(al3, bl1) | 0;
        mid = mid + Math.imul(al3, bh1) | 0;
        mid = mid + Math.imul(ah3, bl1) | 0;
        hi = hi + Math.imul(ah3, bh1) | 0;
        lo = lo + Math.imul(al2, bl2) | 0;
        mid = mid + Math.imul(al2, bh2) | 0;
        mid = mid + Math.imul(ah2, bl2) | 0;
        hi = hi + Math.imul(ah2, bh2) | 0;
        lo = lo + Math.imul(al1, bl3) | 0;
        mid = mid + Math.imul(al1, bh3) | 0;
        mid = mid + Math.imul(ah1, bl3) | 0;
        hi = hi + Math.imul(ah1, bh3) | 0;
        lo = lo + Math.imul(al0, bl4) | 0;
        mid = mid + Math.imul(al0, bh4) | 0;
        mid = mid + Math.imul(ah0, bl4) | 0;
        hi = hi + Math.imul(ah0, bh4) | 0;
        var w4 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
        w4 &= 0x3ffffff;
        lo = Math.imul(al5, bl0);
        mid = Math.imul(al5, bh0);
        mid = mid + Math.imul(ah5, bl0) | 0;
        hi = Math.imul(ah5, bh0);
        lo = lo + Math.imul(al4, bl1) | 0;
        mid = mid + Math.imul(al4, bh1) | 0;
        mid = mid + Math.imul(ah4, bl1) | 0;
        hi = hi + Math.imul(ah4, bh1) | 0;
        lo = lo + Math.imul(al3, bl2) | 0;
        mid = mid + Math.imul(al3, bh2) | 0;
        mid = mid + Math.imul(ah3, bl2) | 0;
        hi = hi + Math.imul(ah3, bh2) | 0;
        lo = lo + Math.imul(al2, bl3) | 0;
        mid = mid + Math.imul(al2, bh3) | 0;
        mid = mid + Math.imul(ah2, bl3) | 0;
        hi = hi + Math.imul(ah2, bh3) | 0;
        lo = lo + Math.imul(al1, bl4) | 0;
        mid = mid + Math.imul(al1, bh4) | 0;
        mid = mid + Math.imul(ah1, bl4) | 0;
        hi = hi + Math.imul(ah1, bh4) | 0;
        lo = lo + Math.imul(al0, bl5) | 0;
        mid = mid + Math.imul(al0, bh5) | 0;
        mid = mid + Math.imul(ah0, bl5) | 0;
        hi = hi + Math.imul(ah0, bh5) | 0;
        var w5 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
        w5 &= 0x3ffffff;
        lo = Math.imul(al6, bl0);
        mid = Math.imul(al6, bh0);
        mid = mid + Math.imul(ah6, bl0) | 0;
        hi = Math.imul(ah6, bh0);
        lo = lo + Math.imul(al5, bl1) | 0;
        mid = mid + Math.imul(al5, bh1) | 0;
        mid = mid + Math.imul(ah5, bl1) | 0;
        hi = hi + Math.imul(ah5, bh1) | 0;
        lo = lo + Math.imul(al4, bl2) | 0;
        mid = mid + Math.imul(al4, bh2) | 0;
        mid = mid + Math.imul(ah4, bl2) | 0;
        hi = hi + Math.imul(ah4, bh2) | 0;
        lo = lo + Math.imul(al3, bl3) | 0;
        mid = mid + Math.imul(al3, bh3) | 0;
        mid = mid + Math.imul(ah3, bl3) | 0;
        hi = hi + Math.imul(ah3, bh3) | 0;
        lo = lo + Math.imul(al2, bl4) | 0;
        mid = mid + Math.imul(al2, bh4) | 0;
        mid = mid + Math.imul(ah2, bl4) | 0;
        hi = hi + Math.imul(ah2, bh4) | 0;
        lo = lo + Math.imul(al1, bl5) | 0;
        mid = mid + Math.imul(al1, bh5) | 0;
        mid = mid + Math.imul(ah1, bl5) | 0;
        hi = hi + Math.imul(ah1, bh5) | 0;
        lo = lo + Math.imul(al0, bl6) | 0;
        mid = mid + Math.imul(al0, bh6) | 0;
        mid = mid + Math.imul(ah0, bl6) | 0;
        hi = hi + Math.imul(ah0, bh6) | 0;
        var w6 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
        w6 &= 0x3ffffff;
        lo = Math.imul(al7, bl0);
        mid = Math.imul(al7, bh0);
        mid = mid + Math.imul(ah7, bl0) | 0;
        hi = Math.imul(ah7, bh0);
        lo = lo + Math.imul(al6, bl1) | 0;
        mid = mid + Math.imul(al6, bh1) | 0;
        mid = mid + Math.imul(ah6, bl1) | 0;
        hi = hi + Math.imul(ah6, bh1) | 0;
        lo = lo + Math.imul(al5, bl2) | 0;
        mid = mid + Math.imul(al5, bh2) | 0;
        mid = mid + Math.imul(ah5, bl2) | 0;
        hi = hi + Math.imul(ah5, bh2) | 0;
        lo = lo + Math.imul(al4, bl3) | 0;
        mid = mid + Math.imul(al4, bh3) | 0;
        mid = mid + Math.imul(ah4, bl3) | 0;
        hi = hi + Math.imul(ah4, bh3) | 0;
        lo = lo + Math.imul(al3, bl4) | 0;
        mid = mid + Math.imul(al3, bh4) | 0;
        mid = mid + Math.imul(ah3, bl4) | 0;
        hi = hi + Math.imul(ah3, bh4) | 0;
        lo = lo + Math.imul(al2, bl5) | 0;
        mid = mid + Math.imul(al2, bh5) | 0;
        mid = mid + Math.imul(ah2, bl5) | 0;
        hi = hi + Math.imul(ah2, bh5) | 0;
        lo = lo + Math.imul(al1, bl6) | 0;
        mid = mid + Math.imul(al1, bh6) | 0;
        mid = mid + Math.imul(ah1, bl6) | 0;
        hi = hi + Math.imul(ah1, bh6) | 0;
        lo = lo + Math.imul(al0, bl7) | 0;
        mid = mid + Math.imul(al0, bh7) | 0;
        mid = mid + Math.imul(ah0, bl7) | 0;
        hi = hi + Math.imul(ah0, bh7) | 0;
        var w7 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
        w7 &= 0x3ffffff;
        lo = Math.imul(al8, bl0);
        mid = Math.imul(al8, bh0);
        mid = mid + Math.imul(ah8, bl0) | 0;
        hi = Math.imul(ah8, bh0);
        lo = lo + Math.imul(al7, bl1) | 0;
        mid = mid + Math.imul(al7, bh1) | 0;
        mid = mid + Math.imul(ah7, bl1) | 0;
        hi = hi + Math.imul(ah7, bh1) | 0;
        lo = lo + Math.imul(al6, bl2) | 0;
        mid = mid + Math.imul(al6, bh2) | 0;
        mid = mid + Math.imul(ah6, bl2) | 0;
        hi = hi + Math.imul(ah6, bh2) | 0;
        lo = lo + Math.imul(al5, bl3) | 0;
        mid = mid + Math.imul(al5, bh3) | 0;
        mid = mid + Math.imul(ah5, bl3) | 0;
        hi = hi + Math.imul(ah5, bh3) | 0;
        lo = lo + Math.imul(al4, bl4) | 0;
        mid = mid + Math.imul(al4, bh4) | 0;
        mid = mid + Math.imul(ah4, bl4) | 0;
        hi = hi + Math.imul(ah4, bh4) | 0;
        lo = lo + Math.imul(al3, bl5) | 0;
        mid = mid + Math.imul(al3, bh5) | 0;
        mid = mid + Math.imul(ah3, bl5) | 0;
        hi = hi + Math.imul(ah3, bh5) | 0;
        lo = lo + Math.imul(al2, bl6) | 0;
        mid = mid + Math.imul(al2, bh6) | 0;
        mid = mid + Math.imul(ah2, bl6) | 0;
        hi = hi + Math.imul(ah2, bh6) | 0;
        lo = lo + Math.imul(al1, bl7) | 0;
        mid = mid + Math.imul(al1, bh7) | 0;
        mid = mid + Math.imul(ah1, bl7) | 0;
        hi = hi + Math.imul(ah1, bh7) | 0;
        lo = lo + Math.imul(al0, bl8) | 0;
        mid = mid + Math.imul(al0, bh8) | 0;
        mid = mid + Math.imul(ah0, bl8) | 0;
        hi = hi + Math.imul(ah0, bh8) | 0;
        var w8 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
        w8 &= 0x3ffffff;
        lo = Math.imul(al9, bl0);
        mid = Math.imul(al9, bh0);
        mid = mid + Math.imul(ah9, bl0) | 0;
        hi = Math.imul(ah9, bh0);
        lo = lo + Math.imul(al8, bl1) | 0;
        mid = mid + Math.imul(al8, bh1) | 0;
        mid = mid + Math.imul(ah8, bl1) | 0;
        hi = hi + Math.imul(ah8, bh1) | 0;
        lo = lo + Math.imul(al7, bl2) | 0;
        mid = mid + Math.imul(al7, bh2) | 0;
        mid = mid + Math.imul(ah7, bl2) | 0;
        hi = hi + Math.imul(ah7, bh2) | 0;
        lo = lo + Math.imul(al6, bl3) | 0;
        mid = mid + Math.imul(al6, bh3) | 0;
        mid = mid + Math.imul(ah6, bl3) | 0;
        hi = hi + Math.imul(ah6, bh3) | 0;
        lo = lo + Math.imul(al5, bl4) | 0;
        mid = mid + Math.imul(al5, bh4) | 0;
        mid = mid + Math.imul(ah5, bl4) | 0;
        hi = hi + Math.imul(ah5, bh4) | 0;
        lo = lo + Math.imul(al4, bl5) | 0;
        mid = mid + Math.imul(al4, bh5) | 0;
        mid = mid + Math.imul(ah4, bl5) | 0;
        hi = hi + Math.imul(ah4, bh5) | 0;
        lo = lo + Math.imul(al3, bl6) | 0;
        mid = mid + Math.imul(al3, bh6) | 0;
        mid = mid + Math.imul(ah3, bl6) | 0;
        hi = hi + Math.imul(ah3, bh6) | 0;
        lo = lo + Math.imul(al2, bl7) | 0;
        mid = mid + Math.imul(al2, bh7) | 0;
        mid = mid + Math.imul(ah2, bl7) | 0;
        hi = hi + Math.imul(ah2, bh7) | 0;
        lo = lo + Math.imul(al1, bl8) | 0;
        mid = mid + Math.imul(al1, bh8) | 0;
        mid = mid + Math.imul(ah1, bl8) | 0;
        hi = hi + Math.imul(ah1, bh8) | 0;
        lo = lo + Math.imul(al0, bl9) | 0;
        mid = mid + Math.imul(al0, bh9) | 0;
        mid = mid + Math.imul(ah0, bl9) | 0;
        hi = hi + Math.imul(ah0, bh9) | 0;
        var w9 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
        w9 &= 0x3ffffff;
        lo = Math.imul(al9, bl1);
        mid = Math.imul(al9, bh1);
        mid = mid + Math.imul(ah9, bl1) | 0;
        hi = Math.imul(ah9, bh1);
        lo = lo + Math.imul(al8, bl2) | 0;
        mid = mid + Math.imul(al8, bh2) | 0;
        mid = mid + Math.imul(ah8, bl2) | 0;
        hi = hi + Math.imul(ah8, bh2) | 0;
        lo = lo + Math.imul(al7, bl3) | 0;
        mid = mid + Math.imul(al7, bh3) | 0;
        mid = mid + Math.imul(ah7, bl3) | 0;
        hi = hi + Math.imul(ah7, bh3) | 0;
        lo = lo + Math.imul(al6, bl4) | 0;
        mid = mid + Math.imul(al6, bh4) | 0;
        mid = mid + Math.imul(ah6, bl4) | 0;
        hi = hi + Math.imul(ah6, bh4) | 0;
        lo = lo + Math.imul(al5, bl5) | 0;
        mid = mid + Math.imul(al5, bh5) | 0;
        mid = mid + Math.imul(ah5, bl5) | 0;
        hi = hi + Math.imul(ah5, bh5) | 0;
        lo = lo + Math.imul(al4, bl6) | 0;
        mid = mid + Math.imul(al4, bh6) | 0;
        mid = mid + Math.imul(ah4, bl6) | 0;
        hi = hi + Math.imul(ah4, bh6) | 0;
        lo = lo + Math.imul(al3, bl7) | 0;
        mid = mid + Math.imul(al3, bh7) | 0;
        mid = mid + Math.imul(ah3, bl7) | 0;
        hi = hi + Math.imul(ah3, bh7) | 0;
        lo = lo + Math.imul(al2, bl8) | 0;
        mid = mid + Math.imul(al2, bh8) | 0;
        mid = mid + Math.imul(ah2, bl8) | 0;
        hi = hi + Math.imul(ah2, bh8) | 0;
        lo = lo + Math.imul(al1, bl9) | 0;
        mid = mid + Math.imul(al1, bh9) | 0;
        mid = mid + Math.imul(ah1, bl9) | 0;
        hi = hi + Math.imul(ah1, bh9) | 0;
        var w10 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
        w10 &= 0x3ffffff;
        lo = Math.imul(al9, bl2);
        mid = Math.imul(al9, bh2);
        mid = mid + Math.imul(ah9, bl2) | 0;
        hi = Math.imul(ah9, bh2);
        lo = lo + Math.imul(al8, bl3) | 0;
        mid = mid + Math.imul(al8, bh3) | 0;
        mid = mid + Math.imul(ah8, bl3) | 0;
        hi = hi + Math.imul(ah8, bh3) | 0;
        lo = lo + Math.imul(al7, bl4) | 0;
        mid = mid + Math.imul(al7, bh4) | 0;
        mid = mid + Math.imul(ah7, bl4) | 0;
        hi = hi + Math.imul(ah7, bh4) | 0;
        lo = lo + Math.imul(al6, bl5) | 0;
        mid = mid + Math.imul(al6, bh5) | 0;
        mid = mid + Math.imul(ah6, bl5) | 0;
        hi = hi + Math.imul(ah6, bh5) | 0;
        lo = lo + Math.imul(al5, bl6) | 0;
        mid = mid + Math.imul(al5, bh6) | 0;
        mid = mid + Math.imul(ah5, bl6) | 0;
        hi = hi + Math.imul(ah5, bh6) | 0;
        lo = lo + Math.imul(al4, bl7) | 0;
        mid = mid + Math.imul(al4, bh7) | 0;
        mid = mid + Math.imul(ah4, bl7) | 0;
        hi = hi + Math.imul(ah4, bh7) | 0;
        lo = lo + Math.imul(al3, bl8) | 0;
        mid = mid + Math.imul(al3, bh8) | 0;
        mid = mid + Math.imul(ah3, bl8) | 0;
        hi = hi + Math.imul(ah3, bh8) | 0;
        lo = lo + Math.imul(al2, bl9) | 0;
        mid = mid + Math.imul(al2, bh9) | 0;
        mid = mid + Math.imul(ah2, bl9) | 0;
        hi = hi + Math.imul(ah2, bh9) | 0;
        var w11 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
        w11 &= 0x3ffffff;
        lo = Math.imul(al9, bl3);
        mid = Math.imul(al9, bh3);
        mid = mid + Math.imul(ah9, bl3) | 0;
        hi = Math.imul(ah9, bh3);
        lo = lo + Math.imul(al8, bl4) | 0;
        mid = mid + Math.imul(al8, bh4) | 0;
        mid = mid + Math.imul(ah8, bl4) | 0;
        hi = hi + Math.imul(ah8, bh4) | 0;
        lo = lo + Math.imul(al7, bl5) | 0;
        mid = mid + Math.imul(al7, bh5) | 0;
        mid = mid + Math.imul(ah7, bl5) | 0;
        hi = hi + Math.imul(ah7, bh5) | 0;
        lo = lo + Math.imul(al6, bl6) | 0;
        mid = mid + Math.imul(al6, bh6) | 0;
        mid = mid + Math.imul(ah6, bl6) | 0;
        hi = hi + Math.imul(ah6, bh6) | 0;
        lo = lo + Math.imul(al5, bl7) | 0;
        mid = mid + Math.imul(al5, bh7) | 0;
        mid = mid + Math.imul(ah5, bl7) | 0;
        hi = hi + Math.imul(ah5, bh7) | 0;
        lo = lo + Math.imul(al4, bl8) | 0;
        mid = mid + Math.imul(al4, bh8) | 0;
        mid = mid + Math.imul(ah4, bl8) | 0;
        hi = hi + Math.imul(ah4, bh8) | 0;
        lo = lo + Math.imul(al3, bl9) | 0;
        mid = mid + Math.imul(al3, bh9) | 0;
        mid = mid + Math.imul(ah3, bl9) | 0;
        hi = hi + Math.imul(ah3, bh9) | 0;
        var w12 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
        w12 &= 0x3ffffff;
        lo = Math.imul(al9, bl4);
        mid = Math.imul(al9, bh4);
        mid = mid + Math.imul(ah9, bl4) | 0;
        hi = Math.imul(ah9, bh4);
        lo = lo + Math.imul(al8, bl5) | 0;
        mid = mid + Math.imul(al8, bh5) | 0;
        mid = mid + Math.imul(ah8, bl5) | 0;
        hi = hi + Math.imul(ah8, bh5) | 0;
        lo = lo + Math.imul(al7, bl6) | 0;
        mid = mid + Math.imul(al7, bh6) | 0;
        mid = mid + Math.imul(ah7, bl6) | 0;
        hi = hi + Math.imul(ah7, bh6) | 0;
        lo = lo + Math.imul(al6, bl7) | 0;
        mid = mid + Math.imul(al6, bh7) | 0;
        mid = mid + Math.imul(ah6, bl7) | 0;
        hi = hi + Math.imul(ah6, bh7) | 0;
        lo = lo + Math.imul(al5, bl8) | 0;
        mid = mid + Math.imul(al5, bh8) | 0;
        mid = mid + Math.imul(ah5, bl8) | 0;
        hi = hi + Math.imul(ah5, bh8) | 0;
        lo = lo + Math.imul(al4, bl9) | 0;
        mid = mid + Math.imul(al4, bh9) | 0;
        mid = mid + Math.imul(ah4, bl9) | 0;
        hi = hi + Math.imul(ah4, bh9) | 0;
        var w13 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
        w13 &= 0x3ffffff;
        lo = Math.imul(al9, bl5);
        mid = Math.imul(al9, bh5);
        mid = mid + Math.imul(ah9, bl5) | 0;
        hi = Math.imul(ah9, bh5);
        lo = lo + Math.imul(al8, bl6) | 0;
        mid = mid + Math.imul(al8, bh6) | 0;
        mid = mid + Math.imul(ah8, bl6) | 0;
        hi = hi + Math.imul(ah8, bh6) | 0;
        lo = lo + Math.imul(al7, bl7) | 0;
        mid = mid + Math.imul(al7, bh7) | 0;
        mid = mid + Math.imul(ah7, bl7) | 0;
        hi = hi + Math.imul(ah7, bh7) | 0;
        lo = lo + Math.imul(al6, bl8) | 0;
        mid = mid + Math.imul(al6, bh8) | 0;
        mid = mid + Math.imul(ah6, bl8) | 0;
        hi = hi + Math.imul(ah6, bh8) | 0;
        lo = lo + Math.imul(al5, bl9) | 0;
        mid = mid + Math.imul(al5, bh9) | 0;
        mid = mid + Math.imul(ah5, bl9) | 0;
        hi = hi + Math.imul(ah5, bh9) | 0;
        var w14 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
        w14 &= 0x3ffffff;
        lo = Math.imul(al9, bl6);
        mid = Math.imul(al9, bh6);
        mid = mid + Math.imul(ah9, bl6) | 0;
        hi = Math.imul(ah9, bh6);
        lo = lo + Math.imul(al8, bl7) | 0;
        mid = mid + Math.imul(al8, bh7) | 0;
        mid = mid + Math.imul(ah8, bl7) | 0;
        hi = hi + Math.imul(ah8, bh7) | 0;
        lo = lo + Math.imul(al7, bl8) | 0;
        mid = mid + Math.imul(al7, bh8) | 0;
        mid = mid + Math.imul(ah7, bl8) | 0;
        hi = hi + Math.imul(ah7, bh8) | 0;
        lo = lo + Math.imul(al6, bl9) | 0;
        mid = mid + Math.imul(al6, bh9) | 0;
        mid = mid + Math.imul(ah6, bl9) | 0;
        hi = hi + Math.imul(ah6, bh9) | 0;
        var w15 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
        w15 &= 0x3ffffff;
        lo = Math.imul(al9, bl7);
        mid = Math.imul(al9, bh7);
        mid = mid + Math.imul(ah9, bl7) | 0;
        hi = Math.imul(ah9, bh7);
        lo = lo + Math.imul(al8, bl8) | 0;
        mid = mid + Math.imul(al8, bh8) | 0;
        mid = mid + Math.imul(ah8, bl8) | 0;
        hi = hi + Math.imul(ah8, bh8) | 0;
        lo = lo + Math.imul(al7, bl9) | 0;
        mid = mid + Math.imul(al7, bh9) | 0;
        mid = mid + Math.imul(ah7, bl9) | 0;
        hi = hi + Math.imul(ah7, bh9) | 0;
        var w16 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
        w16 &= 0x3ffffff;
        lo = Math.imul(al9, bl8);
        mid = Math.imul(al9, bh8);
        mid = mid + Math.imul(ah9, bl8) | 0;
        hi = Math.imul(ah9, bh8);
        lo = lo + Math.imul(al8, bl9) | 0;
        mid = mid + Math.imul(al8, bh9) | 0;
        mid = mid + Math.imul(ah8, bl9) | 0;
        hi = hi + Math.imul(ah8, bh9) | 0;
        var w17 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
        w17 &= 0x3ffffff;
        lo = Math.imul(al9, bl9);
        mid = Math.imul(al9, bh9);
        mid = mid + Math.imul(ah9, bl9) | 0;
        hi = Math.imul(ah9, bh9);
        var w18 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
        w18 &= 0x3ffffff;
        o[0] = w0;
        o[1] = w1;
        o[2] = w2;
        o[3] = w3;
        o[4] = w4;
        o[5] = w5;
        o[6] = w6;
        o[7] = w7;
        o[8] = w8;
        o[9] = w9;
        o[10] = w10;
        o[11] = w11;
        o[12] = w12;
        o[13] = w13;
        o[14] = w14;
        o[15] = w15;
        o[16] = w16;
        o[17] = w17;
        o[18] = w18;
        if (c !== 0) {
          o[19] = c;
          out.length++;
        }
        return out;
      };
      if (!Math.imul) {
        comb10MulTo = smallMulTo;
      }
      function bigMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        out.length = self.length + num.length;
        var carry = 0;
        var hncarry = 0;
        for (var k = 0; k < out.length - 1; k++) {
          var ncarry = hncarry;
          hncarry = 0;
          var rword = carry & 0x3ffffff;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j;
            var a = self.words[i] | 0;
            var b = num.words[j] | 0;
            var r = a * b;
            var lo = r & 0x3ffffff;
            ncarry = ncarry + (r / 0x4000000 | 0) | 0;
            lo = lo + rword | 0;
            rword = lo & 0x3ffffff;
            ncarry = ncarry + (lo >>> 26) | 0;
            hncarry += ncarry >>> 26;
            ncarry &= 0x3ffffff;
          }
          out.words[k] = rword;
          carry = ncarry;
          ncarry = hncarry;
        }
        if (carry !== 0) {
          out.words[k] = carry;
        } else {
          out.length--;
        }
        return out.strip();
      }
      function jumboMulTo(self, num, out) {
        var fftm = new FFTM();
        return fftm.mulp(self, num, out);
      }
      BN.prototype.mulTo = function mulTo(num, out) {
        var res;
        var len = this.length + num.length;
        if (this.length === 10 && num.length === 10) {
          res = comb10MulTo(this, num, out);
        } else if (len < 63) {
          res = smallMulTo(this, num, out);
        } else if (len < 1024) {
          res = bigMulTo(this, num, out);
        } else {
          res = jumboMulTo(this, num, out);
        }
        return res;
      };
      function FFTM(x, y) {
        this.x = x;
        this.y = y;
      }
      FFTM.prototype.makeRBT = function makeRBT(N) {
        var t = new Array(N);
        var l = BN.prototype._countBits(N) - 1;
        for (var i = 0; i < N; i++) {
          t[i] = this.revBin(i, l, N);
        }
        return t;
      };
      FFTM.prototype.revBin = function revBin(x, l, N) {
        if (x === 0 || x === N - 1) return x;
        var rb = 0;
        for (var i = 0; i < l; i++) {
          rb |= (x & 1) << l - i - 1;
          x >>= 1;
        }
        return rb;
      };
      FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
        for (var i = 0; i < N; i++) {
          rtws[i] = rws[rbt[i]];
          itws[i] = iws[rbt[i]];
        }
      };
      FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
        this.permute(rbt, rws, iws, rtws, itws, N);
        for (var s = 1; s < N; s <<= 1) {
          var l = s << 1;
          var rtwdf = Math.cos(2 * Math.PI / l);
          var itwdf = Math.sin(2 * Math.PI / l);
          for (var p = 0; p < N; p += l) {
            var rtwdf_ = rtwdf;
            var itwdf_ = itwdf;
            for (var j = 0; j < s; j++) {
              var re = rtws[p + j];
              var ie = itws[p + j];
              var ro = rtws[p + j + s];
              var io = itws[p + j + s];
              var rx = rtwdf_ * ro - itwdf_ * io;
              io = rtwdf_ * io + itwdf_ * ro;
              ro = rx;
              rtws[p + j] = re + ro;
              itws[p + j] = ie + io;
              rtws[p + j + s] = re - ro;
              itws[p + j + s] = ie - io;
              if (j !== l) {
                rx = rtwdf * rtwdf_ - itwdf * itwdf_;
                itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                rtwdf_ = rx;
              }
            }
          }
        }
      };
      FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
        var N = Math.max(m, n) | 1;
        var odd = N & 1;
        var i = 0;
        for (N = N / 2 | 0; N; N = N >>> 1) {
          i++;
        }
        return 1 << i + 1 + odd;
      };
      FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
        if (N <= 1) return;
        for (var i = 0; i < N / 2; i++) {
          var t = rws[i];
          rws[i] = rws[N - i - 1];
          rws[N - i - 1] = t;
          t = iws[i];
          iws[i] = -iws[N - i - 1];
          iws[N - i - 1] = -t;
        }
      };
      FFTM.prototype.normalize13b = function normalize13b(ws, N) {
        var carry = 0;
        for (var i = 0; i < N / 2; i++) {
          var w = Math.round(ws[2 * i + 1] / N) * 0x2000 + Math.round(ws[2 * i] / N) + carry;
          ws[i] = w & 0x3ffffff;
          if (w < 0x4000000) {
            carry = 0;
          } else {
            carry = w / 0x4000000 | 0;
          }
        }
        return ws;
      };
      FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
        var carry = 0;
        for (var i = 0; i < len; i++) {
          carry = carry + (ws[i] | 0);
          rws[2 * i] = carry & 0x1fff;
          carry = carry >>> 13;
          rws[2 * i + 1] = carry & 0x1fff;
          carry = carry >>> 13;
        }
        for (i = 2 * len; i < N; ++i) {
          rws[i] = 0;
        }
        assert(carry === 0);
        assert((carry & ~0x1fff) === 0);
      };
      FFTM.prototype.stub = function stub(N) {
        var ph = new Array(N);
        for (var i = 0; i < N; i++) {
          ph[i] = 0;
        }
        return ph;
      };
      FFTM.prototype.mulp = function mulp(x, y, out) {
        var N = 2 * this.guessLen13b(x.length, y.length);
        var rbt = this.makeRBT(N);
        var _ = this.stub(N);
        var rws = new Array(N);
        var rwst = new Array(N);
        var iwst = new Array(N);
        var nrws = new Array(N);
        var nrwst = new Array(N);
        var niwst = new Array(N);
        var rmws = out.words;
        rmws.length = N;
        this.convert13b(x.words, x.length, rws, N);
        this.convert13b(y.words, y.length, nrws, N);
        this.transform(rws, _, rwst, iwst, N, rbt);
        this.transform(nrws, _, nrwst, niwst, N, rbt);
        for (var i = 0; i < N; i++) {
          var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
          iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
          rwst[i] = rx;
        }
        this.conjugate(rwst, iwst, N);
        this.transform(rwst, iwst, rmws, _, N, rbt);
        this.conjugate(rmws, _, N);
        this.normalize13b(rmws, N);
        out.negative = x.negative ^ y.negative;
        out.length = x.length + y.length;
        return out.strip();
      };
      BN.prototype.mul = function mul(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return this.mulTo(num, out);
      };
      BN.prototype.mulf = function mulf(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return jumboMulTo(this, num, out);
      };
      BN.prototype.imul = function imul(num) {
        return this.clone().mulTo(num, this);
      };
      BN.prototype.imuln = function imuln(num) {
        assert(typeof num === 'number');
        assert(num < 0x4000000);
        var carry = 0;
        for (var i = 0; i < this.length; i++) {
          var w = (this.words[i] | 0) * num;
          var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
          carry >>= 26;
          carry += w / 0x4000000 | 0;
          carry += lo >>> 26;
          this.words[i] = lo & 0x3ffffff;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        return this;
      };
      BN.prototype.muln = function muln(num) {
        return this.clone().imuln(num);
      };
      BN.prototype.sqr = function sqr() {
        return this.mul(this);
      };
      BN.prototype.isqr = function isqr() {
        return this.imul(this.clone());
      };
      BN.prototype.pow = function pow(num) {
        var w = toBitArray(num);
        if (w.length === 0) return new BN(1);
        var res = this;
        for (var i = 0; i < w.length; i++, res = res.sqr()) {
          if (w[i] !== 0) break;
        }
        if (++i < w.length) {
          for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
            if (w[i] === 0) continue;
            res = res.mul(q);
          }
        }
        return res;
      };
      BN.prototype.iushln = function iushln(bits) {
        assert(typeof bits === 'number' && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        var carryMask = 0x3ffffff >>> 26 - r << 26 - r;
        var i;
        if (r !== 0) {
          var carry = 0;
          for (i = 0; i < this.length; i++) {
            var newCarry = this.words[i] & carryMask;
            var c = (this.words[i] | 0) - newCarry << r;
            this.words[i] = c | carry;
            carry = newCarry >>> 26 - r;
          }
          if (carry) {
            this.words[i] = carry;
            this.length++;
          }
        }
        if (s !== 0) {
          for (i = this.length - 1; i >= 0; i--) {
            this.words[i + s] = this.words[i];
          }
          for (i = 0; i < s; i++) {
            this.words[i] = 0;
          }
          this.length += s;
        }
        return this.strip();
      };
      BN.prototype.ishln = function ishln(bits) {
        assert(this.negative === 0);
        return this.iushln(bits);
      };
      BN.prototype.iushrn = function iushrn(bits, hint, extended) {
        assert(typeof bits === 'number' && bits >= 0);
        var h;
        if (hint) {
          h = (hint - hint % 26) / 26;
        } else {
          h = 0;
        }
        var r = bits % 26;
        var s = Math.min((bits - r) / 26, this.length);
        var mask = 0x3ffffff ^ 0x3ffffff >>> r << r;
        var maskedWords = extended;
        h -= s;
        h = Math.max(0, h);
        if (maskedWords) {
          for (var i = 0; i < s; i++) {
            maskedWords.words[i] = this.words[i];
          }
          maskedWords.length = s;
        }
        if (s === 0) ;else if (this.length > s) {
          this.length -= s;
          for (i = 0; i < this.length; i++) {
            this.words[i] = this.words[i + s];
          }
        } else {
          this.words[0] = 0;
          this.length = 1;
        }
        var carry = 0;
        for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
          var word = this.words[i] | 0;
          this.words[i] = carry << 26 - r | word >>> r;
          carry = word & mask;
        }
        if (maskedWords && carry !== 0) {
          maskedWords.words[maskedWords.length++] = carry;
        }
        if (this.length === 0) {
          this.words[0] = 0;
          this.length = 1;
        }
        return this.strip();
      };
      BN.prototype.ishrn = function ishrn(bits, hint, extended) {
        assert(this.negative === 0);
        return this.iushrn(bits, hint, extended);
      };
      BN.prototype.shln = function shln(bits) {
        return this.clone().ishln(bits);
      };
      BN.prototype.ushln = function ushln(bits) {
        return this.clone().iushln(bits);
      };
      BN.prototype.shrn = function shrn(bits) {
        return this.clone().ishrn(bits);
      };
      BN.prototype.ushrn = function ushrn(bits) {
        return this.clone().iushrn(bits);
      };
      BN.prototype.testn = function testn(bit) {
        assert(typeof bit === 'number' && bit >= 0);
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) return false;
        var w = this.words[s];
        return !!(w & q);
      };
      BN.prototype.imaskn = function imaskn(bits) {
        assert(typeof bits === 'number' && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        assert(this.negative === 0, 'imaskn works only with positive numbers');
        if (this.length <= s) {
          return this;
        }
        if (r !== 0) {
          s++;
        }
        this.length = Math.min(s, this.length);
        if (r !== 0) {
          var mask = 0x3ffffff ^ 0x3ffffff >>> r << r;
          this.words[this.length - 1] &= mask;
        }
        return this.strip();
      };
      BN.prototype.maskn = function maskn(bits) {
        return this.clone().imaskn(bits);
      };
      BN.prototype.iaddn = function iaddn(num) {
        assert(typeof num === 'number');
        assert(num < 0x4000000);
        if (num < 0) return this.isubn(-num);
        if (this.negative !== 0) {
          if (this.length === 1 && (this.words[0] | 0) < num) {
            this.words[0] = num - (this.words[0] | 0);
            this.negative = 0;
            return this;
          }
          this.negative = 0;
          this.isubn(num);
          this.negative = 1;
          return this;
        }
        return this._iaddn(num);
      };
      BN.prototype._iaddn = function _iaddn(num) {
        this.words[0] += num;
        for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
          this.words[i] -= 0x4000000;
          if (i === this.length - 1) {
            this.words[i + 1] = 1;
          } else {
            this.words[i + 1]++;
          }
        }
        this.length = Math.max(this.length, i + 1);
        return this;
      };
      BN.prototype.isubn = function isubn(num) {
        assert(typeof num === 'number');
        assert(num < 0x4000000);
        if (num < 0) return this.iaddn(-num);
        if (this.negative !== 0) {
          this.negative = 0;
          this.iaddn(num);
          this.negative = 1;
          return this;
        }
        this.words[0] -= num;
        if (this.length === 1 && this.words[0] < 0) {
          this.words[0] = -this.words[0];
          this.negative = 1;
        } else {
          for (var i = 0; i < this.length && this.words[i] < 0; i++) {
            this.words[i] += 0x4000000;
            this.words[i + 1] -= 1;
          }
        }
        return this.strip();
      };
      BN.prototype.addn = function addn(num) {
        return this.clone().iaddn(num);
      };
      BN.prototype.subn = function subn(num) {
        return this.clone().isubn(num);
      };
      BN.prototype.iabs = function iabs() {
        this.negative = 0;
        return this;
      };
      BN.prototype.abs = function abs() {
        return this.clone().iabs();
      };
      BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
        var len = num.length + shift;
        var i;
        this._expand(len);
        var w;
        var carry = 0;
        for (i = 0; i < num.length; i++) {
          w = (this.words[i + shift] | 0) + carry;
          var right = (num.words[i] | 0) * mul;
          w -= right & 0x3ffffff;
          carry = (w >> 26) - (right / 0x4000000 | 0);
          this.words[i + shift] = w & 0x3ffffff;
        }
        for (; i < this.length - shift; i++) {
          w = (this.words[i + shift] | 0) + carry;
          carry = w >> 26;
          this.words[i + shift] = w & 0x3ffffff;
        }
        if (carry === 0) return this.strip();
        assert(carry === -1);
        carry = 0;
        for (i = 0; i < this.length; i++) {
          w = -(this.words[i] | 0) + carry;
          carry = w >> 26;
          this.words[i] = w & 0x3ffffff;
        }
        this.negative = 1;
        return this.strip();
      };
      BN.prototype._wordDiv = function _wordDiv(num, mode) {
        var shift = this.length - num.length;
        var a = this.clone();
        var b = num;
        var bhi = b.words[b.length - 1] | 0;
        var bhiBits = this._countBits(bhi);
        shift = 26 - bhiBits;
        if (shift !== 0) {
          b = b.ushln(shift);
          a.iushln(shift);
          bhi = b.words[b.length - 1] | 0;
        }
        var m = a.length - b.length;
        var q;
        if (mode !== 'mod') {
          q = new BN(null);
          q.length = m + 1;
          q.words = new Array(q.length);
          for (var i = 0; i < q.length; i++) {
            q.words[i] = 0;
          }
        }
        var diff = a.clone()._ishlnsubmul(b, 1, m);
        if (diff.negative === 0) {
          a = diff;
          if (q) {
            q.words[m] = 1;
          }
        }
        for (var j = m - 1; j >= 0; j--) {
          var qj = (a.words[b.length + j] | 0) * 0x4000000 + (a.words[b.length + j - 1] | 0);
          qj = Math.min(qj / bhi | 0, 0x3ffffff);
          a._ishlnsubmul(b, qj, j);
          while (a.negative !== 0) {
            qj--;
            a.negative = 0;
            a._ishlnsubmul(b, 1, j);
            if (!a.isZero()) {
              a.negative ^= 1;
            }
          }
          if (q) {
            q.words[j] = qj;
          }
        }
        if (q) {
          q.strip();
        }
        a.strip();
        if (mode !== 'div' && shift !== 0) {
          a.iushrn(shift);
        }
        return {
          div: q || null,
          mod: a
        };
      };
      BN.prototype.divmod = function divmod(num, mode, positive) {
        assert(!num.isZero());
        if (this.isZero()) {
          return {
            div: new BN(0),
            mod: new BN(0)
          };
        }
        var div, mod, res;
        if (this.negative !== 0 && num.negative === 0) {
          res = this.neg().divmod(num, mode);
          if (mode !== 'mod') {
            div = res.div.neg();
          }
          if (mode !== 'div') {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.iadd(num);
            }
          }
          return {
            div: div,
            mod: mod
          };
        }
        if (this.negative === 0 && num.negative !== 0) {
          res = this.divmod(num.neg(), mode);
          if (mode !== 'mod') {
            div = res.div.neg();
          }
          return {
            div: div,
            mod: res.mod
          };
        }
        if ((this.negative & num.negative) !== 0) {
          res = this.neg().divmod(num.neg(), mode);
          if (mode !== 'div') {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.isub(num);
            }
          }
          return {
            div: res.div,
            mod: mod
          };
        }
        if (num.length > this.length || this.cmp(num) < 0) {
          return {
            div: new BN(0),
            mod: this
          };
        }
        if (num.length === 1) {
          if (mode === 'div') {
            return {
              div: this.divn(num.words[0]),
              mod: null
            };
          }
          if (mode === 'mod') {
            return {
              div: null,
              mod: new BN(this.modn(num.words[0]))
            };
          }
          return {
            div: this.divn(num.words[0]),
            mod: new BN(this.modn(num.words[0]))
          };
        }
        return this._wordDiv(num, mode);
      };
      BN.prototype.div = function div(num) {
        return this.divmod(num, 'div', false).div;
      };
      BN.prototype.mod = function mod(num) {
        return this.divmod(num, 'mod', false).mod;
      };
      BN.prototype.umod = function umod(num) {
        return this.divmod(num, 'mod', true).mod;
      };
      BN.prototype.divRound = function divRound(num) {
        var dm = this.divmod(num);
        if (dm.mod.isZero()) return dm.div;
        var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;
        var half = num.ushrn(1);
        var r2 = num.andln(1);
        var cmp = mod.cmp(half);
        if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
        return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
      };
      BN.prototype.modn = function modn(num) {
        assert(num <= 0x3ffffff);
        var p = (1 << 26) % num;
        var acc = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          acc = (p * acc + (this.words[i] | 0)) % num;
        }
        return acc;
      };
      BN.prototype.idivn = function idivn(num) {
        assert(num <= 0x3ffffff);
        var carry = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var w = (this.words[i] | 0) + carry * 0x4000000;
          this.words[i] = w / num | 0;
          carry = w % num;
        }
        return this.strip();
      };
      BN.prototype.divn = function divn(num) {
        return this.clone().idivn(num);
      };
      BN.prototype.egcd = function egcd(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var x = this;
        var y = p.clone();
        if (x.negative !== 0) {
          x = x.umod(p);
        } else {
          x = x.clone();
        }
        var A = new BN(1);
        var B = new BN(0);
        var C = new BN(0);
        var D = new BN(1);
        var g = 0;
        while (x.isEven() && y.isEven()) {
          x.iushrn(1);
          y.iushrn(1);
          ++g;
        }
        var yp = y.clone();
        var xp = x.clone();
        while (!x.isZero()) {
          for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
          if (i > 0) {
            x.iushrn(i);
            while (i-- > 0) {
              if (A.isOdd() || B.isOdd()) {
                A.iadd(yp);
                B.isub(xp);
              }
              A.iushrn(1);
              B.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
          if (j > 0) {
            y.iushrn(j);
            while (j-- > 0) {
              if (C.isOdd() || D.isOdd()) {
                C.iadd(yp);
                D.isub(xp);
              }
              C.iushrn(1);
              D.iushrn(1);
            }
          }
          if (x.cmp(y) >= 0) {
            x.isub(y);
            A.isub(C);
            B.isub(D);
          } else {
            y.isub(x);
            C.isub(A);
            D.isub(B);
          }
        }
        return {
          a: C,
          b: D,
          gcd: y.iushln(g)
        };
      };
      BN.prototype._invmp = function _invmp(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var a = this;
        var b = p.clone();
        if (a.negative !== 0) {
          a = a.umod(p);
        } else {
          a = a.clone();
        }
        var x1 = new BN(1);
        var x2 = new BN(0);
        var delta = b.clone();
        while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
          for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
          if (i > 0) {
            a.iushrn(i);
            while (i-- > 0) {
              if (x1.isOdd()) {
                x1.iadd(delta);
              }
              x1.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
          if (j > 0) {
            b.iushrn(j);
            while (j-- > 0) {
              if (x2.isOdd()) {
                x2.iadd(delta);
              }
              x2.iushrn(1);
            }
          }
          if (a.cmp(b) >= 0) {
            a.isub(b);
            x1.isub(x2);
          } else {
            b.isub(a);
            x2.isub(x1);
          }
        }
        var res;
        if (a.cmpn(1) === 0) {
          res = x1;
        } else {
          res = x2;
        }
        if (res.cmpn(0) < 0) {
          res.iadd(p);
        }
        return res;
      };
      BN.prototype.gcd = function gcd(num) {
        if (this.isZero()) return num.abs();
        if (num.isZero()) return this.abs();
        var a = this.clone();
        var b = num.clone();
        a.negative = 0;
        b.negative = 0;
        for (var shift = 0; a.isEven() && b.isEven(); shift++) {
          a.iushrn(1);
          b.iushrn(1);
        }
        do {
          while (a.isEven()) {
            a.iushrn(1);
          }
          while (b.isEven()) {
            b.iushrn(1);
          }
          var r = a.cmp(b);
          if (r < 0) {
            var t = a;
            a = b;
            b = t;
          } else if (r === 0 || b.cmpn(1) === 0) {
            break;
          }
          a.isub(b);
        } while (true);
        return b.iushln(shift);
      };
      BN.prototype.invm = function invm(num) {
        return this.egcd(num).a.umod(num);
      };
      BN.prototype.isEven = function isEven() {
        return (this.words[0] & 1) === 0;
      };
      BN.prototype.isOdd = function isOdd() {
        return (this.words[0] & 1) === 1;
      };
      BN.prototype.andln = function andln(num) {
        return this.words[0] & num;
      };
      BN.prototype.bincn = function bincn(bit) {
        assert(typeof bit === 'number');
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) {
          this._expand(s + 1);
          this.words[s] |= q;
          return this;
        }
        var carry = q;
        for (var i = s; carry !== 0 && i < this.length; i++) {
          var w = this.words[i] | 0;
          w += carry;
          carry = w >>> 26;
          w &= 0x3ffffff;
          this.words[i] = w;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        return this;
      };
      BN.prototype.isZero = function isZero() {
        return this.length === 1 && this.words[0] === 0;
      };
      BN.prototype.cmpn = function cmpn(num) {
        var negative = num < 0;
        if (this.negative !== 0 && !negative) return -1;
        if (this.negative === 0 && negative) return 1;
        this.strip();
        var res;
        if (this.length > 1) {
          res = 1;
        } else {
          if (negative) {
            num = -num;
          }
          assert(num <= 0x3ffffff, 'Number is too big');
          var w = this.words[0] | 0;
          res = w === num ? 0 : w < num ? -1 : 1;
        }
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN.prototype.cmp = function cmp(num) {
        if (this.negative !== 0 && num.negative === 0) return -1;
        if (this.negative === 0 && num.negative !== 0) return 1;
        var res = this.ucmp(num);
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN.prototype.ucmp = function ucmp(num) {
        if (this.length > num.length) return 1;
        if (this.length < num.length) return -1;
        var res = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var a = this.words[i] | 0;
          var b = num.words[i] | 0;
          if (a === b) continue;
          if (a < b) {
            res = -1;
          } else if (a > b) {
            res = 1;
          }
          break;
        }
        return res;
      };
      BN.prototype.gtn = function gtn(num) {
        return this.cmpn(num) === 1;
      };
      BN.prototype.gt = function gt(num) {
        return this.cmp(num) === 1;
      };
      BN.prototype.gten = function gten(num) {
        return this.cmpn(num) >= 0;
      };
      BN.prototype.gte = function gte(num) {
        return this.cmp(num) >= 0;
      };
      BN.prototype.ltn = function ltn(num) {
        return this.cmpn(num) === -1;
      };
      BN.prototype.lt = function lt(num) {
        return this.cmp(num) === -1;
      };
      BN.prototype.lten = function lten(num) {
        return this.cmpn(num) <= 0;
      };
      BN.prototype.lte = function lte(num) {
        return this.cmp(num) <= 0;
      };
      BN.prototype.eqn = function eqn(num) {
        return this.cmpn(num) === 0;
      };
      BN.prototype.eq = function eq(num) {
        return this.cmp(num) === 0;
      };
      BN.red = function red(num) {
        return new Red(num);
      };
      BN.prototype.toRed = function toRed(ctx) {
        assert(!this.red, 'Already a number in reduction context');
        assert(this.negative === 0, 'red works only with positives');
        return ctx.convertTo(this)._forceRed(ctx);
      };
      BN.prototype.fromRed = function fromRed() {
        assert(this.red, 'fromRed works only with numbers in reduction context');
        return this.red.convertFrom(this);
      };
      BN.prototype._forceRed = function _forceRed(ctx) {
        this.red = ctx;
        return this;
      };
      BN.prototype.forceRed = function forceRed(ctx) {
        assert(!this.red, 'Already a number in reduction context');
        return this._forceRed(ctx);
      };
      BN.prototype.redAdd = function redAdd(num) {
        assert(this.red, 'redAdd works only with red numbers');
        return this.red.add(this, num);
      };
      BN.prototype.redIAdd = function redIAdd(num) {
        assert(this.red, 'redIAdd works only with red numbers');
        return this.red.iadd(this, num);
      };
      BN.prototype.redSub = function redSub(num) {
        assert(this.red, 'redSub works only with red numbers');
        return this.red.sub(this, num);
      };
      BN.prototype.redISub = function redISub(num) {
        assert(this.red, 'redISub works only with red numbers');
        return this.red.isub(this, num);
      };
      BN.prototype.redShl = function redShl(num) {
        assert(this.red, 'redShl works only with red numbers');
        return this.red.shl(this, num);
      };
      BN.prototype.redMul = function redMul(num) {
        assert(this.red, 'redMul works only with red numbers');
        this.red._verify2(this, num);
        return this.red.mul(this, num);
      };
      BN.prototype.redIMul = function redIMul(num) {
        assert(this.red, 'redMul works only with red numbers');
        this.red._verify2(this, num);
        return this.red.imul(this, num);
      };
      BN.prototype.redSqr = function redSqr() {
        assert(this.red, 'redSqr works only with red numbers');
        this.red._verify1(this);
        return this.red.sqr(this);
      };
      BN.prototype.redISqr = function redISqr() {
        assert(this.red, 'redISqr works only with red numbers');
        this.red._verify1(this);
        return this.red.isqr(this);
      };
      BN.prototype.redSqrt = function redSqrt() {
        assert(this.red, 'redSqrt works only with red numbers');
        this.red._verify1(this);
        return this.red.sqrt(this);
      };
      BN.prototype.redInvm = function redInvm() {
        assert(this.red, 'redInvm works only with red numbers');
        this.red._verify1(this);
        return this.red.invm(this);
      };
      BN.prototype.redNeg = function redNeg() {
        assert(this.red, 'redNeg works only with red numbers');
        this.red._verify1(this);
        return this.red.neg(this);
      };
      BN.prototype.redPow = function redPow(num) {
        assert(this.red && !num.red, 'redPow(normalNum)');
        this.red._verify1(this);
        return this.red.pow(this, num);
      };
      var primes = {
        k256: null,
        p224: null,
        p192: null,
        p25519: null
      };
      function MPrime(name, p) {
        this.name = name;
        this.p = new BN(p, 16);
        this.n = this.p.bitLength();
        this.k = new BN(1).iushln(this.n).isub(this.p);
        this.tmp = this._tmp();
      }
      MPrime.prototype._tmp = function _tmp() {
        var tmp = new BN(null);
        tmp.words = new Array(Math.ceil(this.n / 13));
        return tmp;
      };
      MPrime.prototype.ireduce = function ireduce(num) {
        var r = num;
        var rlen;
        do {
          this.split(r, this.tmp);
          r = this.imulK(r);
          r = r.iadd(this.tmp);
          rlen = r.bitLength();
        } while (rlen > this.n);
        var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
        if (cmp === 0) {
          r.words[0] = 0;
          r.length = 1;
        } else if (cmp > 0) {
          r.isub(this.p);
        } else {
          if (r.strip !== undefined) {
            r.strip();
          } else {
            r._strip();
          }
        }
        return r;
      };
      MPrime.prototype.split = function split(input, out) {
        input.iushrn(this.n, 0, out);
      };
      MPrime.prototype.imulK = function imulK(num) {
        return num.imul(this.k);
      };
      function K256() {
        MPrime.call(this, 'k256', 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
      }
      inherits(K256, MPrime);
      K256.prototype.split = function split(input, output) {
        var mask = 0x3fffff;
        var outLen = Math.min(input.length, 9);
        for (var i = 0; i < outLen; i++) {
          output.words[i] = input.words[i];
        }
        output.length = outLen;
        if (input.length <= 9) {
          input.words[0] = 0;
          input.length = 1;
          return;
        }
        var prev = input.words[9];
        output.words[output.length++] = prev & mask;
        for (i = 10; i < input.length; i++) {
          var next = input.words[i] | 0;
          input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
          prev = next;
        }
        prev >>>= 22;
        input.words[i - 10] = prev;
        if (prev === 0 && input.length > 10) {
          input.length -= 10;
        } else {
          input.length -= 9;
        }
      };
      K256.prototype.imulK = function imulK(num) {
        num.words[num.length] = 0;
        num.words[num.length + 1] = 0;
        num.length += 2;
        var lo = 0;
        for (var i = 0; i < num.length; i++) {
          var w = num.words[i] | 0;
          lo += w * 0x3d1;
          num.words[i] = lo & 0x3ffffff;
          lo = w * 0x40 + (lo / 0x4000000 | 0);
        }
        if (num.words[num.length - 1] === 0) {
          num.length--;
          if (num.words[num.length - 1] === 0) {
            num.length--;
          }
        }
        return num;
      };
      function P224() {
        MPrime.call(this, 'p224', 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
      }
      inherits(P224, MPrime);
      function P192() {
        MPrime.call(this, 'p192', 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
      }
      inherits(P192, MPrime);
      function P25519() {
        MPrime.call(this, '25519', '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
      }
      inherits(P25519, MPrime);
      P25519.prototype.imulK = function imulK(num) {
        var carry = 0;
        for (var i = 0; i < num.length; i++) {
          var hi = (num.words[i] | 0) * 0x13 + carry;
          var lo = hi & 0x3ffffff;
          hi >>>= 26;
          num.words[i] = lo;
          carry = hi;
        }
        if (carry !== 0) {
          num.words[num.length++] = carry;
        }
        return num;
      };
      BN._prime = function prime(name) {
        if (primes[name]) return primes[name];
        var prime;
        if (name === 'k256') {
          prime = new K256();
        } else if (name === 'p224') {
          prime = new P224();
        } else if (name === 'p192') {
          prime = new P192();
        } else if (name === 'p25519') {
          prime = new P25519();
        } else {
          throw new Error('Unknown prime ' + name);
        }
        primes[name] = prime;
        return prime;
      };
      function Red(m) {
        if (typeof m === 'string') {
          var prime = BN._prime(m);
          this.m = prime.p;
          this.prime = prime;
        } else {
          assert(m.gtn(1), 'modulus must be greater than 1');
          this.m = m;
          this.prime = null;
        }
      }
      Red.prototype._verify1 = function _verify1(a) {
        assert(a.negative === 0, 'red works only with positives');
        assert(a.red, 'red works only with red numbers');
      };
      Red.prototype._verify2 = function _verify2(a, b) {
        assert((a.negative | b.negative) === 0, 'red works only with positives');
        assert(a.red && a.red === b.red, 'red works only with red numbers');
      };
      Red.prototype.imod = function imod(a) {
        if (this.prime) return this.prime.ireduce(a)._forceRed(this);
        return a.umod(this.m)._forceRed(this);
      };
      Red.prototype.neg = function neg(a) {
        if (a.isZero()) {
          return a.clone();
        }
        return this.m.sub(a)._forceRed(this);
      };
      Red.prototype.add = function add(a, b) {
        this._verify2(a, b);
        var res = a.add(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.iadd = function iadd(a, b) {
        this._verify2(a, b);
        var res = a.iadd(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res;
      };
      Red.prototype.sub = function sub(a, b) {
        this._verify2(a, b);
        var res = a.sub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.isub = function isub(a, b) {
        this._verify2(a, b);
        var res = a.isub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res;
      };
      Red.prototype.shl = function shl(a, num) {
        this._verify1(a);
        return this.imod(a.ushln(num));
      };
      Red.prototype.imul = function imul(a, b) {
        this._verify2(a, b);
        return this.imod(a.imul(b));
      };
      Red.prototype.mul = function mul(a, b) {
        this._verify2(a, b);
        return this.imod(a.mul(b));
      };
      Red.prototype.isqr = function isqr(a) {
        return this.imul(a, a.clone());
      };
      Red.prototype.sqr = function sqr(a) {
        return this.mul(a, a);
      };
      Red.prototype.sqrt = function sqrt(a) {
        if (a.isZero()) return a.clone();
        var mod3 = this.m.andln(3);
        assert(mod3 % 2 === 1);
        if (mod3 === 3) {
          var pow = this.m.add(new BN(1)).iushrn(2);
          return this.pow(a, pow);
        }
        var q = this.m.subn(1);
        var s = 0;
        while (!q.isZero() && q.andln(1) === 0) {
          s++;
          q.iushrn(1);
        }
        assert(!q.isZero());
        var one = new BN(1).toRed(this);
        var nOne = one.redNeg();
        var lpow = this.m.subn(1).iushrn(1);
        var z = this.m.bitLength();
        z = new BN(2 * z * z).toRed(this);
        while (this.pow(z, lpow).cmp(nOne) !== 0) {
          z.redIAdd(nOne);
        }
        var c = this.pow(z, q);
        var r = this.pow(a, q.addn(1).iushrn(1));
        var t = this.pow(a, q);
        var m = s;
        while (t.cmp(one) !== 0) {
          var tmp = t;
          for (var i = 0; tmp.cmp(one) !== 0; i++) {
            tmp = tmp.redSqr();
          }
          assert(i < m);
          var b = this.pow(c, new BN(1).iushln(m - i - 1));
          r = r.redMul(b);
          c = b.redSqr();
          t = t.redMul(c);
          m = i;
        }
        return r;
      };
      Red.prototype.invm = function invm(a) {
        var inv = a._invmp(this.m);
        if (inv.negative !== 0) {
          inv.negative = 0;
          return this.imod(inv).redNeg();
        } else {
          return this.imod(inv);
        }
      };
      Red.prototype.pow = function pow(a, num) {
        if (num.isZero()) return new BN(1).toRed(this);
        if (num.cmpn(1) === 0) return a.clone();
        var windowSize = 4;
        var wnd = new Array(1 << windowSize);
        wnd[0] = new BN(1).toRed(this);
        wnd[1] = a;
        for (var i = 2; i < wnd.length; i++) {
          wnd[i] = this.mul(wnd[i - 1], a);
        }
        var res = wnd[0];
        var current = 0;
        var currentLen = 0;
        var start = num.bitLength() % 26;
        if (start === 0) {
          start = 26;
        }
        for (i = num.length - 1; i >= 0; i--) {
          var word = num.words[i];
          for (var j = start - 1; j >= 0; j--) {
            var bit = word >> j & 1;
            if (res !== wnd[0]) {
              res = this.sqr(res);
            }
            if (bit === 0 && current === 0) {
              currentLen = 0;
              continue;
            }
            current <<= 1;
            current |= bit;
            currentLen++;
            if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;
            res = this.mul(res, wnd[current]);
            currentLen = 0;
            current = 0;
          }
          start = 26;
        }
        return res;
      };
      Red.prototype.convertTo = function convertTo(num) {
        var r = num.umod(this.m);
        return r === num ? r.clone() : r;
      };
      Red.prototype.convertFrom = function convertFrom(num) {
        var res = num.clone();
        res.red = null;
        return res;
      };
      BN.mont = function mont(num) {
        return new Mont(num);
      };
      function Mont(m) {
        Red.call(this, m);
        this.shift = this.m.bitLength();
        if (this.shift % 26 !== 0) {
          this.shift += 26 - this.shift % 26;
        }
        this.r = new BN(1).iushln(this.shift);
        this.r2 = this.imod(this.r.sqr());
        this.rinv = this.r._invmp(this.m);
        this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
        this.minv = this.minv.umod(this.r);
        this.minv = this.r.sub(this.minv);
      }
      inherits(Mont, Red);
      Mont.prototype.convertTo = function convertTo(num) {
        return this.imod(num.ushln(this.shift));
      };
      Mont.prototype.convertFrom = function convertFrom(num) {
        var r = this.imod(num.mul(this.rinv));
        r.red = null;
        return r;
      };
      Mont.prototype.imul = function imul(a, b) {
        if (a.isZero() || b.isZero()) {
          a.words[0] = 0;
          a.length = 1;
          return a;
        }
        var t = a.imul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.mul = function mul(a, b) {
        if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
        var t = a.mul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.invm = function invm(a) {
        var res = this.imod(a._invmp(this.m).mul(this.r2));
        return res._forceRed(this);
      };
    })(module, commonjsGlobal);
  })(bn);
  var bnExports = bn.exports;
  var minimalisticAssert = assert$i;
  function assert$i(val, msg) {
    if (!val) throw new Error(msg || 'Assertion failed');
  }
  assert$i.equal = function assertEqual(l, r, msg) {
    if (l != r) throw new Error(msg || 'Assertion failed: ' + l + ' != ' + r);
  };
  var utils$n = {};
  (function (exports) {
    var utils = exports;
    function toArray(msg, enc) {
      if (Array.isArray(msg)) return msg.slice();
      if (!msg) return [];
      var res = [];
      if (typeof msg !== 'string') {
        for (var i = 0; i < msg.length; i++) res[i] = msg[i] | 0;
        return res;
      }
      if (enc === 'hex') {
        msg = msg.replace(/[^a-z0-9]+/ig, '');
        if (msg.length % 2 !== 0) msg = '0' + msg;
        for (var i = 0; i < msg.length; i += 2) res.push(parseInt(msg[i] + msg[i + 1], 16));
      } else {
        for (var i = 0; i < msg.length; i++) {
          var c = msg.charCodeAt(i);
          var hi = c >> 8;
          var lo = c & 0xff;
          if (hi) res.push(hi, lo);else res.push(lo);
        }
      }
      return res;
    }
    utils.toArray = toArray;
    function zero2(word) {
      if (word.length === 1) return '0' + word;else return word;
    }
    utils.zero2 = zero2;
    function toHex(msg) {
      var res = '';
      for (var i = 0; i < msg.length; i++) res += zero2(msg[i].toString(16));
      return res;
    }
    utils.toHex = toHex;
    utils.encode = function encode(arr, enc) {
      if (enc === 'hex') return toHex(arr);else return arr;
    };
  })(utils$n);
  (function (exports) {
    var utils = exports;
    var BN = bnExports;
    var minAssert = minimalisticAssert;
    var minUtils = utils$n;
    utils.assert = minAssert;
    utils.toArray = minUtils.toArray;
    utils.zero2 = minUtils.zero2;
    utils.toHex = minUtils.toHex;
    utils.encode = minUtils.encode;
    function getNAF(num, w) {
      var naf = [];
      var ws = 1 << w + 1;
      var k = num.clone();
      while (k.cmpn(1) >= 0) {
        var z;
        if (k.isOdd()) {
          var mod = k.andln(ws - 1);
          if (mod > (ws >> 1) - 1) z = (ws >> 1) - mod;else z = mod;
          k.isubn(z);
        } else {
          z = 0;
        }
        naf.push(z);
        var shift = k.cmpn(0) !== 0 && k.andln(ws - 1) === 0 ? w + 1 : 1;
        for (var i = 1; i < shift; i++) naf.push(0);
        k.iushrn(shift);
      }
      return naf;
    }
    utils.getNAF = getNAF;
    function getJSF(k1, k2) {
      var jsf = [[], []];
      k1 = k1.clone();
      k2 = k2.clone();
      var d1 = 0;
      var d2 = 0;
      while (k1.cmpn(-d1) > 0 || k2.cmpn(-d2) > 0) {
        var m14 = k1.andln(3) + d1 & 3;
        var m24 = k2.andln(3) + d2 & 3;
        if (m14 === 3) m14 = -1;
        if (m24 === 3) m24 = -1;
        var u1;
        if ((m14 & 1) === 0) {
          u1 = 0;
        } else {
          var m8 = k1.andln(7) + d1 & 7;
          if ((m8 === 3 || m8 === 5) && m24 === 2) u1 = -m14;else u1 = m14;
        }
        jsf[0].push(u1);
        var u2;
        if ((m24 & 1) === 0) {
          u2 = 0;
        } else {
          var m8 = k2.andln(7) + d2 & 7;
          if ((m8 === 3 || m8 === 5) && m14 === 2) u2 = -m24;else u2 = m24;
        }
        jsf[1].push(u2);
        if (2 * d1 === u1 + 1) d1 = 1 - d1;
        if (2 * d2 === u2 + 1) d2 = 1 - d2;
        k1.iushrn(1);
        k2.iushrn(1);
      }
      return jsf;
    }
    utils.getJSF = getJSF;
    function cachedProperty(obj, name, computer) {
      var key = '_' + name;
      obj.prototype[name] = function cachedProperty() {
        return this[key] !== undefined ? this[key] : this[key] = computer.call(this);
      };
    }
    utils.cachedProperty = cachedProperty;
    function parseBytes(bytes) {
      return typeof bytes === 'string' ? utils.toArray(bytes, 'hex') : bytes;
    }
    utils.parseBytes = parseBytes;
    function intFromLE(bytes) {
      return new BN(bytes, 'hex', 'le');
    }
    utils.intFromLE = intFromLE;
  })(utils$o);
  var brorand = {
    exports: {}
  };
  var r$1;
  brorand.exports = function rand(len) {
    if (!r$1) r$1 = new Rand(null);
    return r$1.generate(len);
  };
  function Rand(rand) {
    this.rand = rand;
  }
  brorand.exports.Rand = Rand;
  Rand.prototype.generate = function generate(len) {
    return this._rand(len);
  };
  Rand.prototype._rand = function _rand(n) {
    if (this.rand.getBytes) return this.rand.getBytes(n);
    var res = new Uint8Array(n);
    for (var i = 0; i < res.length; i++) res[i] = this.rand.getByte();
    return res;
  };
  if (typeof self === 'object') {
    if (self.crypto && self.crypto.getRandomValues) {
      Rand.prototype._rand = function _rand(n) {
        var arr = new Uint8Array(n);
        self.crypto.getRandomValues(arr);
        return arr;
      };
    } else if (self.msCrypto && self.msCrypto.getRandomValues) {
      Rand.prototype._rand = function _rand(n) {
        var arr = new Uint8Array(n);
        self.msCrypto.getRandomValues(arr);
        return arr;
      };
    } else if (typeof window === 'object') {
      Rand.prototype._rand = function () {
        throw new Error('Not implemented yet');
      };
    }
  } else {
    try {
      var crypto$1 = require('crypto');
      if (typeof crypto$1.randomBytes !== 'function') throw new Error('Not supported');
      Rand.prototype._rand = function _rand(n) {
        return crypto$1.randomBytes(n);
      };
    } catch (e) {}
  }
  var brorandExports = brorand.exports;
  var curve = {};
  var BN$7 = bnExports;
  var utils$m = utils$o;
  var getNAF = utils$m.getNAF;
  var getJSF = utils$m.getJSF;
  var assert$h = utils$m.assert;
  function BaseCurve(type, conf) {
    this.type = type;
    this.p = new BN$7(conf.p, 16);
    this.red = conf.prime ? BN$7.red(conf.prime) : BN$7.mont(this.p);
    this.zero = new BN$7(0).toRed(this.red);
    this.one = new BN$7(1).toRed(this.red);
    this.two = new BN$7(2).toRed(this.red);
    this.n = conf.n && new BN$7(conf.n, 16);
    this.g = conf.g && this.pointFromJSON(conf.g, conf.gRed);
    this._wnafT1 = new Array(4);
    this._wnafT2 = new Array(4);
    this._wnafT3 = new Array(4);
    this._wnafT4 = new Array(4);
    var adjustCount = this.n && this.p.div(this.n);
    if (!adjustCount || adjustCount.cmpn(100) > 0) {
      this.redN = null;
    } else {
      this._maxwellTrick = true;
      this.redN = this.n.toRed(this.red);
    }
  }
  var base = BaseCurve;
  BaseCurve.prototype.point = function point() {
    throw new Error('Not implemented');
  };
  BaseCurve.prototype.validate = function validate() {
    throw new Error('Not implemented');
  };
  BaseCurve.prototype._fixedNafMul = function _fixedNafMul(p, k) {
    assert$h(p.precomputed);
    var doubles = p._getDoubles();
    var naf = getNAF(k, 1);
    var I = (1 << doubles.step + 1) - (doubles.step % 2 === 0 ? 2 : 1);
    I /= 3;
    var repr = [];
    for (var j = 0; j < naf.length; j += doubles.step) {
      var nafW = 0;
      for (var k = j + doubles.step - 1; k >= j; k--) nafW = (nafW << 1) + naf[k];
      repr.push(nafW);
    }
    var a = this.jpoint(null, null, null);
    var b = this.jpoint(null, null, null);
    for (var i = I; i > 0; i--) {
      for (var j = 0; j < repr.length; j++) {
        var nafW = repr[j];
        if (nafW === i) b = b.mixedAdd(doubles.points[j]);else if (nafW === -i) b = b.mixedAdd(doubles.points[j].neg());
      }
      a = a.add(b);
    }
    return a.toP();
  };
  BaseCurve.prototype._wnafMul = function _wnafMul(p, k) {
    var w = 4;
    var nafPoints = p._getNAFPoints(w);
    w = nafPoints.wnd;
    var wnd = nafPoints.points;
    var naf = getNAF(k, w);
    var acc = this.jpoint(null, null, null);
    for (var i = naf.length - 1; i >= 0; i--) {
      for (var k = 0; i >= 0 && naf[i] === 0; i--) k++;
      if (i >= 0) k++;
      acc = acc.dblp(k);
      if (i < 0) break;
      var z = naf[i];
      assert$h(z !== 0);
      if (p.type === 'affine') {
        if (z > 0) acc = acc.mixedAdd(wnd[z - 1 >> 1]);else acc = acc.mixedAdd(wnd[-z - 1 >> 1].neg());
      } else {
        if (z > 0) acc = acc.add(wnd[z - 1 >> 1]);else acc = acc.add(wnd[-z - 1 >> 1].neg());
      }
    }
    return p.type === 'affine' ? acc.toP() : acc;
  };
  BaseCurve.prototype._wnafMulAdd = function _wnafMulAdd(defW, points, coeffs, len, jacobianResult) {
    var wndWidth = this._wnafT1;
    var wnd = this._wnafT2;
    var naf = this._wnafT3;
    var max = 0;
    for (var i = 0; i < len; i++) {
      var p = points[i];
      var nafPoints = p._getNAFPoints(defW);
      wndWidth[i] = nafPoints.wnd;
      wnd[i] = nafPoints.points;
    }
    for (var i = len - 1; i >= 1; i -= 2) {
      var a = i - 1;
      var b = i;
      if (wndWidth[a] !== 1 || wndWidth[b] !== 1) {
        naf[a] = getNAF(coeffs[a], wndWidth[a]);
        naf[b] = getNAF(coeffs[b], wndWidth[b]);
        max = Math.max(naf[a].length, max);
        max = Math.max(naf[b].length, max);
        continue;
      }
      var comb = [points[a], null, null, points[b]];
      if (points[a].y.cmp(points[b].y) === 0) {
        comb[1] = points[a].add(points[b]);
        comb[2] = points[a].toJ().mixedAdd(points[b].neg());
      } else if (points[a].y.cmp(points[b].y.redNeg()) === 0) {
        comb[1] = points[a].toJ().mixedAdd(points[b]);
        comb[2] = points[a].add(points[b].neg());
      } else {
        comb[1] = points[a].toJ().mixedAdd(points[b]);
        comb[2] = points[a].toJ().mixedAdd(points[b].neg());
      }
      var index = [-3, -1, -5, -7, 0, 7, 5, 1, 3];
      var jsf = getJSF(coeffs[a], coeffs[b]);
      max = Math.max(jsf[0].length, max);
      naf[a] = new Array(max);
      naf[b] = new Array(max);
      for (var j = 0; j < max; j++) {
        var ja = jsf[0][j] | 0;
        var jb = jsf[1][j] | 0;
        naf[a][j] = index[(ja + 1) * 3 + (jb + 1)];
        naf[b][j] = 0;
        wnd[a] = comb;
      }
    }
    var acc = this.jpoint(null, null, null);
    var tmp = this._wnafT4;
    for (var i = max; i >= 0; i--) {
      var k = 0;
      while (i >= 0) {
        var zero = true;
        for (var j = 0; j < len; j++) {
          tmp[j] = naf[j][i] | 0;
          if (tmp[j] !== 0) zero = false;
        }
        if (!zero) break;
        k++;
        i--;
      }
      if (i >= 0) k++;
      acc = acc.dblp(k);
      if (i < 0) break;
      for (var j = 0; j < len; j++) {
        var z = tmp[j];
        var p;
        if (z === 0) continue;else if (z > 0) p = wnd[j][z - 1 >> 1];else if (z < 0) p = wnd[j][-z - 1 >> 1].neg();
        if (p.type === 'affine') acc = acc.mixedAdd(p);else acc = acc.add(p);
      }
    }
    for (var i = 0; i < len; i++) wnd[i] = null;
    if (jacobianResult) return acc;else return acc.toP();
  };
  function BasePoint(curve, type) {
    this.curve = curve;
    this.type = type;
    this.precomputed = null;
  }
  BaseCurve.BasePoint = BasePoint;
  BasePoint.prototype.eq = function eq() {
    throw new Error('Not implemented');
  };
  BasePoint.prototype.validate = function validate() {
    return this.curve.validate(this);
  };
  BaseCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
    bytes = utils$m.toArray(bytes, enc);
    var len = this.p.byteLength();
    if ((bytes[0] === 0x04 || bytes[0] === 0x06 || bytes[0] === 0x07) && bytes.length - 1 === 2 * len) {
      if (bytes[0] === 0x06) assert$h(bytes[bytes.length - 1] % 2 === 0);else if (bytes[0] === 0x07) assert$h(bytes[bytes.length - 1] % 2 === 1);
      var res = this.point(bytes.slice(1, 1 + len), bytes.slice(1 + len, 1 + 2 * len));
      return res;
    } else if ((bytes[0] === 0x02 || bytes[0] === 0x03) && bytes.length - 1 === len) {
      return this.pointFromX(bytes.slice(1, 1 + len), bytes[0] === 0x03);
    }
    throw new Error('Unknown point format');
  };
  BasePoint.prototype.encodeCompressed = function encodeCompressed(enc) {
    return this.encode(enc, true);
  };
  BasePoint.prototype._encode = function _encode(compact) {
    var len = this.curve.p.byteLength();
    var x = this.getX().toArray('be', len);
    if (compact) return [this.getY().isEven() ? 0x02 : 0x03].concat(x);
    return [0x04].concat(x, this.getY().toArray('be', len));
  };
  BasePoint.prototype.encode = function encode(enc, compact) {
    return utils$m.encode(this._encode(compact), enc);
  };
  BasePoint.prototype.precompute = function precompute(power) {
    if (this.precomputed) return this;
    var precomputed = {
      doubles: null,
      naf: null,
      beta: null
    };
    precomputed.naf = this._getNAFPoints(8);
    precomputed.doubles = this._getDoubles(4, power);
    precomputed.beta = this._getBeta();
    this.precomputed = precomputed;
    return this;
  };
  BasePoint.prototype._hasDoubles = function _hasDoubles(k) {
    if (!this.precomputed) return false;
    var doubles = this.precomputed.doubles;
    if (!doubles) return false;
    return doubles.points.length >= Math.ceil((k.bitLength() + 1) / doubles.step);
  };
  BasePoint.prototype._getDoubles = function _getDoubles(step, power) {
    if (this.precomputed && this.precomputed.doubles) return this.precomputed.doubles;
    var doubles = [this];
    var acc = this;
    for (var i = 0; i < power; i += step) {
      for (var j = 0; j < step; j++) acc = acc.dbl();
      doubles.push(acc);
    }
    return {
      step: step,
      points: doubles
    };
  };
  BasePoint.prototype._getNAFPoints = function _getNAFPoints(wnd) {
    if (this.precomputed && this.precomputed.naf) return this.precomputed.naf;
    var res = [this];
    var max = (1 << wnd) - 1;
    var dbl = max === 1 ? null : this.dbl();
    for (var i = 1; i < max; i++) res[i] = res[i - 1].add(dbl);
    return {
      wnd: wnd,
      points: res
    };
  };
  BasePoint.prototype._getBeta = function _getBeta() {
    return null;
  };
  BasePoint.prototype.dblp = function dblp(k) {
    var r = this;
    for (var i = 0; i < k; i++) r = r.dbl();
    return r;
  };
  var inherits$7 = {
    exports: {}
  };
  var inherits_browser = {
    exports: {}
  };
  var hasRequiredInherits_browser;
  function requireInherits_browser() {
    if (hasRequiredInherits_browser) return inherits_browser.exports;
    hasRequiredInherits_browser = 1;
    if (typeof Object.create === 'function') {
      inherits_browser.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      inherits_browser.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function () {};
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
    return inherits_browser.exports;
  }
  try {
    var util = require('util');
    if (typeof util.inherits !== 'function') throw '';
    inherits$7.exports = util.inherits;
  } catch (e) {
    inherits$7.exports = requireInherits_browser();
  }
  var inheritsExports = inherits$7.exports;
  var utils$l = utils$o;
  var BN$6 = bnExports;
  var inherits$6 = inheritsExports;
  var Base$2 = base;
  var assert$g = utils$l.assert;
  function ShortCurve(conf) {
    Base$2.call(this, 'short', conf);
    this.a = new BN$6(conf.a, 16).toRed(this.red);
    this.b = new BN$6(conf.b, 16).toRed(this.red);
    this.tinv = this.two.redInvm();
    this.zeroA = this.a.fromRed().cmpn(0) === 0;
    this.threeA = this.a.fromRed().sub(this.p).cmpn(-3) === 0;
    this.endo = this._getEndomorphism(conf);
    this._endoWnafT1 = new Array(4);
    this._endoWnafT2 = new Array(4);
  }
  inherits$6(ShortCurve, Base$2);
  var short = ShortCurve;
  ShortCurve.prototype._getEndomorphism = function _getEndomorphism(conf) {
    if (!this.zeroA || !this.g || !this.n || this.p.modn(3) !== 1) return;
    var beta;
    var lambda;
    if (conf.beta) {
      beta = new BN$6(conf.beta, 16).toRed(this.red);
    } else {
      var betas = this._getEndoRoots(this.p);
      beta = betas[0].cmp(betas[1]) < 0 ? betas[0] : betas[1];
      beta = beta.toRed(this.red);
    }
    if (conf.lambda) {
      lambda = new BN$6(conf.lambda, 16);
    } else {
      var lambdas = this._getEndoRoots(this.n);
      if (this.g.mul(lambdas[0]).x.cmp(this.g.x.redMul(beta)) === 0) {
        lambda = lambdas[0];
      } else {
        lambda = lambdas[1];
        assert$g(this.g.mul(lambda).x.cmp(this.g.x.redMul(beta)) === 0);
      }
    }
    var basis;
    if (conf.basis) {
      basis = conf.basis.map(function (vec) {
        return {
          a: new BN$6(vec.a, 16),
          b: new BN$6(vec.b, 16)
        };
      });
    } else {
      basis = this._getEndoBasis(lambda);
    }
    return {
      beta: beta,
      lambda: lambda,
      basis: basis
    };
  };
  ShortCurve.prototype._getEndoRoots = function _getEndoRoots(num) {
    var red = num === this.p ? this.red : BN$6.mont(num);
    var tinv = new BN$6(2).toRed(red).redInvm();
    var ntinv = tinv.redNeg();
    var s = new BN$6(3).toRed(red).redNeg().redSqrt().redMul(tinv);
    var l1 = ntinv.redAdd(s).fromRed();
    var l2 = ntinv.redSub(s).fromRed();
    return [l1, l2];
  };
  ShortCurve.prototype._getEndoBasis = function _getEndoBasis(lambda) {
    var aprxSqrt = this.n.ushrn(Math.floor(this.n.bitLength() / 2));
    var u = lambda;
    var v = this.n.clone();
    var x1 = new BN$6(1);
    var y1 = new BN$6(0);
    var x2 = new BN$6(0);
    var y2 = new BN$6(1);
    var a0;
    var b0;
    var a1;
    var b1;
    var a2;
    var b2;
    var prevR;
    var i = 0;
    var r;
    var x;
    while (u.cmpn(0) !== 0) {
      var q = v.div(u);
      r = v.sub(q.mul(u));
      x = x2.sub(q.mul(x1));
      var y = y2.sub(q.mul(y1));
      if (!a1 && r.cmp(aprxSqrt) < 0) {
        a0 = prevR.neg();
        b0 = x1;
        a1 = r.neg();
        b1 = x;
      } else if (a1 && ++i === 2) {
        break;
      }
      prevR = r;
      v = u;
      u = r;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
    }
    a2 = r.neg();
    b2 = x;
    var len1 = a1.sqr().add(b1.sqr());
    var len2 = a2.sqr().add(b2.sqr());
    if (len2.cmp(len1) >= 0) {
      a2 = a0;
      b2 = b0;
    }
    if (a1.negative) {
      a1 = a1.neg();
      b1 = b1.neg();
    }
    if (a2.negative) {
      a2 = a2.neg();
      b2 = b2.neg();
    }
    return [{
      a: a1,
      b: b1
    }, {
      a: a2,
      b: b2
    }];
  };
  ShortCurve.prototype._endoSplit = function _endoSplit(k) {
    var basis = this.endo.basis;
    var v1 = basis[0];
    var v2 = basis[1];
    var c1 = v2.b.mul(k).divRound(this.n);
    var c2 = v1.b.neg().mul(k).divRound(this.n);
    var p1 = c1.mul(v1.a);
    var p2 = c2.mul(v2.a);
    var q1 = c1.mul(v1.b);
    var q2 = c2.mul(v2.b);
    var k1 = k.sub(p1).sub(p2);
    var k2 = q1.add(q2).neg();
    return {
      k1: k1,
      k2: k2
    };
  };
  ShortCurve.prototype.pointFromX = function pointFromX(x, odd) {
    x = new BN$6(x, 16);
    if (!x.red) x = x.toRed(this.red);
    var y2 = x.redSqr().redMul(x).redIAdd(x.redMul(this.a)).redIAdd(this.b);
    var y = y2.redSqrt();
    if (y.redSqr().redSub(y2).cmp(this.zero) !== 0) throw new Error('invalid point');
    var isOdd = y.fromRed().isOdd();
    if (odd && !isOdd || !odd && isOdd) y = y.redNeg();
    return this.point(x, y);
  };
  ShortCurve.prototype.validate = function validate(point) {
    if (point.inf) return true;
    var x = point.x;
    var y = point.y;
    var ax = this.a.redMul(x);
    var rhs = x.redSqr().redMul(x).redIAdd(ax).redIAdd(this.b);
    return y.redSqr().redISub(rhs).cmpn(0) === 0;
  };
  ShortCurve.prototype._endoWnafMulAdd = function _endoWnafMulAdd(points, coeffs, jacobianResult) {
    var npoints = this._endoWnafT1;
    var ncoeffs = this._endoWnafT2;
    for (var i = 0; i < points.length; i++) {
      var split = this._endoSplit(coeffs[i]);
      var p = points[i];
      var beta = p._getBeta();
      if (split.k1.negative) {
        split.k1.ineg();
        p = p.neg(true);
      }
      if (split.k2.negative) {
        split.k2.ineg();
        beta = beta.neg(true);
      }
      npoints[i * 2] = p;
      npoints[i * 2 + 1] = beta;
      ncoeffs[i * 2] = split.k1;
      ncoeffs[i * 2 + 1] = split.k2;
    }
    var res = this._wnafMulAdd(1, npoints, ncoeffs, i * 2, jacobianResult);
    for (var j = 0; j < i * 2; j++) {
      npoints[j] = null;
      ncoeffs[j] = null;
    }
    return res;
  };
  function Point$2(curve, x, y, isRed) {
    Base$2.BasePoint.call(this, curve, 'affine');
    if (x === null && y === null) {
      this.x = null;
      this.y = null;
      this.inf = true;
    } else {
      this.x = new BN$6(x, 16);
      this.y = new BN$6(y, 16);
      if (isRed) {
        this.x.forceRed(this.curve.red);
        this.y.forceRed(this.curve.red);
      }
      if (!this.x.red) this.x = this.x.toRed(this.curve.red);
      if (!this.y.red) this.y = this.y.toRed(this.curve.red);
      this.inf = false;
    }
  }
  inherits$6(Point$2, Base$2.BasePoint);
  ShortCurve.prototype.point = function point(x, y, isRed) {
    return new Point$2(this, x, y, isRed);
  };
  ShortCurve.prototype.pointFromJSON = function pointFromJSON(obj, red) {
    return Point$2.fromJSON(this, obj, red);
  };
  Point$2.prototype._getBeta = function _getBeta() {
    if (!this.curve.endo) return;
    var pre = this.precomputed;
    if (pre && pre.beta) return pre.beta;
    var beta = this.curve.point(this.x.redMul(this.curve.endo.beta), this.y);
    if (pre) {
      var curve = this.curve;
      var endoMul = function (p) {
        return curve.point(p.x.redMul(curve.endo.beta), p.y);
      };
      pre.beta = beta;
      beta.precomputed = {
        beta: null,
        naf: pre.naf && {
          wnd: pre.naf.wnd,
          points: pre.naf.points.map(endoMul)
        },
        doubles: pre.doubles && {
          step: pre.doubles.step,
          points: pre.doubles.points.map(endoMul)
        }
      };
    }
    return beta;
  };
  Point$2.prototype.toJSON = function toJSON() {
    if (!this.precomputed) return [this.x, this.y];
    return [this.x, this.y, this.precomputed && {
      doubles: this.precomputed.doubles && {
        step: this.precomputed.doubles.step,
        points: this.precomputed.doubles.points.slice(1)
      },
      naf: this.precomputed.naf && {
        wnd: this.precomputed.naf.wnd,
        points: this.precomputed.naf.points.slice(1)
      }
    }];
  };
  Point$2.fromJSON = function fromJSON(curve, obj, red) {
    if (typeof obj === 'string') obj = JSON.parse(obj);
    var res = curve.point(obj[0], obj[1], red);
    if (!obj[2]) return res;
    function obj2point(obj) {
      return curve.point(obj[0], obj[1], red);
    }
    var pre = obj[2];
    res.precomputed = {
      beta: null,
      doubles: pre.doubles && {
        step: pre.doubles.step,
        points: [res].concat(pre.doubles.points.map(obj2point))
      },
      naf: pre.naf && {
        wnd: pre.naf.wnd,
        points: [res].concat(pre.naf.points.map(obj2point))
      }
    };
    return res;
  };
  Point$2.prototype.inspect = function inspect() {
    if (this.isInfinity()) return '<EC Point Infinity>';
    return '<EC Point x: ' + this.x.fromRed().toString(16, 2) + ' y: ' + this.y.fromRed().toString(16, 2) + '>';
  };
  Point$2.prototype.isInfinity = function isInfinity() {
    return this.inf;
  };
  Point$2.prototype.add = function add(p) {
    if (this.inf) return p;
    if (p.inf) return this;
    if (this.eq(p)) return this.dbl();
    if (this.neg().eq(p)) return this.curve.point(null, null);
    if (this.x.cmp(p.x) === 0) return this.curve.point(null, null);
    var c = this.y.redSub(p.y);
    if (c.cmpn(0) !== 0) c = c.redMul(this.x.redSub(p.x).redInvm());
    var nx = c.redSqr().redISub(this.x).redISub(p.x);
    var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
    return this.curve.point(nx, ny);
  };
  Point$2.prototype.dbl = function dbl() {
    if (this.inf) return this;
    var ys1 = this.y.redAdd(this.y);
    if (ys1.cmpn(0) === 0) return this.curve.point(null, null);
    var a = this.curve.a;
    var x2 = this.x.redSqr();
    var dyinv = ys1.redInvm();
    var c = x2.redAdd(x2).redIAdd(x2).redIAdd(a).redMul(dyinv);
    var nx = c.redSqr().redISub(this.x.redAdd(this.x));
    var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
    return this.curve.point(nx, ny);
  };
  Point$2.prototype.getX = function getX() {
    return this.x.fromRed();
  };
  Point$2.prototype.getY = function getY() {
    return this.y.fromRed();
  };
  Point$2.prototype.mul = function mul(k) {
    k = new BN$6(k, 16);
    if (this._hasDoubles(k)) return this.curve._fixedNafMul(this, k);else if (this.curve.endo) return this.curve._endoWnafMulAdd([this], [k]);else return this.curve._wnafMul(this, k);
  };
  Point$2.prototype.mulAdd = function mulAdd(k1, p2, k2) {
    var points = [this, p2];
    var coeffs = [k1, k2];
    if (this.curve.endo) return this.curve._endoWnafMulAdd(points, coeffs);else return this.curve._wnafMulAdd(1, points, coeffs, 2);
  };
  Point$2.prototype.jmulAdd = function jmulAdd(k1, p2, k2) {
    var points = [this, p2];
    var coeffs = [k1, k2];
    if (this.curve.endo) return this.curve._endoWnafMulAdd(points, coeffs, true);else return this.curve._wnafMulAdd(1, points, coeffs, 2, true);
  };
  Point$2.prototype.eq = function eq(p) {
    return this === p || this.inf === p.inf && (this.inf || this.x.cmp(p.x) === 0 && this.y.cmp(p.y) === 0);
  };
  Point$2.prototype.neg = function neg(_precompute) {
    if (this.inf) return this;
    var res = this.curve.point(this.x, this.y.redNeg());
    if (_precompute && this.precomputed) {
      var pre = this.precomputed;
      var negate = function (p) {
        return p.neg();
      };
      res.precomputed = {
        naf: pre.naf && {
          wnd: pre.naf.wnd,
          points: pre.naf.points.map(negate)
        },
        doubles: pre.doubles && {
          step: pre.doubles.step,
          points: pre.doubles.points.map(negate)
        }
      };
    }
    return res;
  };
  Point$2.prototype.toJ = function toJ() {
    if (this.inf) return this.curve.jpoint(null, null, null);
    var res = this.curve.jpoint(this.x, this.y, this.curve.one);
    return res;
  };
  function JPoint(curve, x, y, z) {
    Base$2.BasePoint.call(this, curve, 'jacobian');
    if (x === null && y === null && z === null) {
      this.x = this.curve.one;
      this.y = this.curve.one;
      this.z = new BN$6(0);
    } else {
      this.x = new BN$6(x, 16);
      this.y = new BN$6(y, 16);
      this.z = new BN$6(z, 16);
    }
    if (!this.x.red) this.x = this.x.toRed(this.curve.red);
    if (!this.y.red) this.y = this.y.toRed(this.curve.red);
    if (!this.z.red) this.z = this.z.toRed(this.curve.red);
    this.zOne = this.z === this.curve.one;
  }
  inherits$6(JPoint, Base$2.BasePoint);
  ShortCurve.prototype.jpoint = function jpoint(x, y, z) {
    return new JPoint(this, x, y, z);
  };
  JPoint.prototype.toP = function toP() {
    if (this.isInfinity()) return this.curve.point(null, null);
    var zinv = this.z.redInvm();
    var zinv2 = zinv.redSqr();
    var ax = this.x.redMul(zinv2);
    var ay = this.y.redMul(zinv2).redMul(zinv);
    return this.curve.point(ax, ay);
  };
  JPoint.prototype.neg = function neg() {
    return this.curve.jpoint(this.x, this.y.redNeg(), this.z);
  };
  JPoint.prototype.add = function add(p) {
    if (this.isInfinity()) return p;
    if (p.isInfinity()) return this;
    var pz2 = p.z.redSqr();
    var z2 = this.z.redSqr();
    var u1 = this.x.redMul(pz2);
    var u2 = p.x.redMul(z2);
    var s1 = this.y.redMul(pz2.redMul(p.z));
    var s2 = p.y.redMul(z2.redMul(this.z));
    var h = u1.redSub(u2);
    var r = s1.redSub(s2);
    if (h.cmpn(0) === 0) {
      if (r.cmpn(0) !== 0) return this.curve.jpoint(null, null, null);else return this.dbl();
    }
    var h2 = h.redSqr();
    var h3 = h2.redMul(h);
    var v = u1.redMul(h2);
    var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
    var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
    var nz = this.z.redMul(p.z).redMul(h);
    return this.curve.jpoint(nx, ny, nz);
  };
  JPoint.prototype.mixedAdd = function mixedAdd(p) {
    if (this.isInfinity()) return p.toJ();
    if (p.isInfinity()) return this;
    var z2 = this.z.redSqr();
    var u1 = this.x;
    var u2 = p.x.redMul(z2);
    var s1 = this.y;
    var s2 = p.y.redMul(z2).redMul(this.z);
    var h = u1.redSub(u2);
    var r = s1.redSub(s2);
    if (h.cmpn(0) === 0) {
      if (r.cmpn(0) !== 0) return this.curve.jpoint(null, null, null);else return this.dbl();
    }
    var h2 = h.redSqr();
    var h3 = h2.redMul(h);
    var v = u1.redMul(h2);
    var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
    var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
    var nz = this.z.redMul(h);
    return this.curve.jpoint(nx, ny, nz);
  };
  JPoint.prototype.dblp = function dblp(pow) {
    if (pow === 0) return this;
    if (this.isInfinity()) return this;
    if (!pow) return this.dbl();
    if (this.curve.zeroA || this.curve.threeA) {
      var r = this;
      for (var i = 0; i < pow; i++) r = r.dbl();
      return r;
    }
    var a = this.curve.a;
    var tinv = this.curve.tinv;
    var jx = this.x;
    var jy = this.y;
    var jz = this.z;
    var jz4 = jz.redSqr().redSqr();
    var jyd = jy.redAdd(jy);
    for (var i = 0; i < pow; i++) {
      var jx2 = jx.redSqr();
      var jyd2 = jyd.redSqr();
      var jyd4 = jyd2.redSqr();
      var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));
      var t1 = jx.redMul(jyd2);
      var nx = c.redSqr().redISub(t1.redAdd(t1));
      var t2 = t1.redISub(nx);
      var dny = c.redMul(t2);
      dny = dny.redIAdd(dny).redISub(jyd4);
      var nz = jyd.redMul(jz);
      if (i + 1 < pow) jz4 = jz4.redMul(jyd4);
      jx = nx;
      jz = nz;
      jyd = dny;
    }
    return this.curve.jpoint(jx, jyd.redMul(tinv), jz);
  };
  JPoint.prototype.dbl = function dbl() {
    if (this.isInfinity()) return this;
    if (this.curve.zeroA) return this._zeroDbl();else if (this.curve.threeA) return this._threeDbl();else return this._dbl();
  };
  JPoint.prototype._zeroDbl = function _zeroDbl() {
    var nx;
    var ny;
    var nz;
    if (this.zOne) {
      var xx = this.x.redSqr();
      var yy = this.y.redSqr();
      var yyyy = yy.redSqr();
      var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
      s = s.redIAdd(s);
      var m = xx.redAdd(xx).redIAdd(xx);
      var t = m.redSqr().redISub(s).redISub(s);
      var yyyy8 = yyyy.redIAdd(yyyy);
      yyyy8 = yyyy8.redIAdd(yyyy8);
      yyyy8 = yyyy8.redIAdd(yyyy8);
      nx = t;
      ny = m.redMul(s.redISub(t)).redISub(yyyy8);
      nz = this.y.redAdd(this.y);
    } else {
      var a = this.x.redSqr();
      var b = this.y.redSqr();
      var c = b.redSqr();
      var d = this.x.redAdd(b).redSqr().redISub(a).redISub(c);
      d = d.redIAdd(d);
      var e = a.redAdd(a).redIAdd(a);
      var f = e.redSqr();
      var c8 = c.redIAdd(c);
      c8 = c8.redIAdd(c8);
      c8 = c8.redIAdd(c8);
      nx = f.redISub(d).redISub(d);
      ny = e.redMul(d.redISub(nx)).redISub(c8);
      nz = this.y.redMul(this.z);
      nz = nz.redIAdd(nz);
    }
    return this.curve.jpoint(nx, ny, nz);
  };
  JPoint.prototype._threeDbl = function _threeDbl() {
    var nx;
    var ny;
    var nz;
    if (this.zOne) {
      var xx = this.x.redSqr();
      var yy = this.y.redSqr();
      var yyyy = yy.redSqr();
      var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
      s = s.redIAdd(s);
      var m = xx.redAdd(xx).redIAdd(xx).redIAdd(this.curve.a);
      var t = m.redSqr().redISub(s).redISub(s);
      nx = t;
      var yyyy8 = yyyy.redIAdd(yyyy);
      yyyy8 = yyyy8.redIAdd(yyyy8);
      yyyy8 = yyyy8.redIAdd(yyyy8);
      ny = m.redMul(s.redISub(t)).redISub(yyyy8);
      nz = this.y.redAdd(this.y);
    } else {
      var delta = this.z.redSqr();
      var gamma = this.y.redSqr();
      var beta = this.x.redMul(gamma);
      var alpha = this.x.redSub(delta).redMul(this.x.redAdd(delta));
      alpha = alpha.redAdd(alpha).redIAdd(alpha);
      var beta4 = beta.redIAdd(beta);
      beta4 = beta4.redIAdd(beta4);
      var beta8 = beta4.redAdd(beta4);
      nx = alpha.redSqr().redISub(beta8);
      nz = this.y.redAdd(this.z).redSqr().redISub(gamma).redISub(delta);
      var ggamma8 = gamma.redSqr();
      ggamma8 = ggamma8.redIAdd(ggamma8);
      ggamma8 = ggamma8.redIAdd(ggamma8);
      ggamma8 = ggamma8.redIAdd(ggamma8);
      ny = alpha.redMul(beta4.redISub(nx)).redISub(ggamma8);
    }
    return this.curve.jpoint(nx, ny, nz);
  };
  JPoint.prototype._dbl = function _dbl() {
    var a = this.curve.a;
    var jx = this.x;
    var jy = this.y;
    var jz = this.z;
    var jz4 = jz.redSqr().redSqr();
    var jx2 = jx.redSqr();
    var jy2 = jy.redSqr();
    var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));
    var jxd4 = jx.redAdd(jx);
    jxd4 = jxd4.redIAdd(jxd4);
    var t1 = jxd4.redMul(jy2);
    var nx = c.redSqr().redISub(t1.redAdd(t1));
    var t2 = t1.redISub(nx);
    var jyd8 = jy2.redSqr();
    jyd8 = jyd8.redIAdd(jyd8);
    jyd8 = jyd8.redIAdd(jyd8);
    jyd8 = jyd8.redIAdd(jyd8);
    var ny = c.redMul(t2).redISub(jyd8);
    var nz = jy.redAdd(jy).redMul(jz);
    return this.curve.jpoint(nx, ny, nz);
  };
  JPoint.prototype.trpl = function trpl() {
    if (!this.curve.zeroA) return this.dbl().add(this);
    var xx = this.x.redSqr();
    var yy = this.y.redSqr();
    var zz = this.z.redSqr();
    var yyyy = yy.redSqr();
    var m = xx.redAdd(xx).redIAdd(xx);
    var mm = m.redSqr();
    var e = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
    e = e.redIAdd(e);
    e = e.redAdd(e).redIAdd(e);
    e = e.redISub(mm);
    var ee = e.redSqr();
    var t = yyyy.redIAdd(yyyy);
    t = t.redIAdd(t);
    t = t.redIAdd(t);
    t = t.redIAdd(t);
    var u = m.redIAdd(e).redSqr().redISub(mm).redISub(ee).redISub(t);
    var yyu4 = yy.redMul(u);
    yyu4 = yyu4.redIAdd(yyu4);
    yyu4 = yyu4.redIAdd(yyu4);
    var nx = this.x.redMul(ee).redISub(yyu4);
    nx = nx.redIAdd(nx);
    nx = nx.redIAdd(nx);
    var ny = this.y.redMul(u.redMul(t.redISub(u)).redISub(e.redMul(ee)));
    ny = ny.redIAdd(ny);
    ny = ny.redIAdd(ny);
    ny = ny.redIAdd(ny);
    var nz = this.z.redAdd(e).redSqr().redISub(zz).redISub(ee);
    return this.curve.jpoint(nx, ny, nz);
  };
  JPoint.prototype.mul = function mul(k, kbase) {
    k = new BN$6(k, kbase);
    return this.curve._wnafMul(this, k);
  };
  JPoint.prototype.eq = function eq(p) {
    if (p.type === 'affine') return this.eq(p.toJ());
    if (this === p) return true;
    var z2 = this.z.redSqr();
    var pz2 = p.z.redSqr();
    if (this.x.redMul(pz2).redISub(p.x.redMul(z2)).cmpn(0) !== 0) return false;
    var z3 = z2.redMul(this.z);
    var pz3 = pz2.redMul(p.z);
    return this.y.redMul(pz3).redISub(p.y.redMul(z3)).cmpn(0) === 0;
  };
  JPoint.prototype.eqXToP = function eqXToP(x) {
    var zs = this.z.redSqr();
    var rx = x.toRed(this.curve.red).redMul(zs);
    if (this.x.cmp(rx) === 0) return true;
    var xc = x.clone();
    var t = this.curve.redN.redMul(zs);
    for (;;) {
      xc.iadd(this.curve.n);
      if (xc.cmp(this.curve.p) >= 0) return false;
      rx.redIAdd(t);
      if (this.x.cmp(rx) === 0) return true;
    }
  };
  JPoint.prototype.inspect = function inspect() {
    if (this.isInfinity()) return '<EC JPoint Infinity>';
    return '<EC JPoint x: ' + this.x.toString(16, 2) + ' y: ' + this.y.toString(16, 2) + ' z: ' + this.z.toString(16, 2) + '>';
  };
  JPoint.prototype.isInfinity = function isInfinity() {
    return this.z.cmpn(0) === 0;
  };
  var BN$5 = bnExports;
  var inherits$5 = inheritsExports;
  var Base$1 = base;
  var utils$k = utils$o;
  function MontCurve(conf) {
    Base$1.call(this, 'mont', conf);
    this.a = new BN$5(conf.a, 16).toRed(this.red);
    this.b = new BN$5(conf.b, 16).toRed(this.red);
    this.i4 = new BN$5(4).toRed(this.red).redInvm();
    this.two = new BN$5(2).toRed(this.red);
    this.a24 = this.i4.redMul(this.a.redAdd(this.two));
  }
  inherits$5(MontCurve, Base$1);
  var mont = MontCurve;
  MontCurve.prototype.validate = function validate(point) {
    var x = point.normalize().x;
    var x2 = x.redSqr();
    var rhs = x2.redMul(x).redAdd(x2.redMul(this.a)).redAdd(x);
    var y = rhs.redSqrt();
    return y.redSqr().cmp(rhs) === 0;
  };
  function Point$1(curve, x, z) {
    Base$1.BasePoint.call(this, curve, 'projective');
    if (x === null && z === null) {
      this.x = this.curve.one;
      this.z = this.curve.zero;
    } else {
      this.x = new BN$5(x, 16);
      this.z = new BN$5(z, 16);
      if (!this.x.red) this.x = this.x.toRed(this.curve.red);
      if (!this.z.red) this.z = this.z.toRed(this.curve.red);
    }
  }
  inherits$5(Point$1, Base$1.BasePoint);
  MontCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
    var bytes = utils$k.toArray(bytes, enc);
    if (bytes.length === 33 && bytes[0] === 0x40) bytes = bytes.slice(1, 33).reverse();
    if (bytes.length !== 32) throw new Error('Unknown point compression format');
    return this.point(bytes, 1);
  };
  MontCurve.prototype.point = function point(x, z) {
    return new Point$1(this, x, z);
  };
  MontCurve.prototype.pointFromJSON = function pointFromJSON(obj) {
    return Point$1.fromJSON(this, obj);
  };
  Point$1.prototype.precompute = function precompute() {};
  Point$1.prototype._encode = function _encode(compact) {
    var len = this.curve.p.byteLength();
    if (compact) {
      return [0x40].concat(this.getX().toArray('le', len));
    } else {
      return this.getX().toArray('be', len);
    }
  };
  Point$1.fromJSON = function fromJSON(curve, obj) {
    return new Point$1(curve, obj[0], obj[1] || curve.one);
  };
  Point$1.prototype.inspect = function inspect() {
    if (this.isInfinity()) return '<EC Point Infinity>';
    return '<EC Point x: ' + this.x.fromRed().toString(16, 2) + ' z: ' + this.z.fromRed().toString(16, 2) + '>';
  };
  Point$1.prototype.isInfinity = function isInfinity() {
    return this.z.cmpn(0) === 0;
  };
  Point$1.prototype.dbl = function dbl() {
    var a = this.x.redAdd(this.z);
    var aa = a.redSqr();
    var b = this.x.redSub(this.z);
    var bb = b.redSqr();
    var c = aa.redSub(bb);
    var nx = aa.redMul(bb);
    var nz = c.redMul(bb.redAdd(this.curve.a24.redMul(c)));
    return this.curve.point(nx, nz);
  };
  Point$1.prototype.add = function add() {
    throw new Error('Not supported on Montgomery curve');
  };
  Point$1.prototype.diffAdd = function diffAdd(p, diff) {
    var a = this.x.redAdd(this.z);
    var b = this.x.redSub(this.z);
    var c = p.x.redAdd(p.z);
    var d = p.x.redSub(p.z);
    var da = d.redMul(a);
    var cb = c.redMul(b);
    var nx = diff.z.redMul(da.redAdd(cb).redSqr());
    var nz = diff.x.redMul(da.redISub(cb).redSqr());
    return this.curve.point(nx, nz);
  };
  Point$1.prototype.mul = function mul(k) {
    k = new BN$5(k, 16);
    var t = k.clone();
    var a = this;
    var b = this.curve.point(null, null);
    var c = this;
    for (var bits = []; t.cmpn(0) !== 0; t.iushrn(1)) bits.push(t.andln(1));
    for (var i = bits.length - 1; i >= 0; i--) {
      if (bits[i] === 0) {
        a = a.diffAdd(b, c);
        b = b.dbl();
      } else {
        b = a.diffAdd(b, c);
        a = a.dbl();
      }
    }
    return b;
  };
  Point$1.prototype.mulAdd = function mulAdd() {
    throw new Error('Not supported on Montgomery curve');
  };
  Point$1.prototype.jumlAdd = function jumlAdd() {
    throw new Error('Not supported on Montgomery curve');
  };
  Point$1.prototype.eq = function eq(other) {
    return this.getX().cmp(other.getX()) === 0;
  };
  Point$1.prototype.normalize = function normalize() {
    this.x = this.x.redMul(this.z.redInvm());
    this.z = this.curve.one;
    return this;
  };
  Point$1.prototype.getX = function getX() {
    this.normalize();
    return this.x.fromRed();
  };
  var utils$j = utils$o;
  var BN$4 = bnExports;
  var inherits$4 = inheritsExports;
  var Base = base;
  var assert$f = utils$j.assert;
  function EdwardsCurve(conf) {
    this.twisted = (conf.a | 0) !== 1;
    this.mOneA = this.twisted && (conf.a | 0) === -1;
    this.extended = this.mOneA;
    Base.call(this, 'edwards', conf);
    this.a = new BN$4(conf.a, 16).umod(this.red.m);
    this.a = this.a.toRed(this.red);
    this.c = new BN$4(conf.c, 16).toRed(this.red);
    this.c2 = this.c.redSqr();
    this.d = new BN$4(conf.d, 16).toRed(this.red);
    this.dd = this.d.redAdd(this.d);
    assert$f(!this.twisted || this.c.fromRed().cmpn(1) === 0);
    this.oneC = (conf.c | 0) === 1;
  }
  inherits$4(EdwardsCurve, Base);
  var edwards = EdwardsCurve;
  EdwardsCurve.prototype._mulA = function _mulA(num) {
    if (this.mOneA) return num.redNeg();else return this.a.redMul(num);
  };
  EdwardsCurve.prototype._mulC = function _mulC(num) {
    if (this.oneC) return num;else return this.c.redMul(num);
  };
  EdwardsCurve.prototype.jpoint = function jpoint(x, y, z, t) {
    return this.point(x, y, z, t);
  };
  EdwardsCurve.prototype.pointFromX = function pointFromX(x, odd) {
    x = new BN$4(x, 16);
    if (!x.red) x = x.toRed(this.red);
    var x2 = x.redSqr();
    var rhs = this.c2.redSub(this.a.redMul(x2));
    var lhs = this.one.redSub(this.c2.redMul(this.d).redMul(x2));
    var y2 = rhs.redMul(lhs.redInvm());
    var y = y2.redSqrt();
    if (y.redSqr().redSub(y2).cmp(this.zero) !== 0) throw new Error('invalid point');
    var isOdd = y.fromRed().isOdd();
    if (odd && !isOdd || !odd && isOdd) y = y.redNeg();
    return this.point(x, y);
  };
  EdwardsCurve.prototype.pointFromY = function pointFromY(y, odd) {
    y = new BN$4(y, 16);
    if (!y.red) y = y.toRed(this.red);
    var y2 = y.redSqr();
    var lhs = y2.redSub(this.c2);
    var rhs = y2.redMul(this.d).redMul(this.c2).redSub(this.a);
    var x2 = lhs.redMul(rhs.redInvm());
    if (x2.cmp(this.zero) === 0) {
      if (odd) throw new Error('invalid point');else return this.point(this.zero, y);
    }
    var x = x2.redSqrt();
    if (x.redSqr().redSub(x2).cmp(this.zero) !== 0) throw new Error('invalid point');
    if (x.fromRed().isOdd() !== odd) x = x.redNeg();
    return this.point(x, y);
  };
  EdwardsCurve.prototype.validate = function validate(point) {
    if (point.isInfinity()) return true;
    point.normalize();
    var x2 = point.x.redSqr();
    var y2 = point.y.redSqr();
    var lhs = x2.redMul(this.a).redAdd(y2);
    var rhs = this.c2.redMul(this.one.redAdd(this.d.redMul(x2).redMul(y2)));
    return lhs.cmp(rhs) === 0;
  };
  function Point(curve, x, y, z, t) {
    Base.BasePoint.call(this, curve, 'projective');
    if (x === null && y === null && z === null) {
      this.x = this.curve.zero;
      this.y = this.curve.one;
      this.z = this.curve.one;
      this.t = this.curve.zero;
      this.zOne = true;
    } else {
      this.x = new BN$4(x, 16);
      this.y = new BN$4(y, 16);
      this.z = z ? new BN$4(z, 16) : this.curve.one;
      this.t = t && new BN$4(t, 16);
      if (!this.x.red) this.x = this.x.toRed(this.curve.red);
      if (!this.y.red) this.y = this.y.toRed(this.curve.red);
      if (!this.z.red) this.z = this.z.toRed(this.curve.red);
      if (this.t && !this.t.red) this.t = this.t.toRed(this.curve.red);
      this.zOne = this.z === this.curve.one;
      if (this.curve.extended && !this.t) {
        this.t = this.x.redMul(this.y);
        if (!this.zOne) this.t = this.t.redMul(this.z.redInvm());
      }
    }
  }
  inherits$4(Point, Base.BasePoint);
  EdwardsCurve.prototype.pointFromJSON = function pointFromJSON(obj) {
    return Point.fromJSON(this, obj);
  };
  EdwardsCurve.prototype.point = function point(x, y, z, t) {
    return new Point(this, x, y, z, t);
  };
  Point.fromJSON = function fromJSON(curve, obj) {
    return new Point(curve, obj[0], obj[1], obj[2]);
  };
  Point.prototype.inspect = function inspect() {
    if (this.isInfinity()) return '<EC Point Infinity>';
    return '<EC Point x: ' + this.x.fromRed().toString(16, 2) + ' y: ' + this.y.fromRed().toString(16, 2) + ' z: ' + this.z.fromRed().toString(16, 2) + '>';
  };
  Point.prototype.isInfinity = function isInfinity() {
    return this.x.cmpn(0) === 0 && (this.y.cmp(this.z) === 0 || this.zOne && this.y.cmp(this.curve.c) === 0);
  };
  Point.prototype._extDbl = function _extDbl() {
    var a = this.x.redSqr();
    var b = this.y.redSqr();
    var c = this.z.redSqr();
    c = c.redIAdd(c);
    var d = this.curve._mulA(a);
    var e = this.x.redAdd(this.y).redSqr().redISub(a).redISub(b);
    var g = d.redAdd(b);
    var f = g.redSub(c);
    var h = d.redSub(b);
    var nx = e.redMul(f);
    var ny = g.redMul(h);
    var nt = e.redMul(h);
    var nz = f.redMul(g);
    return this.curve.point(nx, ny, nz, nt);
  };
  Point.prototype._projDbl = function _projDbl() {
    var b = this.x.redAdd(this.y).redSqr();
    var c = this.x.redSqr();
    var d = this.y.redSqr();
    var nx;
    var ny;
    var nz;
    if (this.curve.twisted) {
      var e = this.curve._mulA(c);
      var f = e.redAdd(d);
      if (this.zOne) {
        nx = b.redSub(c).redSub(d).redMul(f.redSub(this.curve.two));
        ny = f.redMul(e.redSub(d));
        nz = f.redSqr().redSub(f).redSub(f);
      } else {
        var h = this.z.redSqr();
        var j = f.redSub(h).redISub(h);
        nx = b.redSub(c).redISub(d).redMul(j);
        ny = f.redMul(e.redSub(d));
        nz = f.redMul(j);
      }
    } else {
      var e = c.redAdd(d);
      var h = this.curve._mulC(this.z).redSqr();
      var j = e.redSub(h).redSub(h);
      nx = this.curve._mulC(b.redISub(e)).redMul(j);
      ny = this.curve._mulC(e).redMul(c.redISub(d));
      nz = e.redMul(j);
    }
    return this.curve.point(nx, ny, nz);
  };
  Point.prototype.dbl = function dbl() {
    if (this.isInfinity()) return this;
    if (this.curve.extended) return this._extDbl();else return this._projDbl();
  };
  Point.prototype._extAdd = function _extAdd(p) {
    var a = this.y.redSub(this.x).redMul(p.y.redSub(p.x));
    var b = this.y.redAdd(this.x).redMul(p.y.redAdd(p.x));
    var c = this.t.redMul(this.curve.dd).redMul(p.t);
    var d = this.z.redMul(p.z.redAdd(p.z));
    var e = b.redSub(a);
    var f = d.redSub(c);
    var g = d.redAdd(c);
    var h = b.redAdd(a);
    var nx = e.redMul(f);
    var ny = g.redMul(h);
    var nt = e.redMul(h);
    var nz = f.redMul(g);
    return this.curve.point(nx, ny, nz, nt);
  };
  Point.prototype._projAdd = function _projAdd(p) {
    var a = this.z.redMul(p.z);
    var b = a.redSqr();
    var c = this.x.redMul(p.x);
    var d = this.y.redMul(p.y);
    var e = this.curve.d.redMul(c).redMul(d);
    var f = b.redSub(e);
    var g = b.redAdd(e);
    var tmp = this.x.redAdd(this.y).redMul(p.x.redAdd(p.y)).redISub(c).redISub(d);
    var nx = a.redMul(f).redMul(tmp);
    var ny;
    var nz;
    if (this.curve.twisted) {
      ny = a.redMul(g).redMul(d.redSub(this.curve._mulA(c)));
      nz = f.redMul(g);
    } else {
      ny = a.redMul(g).redMul(d.redSub(c));
      nz = this.curve._mulC(f).redMul(g);
    }
    return this.curve.point(nx, ny, nz);
  };
  Point.prototype.add = function add(p) {
    if (this.isInfinity()) return p;
    if (p.isInfinity()) return this;
    if (this.curve.extended) return this._extAdd(p);else return this._projAdd(p);
  };
  Point.prototype.mul = function mul(k) {
    if (this._hasDoubles(k)) return this.curve._fixedNafMul(this, k);else return this.curve._wnafMul(this, k);
  };
  Point.prototype.mulAdd = function mulAdd(k1, p, k2) {
    return this.curve._wnafMulAdd(1, [this, p], [k1, k2], 2, false);
  };
  Point.prototype.jmulAdd = function jmulAdd(k1, p, k2) {
    return this.curve._wnafMulAdd(1, [this, p], [k1, k2], 2, true);
  };
  Point.prototype.normalize = function normalize() {
    if (this.zOne) return this;
    var zi = this.z.redInvm();
    this.x = this.x.redMul(zi);
    this.y = this.y.redMul(zi);
    if (this.t) this.t = this.t.redMul(zi);
    this.z = this.curve.one;
    this.zOne = true;
    return this;
  };
  Point.prototype.neg = function neg() {
    return this.curve.point(this.x.redNeg(), this.y, this.z, this.t && this.t.redNeg());
  };
  Point.prototype.getX = function getX() {
    this.normalize();
    return this.x.fromRed();
  };
  Point.prototype.getY = function getY() {
    this.normalize();
    return this.y.fromRed();
  };
  Point.prototype.eq = function eq(other) {
    return this === other || this.getX().cmp(other.getX()) === 0 && this.getY().cmp(other.getY()) === 0;
  };
  Point.prototype.eqXToP = function eqXToP(x) {
    var rx = x.toRed(this.curve.red).redMul(this.z);
    if (this.x.cmp(rx) === 0) return true;
    var xc = x.clone();
    var t = this.curve.redN.redMul(this.z);
    for (;;) {
      xc.iadd(this.curve.n);
      if (xc.cmp(this.curve.p) >= 0) return false;
      rx.redIAdd(t);
      if (this.x.cmp(rx) === 0) return true;
    }
  };
  Point.prototype.toP = Point.prototype.normalize;
  Point.prototype.mixedAdd = Point.prototype.add;
  (function (exports) {
    var curve = exports;
    curve.base = base;
    curve.short = short;
    curve.mont = mont;
    curve.edwards = edwards;
  })(curve);
  var curves$1 = {};
  var hash$2 = {};
  var utils$i = {};
  var assert$e = minimalisticAssert;
  var inherits$3 = inheritsExports;
  utils$i.inherits = inherits$3;
  function isSurrogatePair(msg, i) {
    if ((msg.charCodeAt(i) & 0xFC00) !== 0xD800) {
      return false;
    }
    if (i < 0 || i + 1 >= msg.length) {
      return false;
    }
    return (msg.charCodeAt(i + 1) & 0xFC00) === 0xDC00;
  }
  function toArray(msg, enc) {
    if (Array.isArray(msg)) return msg.slice();
    if (!msg) return [];
    var res = [];
    if (typeof msg === 'string') {
      if (!enc) {
        var p = 0;
        for (var i = 0; i < msg.length; i++) {
          var c = msg.charCodeAt(i);
          if (c < 128) {
            res[p++] = c;
          } else if (c < 2048) {
            res[p++] = c >> 6 | 192;
            res[p++] = c & 63 | 128;
          } else if (isSurrogatePair(msg, i)) {
            c = 0x10000 + ((c & 0x03FF) << 10) + (msg.charCodeAt(++i) & 0x03FF);
            res[p++] = c >> 18 | 240;
            res[p++] = c >> 12 & 63 | 128;
            res[p++] = c >> 6 & 63 | 128;
            res[p++] = c & 63 | 128;
          } else {
            res[p++] = c >> 12 | 224;
            res[p++] = c >> 6 & 63 | 128;
            res[p++] = c & 63 | 128;
          }
        }
      } else if (enc === 'hex') {
        msg = msg.replace(/[^a-z0-9]+/ig, '');
        if (msg.length % 2 !== 0) msg = '0' + msg;
        for (i = 0; i < msg.length; i += 2) res.push(parseInt(msg[i] + msg[i + 1], 16));
      }
    } else {
      for (i = 0; i < msg.length; i++) res[i] = msg[i] | 0;
    }
    return res;
  }
  utils$i.toArray = toArray;
  function toHex(msg) {
    var res = '';
    for (var i = 0; i < msg.length; i++) res += zero2(msg[i].toString(16));
    return res;
  }
  utils$i.toHex = toHex;
  function htonl(w) {
    var res = w >>> 24 | w >>> 8 & 0xff00 | w << 8 & 0xff0000 | (w & 0xff) << 24;
    return res >>> 0;
  }
  utils$i.htonl = htonl;
  function toHex32(msg, endian) {
    var res = '';
    for (var i = 0; i < msg.length; i++) {
      var w = msg[i];
      if (endian === 'little') w = htonl(w);
      res += zero8(w.toString(16));
    }
    return res;
  }
  utils$i.toHex32 = toHex32;
  function zero2(word) {
    if (word.length === 1) return '0' + word;else return word;
  }
  utils$i.zero2 = zero2;
  function zero8(word) {
    if (word.length === 7) return '0' + word;else if (word.length === 6) return '00' + word;else if (word.length === 5) return '000' + word;else if (word.length === 4) return '0000' + word;else if (word.length === 3) return '00000' + word;else if (word.length === 2) return '000000' + word;else if (word.length === 1) return '0000000' + word;else return word;
  }
  utils$i.zero8 = zero8;
  function join32(msg, start, end, endian) {
    var len = end - start;
    assert$e(len % 4 === 0);
    var res = new Array(len / 4);
    for (var i = 0, k = start; i < res.length; i++, k += 4) {
      var w;
      if (endian === 'big') w = msg[k] << 24 | msg[k + 1] << 16 | msg[k + 2] << 8 | msg[k + 3];else w = msg[k + 3] << 24 | msg[k + 2] << 16 | msg[k + 1] << 8 | msg[k];
      res[i] = w >>> 0;
    }
    return res;
  }
  utils$i.join32 = join32;
  function split32(msg, endian) {
    var res = new Array(msg.length * 4);
    for (var i = 0, k = 0; i < msg.length; i++, k += 4) {
      var m = msg[i];
      if (endian === 'big') {
        res[k] = m >>> 24;
        res[k + 1] = m >>> 16 & 0xff;
        res[k + 2] = m >>> 8 & 0xff;
        res[k + 3] = m & 0xff;
      } else {
        res[k + 3] = m >>> 24;
        res[k + 2] = m >>> 16 & 0xff;
        res[k + 1] = m >>> 8 & 0xff;
        res[k] = m & 0xff;
      }
    }
    return res;
  }
  utils$i.split32 = split32;
  function rotr32$1(w, b) {
    return w >>> b | w << 32 - b;
  }
  utils$i.rotr32 = rotr32$1;
  function rotl32$2(w, b) {
    return w << b | w >>> 32 - b;
  }
  utils$i.rotl32 = rotl32$2;
  function sum32$3(a, b) {
    return a + b >>> 0;
  }
  utils$i.sum32 = sum32$3;
  function sum32_3$1(a, b, c) {
    return a + b + c >>> 0;
  }
  utils$i.sum32_3 = sum32_3$1;
  function sum32_4$2(a, b, c, d) {
    return a + b + c + d >>> 0;
  }
  utils$i.sum32_4 = sum32_4$2;
  function sum32_5$2(a, b, c, d, e) {
    return a + b + c + d + e >>> 0;
  }
  utils$i.sum32_5 = sum32_5$2;
  function sum64$1(buf, pos, ah, al) {
    var bh = buf[pos];
    var bl = buf[pos + 1];
    var lo = al + bl >>> 0;
    var hi = (lo < al ? 1 : 0) + ah + bh;
    buf[pos] = hi >>> 0;
    buf[pos + 1] = lo;
  }
  utils$i.sum64 = sum64$1;
  function sum64_hi$1(ah, al, bh, bl) {
    var lo = al + bl >>> 0;
    var hi = (lo < al ? 1 : 0) + ah + bh;
    return hi >>> 0;
  }
  utils$i.sum64_hi = sum64_hi$1;
  function sum64_lo$1(ah, al, bh, bl) {
    var lo = al + bl;
    return lo >>> 0;
  }
  utils$i.sum64_lo = sum64_lo$1;
  function sum64_4_hi$1(ah, al, bh, bl, ch, cl, dh, dl) {
    var carry = 0;
    var lo = al;
    lo = lo + bl >>> 0;
    carry += lo < al ? 1 : 0;
    lo = lo + cl >>> 0;
    carry += lo < cl ? 1 : 0;
    lo = lo + dl >>> 0;
    carry += lo < dl ? 1 : 0;
    var hi = ah + bh + ch + dh + carry;
    return hi >>> 0;
  }
  utils$i.sum64_4_hi = sum64_4_hi$1;
  function sum64_4_lo$1(ah, al, bh, bl, ch, cl, dh, dl) {
    var lo = al + bl + cl + dl;
    return lo >>> 0;
  }
  utils$i.sum64_4_lo = sum64_4_lo$1;
  function sum64_5_hi$1(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
    var carry = 0;
    var lo = al;
    lo = lo + bl >>> 0;
    carry += lo < al ? 1 : 0;
    lo = lo + cl >>> 0;
    carry += lo < cl ? 1 : 0;
    lo = lo + dl >>> 0;
    carry += lo < dl ? 1 : 0;
    lo = lo + el >>> 0;
    carry += lo < el ? 1 : 0;
    var hi = ah + bh + ch + dh + eh + carry;
    return hi >>> 0;
  }
  utils$i.sum64_5_hi = sum64_5_hi$1;
  function sum64_5_lo$1(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
    var lo = al + bl + cl + dl + el;
    return lo >>> 0;
  }
  utils$i.sum64_5_lo = sum64_5_lo$1;
  function rotr64_hi$1(ah, al, num) {
    var r = al << 32 - num | ah >>> num;
    return r >>> 0;
  }
  utils$i.rotr64_hi = rotr64_hi$1;
  function rotr64_lo$1(ah, al, num) {
    var r = ah << 32 - num | al >>> num;
    return r >>> 0;
  }
  utils$i.rotr64_lo = rotr64_lo$1;
  function shr64_hi$1(ah, al, num) {
    return ah >>> num;
  }
  utils$i.shr64_hi = shr64_hi$1;
  function shr64_lo$1(ah, al, num) {
    var r = ah << 32 - num | al >>> num;
    return r >>> 0;
  }
  utils$i.shr64_lo = shr64_lo$1;
  var common$5 = {};
  var utils$h = utils$i;
  var assert$d = minimalisticAssert;
  function BlockHash$4() {
    this.pending = null;
    this.pendingTotal = 0;
    this.blockSize = this.constructor.blockSize;
    this.outSize = this.constructor.outSize;
    this.hmacStrength = this.constructor.hmacStrength;
    this.padLength = this.constructor.padLength / 8;
    this.endian = 'big';
    this._delta8 = this.blockSize / 8;
    this._delta32 = this.blockSize / 32;
  }
  common$5.BlockHash = BlockHash$4;
  BlockHash$4.prototype.update = function update(msg, enc) {
    msg = utils$h.toArray(msg, enc);
    if (!this.pending) this.pending = msg;else this.pending = this.pending.concat(msg);
    this.pendingTotal += msg.length;
    if (this.pending.length >= this._delta8) {
      msg = this.pending;
      var r = msg.length % this._delta8;
      this.pending = msg.slice(msg.length - r, msg.length);
      if (this.pending.length === 0) this.pending = null;
      msg = utils$h.join32(msg, 0, msg.length - r, this.endian);
      for (var i = 0; i < msg.length; i += this._delta32) this._update(msg, i, i + this._delta32);
    }
    return this;
  };
  BlockHash$4.prototype.digest = function digest(enc) {
    this.update(this._pad());
    assert$d(this.pending === null);
    return this._digest(enc);
  };
  BlockHash$4.prototype._pad = function pad() {
    var len = this.pendingTotal;
    var bytes = this._delta8;
    var k = bytes - (len + this.padLength) % bytes;
    var res = new Array(k + this.padLength);
    res[0] = 0x80;
    for (var i = 1; i < k; i++) res[i] = 0;
    len <<= 3;
    if (this.endian === 'big') {
      for (var t = 8; t < this.padLength; t++) res[i++] = 0;
      res[i++] = 0;
      res[i++] = 0;
      res[i++] = 0;
      res[i++] = 0;
      res[i++] = len >>> 24 & 0xff;
      res[i++] = len >>> 16 & 0xff;
      res[i++] = len >>> 8 & 0xff;
      res[i++] = len & 0xff;
    } else {
      res[i++] = len & 0xff;
      res[i++] = len >>> 8 & 0xff;
      res[i++] = len >>> 16 & 0xff;
      res[i++] = len >>> 24 & 0xff;
      res[i++] = 0;
      res[i++] = 0;
      res[i++] = 0;
      res[i++] = 0;
      for (t = 8; t < this.padLength; t++) res[i++] = 0;
    }
    return res;
  };
  var sha = {};
  var common$4 = {};
  var utils$g = utils$i;
  var rotr32 = utils$g.rotr32;
  function ft_1$1(s, x, y, z) {
    if (s === 0) return ch32$1(x, y, z);
    if (s === 1 || s === 3) return p32(x, y, z);
    if (s === 2) return maj32$1(x, y, z);
  }
  common$4.ft_1 = ft_1$1;
  function ch32$1(x, y, z) {
    return x & y ^ ~x & z;
  }
  common$4.ch32 = ch32$1;
  function maj32$1(x, y, z) {
    return x & y ^ x & z ^ y & z;
  }
  common$4.maj32 = maj32$1;
  function p32(x, y, z) {
    return x ^ y ^ z;
  }
  common$4.p32 = p32;
  function s0_256$1(x) {
    return rotr32(x, 2) ^ rotr32(x, 13) ^ rotr32(x, 22);
  }
  common$4.s0_256 = s0_256$1;
  function s1_256$1(x) {
    return rotr32(x, 6) ^ rotr32(x, 11) ^ rotr32(x, 25);
  }
  common$4.s1_256 = s1_256$1;
  function g0_256$1(x) {
    return rotr32(x, 7) ^ rotr32(x, 18) ^ x >>> 3;
  }
  common$4.g0_256 = g0_256$1;
  function g1_256$1(x) {
    return rotr32(x, 17) ^ rotr32(x, 19) ^ x >>> 10;
  }
  common$4.g1_256 = g1_256$1;
  var utils$f = utils$i;
  var common$3 = common$5;
  var shaCommon$1 = common$4;
  var rotl32$1 = utils$f.rotl32;
  var sum32$2 = utils$f.sum32;
  var sum32_5$1 = utils$f.sum32_5;
  var ft_1 = shaCommon$1.ft_1;
  var BlockHash$3 = common$3.BlockHash;
  var sha1_K = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6];
  function SHA1() {
    if (!(this instanceof SHA1)) return new SHA1();
    BlockHash$3.call(this);
    this.h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    this.W = new Array(80);
  }
  utils$f.inherits(SHA1, BlockHash$3);
  var _1 = SHA1;
  SHA1.blockSize = 512;
  SHA1.outSize = 160;
  SHA1.hmacStrength = 80;
  SHA1.padLength = 64;
  SHA1.prototype._update = function _update(msg, start) {
    var W = this.W;
    for (var i = 0; i < 16; i++) W[i] = msg[start + i];
    for (; i < W.length; i++) W[i] = rotl32$1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
    var a = this.h[0];
    var b = this.h[1];
    var c = this.h[2];
    var d = this.h[3];
    var e = this.h[4];
    for (i = 0; i < W.length; i++) {
      var s = ~~(i / 20);
      var t = sum32_5$1(rotl32$1(a, 5), ft_1(s, b, c, d), e, W[i], sha1_K[s]);
      e = d;
      d = c;
      c = rotl32$1(b, 30);
      b = a;
      a = t;
    }
    this.h[0] = sum32$2(this.h[0], a);
    this.h[1] = sum32$2(this.h[1], b);
    this.h[2] = sum32$2(this.h[2], c);
    this.h[3] = sum32$2(this.h[3], d);
    this.h[4] = sum32$2(this.h[4], e);
  };
  SHA1.prototype._digest = function digest(enc) {
    if (enc === 'hex') return utils$f.toHex32(this.h, 'big');else return utils$f.split32(this.h, 'big');
  };
  var utils$e = utils$i;
  var common$2 = common$5;
  var shaCommon = common$4;
  var assert$c = minimalisticAssert;
  var sum32$1 = utils$e.sum32;
  var sum32_4$1 = utils$e.sum32_4;
  var sum32_5 = utils$e.sum32_5;
  var ch32 = shaCommon.ch32;
  var maj32 = shaCommon.maj32;
  var s0_256 = shaCommon.s0_256;
  var s1_256 = shaCommon.s1_256;
  var g0_256 = shaCommon.g0_256;
  var g1_256 = shaCommon.g1_256;
  var BlockHash$2 = common$2.BlockHash;
  var sha256_K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function SHA256$1() {
    if (!(this instanceof SHA256$1)) return new SHA256$1();
    BlockHash$2.call(this);
    this.h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    this.k = sha256_K;
    this.W = new Array(64);
  }
  utils$e.inherits(SHA256$1, BlockHash$2);
  var _256 = SHA256$1;
  SHA256$1.blockSize = 512;
  SHA256$1.outSize = 256;
  SHA256$1.hmacStrength = 192;
  SHA256$1.padLength = 64;
  SHA256$1.prototype._update = function _update(msg, start) {
    var W = this.W;
    for (var i = 0; i < 16; i++) W[i] = msg[start + i];
    for (; i < W.length; i++) W[i] = sum32_4$1(g1_256(W[i - 2]), W[i - 7], g0_256(W[i - 15]), W[i - 16]);
    var a = this.h[0];
    var b = this.h[1];
    var c = this.h[2];
    var d = this.h[3];
    var e = this.h[4];
    var f = this.h[5];
    var g = this.h[6];
    var h = this.h[7];
    assert$c(this.k.length === W.length);
    for (i = 0; i < W.length; i++) {
      var T1 = sum32_5(h, s1_256(e), ch32(e, f, g), this.k[i], W[i]);
      var T2 = sum32$1(s0_256(a), maj32(a, b, c));
      h = g;
      g = f;
      f = e;
      e = sum32$1(d, T1);
      d = c;
      c = b;
      b = a;
      a = sum32$1(T1, T2);
    }
    this.h[0] = sum32$1(this.h[0], a);
    this.h[1] = sum32$1(this.h[1], b);
    this.h[2] = sum32$1(this.h[2], c);
    this.h[3] = sum32$1(this.h[3], d);
    this.h[4] = sum32$1(this.h[4], e);
    this.h[5] = sum32$1(this.h[5], f);
    this.h[6] = sum32$1(this.h[6], g);
    this.h[7] = sum32$1(this.h[7], h);
  };
  SHA256$1.prototype._digest = function digest(enc) {
    if (enc === 'hex') return utils$e.toHex32(this.h, 'big');else return utils$e.split32(this.h, 'big');
  };
  var utils$d = utils$i;
  var SHA256 = _256;
  function SHA224() {
    if (!(this instanceof SHA224)) return new SHA224();
    SHA256.call(this);
    this.h = [0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4];
  }
  utils$d.inherits(SHA224, SHA256);
  var _224 = SHA224;
  SHA224.blockSize = 512;
  SHA224.outSize = 224;
  SHA224.hmacStrength = 192;
  SHA224.padLength = 64;
  SHA224.prototype._digest = function digest(enc) {
    if (enc === 'hex') return utils$d.toHex32(this.h.slice(0, 7), 'big');else return utils$d.split32(this.h.slice(0, 7), 'big');
  };
  var utils$c = utils$i;
  var common$1 = common$5;
  var assert$b = minimalisticAssert;
  var rotr64_hi = utils$c.rotr64_hi;
  var rotr64_lo = utils$c.rotr64_lo;
  var shr64_hi = utils$c.shr64_hi;
  var shr64_lo = utils$c.shr64_lo;
  var sum64 = utils$c.sum64;
  var sum64_hi = utils$c.sum64_hi;
  var sum64_lo = utils$c.sum64_lo;
  var sum64_4_hi = utils$c.sum64_4_hi;
  var sum64_4_lo = utils$c.sum64_4_lo;
  var sum64_5_hi = utils$c.sum64_5_hi;
  var sum64_5_lo = utils$c.sum64_5_lo;
  var BlockHash$1 = common$1.BlockHash;
  var sha512_K = [0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc, 0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118, 0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2, 0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694, 0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65, 0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5, 0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4, 0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70, 0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df, 0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b, 0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30, 0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8, 0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8, 0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3, 0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec, 0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b, 0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178, 0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b, 0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c, 0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817];
  function SHA512$1() {
    if (!(this instanceof SHA512$1)) return new SHA512$1();
    BlockHash$1.call(this);
    this.h = [0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1, 0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179];
    this.k = sha512_K;
    this.W = new Array(160);
  }
  utils$c.inherits(SHA512$1, BlockHash$1);
  var _512 = SHA512$1;
  SHA512$1.blockSize = 1024;
  SHA512$1.outSize = 512;
  SHA512$1.hmacStrength = 192;
  SHA512$1.padLength = 128;
  SHA512$1.prototype._prepareBlock = function _prepareBlock(msg, start) {
    var W = this.W;
    for (var i = 0; i < 32; i++) W[i] = msg[start + i];
    for (; i < W.length; i += 2) {
      var c0_hi = g1_512_hi(W[i - 4], W[i - 3]);
      var c0_lo = g1_512_lo(W[i - 4], W[i - 3]);
      var c1_hi = W[i - 14];
      var c1_lo = W[i - 13];
      var c2_hi = g0_512_hi(W[i - 30], W[i - 29]);
      var c2_lo = g0_512_lo(W[i - 30], W[i - 29]);
      var c3_hi = W[i - 32];
      var c3_lo = W[i - 31];
      W[i] = sum64_4_hi(c0_hi, c0_lo, c1_hi, c1_lo, c2_hi, c2_lo, c3_hi, c3_lo);
      W[i + 1] = sum64_4_lo(c0_hi, c0_lo, c1_hi, c1_lo, c2_hi, c2_lo, c3_hi, c3_lo);
    }
  };
  SHA512$1.prototype._update = function _update(msg, start) {
    this._prepareBlock(msg, start);
    var W = this.W;
    var ah = this.h[0];
    var al = this.h[1];
    var bh = this.h[2];
    var bl = this.h[3];
    var ch = this.h[4];
    var cl = this.h[5];
    var dh = this.h[6];
    var dl = this.h[7];
    var eh = this.h[8];
    var el = this.h[9];
    var fh = this.h[10];
    var fl = this.h[11];
    var gh = this.h[12];
    var gl = this.h[13];
    var hh = this.h[14];
    var hl = this.h[15];
    assert$b(this.k.length === W.length);
    for (var i = 0; i < W.length; i += 2) {
      var c0_hi = hh;
      var c0_lo = hl;
      var c1_hi = s1_512_hi(eh, el);
      var c1_lo = s1_512_lo(eh, el);
      var c2_hi = ch64_hi(eh, el, fh, fl, gh);
      var c2_lo = ch64_lo(eh, el, fh, fl, gh, gl);
      var c3_hi = this.k[i];
      var c3_lo = this.k[i + 1];
      var c4_hi = W[i];
      var c4_lo = W[i + 1];
      var T1_hi = sum64_5_hi(c0_hi, c0_lo, c1_hi, c1_lo, c2_hi, c2_lo, c3_hi, c3_lo, c4_hi, c4_lo);
      var T1_lo = sum64_5_lo(c0_hi, c0_lo, c1_hi, c1_lo, c2_hi, c2_lo, c3_hi, c3_lo, c4_hi, c4_lo);
      c0_hi = s0_512_hi(ah, al);
      c0_lo = s0_512_lo(ah, al);
      c1_hi = maj64_hi(ah, al, bh, bl, ch);
      c1_lo = maj64_lo(ah, al, bh, bl, ch, cl);
      var T2_hi = sum64_hi(c0_hi, c0_lo, c1_hi, c1_lo);
      var T2_lo = sum64_lo(c0_hi, c0_lo, c1_hi, c1_lo);
      hh = gh;
      hl = gl;
      gh = fh;
      gl = fl;
      fh = eh;
      fl = el;
      eh = sum64_hi(dh, dl, T1_hi, T1_lo);
      el = sum64_lo(dl, dl, T1_hi, T1_lo);
      dh = ch;
      dl = cl;
      ch = bh;
      cl = bl;
      bh = ah;
      bl = al;
      ah = sum64_hi(T1_hi, T1_lo, T2_hi, T2_lo);
      al = sum64_lo(T1_hi, T1_lo, T2_hi, T2_lo);
    }
    sum64(this.h, 0, ah, al);
    sum64(this.h, 2, bh, bl);
    sum64(this.h, 4, ch, cl);
    sum64(this.h, 6, dh, dl);
    sum64(this.h, 8, eh, el);
    sum64(this.h, 10, fh, fl);
    sum64(this.h, 12, gh, gl);
    sum64(this.h, 14, hh, hl);
  };
  SHA512$1.prototype._digest = function digest(enc) {
    if (enc === 'hex') return utils$c.toHex32(this.h, 'big');else return utils$c.split32(this.h, 'big');
  };
  function ch64_hi(xh, xl, yh, yl, zh) {
    var r = xh & yh ^ ~xh & zh;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function ch64_lo(xh, xl, yh, yl, zh, zl) {
    var r = xl & yl ^ ~xl & zl;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function maj64_hi(xh, xl, yh, yl, zh) {
    var r = xh & yh ^ xh & zh ^ yh & zh;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function maj64_lo(xh, xl, yh, yl, zh, zl) {
    var r = xl & yl ^ xl & zl ^ yl & zl;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function s0_512_hi(xh, xl) {
    var c0_hi = rotr64_hi(xh, xl, 28);
    var c1_hi = rotr64_hi(xl, xh, 2);
    var c2_hi = rotr64_hi(xl, xh, 7);
    var r = c0_hi ^ c1_hi ^ c2_hi;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function s0_512_lo(xh, xl) {
    var c0_lo = rotr64_lo(xh, xl, 28);
    var c1_lo = rotr64_lo(xl, xh, 2);
    var c2_lo = rotr64_lo(xl, xh, 7);
    var r = c0_lo ^ c1_lo ^ c2_lo;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function s1_512_hi(xh, xl) {
    var c0_hi = rotr64_hi(xh, xl, 14);
    var c1_hi = rotr64_hi(xh, xl, 18);
    var c2_hi = rotr64_hi(xl, xh, 9);
    var r = c0_hi ^ c1_hi ^ c2_hi;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function s1_512_lo(xh, xl) {
    var c0_lo = rotr64_lo(xh, xl, 14);
    var c1_lo = rotr64_lo(xh, xl, 18);
    var c2_lo = rotr64_lo(xl, xh, 9);
    var r = c0_lo ^ c1_lo ^ c2_lo;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function g0_512_hi(xh, xl) {
    var c0_hi = rotr64_hi(xh, xl, 1);
    var c1_hi = rotr64_hi(xh, xl, 8);
    var c2_hi = shr64_hi(xh, xl, 7);
    var r = c0_hi ^ c1_hi ^ c2_hi;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function g0_512_lo(xh, xl) {
    var c0_lo = rotr64_lo(xh, xl, 1);
    var c1_lo = rotr64_lo(xh, xl, 8);
    var c2_lo = shr64_lo(xh, xl, 7);
    var r = c0_lo ^ c1_lo ^ c2_lo;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function g1_512_hi(xh, xl) {
    var c0_hi = rotr64_hi(xh, xl, 19);
    var c1_hi = rotr64_hi(xl, xh, 29);
    var c2_hi = shr64_hi(xh, xl, 6);
    var r = c0_hi ^ c1_hi ^ c2_hi;
    if (r < 0) r += 0x100000000;
    return r;
  }
  function g1_512_lo(xh, xl) {
    var c0_lo = rotr64_lo(xh, xl, 19);
    var c1_lo = rotr64_lo(xl, xh, 29);
    var c2_lo = shr64_lo(xh, xl, 6);
    var r = c0_lo ^ c1_lo ^ c2_lo;
    if (r < 0) r += 0x100000000;
    return r;
  }
  var utils$b = utils$i;
  var SHA512 = _512;
  function SHA384() {
    if (!(this instanceof SHA384)) return new SHA384();
    SHA512.call(this);
    this.h = [0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939, 0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4];
  }
  utils$b.inherits(SHA384, SHA512);
  var _384 = SHA384;
  SHA384.blockSize = 1024;
  SHA384.outSize = 384;
  SHA384.hmacStrength = 192;
  SHA384.padLength = 128;
  SHA384.prototype._digest = function digest(enc) {
    if (enc === 'hex') return utils$b.toHex32(this.h.slice(0, 12), 'big');else return utils$b.split32(this.h.slice(0, 12), 'big');
  };
  sha.sha1 = _1;
  sha.sha224 = _224;
  sha.sha256 = _256;
  sha.sha384 = _384;
  sha.sha512 = _512;
  var ripemd = {};
  var utils$a = utils$i;
  var common = common$5;
  var rotl32 = utils$a.rotl32;
  var sum32 = utils$a.sum32;
  var sum32_3 = utils$a.sum32_3;
  var sum32_4 = utils$a.sum32_4;
  var BlockHash = common.BlockHash;
  function RIPEMD160() {
    if (!(this instanceof RIPEMD160)) return new RIPEMD160();
    BlockHash.call(this);
    this.h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    this.endian = 'little';
  }
  utils$a.inherits(RIPEMD160, BlockHash);
  ripemd.ripemd160 = RIPEMD160;
  RIPEMD160.blockSize = 512;
  RIPEMD160.outSize = 160;
  RIPEMD160.hmacStrength = 192;
  RIPEMD160.padLength = 64;
  RIPEMD160.prototype._update = function update(msg, start) {
    var A = this.h[0];
    var B = this.h[1];
    var C = this.h[2];
    var D = this.h[3];
    var E = this.h[4];
    var Ah = A;
    var Bh = B;
    var Ch = C;
    var Dh = D;
    var Eh = E;
    for (var j = 0; j < 80; j++) {
      var T = sum32(rotl32(sum32_4(A, f(j, B, C, D), msg[r[j] + start], K(j)), s[j]), E);
      A = E;
      E = D;
      D = rotl32(C, 10);
      C = B;
      B = T;
      T = sum32(rotl32(sum32_4(Ah, f(79 - j, Bh, Ch, Dh), msg[rh[j] + start], Kh(j)), sh[j]), Eh);
      Ah = Eh;
      Eh = Dh;
      Dh = rotl32(Ch, 10);
      Ch = Bh;
      Bh = T;
    }
    T = sum32_3(this.h[1], C, Dh);
    this.h[1] = sum32_3(this.h[2], D, Eh);
    this.h[2] = sum32_3(this.h[3], E, Ah);
    this.h[3] = sum32_3(this.h[4], A, Bh);
    this.h[4] = sum32_3(this.h[0], B, Ch);
    this.h[0] = T;
  };
  RIPEMD160.prototype._digest = function digest(enc) {
    if (enc === 'hex') return utils$a.toHex32(this.h, 'little');else return utils$a.split32(this.h, 'little');
  };
  function f(j, x, y, z) {
    if (j <= 15) return x ^ y ^ z;else if (j <= 31) return x & y | ~x & z;else if (j <= 47) return (x | ~y) ^ z;else if (j <= 63) return x & z | y & ~z;else return x ^ (y | ~z);
  }
  function K(j) {
    if (j <= 15) return 0x00000000;else if (j <= 31) return 0x5a827999;else if (j <= 47) return 0x6ed9eba1;else if (j <= 63) return 0x8f1bbcdc;else return 0xa953fd4e;
  }
  function Kh(j) {
    if (j <= 15) return 0x50a28be6;else if (j <= 31) return 0x5c4dd124;else if (j <= 47) return 0x6d703ef3;else if (j <= 63) return 0x7a6d76e9;else return 0x00000000;
  }
  var r = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13];
  var rh = [5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11];
  var s = [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6];
  var sh = [8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11];
  var utils$9 = utils$i;
  var assert$a = minimalisticAssert;
  function Hmac(hash, key, enc) {
    if (!(this instanceof Hmac)) return new Hmac(hash, key, enc);
    this.Hash = hash;
    this.blockSize = hash.blockSize / 8;
    this.outSize = hash.outSize / 8;
    this.inner = null;
    this.outer = null;
    this._init(utils$9.toArray(key, enc));
  }
  var hmac = Hmac;
  Hmac.prototype._init = function init(key) {
    if (key.length > this.blockSize) key = new this.Hash().update(key).digest();
    assert$a(key.length <= this.blockSize);
    for (var i = key.length; i < this.blockSize; i++) key.push(0);
    for (i = 0; i < key.length; i++) key[i] ^= 0x36;
    this.inner = new this.Hash().update(key);
    for (i = 0; i < key.length; i++) key[i] ^= 0x6a;
    this.outer = new this.Hash().update(key);
  };
  Hmac.prototype.update = function update(msg, enc) {
    this.inner.update(msg, enc);
    return this;
  };
  Hmac.prototype.digest = function digest(enc) {
    this.outer.update(this.inner.digest());
    return this.outer.digest(enc);
  };
  (function (exports) {
    var hash = exports;
    hash.utils = utils$i;
    hash.common = common$5;
    hash.sha = sha;
    hash.ripemd = ripemd;
    hash.hmac = hmac;
    hash.sha1 = hash.sha.sha1;
    hash.sha256 = hash.sha.sha256;
    hash.sha224 = hash.sha.sha224;
    hash.sha384 = hash.sha.sha384;
    hash.sha512 = hash.sha.sha512;
    hash.ripemd160 = hash.ripemd.ripemd160;
  })(hash$2);
  var secp256k1;
  var hasRequiredSecp256k1;
  function requireSecp256k1() {
    if (hasRequiredSecp256k1) return secp256k1;
    hasRequiredSecp256k1 = 1;
    secp256k1 = {
      doubles: {
        step: 4,
        points: [['e60fce93b59e9ec53011aabc21c23e97b2a31369b87a5ae9c44ee89e2a6dec0a', 'f7e3507399e595929db99f34f57937101296891e44d23f0be1f32cce69616821'], ['8282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508', '11f8a8098557dfe45e8256e830b60ace62d613ac2f7b17bed31b6eaff6e26caf'], ['175e159f728b865a72f99cc6c6fc846de0b93833fd2222ed73fce5b551e5b739', 'd3506e0d9e3c79eba4ef97a51ff71f5eacb5955add24345c6efa6ffee9fed695'], ['363d90d447b00c9c99ceac05b6262ee053441c7e55552ffe526bad8f83ff4640', '4e273adfc732221953b445397f3363145b9a89008199ecb62003c7f3bee9de9'], ['8b4b5f165df3c2be8c6244b5b745638843e4a781a15bcd1b69f79a55dffdf80c', '4aad0a6f68d308b4b3fbd7813ab0da04f9e336546162ee56b3eff0c65fd4fd36'], ['723cbaa6e5db996d6bf771c00bd548c7b700dbffa6c0e77bcb6115925232fcda', '96e867b5595cc498a921137488824d6e2660a0653779494801dc069d9eb39f5f'], ['eebfa4d493bebf98ba5feec812c2d3b50947961237a919839a533eca0e7dd7fa', '5d9a8ca3970ef0f269ee7edaf178089d9ae4cdc3a711f712ddfd4fdae1de8999'], ['100f44da696e71672791d0a09b7bde459f1215a29b3c03bfefd7835b39a48db0', 'cdd9e13192a00b772ec8f3300c090666b7ff4a18ff5195ac0fbd5cd62bc65a09'], ['e1031be262c7ed1b1dc9227a4a04c017a77f8d4464f3b3852c8acde6e534fd2d', '9d7061928940405e6bb6a4176597535af292dd419e1ced79a44f18f29456a00d'], ['feea6cae46d55b530ac2839f143bd7ec5cf8b266a41d6af52d5e688d9094696d', 'e57c6b6c97dce1bab06e4e12bf3ecd5c981c8957cc41442d3155debf18090088'], ['da67a91d91049cdcb367be4be6ffca3cfeed657d808583de33fa978bc1ec6cb1', '9bacaa35481642bc41f463f7ec9780e5dec7adc508f740a17e9ea8e27a68be1d'], ['53904faa0b334cdda6e000935ef22151ec08d0f7bb11069f57545ccc1a37b7c0', '5bc087d0bc80106d88c9eccac20d3c1c13999981e14434699dcb096b022771c8'], ['8e7bcd0bd35983a7719cca7764ca906779b53a043a9b8bcaeff959f43ad86047', '10b7770b2a3da4b3940310420ca9514579e88e2e47fd68b3ea10047e8460372a'], ['385eed34c1cdff21e6d0818689b81bde71a7f4f18397e6690a841e1599c43862', '283bebc3e8ea23f56701de19e9ebf4576b304eec2086dc8cc0458fe5542e5453'], ['6f9d9b803ecf191637c73a4413dfa180fddf84a5947fbc9c606ed86c3fac3a7', '7c80c68e603059ba69b8e2a30e45c4d47ea4dd2f5c281002d86890603a842160'], ['3322d401243c4e2582a2147c104d6ecbf774d163db0f5e5313b7e0e742d0e6bd', '56e70797e9664ef5bfb019bc4ddaf9b72805f63ea2873af624f3a2e96c28b2a0'], ['85672c7d2de0b7da2bd1770d89665868741b3f9af7643397721d74d28134ab83', '7c481b9b5b43b2eb6374049bfa62c2e5e77f17fcc5298f44c8e3094f790313a6'], ['948bf809b1988a46b06c9f1919413b10f9226c60f668832ffd959af60c82a0a', '53a562856dcb6646dc6b74c5d1c3418c6d4dff08c97cd2bed4cb7f88d8c8e589'], ['6260ce7f461801c34f067ce0f02873a8f1b0e44dfc69752accecd819f38fd8e8', 'bc2da82b6fa5b571a7f09049776a1ef7ecd292238051c198c1a84e95b2b4ae17'], ['e5037de0afc1d8d43d8348414bbf4103043ec8f575bfdc432953cc8d2037fa2d', '4571534baa94d3b5f9f98d09fb990bddbd5f5b03ec481f10e0e5dc841d755bda'], ['e06372b0f4a207adf5ea905e8f1771b4e7e8dbd1c6a6c5b725866a0ae4fce725', '7a908974bce18cfe12a27bb2ad5a488cd7484a7787104870b27034f94eee31dd'], ['213c7a715cd5d45358d0bbf9dc0ce02204b10bdde2a3f58540ad6908d0559754', '4b6dad0b5ae462507013ad06245ba190bb4850f5f36a7eeddff2c27534b458f2'], ['4e7c272a7af4b34e8dbb9352a5419a87e2838c70adc62cddf0cc3a3b08fbd53c', '17749c766c9d0b18e16fd09f6def681b530b9614bff7dd33e0b3941817dcaae6'], ['fea74e3dbe778b1b10f238ad61686aa5c76e3db2be43057632427e2840fb27b6', '6e0568db9b0b13297cf674deccb6af93126b596b973f7b77701d3db7f23cb96f'], ['76e64113f677cf0e10a2570d599968d31544e179b760432952c02a4417bdde39', 'c90ddf8dee4e95cf577066d70681f0d35e2a33d2b56d2032b4b1752d1901ac01'], ['c738c56b03b2abe1e8281baa743f8f9a8f7cc643df26cbee3ab150242bcbb891', '893fb578951ad2537f718f2eacbfbbbb82314eef7880cfe917e735d9699a84c3'], ['d895626548b65b81e264c7637c972877d1d72e5f3a925014372e9f6588f6c14b', 'febfaa38f2bc7eae728ec60818c340eb03428d632bb067e179363ed75d7d991f'], ['b8da94032a957518eb0f6433571e8761ceffc73693e84edd49150a564f676e03', '2804dfa44805a1e4d7c99cc9762808b092cc584d95ff3b511488e4e74efdf6e7'], ['e80fea14441fb33a7d8adab9475d7fab2019effb5156a792f1a11778e3c0df5d', 'eed1de7f638e00771e89768ca3ca94472d155e80af322ea9fcb4291b6ac9ec78'], ['a301697bdfcd704313ba48e51d567543f2a182031efd6915ddc07bbcc4e16070', '7370f91cfb67e4f5081809fa25d40f9b1735dbf7c0a11a130c0d1a041e177ea1'], ['90ad85b389d6b936463f9d0512678de208cc330b11307fffab7ac63e3fb04ed4', 'e507a3620a38261affdcbd9427222b839aefabe1582894d991d4d48cb6ef150'], ['8f68b9d2f63b5f339239c1ad981f162ee88c5678723ea3351b7b444c9ec4c0da', '662a9f2dba063986de1d90c2b6be215dbbea2cfe95510bfdf23cbf79501fff82'], ['e4f3fb0176af85d65ff99ff9198c36091f48e86503681e3e6686fd5053231e11', '1e63633ad0ef4f1c1661a6d0ea02b7286cc7e74ec951d1c9822c38576feb73bc'], ['8c00fa9b18ebf331eb961537a45a4266c7034f2f0d4e1d0716fb6eae20eae29e', 'efa47267fea521a1a9dc343a3736c974c2fadafa81e36c54e7d2a4c66702414b'], ['e7a26ce69dd4829f3e10cec0a9e98ed3143d084f308b92c0997fddfc60cb3e41', '2a758e300fa7984b471b006a1aafbb18d0a6b2c0420e83e20e8a9421cf2cfd51'], ['b6459e0ee3662ec8d23540c223bcbdc571cbcb967d79424f3cf29eb3de6b80ef', '67c876d06f3e06de1dadf16e5661db3c4b3ae6d48e35b2ff30bf0b61a71ba45'], ['d68a80c8280bb840793234aa118f06231d6f1fc67e73c5a5deda0f5b496943e8', 'db8ba9fff4b586d00c4b1f9177b0e28b5b0e7b8f7845295a294c84266b133120'], ['324aed7df65c804252dc0270907a30b09612aeb973449cea4095980fc28d3d5d', '648a365774b61f2ff130c0c35aec1f4f19213b0c7e332843967224af96ab7c84'], ['4df9c14919cde61f6d51dfdbe5fee5dceec4143ba8d1ca888e8bd373fd054c96', '35ec51092d8728050974c23a1d85d4b5d506cdc288490192ebac06cad10d5d'], ['9c3919a84a474870faed8a9c1cc66021523489054d7f0308cbfc99c8ac1f98cd', 'ddb84f0f4a4ddd57584f044bf260e641905326f76c64c8e6be7e5e03d4fc599d'], ['6057170b1dd12fdf8de05f281d8e06bb91e1493a8b91d4cc5a21382120a959e5', '9a1af0b26a6a4807add9a2daf71df262465152bc3ee24c65e899be932385a2a8'], ['a576df8e23a08411421439a4518da31880cef0fba7d4df12b1a6973eecb94266', '40a6bf20e76640b2c92b97afe58cd82c432e10a7f514d9f3ee8be11ae1b28ec8'], ['7778a78c28dec3e30a05fe9629de8c38bb30d1f5cf9a3a208f763889be58ad71', '34626d9ab5a5b22ff7098e12f2ff580087b38411ff24ac563b513fc1fd9f43ac'], ['928955ee637a84463729fd30e7afd2ed5f96274e5ad7e5cb09eda9c06d903ac', 'c25621003d3f42a827b78a13093a95eeac3d26efa8a8d83fc5180e935bcd091f'], ['85d0fef3ec6db109399064f3a0e3b2855645b4a907ad354527aae75163d82751', '1f03648413a38c0be29d496e582cf5663e8751e96877331582c237a24eb1f962'], ['ff2b0dce97eece97c1c9b6041798b85dfdfb6d8882da20308f5404824526087e', '493d13fef524ba188af4c4dc54d07936c7b7ed6fb90e2ceb2c951e01f0c29907'], ['827fbbe4b1e880ea9ed2b2e6301b212b57f1ee148cd6dd28780e5e2cf856e241', 'c60f9c923c727b0b71bef2c67d1d12687ff7a63186903166d605b68baec293ec'], ['eaa649f21f51bdbae7be4ae34ce6e5217a58fdce7f47f9aa7f3b58fa2120e2b3', 'be3279ed5bbbb03ac69a80f89879aa5a01a6b965f13f7e59d47a5305ba5ad93d'], ['e4a42d43c5cf169d9391df6decf42ee541b6d8f0c9a137401e23632dda34d24f', '4d9f92e716d1c73526fc99ccfb8ad34ce886eedfa8d8e4f13a7f7131deba9414'], ['1ec80fef360cbdd954160fadab352b6b92b53576a88fea4947173b9d4300bf19', 'aeefe93756b5340d2f3a4958a7abbf5e0146e77f6295a07b671cdc1cc107cefd'], ['146a778c04670c2f91b00af4680dfa8bce3490717d58ba889ddb5928366642be', 'b318e0ec3354028add669827f9d4b2870aaa971d2f7e5ed1d0b297483d83efd0'], ['fa50c0f61d22e5f07e3acebb1aa07b128d0012209a28b9776d76a8793180eef9', '6b84c6922397eba9b72cd2872281a68a5e683293a57a213b38cd8d7d3f4f2811'], ['da1d61d0ca721a11b1a5bf6b7d88e8421a288ab5d5bba5220e53d32b5f067ec2', '8157f55a7c99306c79c0766161c91e2966a73899d279b48a655fba0f1ad836f1'], ['a8e282ff0c9706907215ff98e8fd416615311de0446f1e062a73b0610d064e13', '7f97355b8db81c09abfb7f3c5b2515888b679a3e50dd6bd6cef7c73111f4cc0c'], ['174a53b9c9a285872d39e56e6913cab15d59b1fa512508c022f382de8319497c', 'ccc9dc37abfc9c1657b4155f2c47f9e6646b3a1d8cb9854383da13ac079afa73'], ['959396981943785c3d3e57edf5018cdbe039e730e4918b3d884fdff09475b7ba', '2e7e552888c331dd8ba0386a4b9cd6849c653f64c8709385e9b8abf87524f2fd'], ['d2a63a50ae401e56d645a1153b109a8fcca0a43d561fba2dbb51340c9d82b151', 'e82d86fb6443fcb7565aee58b2948220a70f750af484ca52d4142174dcf89405'], ['64587e2335471eb890ee7896d7cfdc866bacbdbd3839317b3436f9b45617e073', 'd99fcdd5bf6902e2ae96dd6447c299a185b90a39133aeab358299e5e9faf6589'], ['8481bde0e4e4d885b3a546d3e549de042f0aa6cea250e7fd358d6c86dd45e458', '38ee7b8cba5404dd84a25bf39cecb2ca900a79c42b262e556d64b1b59779057e'], ['13464a57a78102aa62b6979ae817f4637ffcfed3c4b1ce30bcd6303f6caf666b', '69be159004614580ef7e433453ccb0ca48f300a81d0942e13f495a907f6ecc27'], ['bc4a9df5b713fe2e9aef430bcc1dc97a0cd9ccede2f28588cada3a0d2d83f366', 'd3a81ca6e785c06383937adf4b798caa6e8a9fbfa547b16d758d666581f33c1'], ['8c28a97bf8298bc0d23d8c749452a32e694b65e30a9472a3954ab30fe5324caa', '40a30463a3305193378fedf31f7cc0eb7ae784f0451cb9459e71dc73cbef9482'], ['8ea9666139527a8c1dd94ce4f071fd23c8b350c5a4bb33748c4ba111faccae0', '620efabbc8ee2782e24e7c0cfb95c5d735b783be9cf0f8e955af34a30e62b945'], ['dd3625faef5ba06074669716bbd3788d89bdde815959968092f76cc4eb9a9787', '7a188fa3520e30d461da2501045731ca941461982883395937f68d00c644a573'], ['f710d79d9eb962297e4f6232b40e8f7feb2bc63814614d692c12de752408221e', 'ea98e67232d3b3295d3b535532115ccac8612c721851617526ae47a9c77bfc82']]
      },
      naf: {
        wnd: 7,
        points: [['f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9', '388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e672'], ['2f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4', 'd8ac222636e5e3d6d4dba9dda6c9c426f788271bab0d6840dca87d3aa6ac62d6'], ['5cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bddedcac4f9bc', '6aebca40ba255960a3178d6d861a54dba813d0b813fde7b5a5082628087264da'], ['acd484e2f0c7f65309ad178a9f559abde09796974c57e714c35f110dfc27ccbe', 'cc338921b0a7d9fd64380971763b61e9add888a4375f8e0f05cc262ac64f9c37'], ['774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb', 'd984a032eb6b5e190243dd56d7b7b365372db1e2dff9d6a8301d74c9c953c61b'], ['f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8', 'ab0902e8d880a89758212eb65cdaf473a1a06da521fa91f29b5cb52db03ed81'], ['d7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e', '581e2872a86c72a683842ec228cc6defea40af2bd896d3a5c504dc9ff6a26b58'], ['defdea4cdb677750a420fee807eacf21eb9898ae79b9768766e4faa04a2d4a34', '4211ab0694635168e997b0ead2a93daeced1f4a04a95c0f6cfb199f69e56eb77'], ['2b4ea0a797a443d293ef5cff444f4979f06acfebd7e86d277475656138385b6c', '85e89bc037945d93b343083b5a1c86131a01f60c50269763b570c854e5c09b7a'], ['352bbf4a4cdd12564f93fa332ce333301d9ad40271f8107181340aef25be59d5', '321eb4075348f534d59c18259dda3e1f4a1b3b2e71b1039c67bd3d8bcf81998c'], ['2fa2104d6b38d11b0230010559879124e42ab8dfeff5ff29dc9cdadd4ecacc3f', '2de1068295dd865b64569335bd5dd80181d70ecfc882648423ba76b532b7d67'], ['9248279b09b4d68dab21a9b066edda83263c3d84e09572e269ca0cd7f5453714', '73016f7bf234aade5d1aa71bdea2b1ff3fc0de2a887912ffe54a32ce97cb3402'], ['daed4f2be3a8bf278e70132fb0beb7522f570e144bf615c07e996d443dee8729', 'a69dce4a7d6c98e8d4a1aca87ef8d7003f83c230f3afa726ab40e52290be1c55'], ['c44d12c7065d812e8acf28d7cbb19f9011ecd9e9fdf281b0e6a3b5e87d22e7db', '2119a460ce326cdc76c45926c982fdac0e106e861edf61c5a039063f0e0e6482'], ['6a245bf6dc698504c89a20cfded60853152b695336c28063b61c65cbd269e6b4', 'e022cf42c2bd4a708b3f5126f16a24ad8b33ba48d0423b6efd5e6348100d8a82'], ['1697ffa6fd9de627c077e3d2fe541084ce13300b0bec1146f95ae57f0d0bd6a5', 'b9c398f186806f5d27561506e4557433a2cf15009e498ae7adee9d63d01b2396'], ['605bdb019981718b986d0f07e834cb0d9deb8360ffb7f61df982345ef27a7479', '2972d2de4f8d20681a78d93ec96fe23c26bfae84fb14db43b01e1e9056b8c49'], ['62d14dab4150bf497402fdc45a215e10dcb01c354959b10cfe31c7e9d87ff33d', '80fc06bd8cc5b01098088a1950eed0db01aa132967ab472235f5642483b25eaf'], ['80c60ad0040f27dade5b4b06c408e56b2c50e9f56b9b8b425e555c2f86308b6f', '1c38303f1cc5c30f26e66bad7fe72f70a65eed4cbe7024eb1aa01f56430bd57a'], ['7a9375ad6167ad54aa74c6348cc54d344cc5dc9487d847049d5eabb0fa03c8fb', 'd0e3fa9eca8726909559e0d79269046bdc59ea10c70ce2b02d499ec224dc7f7'], ['d528ecd9b696b54c907a9ed045447a79bb408ec39b68df504bb51f459bc3ffc9', 'eecf41253136e5f99966f21881fd656ebc4345405c520dbc063465b521409933'], ['49370a4b5f43412ea25f514e8ecdad05266115e4a7ecb1387231808f8b45963', '758f3f41afd6ed428b3081b0512fd62a54c3f3afbb5b6764b653052a12949c9a'], ['77f230936ee88cbbd73df930d64702ef881d811e0e1498e2f1c13eb1fc345d74', '958ef42a7886b6400a08266e9ba1b37896c95330d97077cbbe8eb3c7671c60d6'], ['f2dac991cc4ce4b9ea44887e5c7c0bce58c80074ab9d4dbaeb28531b7739f530', 'e0dedc9b3b2f8dad4da1f32dec2531df9eb5fbeb0598e4fd1a117dba703a3c37'], ['463b3d9f662621fb1b4be8fbbe2520125a216cdfc9dae3debcba4850c690d45b', '5ed430d78c296c3543114306dd8622d7c622e27c970a1de31cb377b01af7307e'], ['f16f804244e46e2a09232d4aff3b59976b98fac14328a2d1a32496b49998f247', 'cedabd9b82203f7e13d206fcdf4e33d92a6c53c26e5cce26d6579962c4e31df6'], ['caf754272dc84563b0352b7a14311af55d245315ace27c65369e15f7151d41d1', 'cb474660ef35f5f2a41b643fa5e460575f4fa9b7962232a5c32f908318a04476'], ['2600ca4b282cb986f85d0f1709979d8b44a09c07cb86d7c124497bc86f082120', '4119b88753c15bd6a693b03fcddbb45d5ac6be74ab5f0ef44b0be9475a7e4b40'], ['7635ca72d7e8432c338ec53cd12220bc01c48685e24f7dc8c602a7746998e435', '91b649609489d613d1d5e590f78e6d74ecfc061d57048bad9e76f302c5b9c61'], ['754e3239f325570cdbbf4a87deee8a66b7f2b33479d468fbc1a50743bf56cc18', '673fb86e5bda30fb3cd0ed304ea49a023ee33d0197a695d0c5d98093c536683'], ['e3e6bd1071a1e96aff57859c82d570f0330800661d1c952f9fe2694691d9b9e8', '59c9e0bba394e76f40c0aa58379a3cb6a5a2283993e90c4167002af4920e37f5'], ['186b483d056a033826ae73d88f732985c4ccb1f32ba35f4b4cc47fdcf04aa6eb', '3b952d32c67cf77e2e17446e204180ab21fb8090895138b4a4a797f86e80888b'], ['df9d70a6b9876ce544c98561f4be4f725442e6d2b737d9c91a8321724ce0963f', '55eb2dafd84d6ccd5f862b785dc39d4ab157222720ef9da217b8c45cf2ba2417'], ['5edd5cc23c51e87a497ca815d5dce0f8ab52554f849ed8995de64c5f34ce7143', 'efae9c8dbc14130661e8cec030c89ad0c13c66c0d17a2905cdc706ab7399a868'], ['290798c2b6476830da12fe02287e9e777aa3fba1c355b17a722d362f84614fba', 'e38da76dcd440621988d00bcf79af25d5b29c094db2a23146d003afd41943e7a'], ['af3c423a95d9f5b3054754efa150ac39cd29552fe360257362dfdecef4053b45', 'f98a3fd831eb2b749a93b0e6f35cfb40c8cd5aa667a15581bc2feded498fd9c6'], ['766dbb24d134e745cccaa28c99bf274906bb66b26dcf98df8d2fed50d884249a', '744b1152eacbe5e38dcc887980da38b897584a65fa06cedd2c924f97cbac5996'], ['59dbf46f8c94759ba21277c33784f41645f7b44f6c596a58ce92e666191abe3e', 'c534ad44175fbc300f4ea6ce648309a042ce739a7919798cd85e216c4a307f6e'], ['f13ada95103c4537305e691e74e9a4a8dd647e711a95e73cb62dc6018cfd87b8', 'e13817b44ee14de663bf4bc808341f326949e21a6a75c2570778419bdaf5733d'], ['7754b4fa0e8aced06d4167a2c59cca4cda1869c06ebadfb6488550015a88522c', '30e93e864e669d82224b967c3020b8fa8d1e4e350b6cbcc537a48b57841163a2'], ['948dcadf5990e048aa3874d46abef9d701858f95de8041d2a6828c99e2262519', 'e491a42537f6e597d5d28a3224b1bc25df9154efbd2ef1d2cbba2cae5347d57e'], ['7962414450c76c1689c7b48f8202ec37fb224cf5ac0bfa1570328a8a3d7c77ab', '100b610ec4ffb4760d5c1fc133ef6f6b12507a051f04ac5760afa5b29db83437'], ['3514087834964b54b15b160644d915485a16977225b8847bb0dd085137ec47ca', 'ef0afbb2056205448e1652c48e8127fc6039e77c15c2378b7e7d15a0de293311'], ['d3cc30ad6b483e4bc79ce2c9dd8bc54993e947eb8df787b442943d3f7b527eaf', '8b378a22d827278d89c5e9be8f9508ae3c2ad46290358630afb34db04eede0a4'], ['1624d84780732860ce1c78fcbfefe08b2b29823db913f6493975ba0ff4847610', '68651cf9b6da903e0914448c6cd9d4ca896878f5282be4c8cc06e2a404078575'], ['733ce80da955a8a26902c95633e62a985192474b5af207da6df7b4fd5fc61cd4', 'f5435a2bd2badf7d485a4d8b8db9fcce3e1ef8e0201e4578c54673bc1dc5ea1d'], ['15d9441254945064cf1a1c33bbd3b49f8966c5092171e699ef258dfab81c045c', 'd56eb30b69463e7234f5137b73b84177434800bacebfc685fc37bbe9efe4070d'], ['a1d0fcf2ec9de675b612136e5ce70d271c21417c9d2b8aaaac138599d0717940', 'edd77f50bcb5a3cab2e90737309667f2641462a54070f3d519212d39c197a629'], ['e22fbe15c0af8ccc5780c0735f84dbe9a790badee8245c06c7ca37331cb36980', 'a855babad5cd60c88b430a69f53a1a7a38289154964799be43d06d77d31da06'], ['311091dd9860e8e20ee13473c1155f5f69635e394704eaa74009452246cfa9b3', '66db656f87d1f04fffd1f04788c06830871ec5a64feee685bd80f0b1286d8374'], ['34c1fd04d301be89b31c0442d3e6ac24883928b45a9340781867d4232ec2dbdf', '9414685e97b1b5954bd46f730174136d57f1ceeb487443dc5321857ba73abee'], ['f219ea5d6b54701c1c14de5b557eb42a8d13f3abbcd08affcc2a5e6b049b8d63', '4cb95957e83d40b0f73af4544cccf6b1f4b08d3c07b27fb8d8c2962a400766d1'], ['d7b8740f74a8fbaab1f683db8f45de26543a5490bca627087236912469a0b448', 'fa77968128d9c92ee1010f337ad4717eff15db5ed3c049b3411e0315eaa4593b'], ['32d31c222f8f6f0ef86f7c98d3a3335ead5bcd32abdd94289fe4d3091aa824bf', '5f3032f5892156e39ccd3d7915b9e1da2e6dac9e6f26e961118d14b8462e1661'], ['7461f371914ab32671045a155d9831ea8793d77cd59592c4340f86cbc18347b5', '8ec0ba238b96bec0cbdddcae0aa442542eee1ff50c986ea6b39847b3cc092ff6'], ['ee079adb1df1860074356a25aa38206a6d716b2c3e67453d287698bad7b2b2d6', '8dc2412aafe3be5c4c5f37e0ecc5f9f6a446989af04c4e25ebaac479ec1c8c1e'], ['16ec93e447ec83f0467b18302ee620f7e65de331874c9dc72bfd8616ba9da6b5', '5e4631150e62fb40d0e8c2a7ca5804a39d58186a50e497139626778e25b0674d'], ['eaa5f980c245f6f038978290afa70b6bd8855897f98b6aa485b96065d537bd99', 'f65f5d3e292c2e0819a528391c994624d784869d7e6ea67fb18041024edc07dc'], ['78c9407544ac132692ee1910a02439958ae04877151342ea96c4b6b35a49f51', 'f3e0319169eb9b85d5404795539a5e68fa1fbd583c064d2462b675f194a3ddb4'], ['494f4be219a1a77016dcd838431aea0001cdc8ae7a6fc688726578d9702857a5', '42242a969283a5f339ba7f075e36ba2af925ce30d767ed6e55f4b031880d562c'], ['a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5', '204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b'], ['c41916365abb2b5d09192f5f2dbeafec208f020f12570a184dbadc3e58595997', '4f14351d0087efa49d245b328984989d5caf9450f34bfc0ed16e96b58fa9913'], ['841d6063a586fa475a724604da03bc5b92a2e0d2e0a36acfe4c73a5514742881', '73867f59c0659e81904f9a1c7543698e62562d6744c169ce7a36de01a8d6154'], ['5e95bb399a6971d376026947f89bde2f282b33810928be4ded112ac4d70e20d5', '39f23f366809085beebfc71181313775a99c9aed7d8ba38b161384c746012865'], ['36e4641a53948fd476c39f8a99fd974e5ec07564b5315d8bf99471bca0ef2f66', 'd2424b1b1abe4eb8164227b085c9aa9456ea13493fd563e06fd51cf5694c78fc'], ['336581ea7bfbbb290c191a2f507a41cf5643842170e914faeab27c2c579f726', 'ead12168595fe1be99252129b6e56b3391f7ab1410cd1e0ef3dcdcabd2fda224'], ['8ab89816dadfd6b6a1f2634fcf00ec8403781025ed6890c4849742706bd43ede', '6fdcef09f2f6d0a044e654aef624136f503d459c3e89845858a47a9129cdd24e'], ['1e33f1a746c9c5778133344d9299fcaa20b0938e8acff2544bb40284b8c5fb94', '60660257dd11b3aa9c8ed618d24edff2306d320f1d03010e33a7d2057f3b3b6'], ['85b7c1dcb3cec1b7ee7f30ded79dd20a0ed1f4cc18cbcfcfa410361fd8f08f31', '3d98a9cdd026dd43f39048f25a8847f4fcafad1895d7a633c6fed3c35e999511'], ['29df9fbd8d9e46509275f4b125d6d45d7fbe9a3b878a7af872a2800661ac5f51', 'b4c4fe99c775a606e2d8862179139ffda61dc861c019e55cd2876eb2a27d84b'], ['a0b1cae06b0a847a3fea6e671aaf8adfdfe58ca2f768105c8082b2e449fce252', 'ae434102edde0958ec4b19d917a6a28e6b72da1834aff0e650f049503a296cf2'], ['4e8ceafb9b3e9a136dc7ff67e840295b499dfb3b2133e4ba113f2e4c0e121e5', 'cf2174118c8b6d7a4b48f6d534ce5c79422c086a63460502b827ce62a326683c'], ['d24a44e047e19b6f5afb81c7ca2f69080a5076689a010919f42725c2b789a33b', '6fb8d5591b466f8fc63db50f1c0f1c69013f996887b8244d2cdec417afea8fa3'], ['ea01606a7a6c9cdd249fdfcfacb99584001edd28abbab77b5104e98e8e3b35d4', '322af4908c7312b0cfbfe369f7a7b3cdb7d4494bc2823700cfd652188a3ea98d'], ['af8addbf2b661c8a6c6328655eb96651252007d8c5ea31be4ad196de8ce2131f', '6749e67c029b85f52a034eafd096836b2520818680e26ac8f3dfbcdb71749700'], ['e3ae1974566ca06cc516d47e0fb165a674a3dabcfca15e722f0e3450f45889', '2aeabe7e4531510116217f07bf4d07300de97e4874f81f533420a72eeb0bd6a4'], ['591ee355313d99721cf6993ffed1e3e301993ff3ed258802075ea8ced397e246', 'b0ea558a113c30bea60fc4775460c7901ff0b053d25ca2bdeee98f1a4be5d196'], ['11396d55fda54c49f19aa97318d8da61fa8584e47b084945077cf03255b52984', '998c74a8cd45ac01289d5833a7beb4744ff536b01b257be4c5767bea93ea57a4'], ['3c5d2a1ba39c5a1790000738c9e0c40b8dcdfd5468754b6405540157e017aa7a', 'b2284279995a34e2f9d4de7396fc18b80f9b8b9fdd270f6661f79ca4c81bd257'], ['cc8704b8a60a0defa3a99a7299f2e9c3fbc395afb04ac078425ef8a1793cc030', 'bdd46039feed17881d1e0862db347f8cf395b74fc4bcdc4e940b74e3ac1f1b13'], ['c533e4f7ea8555aacd9777ac5cad29b97dd4defccc53ee7ea204119b2889b197', '6f0a256bc5efdf429a2fb6242f1a43a2d9b925bb4a4b3a26bb8e0f45eb596096'], ['c14f8f2ccb27d6f109f6d08d03cc96a69ba8c34eec07bbcf566d48e33da6593', 'c359d6923bb398f7fd4473e16fe1c28475b740dd098075e6c0e8649113dc3a38'], ['a6cbc3046bc6a450bac24789fa17115a4c9739ed75f8f21ce441f72e0b90e6ef', '21ae7f4680e889bb130619e2c0f95a360ceb573c70603139862afd617fa9b9f'], ['347d6d9a02c48927ebfb86c1359b1caf130a3c0267d11ce6344b39f99d43cc38', '60ea7f61a353524d1c987f6ecec92f086d565ab687870cb12689ff1e31c74448'], ['da6545d2181db8d983f7dcb375ef5866d47c67b1bf31c8cf855ef7437b72656a', '49b96715ab6878a79e78f07ce5680c5d6673051b4935bd897fea824b77dc208a'], ['c40747cc9d012cb1a13b8148309c6de7ec25d6945d657146b9d5994b8feb1111', '5ca560753be2a12fc6de6caf2cb489565db936156b9514e1bb5e83037e0fa2d4'], ['4e42c8ec82c99798ccf3a610be870e78338c7f713348bd34c8203ef4037f3502', '7571d74ee5e0fb92a7a8b33a07783341a5492144cc54bcc40a94473693606437'], ['3775ab7089bc6af823aba2e1af70b236d251cadb0c86743287522a1b3b0dedea', 'be52d107bcfa09d8bcb9736a828cfa7fac8db17bf7a76a2c42ad961409018cf7'], ['cee31cbf7e34ec379d94fb814d3d775ad954595d1314ba8846959e3e82f74e26', '8fd64a14c06b589c26b947ae2bcf6bfa0149ef0be14ed4d80f448a01c43b1c6d'], ['b4f9eaea09b6917619f6ea6a4eb5464efddb58fd45b1ebefcdc1a01d08b47986', '39e5c9925b5a54b07433a4f18c61726f8bb131c012ca542eb24a8ac07200682a'], ['d4263dfc3d2df923a0179a48966d30ce84e2515afc3dccc1b77907792ebcc60e', '62dfaf07a0f78feb30e30d6295853ce189e127760ad6cf7fae164e122a208d54'], ['48457524820fa65a4f8d35eb6930857c0032acc0a4a2de422233eeda897612c4', '25a748ab367979d98733c38a1fa1c2e7dc6cc07db2d60a9ae7a76aaa49bd0f77'], ['dfeeef1881101f2cb11644f3a2afdfc2045e19919152923f367a1767c11cceda', 'ecfb7056cf1de042f9420bab396793c0c390bde74b4bbdff16a83ae09a9a7517'], ['6d7ef6b17543f8373c573f44e1f389835d89bcbc6062ced36c82df83b8fae859', 'cd450ec335438986dfefa10c57fea9bcc521a0959b2d80bbf74b190dca712d10'], ['e75605d59102a5a2684500d3b991f2e3f3c88b93225547035af25af66e04541f', 'f5c54754a8f71ee540b9b48728473e314f729ac5308b06938360990e2bfad125'], ['eb98660f4c4dfaa06a2be453d5020bc99a0c2e60abe388457dd43fefb1ed620c', '6cb9a8876d9cb8520609af3add26cd20a0a7cd8a9411131ce85f44100099223e'], ['13e87b027d8514d35939f2e6892b19922154596941888336dc3563e3b8dba942', 'fef5a3c68059a6dec5d624114bf1e91aac2b9da568d6abeb2570d55646b8adf1'], ['ee163026e9fd6fe017c38f06a5be6fc125424b371ce2708e7bf4491691e5764a', '1acb250f255dd61c43d94ccc670d0f58f49ae3fa15b96623e5430da0ad6c62b2'], ['b268f5ef9ad51e4d78de3a750c2dc89b1e626d43505867999932e5db33af3d80', '5f310d4b3c99b9ebb19f77d41c1dee018cf0d34fd4191614003e945a1216e423'], ['ff07f3118a9df035e9fad85eb6c7bfe42b02f01ca99ceea3bf7ffdba93c4750d', '438136d603e858a3a5c440c38eccbaddc1d2942114e2eddd4740d098ced1f0d8'], ['8d8b9855c7c052a34146fd20ffb658bea4b9f69e0d825ebec16e8c3ce2b526a1', 'cdb559eedc2d79f926baf44fb84ea4d44bcf50fee51d7ceb30e2e7f463036758'], ['52db0b5384dfbf05bfa9d472d7ae26dfe4b851ceca91b1eba54263180da32b63', 'c3b997d050ee5d423ebaf66a6db9f57b3180c902875679de924b69d84a7b375'], ['e62f9490d3d51da6395efd24e80919cc7d0f29c3f3fa48c6fff543becbd43352', '6d89ad7ba4876b0b22c2ca280c682862f342c8591f1daf5170e07bfd9ccafa7d'], ['7f30ea2476b399b4957509c88f77d0191afa2ff5cb7b14fd6d8e7d65aaab1193', 'ca5ef7d4b231c94c3b15389a5f6311e9daff7bb67b103e9880ef4bff637acaec'], ['5098ff1e1d9f14fb46a210fada6c903fef0fb7b4a1dd1d9ac60a0361800b7a00', '9731141d81fc8f8084d37c6e7542006b3ee1b40d60dfe5362a5b132fd17ddc0'], ['32b78c7de9ee512a72895be6b9cbefa6e2f3c4ccce445c96b9f2c81e2778ad58', 'ee1849f513df71e32efc3896ee28260c73bb80547ae2275ba497237794c8753c'], ['e2cb74fddc8e9fbcd076eef2a7c72b0ce37d50f08269dfc074b581550547a4f7', 'd3aa2ed71c9dd2247a62df062736eb0baddea9e36122d2be8641abcb005cc4a4'], ['8438447566d4d7bedadc299496ab357426009a35f235cb141be0d99cd10ae3a8', 'c4e1020916980a4da5d01ac5e6ad330734ef0d7906631c4f2390426b2edd791f'], ['4162d488b89402039b584c6fc6c308870587d9c46f660b878ab65c82c711d67e', '67163e903236289f776f22c25fb8a3afc1732f2b84b4e95dbda47ae5a0852649'], ['3fad3fa84caf0f34f0f89bfd2dcf54fc175d767aec3e50684f3ba4a4bf5f683d', 'cd1bc7cb6cc407bb2f0ca647c718a730cf71872e7d0d2a53fa20efcdfe61826'], ['674f2600a3007a00568c1a7ce05d0816c1fb84bf1370798f1c69532faeb1a86b', '299d21f9413f33b3edf43b257004580b70db57da0b182259e09eecc69e0d38a5'], ['d32f4da54ade74abb81b815ad1fb3b263d82d6c692714bcff87d29bd5ee9f08f', 'f9429e738b8e53b968e99016c059707782e14f4535359d582fc416910b3eea87'], ['30e4e670435385556e593657135845d36fbb6931f72b08cb1ed954f1e3ce3ff6', '462f9bce619898638499350113bbc9b10a878d35da70740dc695a559eb88db7b'], ['be2062003c51cc3004682904330e4dee7f3dcd10b01e580bf1971b04d4cad297', '62188bc49d61e5428573d48a74e1c655b1c61090905682a0d5558ed72dccb9bc'], ['93144423ace3451ed29e0fb9ac2af211cb6e84a601df5993c419859fff5df04a', '7c10dfb164c3425f5c71a3f9d7992038f1065224f72bb9d1d902a6d13037b47c'], ['b015f8044f5fcbdcf21ca26d6c34fb8197829205c7b7d2a7cb66418c157b112c', 'ab8c1e086d04e813744a655b2df8d5f83b3cdc6faa3088c1d3aea1454e3a1d5f'], ['d5e9e1da649d97d89e4868117a465a3a4f8a18de57a140d36b3f2af341a21b52', '4cb04437f391ed73111a13cc1d4dd0db1693465c2240480d8955e8592f27447a'], ['d3ae41047dd7ca065dbf8ed77b992439983005cd72e16d6f996a5316d36966bb', 'bd1aeb21ad22ebb22a10f0303417c6d964f8cdd7df0aca614b10dc14d125ac46'], ['463e2763d885f958fc66cdd22800f0a487197d0a82e377b49f80af87c897b065', 'bfefacdb0e5d0fd7df3a311a94de062b26b80c61fbc97508b79992671ef7ca7f'], ['7985fdfd127c0567c6f53ec1bb63ec3158e597c40bfe747c83cddfc910641917', '603c12daf3d9862ef2b25fe1de289aed24ed291e0ec6708703a5bd567f32ed03'], ['74a1ad6b5f76e39db2dd249410eac7f99e74c59cb83d2d0ed5ff1543da7703e9', 'cc6157ef18c9c63cd6193d83631bbea0093e0968942e8c33d5737fd790e0db08'], ['30682a50703375f602d416664ba19b7fc9bab42c72747463a71d0896b22f6da3', '553e04f6b018b4fa6c8f39e7f311d3176290d0e0f19ca73f17714d9977a22ff8'], ['9e2158f0d7c0d5f26c3791efefa79597654e7a2b2464f52b1ee6c1347769ef57', '712fcdd1b9053f09003a3481fa7762e9ffd7c8ef35a38509e2fbf2629008373'], ['176e26989a43c9cfeba4029c202538c28172e566e3c4fce7322857f3be327d66', 'ed8cc9d04b29eb877d270b4878dc43c19aefd31f4eee09ee7b47834c1fa4b1c3'], ['75d46efea3771e6e68abb89a13ad747ecf1892393dfc4f1b7004788c50374da8', '9852390a99507679fd0b86fd2b39a868d7efc22151346e1a3ca4726586a6bed8'], ['809a20c67d64900ffb698c4c825f6d5f2310fb0451c869345b7319f645605721', '9e994980d9917e22b76b061927fa04143d096ccc54963e6a5ebfa5f3f8e286c1'], ['1b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180', '4036edc931a60ae889353f77fd53de4a2708b26b6f5da72ad3394119daf408f9']]
      }
    };
    return secp256k1;
  }
  (function (exports) {
    var curves = exports;
    var hash = hash$2;
    var curve$1 = curve;
    var utils = utils$o;
    var assert = utils.assert;
    function PresetCurve(options) {
      if (options.type === 'short') this.curve = new curve$1.short(options);else if (options.type === 'edwards') this.curve = new curve$1.edwards(options);else if (options.type === 'mont') this.curve = new curve$1.mont(options);else throw new Error('Unknown curve type.');
      this.g = this.curve.g;
      this.n = this.curve.n;
      this.hash = options.hash;
      assert(this.g.validate(), 'Invalid curve');
      assert(this.g.mul(this.n).isInfinity(), 'Invalid curve, n*G != O');
    }
    curves.PresetCurve = PresetCurve;
    function defineCurve(name, options) {
      Object.defineProperty(curves, name, {
        configurable: true,
        enumerable: true,
        get: function () {
          var curve = new PresetCurve(options);
          Object.defineProperty(curves, name, {
            configurable: true,
            enumerable: true,
            value: curve
          });
          return curve;
        }
      });
    }
    defineCurve('p192', {
      type: 'short',
      prime: 'p192',
      p: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff',
      a: 'ffffffff ffffffff ffffffff fffffffe ffffffff fffffffc',
      b: '64210519 e59c80e7 0fa7e9ab 72243049 feb8deec c146b9b1',
      n: 'ffffffff ffffffff ffffffff 99def836 146bc9b1 b4d22831',
      hash: hash.sha256,
      gRed: false,
      g: ['188da80e b03090f6 7cbf20eb 43a18800 f4ff0afd 82ff1012', '07192b95 ffc8da78 631011ed 6b24cdd5 73f977a1 1e794811']
    });
    defineCurve('p224', {
      type: 'short',
      prime: 'p224',
      p: 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001',
      a: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff fffffffe',
      b: 'b4050a85 0c04b3ab f5413256 5044b0b7 d7bfd8ba 270b3943 2355ffb4',
      n: 'ffffffff ffffffff ffffffff ffff16a2 e0b8f03e 13dd2945 5c5c2a3d',
      hash: hash.sha256,
      gRed: false,
      g: ['b70e0cbd 6bb4bf7f 321390b9 4a03c1d3 56c21122 343280d6 115c1d21', 'bd376388 b5f723fb 4c22dfe6 cd4375a0 5a074764 44d58199 85007e34']
    });
    defineCurve('p256', {
      type: 'short',
      prime: null,
      p: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff ffffffff',
      a: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff fffffffc',
      b: '5ac635d8 aa3a93e7 b3ebbd55 769886bc 651d06b0 cc53b0f6 3bce3c3e 27d2604b',
      n: 'ffffffff 00000000 ffffffff ffffffff bce6faad a7179e84 f3b9cac2 fc632551',
      hash: hash.sha256,
      gRed: false,
      g: ['6b17d1f2 e12c4247 f8bce6e5 63a440f2 77037d81 2deb33a0 f4a13945 d898c296', '4fe342e2 fe1a7f9b 8ee7eb4a 7c0f9e16 2bce3357 6b315ece cbb64068 37bf51f5']
    });
    defineCurve('p384', {
      type: 'short',
      prime: null,
      p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' + 'fffffffe ffffffff 00000000 00000000 ffffffff',
      a: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' + 'fffffffe ffffffff 00000000 00000000 fffffffc',
      b: 'b3312fa7 e23ee7e4 988e056b e3f82d19 181d9c6e fe814112 0314088f ' + '5013875a c656398d 8a2ed19d 2a85c8ed d3ec2aef',
      n: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c7634d81 ' + 'f4372ddf 581a0db2 48b0a77a ecec196a ccc52973',
      hash: hash.sha384,
      gRed: false,
      g: ['aa87ca22 be8b0537 8eb1c71e f320ad74 6e1d3b62 8ba79b98 59f741e0 82542a38 ' + '5502f25d bf55296c 3a545e38 72760ab7', '3617de4a 96262c6f 5d9e98bf 9292dc29 f8f41dbd 289a147c e9da3113 b5f0b8c0 ' + '0a60b1ce 1d7e819d 7a431d7c 90ea0e5f']
    });
    defineCurve('p521', {
      type: 'short',
      prime: null,
      p: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' + 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' + 'ffffffff ffffffff ffffffff ffffffff ffffffff',
      a: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' + 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' + 'ffffffff ffffffff ffffffff ffffffff fffffffc',
      b: '00000051 953eb961 8e1c9a1f 929a21a0 b68540ee a2da725b ' + '99b315f3 b8b48991 8ef109e1 56193951 ec7e937b 1652c0bd ' + '3bb1bf07 3573df88 3d2c34f1 ef451fd4 6b503f00',
      n: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' + 'ffffffff ffffffff fffffffa 51868783 bf2f966b 7fcc0148 ' + 'f709a5d0 3bb5c9b8 899c47ae bb6fb71e 91386409',
      hash: hash.sha512,
      gRed: false,
      g: ['000000c6 858e06b7 0404e9cd 9e3ecb66 2395b442 9c648139 ' + '053fb521 f828af60 6b4d3dba a14b5e77 efe75928 fe1dc127 ' + 'a2ffa8de 3348b3c1 856a429b f97e7e31 c2e5bd66', '00000118 39296a78 9a3bc004 5c8a5fb4 2c7d1bd9 98f54449 ' + '579b4468 17afbd17 273e662c 97ee7299 5ef42640 c550b901 ' + '3fad0761 353c7086 a272c240 88be9476 9fd16650']
    });
    defineCurve('curve25519', {
      type: 'mont',
      prime: 'p25519',
      p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
      a: '76d06',
      b: '1',
      n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
      cofactor: '8',
      hash: hash.sha256,
      gRed: false,
      g: ['9']
    });
    defineCurve('ed25519', {
      type: 'edwards',
      prime: 'p25519',
      p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
      a: '-1',
      c: '1',
      d: '52036cee2b6ffe73 8cc740797779e898 00700a4d4141d8ab 75eb4dca135978a3',
      n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
      cofactor: '8',
      hash: hash.sha256,
      gRed: false,
      g: ['216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a', '6666666666666666666666666666666666666666666666666666666666666658']
    });
    defineCurve('brainpoolP256r1', {
      type: 'short',
      prime: null,
      p: 'A9FB57DB A1EEA9BC 3E660A90 9D838D72 6E3BF623 D5262028 2013481D 1F6E5377',
      a: '7D5A0975 FC2C3057 EEF67530 417AFFE7 FB8055C1 26DC5C6C E94A4B44 F330B5D9',
      b: '26DC5C6C E94A4B44 F330B5D9 BBD77CBF 95841629 5CF7E1CE 6BCCDC18 FF8C07B6',
      n: 'A9FB57DB A1EEA9BC 3E660A90 9D838D71 8C397AA3 B561A6F7 901E0E82 974856A7',
      hash: hash.sha256,
      gRed: false,
      g: ['8BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262', '547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997']
    });
    defineCurve('brainpoolP384r1', {
      type: 'short',
      prime: null,
      p: '8CB91E82 A3386D28 0F5D6F7E 50E641DF 152F7109 ED5456B4 12B1DA19 7FB71123' + 'ACD3A729 901D1A71 87470013 3107EC53',
      a: '7BC382C6 3D8C150C 3C72080A CE05AFA0 C2BEA28E 4FB22787 139165EF BA91F90F' + '8AA5814A 503AD4EB 04A8C7DD 22CE2826',
      b: '04A8C7DD 22CE2826 8B39B554 16F0447C 2FB77DE1 07DCD2A6 2E880EA5 3EEB62D5' + '7CB43902 95DBC994 3AB78696 FA504C11',
      n: '8CB91E82 A3386D28 0F5D6F7E 50E641DF 152F7109 ED5456B3 1F166E6C AC0425A7' + 'CF3AB6AF 6B7FC310 3B883202 E9046565',
      hash: hash.sha384,
      gRed: false,
      g: ['1D1C64F068CF45FFA2A63A81B7C13F6B8847A3E77EF14FE3DB7FCAFE0CBD10' + 'E8E826E03436D646AAEF87B2E247D4AF1E', '8ABE1D7520F9C2A45CB1EB8E95CFD55262B70B29FEEC5864E19C054FF99129' + '280E4646217791811142820341263C5315']
    });
    defineCurve('brainpoolP512r1', {
      type: 'short',
      prime: null,
      p: 'AADD9DB8 DBE9C48B 3FD4E6AE 33C9FC07 CB308DB3 B3C9D20E D6639CCA 70330871' + '7D4D9B00 9BC66842 AECDA12A E6A380E6 2881FF2F 2D82C685 28AA6056 583A48F3',
      a: '7830A331 8B603B89 E2327145 AC234CC5 94CBDD8D 3DF91610 A83441CA EA9863BC' + '2DED5D5A A8253AA1 0A2EF1C9 8B9AC8B5 7F1117A7 2BF2C7B9 E7C1AC4D 77FC94CA',
      b: '3DF91610 A83441CA EA9863BC 2DED5D5A A8253AA1 0A2EF1C9 8B9AC8B5 7F1117A7' + '2BF2C7B9 E7C1AC4D 77FC94CA DC083E67 984050B7 5EBAE5DD 2809BD63 8016F723',
      n: 'AADD9DB8 DBE9C48B 3FD4E6AE 33C9FC07 CB308DB3 B3C9D20E D6639CCA 70330870' + '553E5C41 4CA92619 41866119 7FAC1047 1DB1D381 085DDADD B5879682 9CA90069',
      hash: hash.sha512,
      gRed: false,
      g: ['81AEE4BDD82ED9645A21322E9C4C6A9385ED9F70B5D916C1B43B62EEF4D009' + '8EFF3B1F78E2D0D48D50D1687B93B97D5F7C6D5047406A5E688B352209BCB9F822', '7DDE385D566332ECC0EABFA9CF7822FDF209F70024A57B1AA000C55B881F81' + '11B2DCDE494A5F485E5BCA4BD88A2763AED1CA2B2FA8F0540678CD1E0F3AD80892']
    });
    var pre;
    try {
      pre = requireSecp256k1();
    } catch (e) {
      pre = undefined;
    }
    defineCurve('secp256k1', {
      type: 'short',
      prime: 'k256',
      p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f',
      a: '0',
      b: '7',
      n: 'ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141',
      h: '1',
      hash: hash.sha256,
      beta: '7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee',
      lambda: '5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72',
      basis: [{
        a: '3086d221a7d46bcde86c90e49284eb15',
        b: '-e4437ed6010e88286f547fa90abfe4c3'
      }, {
        a: '114ca50f7a8e2f3f657c1108d9d44cfd8',
        b: '3086d221a7d46bcde86c90e49284eb15'
      }],
      gRed: false,
      g: ['79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8', pre]
    });
  })(curves$1);
  var hash$1 = hash$2;
  var utils$8 = utils$n;
  var assert$9 = minimalisticAssert;
  function HmacDRBG$1(options) {
    if (!(this instanceof HmacDRBG$1)) return new HmacDRBG$1(options);
    this.hash = options.hash;
    this.predResist = !!options.predResist;
    this.outLen = this.hash.outSize;
    this.minEntropy = options.minEntropy || this.hash.hmacStrength;
    this._reseed = null;
    this.reseedInterval = null;
    this.K = null;
    this.V = null;
    var entropy = utils$8.toArray(options.entropy, options.entropyEnc || 'hex');
    var nonce = utils$8.toArray(options.nonce, options.nonceEnc || 'hex');
    var pers = utils$8.toArray(options.pers, options.persEnc || 'hex');
    assert$9(entropy.length >= this.minEntropy / 8, 'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');
    this._init(entropy, nonce, pers);
  }
  var hmacDrbg = HmacDRBG$1;
  HmacDRBG$1.prototype._init = function init(entropy, nonce, pers) {
    var seed = entropy.concat(nonce).concat(pers);
    this.K = new Array(this.outLen / 8);
    this.V = new Array(this.outLen / 8);
    for (var i = 0; i < this.V.length; i++) {
      this.K[i] = 0x00;
      this.V[i] = 0x01;
    }
    this._update(seed);
    this._reseed = 1;
    this.reseedInterval = 0x1000000000000;
  };
  HmacDRBG$1.prototype._hmac = function hmac() {
    return new hash$1.hmac(this.hash, this.K);
  };
  HmacDRBG$1.prototype._update = function update(seed) {
    var kmac = this._hmac().update(this.V).update([0x00]);
    if (seed) kmac = kmac.update(seed);
    this.K = kmac.digest();
    this.V = this._hmac().update(this.V).digest();
    if (!seed) return;
    this.K = this._hmac().update(this.V).update([0x01]).update(seed).digest();
    this.V = this._hmac().update(this.V).digest();
  };
  HmacDRBG$1.prototype.reseed = function reseed(entropy, entropyEnc, add, addEnc) {
    if (typeof entropyEnc !== 'string') {
      addEnc = add;
      add = entropyEnc;
      entropyEnc = null;
    }
    entropy = utils$8.toArray(entropy, entropyEnc);
    add = utils$8.toArray(add, addEnc);
    assert$9(entropy.length >= this.minEntropy / 8, 'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');
    this._update(entropy.concat(add || []));
    this._reseed = 1;
  };
  HmacDRBG$1.prototype.generate = function generate(len, enc, add, addEnc) {
    if (this._reseed > this.reseedInterval) throw new Error('Reseed is required');
    if (typeof enc !== 'string') {
      addEnc = add;
      add = enc;
      enc = null;
    }
    if (add) {
      add = utils$8.toArray(add, addEnc || 'hex');
      this._update(add);
    }
    var temp = [];
    while (temp.length < len) {
      this.V = this._hmac().update(this.V).digest();
      temp = temp.concat(this.V);
    }
    var res = temp.slice(0, len);
    this._update(add);
    this._reseed++;
    return utils$8.encode(res, enc);
  };
  var BN$3 = bnExports;
  var utils$7 = utils$o;
  var assert$8 = utils$7.assert;
  function KeyPair$2(ec, options) {
    this.ec = ec;
    this.priv = null;
    this.pub = null;
    if (options.priv) this._importPrivate(options.priv, options.privEnc);
    if (options.pub) this._importPublic(options.pub, options.pubEnc);
  }
  var key$1 = KeyPair$2;
  KeyPair$2.fromPublic = function fromPublic(ec, pub, enc) {
    if (pub instanceof KeyPair$2) return pub;
    return new KeyPair$2(ec, {
      pub: pub,
      pubEnc: enc
    });
  };
  KeyPair$2.fromPrivate = function fromPrivate(ec, priv, enc) {
    if (priv instanceof KeyPair$2) return priv;
    return new KeyPair$2(ec, {
      priv: priv,
      privEnc: enc
    });
  };
  KeyPair$2.prototype.validate = function validate() {
    var pub = this.getPublic();
    if (pub.isInfinity()) return {
      result: false,
      reason: 'Invalid public key'
    };
    if (!pub.validate()) return {
      result: false,
      reason: 'Public key is not a point'
    };
    if (!pub.mul(this.ec.curve.n).isInfinity()) return {
      result: false,
      reason: 'Public key * N != O'
    };
    return {
      result: true,
      reason: null
    };
  };
  KeyPair$2.prototype.getPublic = function getPublic(enc, compact) {
    if (!this.pub) this.pub = this.ec.g.mul(this.priv);
    if (!enc) return this.pub;
    return this.pub.encode(enc, compact);
  };
  KeyPair$2.prototype.getPrivate = function getPrivate(enc) {
    if (enc === 'hex') return this.priv.toString(16, 2);else return this.priv;
  };
  KeyPair$2.prototype._importPrivate = function _importPrivate(key, enc) {
    this.priv = new BN$3(key, enc || 16);
    if (this.ec.curve.type === 'mont') {
      var one = this.ec.curve.one;
      var mask = one.ushln(255 - 3).sub(one).ushln(3);
      this.priv = this.priv.or(one.ushln(255 - 1));
      this.priv = this.priv.and(mask);
    } else this.priv = this.priv.umod(this.ec.curve.n);
  };
  KeyPair$2.prototype._importPublic = function _importPublic(key, enc) {
    if (key.x || key.y) {
      if (this.ec.curve.type === 'mont') {
        assert$8(key.x, 'Need x coordinate');
      } else if (this.ec.curve.type === 'short' || this.ec.curve.type === 'edwards') {
        assert$8(key.x && key.y, 'Need both x and y coordinate');
      }
      this.pub = this.ec.curve.point(key.x, key.y);
      return;
    }
    this.pub = this.ec.curve.decodePoint(key, enc);
  };
  KeyPair$2.prototype.derive = function derive(pub) {
    return pub.mul(this.priv).getX();
  };
  KeyPair$2.prototype.sign = function sign(msg, enc, options) {
    return this.ec.sign(msg, this, enc, options);
  };
  KeyPair$2.prototype.verify = function verify(msg, signature) {
    return this.ec.verify(msg, signature, this);
  };
  KeyPair$2.prototype.inspect = function inspect() {
    return '<Key priv: ' + (this.priv && this.priv.toString(16, 2)) + ' pub: ' + (this.pub && this.pub.inspect()) + ' >';
  };
  var BN$2 = bnExports;
  var utils$6 = utils$o;
  var assert$7 = utils$6.assert;
  function Signature$2(options, enc) {
    if (options instanceof Signature$2) return options;
    if (this._importDER(options, enc)) return;
    assert$7(options.r && options.s, 'Signature without r or s');
    this.r = new BN$2(options.r, 16);
    this.s = new BN$2(options.s, 16);
    if (options.recoveryParam === undefined) this.recoveryParam = null;else this.recoveryParam = options.recoveryParam;
  }
  var signature$1 = Signature$2;
  function Position() {
    this.place = 0;
  }
  function getLength(buf, p) {
    var initial = buf[p.place++];
    if (!(initial & 0x80)) {
      return initial;
    }
    var octetLen = initial & 0xf;
    var val = 0;
    for (var i = 0, off = p.place; i < octetLen; i++, off++) {
      val <<= 8;
      val |= buf[off];
    }
    p.place = off;
    return val;
  }
  function rmPadding(buf) {
    var i = 0;
    var len = buf.length - 1;
    while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
      i++;
    }
    if (i === 0) {
      return buf;
    }
    return buf.slice(i);
  }
  Signature$2.prototype._importDER = function _importDER(data, enc) {
    data = utils$6.toArray(data, enc);
    var p = new Position();
    if (data[p.place++] !== 0x30) {
      return false;
    }
    var len = getLength(data, p);
    if (len + p.place !== data.length) {
      return false;
    }
    if (data[p.place++] !== 0x02) {
      return false;
    }
    var rlen = getLength(data, p);
    var r = data.slice(p.place, rlen + p.place);
    p.place += rlen;
    if (data[p.place++] !== 0x02) {
      return false;
    }
    var slen = getLength(data, p);
    if (data.length !== slen + p.place) {
      return false;
    }
    var s = data.slice(p.place, slen + p.place);
    if (r[0] === 0 && r[1] & 0x80) {
      r = r.slice(1);
    }
    if (s[0] === 0 && s[1] & 0x80) {
      s = s.slice(1);
    }
    this.r = new BN$2(r);
    this.s = new BN$2(s);
    this.recoveryParam = null;
    return true;
  };
  function constructLength(arr, len) {
    if (len < 0x80) {
      arr.push(len);
      return;
    }
    var octets = 1 + (Math.log(len) / Math.LN2 >>> 3);
    arr.push(octets | 0x80);
    while (--octets) {
      arr.push(len >>> (octets << 3) & 0xff);
    }
    arr.push(len);
  }
  Signature$2.prototype.toDER = function toDER(enc) {
    var r = this.r.toArray();
    var s = this.s.toArray();
    if (r[0] & 0x80) r = [0].concat(r);
    if (s[0] & 0x80) s = [0].concat(s);
    r = rmPadding(r);
    s = rmPadding(s);
    while (!s[0] && !(s[1] & 0x80)) {
      s = s.slice(1);
    }
    var arr = [0x02];
    constructLength(arr, r.length);
    arr = arr.concat(r);
    arr.push(0x02);
    constructLength(arr, s.length);
    var backHalf = arr.concat(s);
    var res = [0x30];
    constructLength(res, backHalf.length);
    res = res.concat(backHalf);
    return utils$6.encode(res, enc);
  };
  var BN$1 = bnExports;
  var HmacDRBG = hmacDrbg;
  var utils$5 = utils$o;
  var curves = curves$1;
  var rand = brorandExports;
  var assert$6 = utils$5.assert;
  var KeyPair$1 = key$1;
  var Signature$1 = signature$1;
  function EC(options) {
    if (!(this instanceof EC)) return new EC(options);
    if (typeof options === 'string') {
      assert$6(curves.hasOwnProperty(options), 'Unknown curve ' + options);
      options = curves[options];
    }
    if (options instanceof curves.PresetCurve) options = {
      curve: options
    };
    this.curve = options.curve.curve;
    this.n = this.curve.n;
    this.nh = this.n.ushrn(1);
    this.g = this.curve.g;
    this.g = options.curve.g;
    this.g.precompute(options.curve.n.bitLength() + 1);
    this.hash = options.hash || options.curve.hash;
  }
  var ec = EC;
  EC.prototype.keyPair = function keyPair(options) {
    return new KeyPair$1(this, options);
  };
  EC.prototype.keyFromPrivate = function keyFromPrivate(priv, enc) {
    return KeyPair$1.fromPrivate(this, priv, enc);
  };
  EC.prototype.keyFromPublic = function keyFromPublic(pub, enc) {
    return KeyPair$1.fromPublic(this, pub, enc);
  };
  EC.prototype.genKeyPair = function genKeyPair(options) {
    if (!options) options = {};
    var drbg = new HmacDRBG({
      hash: this.hash,
      pers: options.pers,
      persEnc: options.persEnc || 'utf8',
      entropy: options.entropy || rand(this.hash.hmacStrength),
      entropyEnc: options.entropy && options.entropyEnc || 'utf8',
      nonce: this.n.toArray()
    });
    if (this.curve.type === 'mont') {
      var priv = new BN$1(drbg.generate(32));
      return this.keyFromPrivate(priv);
    }
    var bytes = this.n.byteLength();
    var ns2 = this.n.sub(new BN$1(2));
    do {
      var priv = new BN$1(drbg.generate(bytes));
      if (priv.cmp(ns2) > 0) continue;
      priv.iaddn(1);
      return this.keyFromPrivate(priv);
    } while (true);
  };
  EC.prototype._truncateToN = function truncateToN(msg, truncOnly) {
    var delta = msg.byteLength() * 8 - this.n.bitLength();
    if (delta > 0) msg = msg.ushrn(delta);
    if (!truncOnly && msg.cmp(this.n) >= 0) return msg.sub(this.n);else return msg;
  };
  EC.prototype.sign = function sign(msg, key, enc, options) {
    if (typeof enc === 'object') {
      options = enc;
      enc = null;
    }
    if (!options) options = {};
    key = this.keyFromPrivate(key, enc);
    msg = this._truncateToN(new BN$1(msg, 16));
    var bytes = this.n.byteLength();
    var bkey = key.getPrivate().toArray('be', bytes);
    var nonce = msg.toArray('be', bytes);
    var drbg = new HmacDRBG({
      hash: this.hash,
      entropy: bkey,
      nonce: nonce,
      pers: options.pers,
      persEnc: options.persEnc || 'utf8'
    });
    var ns1 = this.n.sub(new BN$1(1));
    for (var iter = 0; true; iter++) {
      var k = options.k ? options.k(iter) : new BN$1(drbg.generate(this.n.byteLength()));
      k = this._truncateToN(k, true);
      if (k.cmpn(1) <= 0 || k.cmp(ns1) >= 0) continue;
      var kp = this.g.mul(k);
      if (kp.isInfinity()) continue;
      var kpX = kp.getX();
      var r = kpX.umod(this.n);
      if (r.cmpn(0) === 0) continue;
      var s = k.invm(this.n).mul(r.mul(key.getPrivate()).iadd(msg));
      s = s.umod(this.n);
      if (s.cmpn(0) === 0) continue;
      var recoveryParam = (kp.getY().isOdd() ? 1 : 0) | (kpX.cmp(r) !== 0 ? 2 : 0);
      if (options.canonical && s.cmp(this.nh) > 0) {
        s = this.n.sub(s);
        recoveryParam ^= 1;
      }
      return new Signature$1({
        r: r,
        s: s,
        recoveryParam: recoveryParam
      });
    }
  };
  EC.prototype.verify = function verify(msg, signature, key, enc) {
    msg = this._truncateToN(new BN$1(msg, 16));
    key = this.keyFromPublic(key, enc);
    signature = new Signature$1(signature, 'hex');
    var r = signature.r;
    var s = signature.s;
    if (r.cmpn(1) < 0 || r.cmp(this.n) >= 0) return false;
    if (s.cmpn(1) < 0 || s.cmp(this.n) >= 0) return false;
    var sinv = s.invm(this.n);
    var u1 = sinv.mul(msg).umod(this.n);
    var u2 = sinv.mul(r).umod(this.n);
    if (!this.curve._maxwellTrick) {
      var p = this.g.mulAdd(u1, key.getPublic(), u2);
      if (p.isInfinity()) return false;
      return p.getX().umod(this.n).cmp(r) === 0;
    }
    var p = this.g.jmulAdd(u1, key.getPublic(), u2);
    if (p.isInfinity()) return false;
    return p.eqXToP(r);
  };
  EC.prototype.recoverPubKey = function (msg, signature, j, enc) {
    assert$6((3 & j) === j, 'The recovery param is more than two bits');
    signature = new Signature$1(signature, enc);
    var n = this.n;
    var e = new BN$1(msg);
    var r = signature.r;
    var s = signature.s;
    var isYOdd = j & 1;
    var isSecondKey = j >> 1;
    if (r.cmp(this.curve.p.umod(this.curve.n)) >= 0 && isSecondKey) throw new Error('Unable to find sencond key candinate');
    if (isSecondKey) r = this.curve.pointFromX(r.add(this.curve.n), isYOdd);else r = this.curve.pointFromX(r, isYOdd);
    var rInv = signature.r.invm(n);
    var s1 = n.sub(e).mul(rInv).umod(n);
    var s2 = s.mul(rInv).umod(n);
    return this.g.mulAdd(s1, r, s2);
  };
  EC.prototype.getKeyRecoveryParam = function (e, signature, Q, enc) {
    signature = new Signature$1(signature, enc);
    if (signature.recoveryParam !== null) return signature.recoveryParam;
    for (var i = 0; i < 4; i++) {
      var Qprime;
      try {
        Qprime = this.recoverPubKey(e, signature, i);
      } catch (e) {
        continue;
      }
      if (Qprime.eq(Q)) return i;
    }
    throw new Error('Unable to find valid recovery factor');
  };
  var utils$4 = utils$o;
  var assert$5 = utils$4.assert;
  var parseBytes$1 = utils$4.parseBytes;
  var cachedProperty$1 = utils$4.cachedProperty;
  function KeyPair(eddsa, params) {
    this.eddsa = eddsa;
    if (params.hasOwnProperty('secret')) this._secret = parseBytes$1(params.secret);
    if (eddsa.isPoint(params.pub)) this._pub = params.pub;else {
      this._pubBytes = parseBytes$1(params.pub);
      if (this._pubBytes && this._pubBytes.length === 33 && this._pubBytes[0] === 0x40) {
        this._pubBytes = this._pubBytes.slice(1, 33);
      }
      if (this._pubBytes && this._pubBytes.length !== 32) throw new Error('Unknown point compression format');
    }
  }
  KeyPair.fromPublic = function fromPublic(eddsa, pub) {
    if (pub instanceof KeyPair) return pub;
    return new KeyPair(eddsa, {
      pub: pub
    });
  };
  KeyPair.fromSecret = function fromSecret(eddsa, secret) {
    if (secret instanceof KeyPair) return secret;
    return new KeyPair(eddsa, {
      secret: secret
    });
  };
  KeyPair.prototype.secret = function secret() {
    return this._secret;
  };
  cachedProperty$1(KeyPair, 'pubBytes', function pubBytes() {
    return this.eddsa.encodePoint(this.pub());
  });
  cachedProperty$1(KeyPair, 'pub', function pub() {
    if (this._pubBytes) return this.eddsa.decodePoint(this._pubBytes);
    return this.eddsa.g.mul(this.priv());
  });
  cachedProperty$1(KeyPair, 'privBytes', function privBytes() {
    var eddsa = this.eddsa;
    var hash = this.hash();
    var lastIx = eddsa.encodingLength - 1;
    var a = hash.slice(0, eddsa.encodingLength);
    a[0] &= 248;
    a[lastIx] &= 127;
    a[lastIx] |= 64;
    return a;
  });
  cachedProperty$1(KeyPair, 'priv', function priv() {
    return this.eddsa.decodeInt(this.privBytes());
  });
  cachedProperty$1(KeyPair, 'hash', function hash() {
    return this.eddsa.hash().update(this.secret()).digest();
  });
  cachedProperty$1(KeyPair, 'messagePrefix', function messagePrefix() {
    return this.hash().slice(this.eddsa.encodingLength);
  });
  KeyPair.prototype.sign = function sign(message) {
    assert$5(this._secret, 'KeyPair can only verify');
    return this.eddsa.sign(message, this);
  };
  KeyPair.prototype.verify = function verify(message, sig) {
    return this.eddsa.verify(message, sig, this);
  };
  KeyPair.prototype.getSecret = function getSecret(enc) {
    assert$5(this._secret, 'KeyPair is public only');
    return utils$4.encode(this.secret(), enc);
  };
  KeyPair.prototype.getPublic = function getPublic(enc, compact) {
    return utils$4.encode((compact ? [0x40] : []).concat(this.pubBytes()), enc);
  };
  var key = KeyPair;
  var BN = bnExports;
  var utils$3 = utils$o;
  var assert$4 = utils$3.assert;
  var cachedProperty = utils$3.cachedProperty;
  var parseBytes = utils$3.parseBytes;
  function Signature(eddsa, sig) {
    this.eddsa = eddsa;
    if (typeof sig !== 'object') sig = parseBytes(sig);
    if (Array.isArray(sig)) {
      sig = {
        R: sig.slice(0, eddsa.encodingLength),
        S: sig.slice(eddsa.encodingLength)
      };
    }
    assert$4(sig.R && sig.S, 'Signature without R or S');
    if (eddsa.isPoint(sig.R)) this._R = sig.R;
    if (sig.S instanceof BN) this._S = sig.S;
    this._Rencoded = Array.isArray(sig.R) ? sig.R : sig.Rencoded;
    this._Sencoded = Array.isArray(sig.S) ? sig.S : sig.Sencoded;
  }
  cachedProperty(Signature, 'S', function S() {
    return this.eddsa.decodeInt(this.Sencoded());
  });
  cachedProperty(Signature, 'R', function R() {
    return this.eddsa.decodePoint(this.Rencoded());
  });
  cachedProperty(Signature, 'Rencoded', function Rencoded() {
    return this.eddsa.encodePoint(this.R());
  });
  cachedProperty(Signature, 'Sencoded', function Sencoded() {
    return this.eddsa.encodeInt(this.S());
  });
  Signature.prototype.toBytes = function toBytes() {
    return this.Rencoded().concat(this.Sencoded());
  };
  Signature.prototype.toHex = function toHex() {
    return utils$3.encode(this.toBytes(), 'hex').toUpperCase();
  };
  var signature = Signature;
  var eddsa;
  var hasRequiredEddsa;
  function requireEddsa() {
    if (hasRequiredEddsa) return eddsa;
    hasRequiredEddsa = 1;
    var hash = hash$2;
    var curves = curves$1;
    var utils = utils$o;
    var HmacDRBG = hmacDrbg;
    var elliptic = requireElliptic();
    var assert = utils.assert;
    var parseBytes = utils.parseBytes;
    var KeyPair = key;
    var Signature = signature;
    function EDDSA(curve) {
      assert(curve === 'ed25519', 'only tested with ed25519 so far');
      if (!(this instanceof EDDSA)) return new EDDSA(curve);
      var curve = curves[curve].curve;
      this.curve = curve;
      this.g = curve.g;
      this.g.precompute(curve.n.bitLength() + 1);
      this.pointClass = curve.point().constructor;
      this.encodingLength = Math.ceil(curve.n.bitLength() / 8);
      this.hash = hash.sha512;
    }
    eddsa = EDDSA;
    EDDSA.prototype.sign = function sign(message, secret) {
      message = parseBytes(message);
      var key = this.keyFromSecret(secret);
      var r = this.hashInt(key.messagePrefix(), message);
      var R = this.g.mul(r);
      var Rencoded = this.encodePoint(R);
      var s_ = this.hashInt(Rencoded, key.pubBytes(), message).mul(key.priv());
      var S = r.add(s_).umod(this.curve.n);
      return this.makeSignature({
        R: R,
        S: S,
        Rencoded: Rencoded
      });
    };
    EDDSA.prototype.verify = function verify(message, sig, pub) {
      message = parseBytes(message);
      sig = this.makeSignature(sig);
      var key = this.keyFromPublic(pub);
      var h = this.hashInt(sig.Rencoded(), key.pubBytes(), message);
      var SG = this.g.mul(sig.S());
      var RplusAh = sig.R().add(key.pub().mul(h));
      return RplusAh.eq(SG);
    };
    EDDSA.prototype.hashInt = function hashInt() {
      var hash = this.hash();
      for (var i = 0; i < arguments.length; i++) hash.update(arguments[i]);
      return utils.intFromLE(hash.digest()).umod(this.curve.n);
    };
    EDDSA.prototype.keyPair = function keyPair(options) {
      return new KeyPair(this, options);
    };
    EDDSA.prototype.keyFromPublic = function keyFromPublic(pub) {
      return KeyPair.fromPublic(this, pub);
    };
    EDDSA.prototype.keyFromSecret = function keyFromSecret(secret) {
      return KeyPair.fromSecret(this, secret);
    };
    EDDSA.prototype.genKeyPair = function genKeyPair(options) {
      if (!options) options = {};
      var drbg = new HmacDRBG({
        hash: this.hash,
        pers: options.pers,
        persEnc: options.persEnc || 'utf8',
        entropy: options.entropy || elliptic.rand(this.hash.hmacStrength),
        entropyEnc: options.entropy && options.entropyEnc || 'utf8',
        nonce: this.curve.n.toArray()
      });
      return this.keyFromSecret(drbg.generate(this.hash.outSize >> 3));
    };
    EDDSA.prototype.makeSignature = function makeSignature(sig) {
      if (sig instanceof Signature) return sig;
      return new Signature(this, sig);
    };
    EDDSA.prototype.encodePoint = function encodePoint(point) {
      var enc = point.getY().toArray('le', this.encodingLength);
      enc[this.encodingLength - 1] |= point.getX().isOdd() ? 0x80 : 0;
      return enc;
    };
    EDDSA.prototype.decodePoint = function decodePoint(bytes) {
      bytes = utils.parseBytes(bytes);
      var lastIx = bytes.length - 1;
      var normed = bytes.slice(0, lastIx).concat(bytes[lastIx] & ~0x80);
      var xIsOdd = (bytes[lastIx] & 0x80) !== 0;
      var y = utils.intFromLE(normed);
      return this.curve.pointFromY(y, xIsOdd);
    };
    EDDSA.prototype.encodeInt = function encodeInt(num) {
      return num.toArray('le', this.encodingLength);
    };
    EDDSA.prototype.decodeInt = function decodeInt(bytes) {
      return utils.intFromLE(bytes);
    };
    EDDSA.prototype.isPoint = function isPoint(val) {
      return val instanceof this.pointClass;
    };
    return eddsa;
  }
  var hasRequiredElliptic;
  function requireElliptic() {
    if (hasRequiredElliptic) return elliptic$2;
    hasRequiredElliptic = 1;
    (function (exports) {
      var elliptic = exports;
      elliptic.utils = utils$o;
      elliptic.rand = brorandExports;
      elliptic.curve = curve;
      elliptic.curves = curves$1;
      elliptic.ec = ec;
      elliptic.eddsa = requireEddsa();
    })(elliptic$2);
    return elliptic$2;
  }
  var ellipticExports = requireElliptic();
  var elliptic = getDefaultExportFromCjs(ellipticExports);
  var elliptic$1 = _mergeNamespaces({
    __proto__: null,
    default: elliptic
  }, [ellipticExports]);
  const namedOIDs = {
    "1.2.840.10045.3.1.7": "P-256",
    "P-256": "1.2.840.10045.3.1.7",
    "1.3.132.0.34": "P-384",
    "P-384": "1.3.132.0.34",
    "1.3.132.0.35": "P-521",
    "P-521": "1.3.132.0.35",
    "1.3.132.0.10": "K-256",
    "K-256": "1.3.132.0.10",
    "1.3.36.3.3.2.8.1.1.7": "brainpoolP256r1",
    "brainpoolP256r1": "1.3.36.3.3.2.8.1.1.7",
    "1.3.36.3.3.2.8.1.1.11": "brainpoolP384r1",
    "brainpoolP384r1": "1.3.36.3.3.2.8.1.1.11",
    "1.3.36.3.3.2.8.1.1.13": "brainpoolP512r1",
    "brainpoolP512r1": "1.3.36.3.3.2.8.1.1.13"
  };
  function getOidByNamedCurve$1(namedCurve) {
    const oid = namedOIDs[namedCurve];
    if (!oid) {
      throw new OperationError(`Cannot convert WebCrypto named curve '${namedCurve}' to OID`);
    }
    return oid;
  }
  class EcCryptoKey extends CryptoKey {
    constructor(algorithm, extractable, type, usages, data) {
      super(algorithm, extractable, type, usages);
      this.data = data;
    }
  }
  class EcCrypto {
    static checkLib() {
      if (typeof elliptic$1 === "undefined") {
        throw new OperationError("Cannot implement EC mechanism. Add 'https://peculiarventures.github.io/pv-webcrypto-tests/src/elliptic.js' script to your project");
      }
    }
    static generateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        const key = this.initEcKey(algorithm.namedCurve);
        const ecKey = key.genKeyPair();
        ecKey.getPublic();
        const prvKey = new EcCryptoKey(Object.assign({}, algorithm), extractable, "private", keyUsages.filter(usage => ~this.privateUsages.indexOf(usage)), ecKey);
        const pubKey = new EcCryptoKey(Object.assign({}, algorithm), true, "public", keyUsages.filter(usage => ~this.publicUsages.indexOf(usage)), ecKey);
        return {
          privateKey: prvKey,
          publicKey: pubKey
        };
      });
    }
    static checkCryptoKey(key) {
      if (!(key instanceof EcCryptoKey)) {
        throw new TypeError("key: Is not EcCryptoKey");
      }
    }
    static concat(...buf) {
      const res = new Uint8Array(buf.map(item => item.length).reduce((prev, cur) => prev + cur));
      let offset = 0;
      buf.forEach(item => {
        for (let i = 0; i < item.length; i++) {
          res[offset + i] = item[i];
        }
        offset += item.length;
      });
      return res;
    }
    static exportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        switch (format) {
          case "pkcs8":
            return this.exportPkcs8Key(key);
          case "spki":
            return this.exportSpkiKey(key);
          case "jwk":
            return this.exportJwkKey(key);
          case "raw":
            return new Uint8Array(key.data.getPublic("der")).buffer;
          default:
            throw new OperationError("format: Must be 'jwk', 'raw, 'pkcs8' or 'spki'");
        }
      });
    }
    static importKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        let ecKey;
        switch (format) {
          case "pkcs8":
            ecKey = this.importPkcs8Key(keyData, algorithm.namedCurve);
            break;
          case "spki":
            ecKey = this.importSpkiKey(keyData, algorithm.namedCurve);
            break;
          case "raw":
            ecKey = this.importEcKey(new index$1.EcPublicKey(keyData), algorithm.namedCurve);
            break;
          case "jwk":
            ecKey = this.importJwkKey(keyData);
            break;
          default:
            throw new OperationError("format: Must be 'jwk', 'raw', 'pkcs8' or 'spki'");
        }
        const key = new EcCryptoKey(Object.assign({}, algorithm), extractable, ecKey.priv ? "private" : "public", keyUsages, ecKey);
        return key;
      });
    }
    static getNamedCurve(wcNamedCurve) {
      const crv = wcNamedCurve.toUpperCase();
      let res = "";
      if (["P-256", "P-384", "P-521"].indexOf(crv) > -1) {
        res = crv.replace("-", "").toLowerCase();
      } else if (crv === "K-256") {
        res = "secp256k1";
      } else if (["brainpoolP256r1", "brainpoolP384r1", "brainpoolP512r1"].includes(wcNamedCurve)) {
        res = wcNamedCurve;
      } else {
        throw new OperationError(`Unsupported named curve '${wcNamedCurve}'`);
      }
      return res;
    }
    static initEcKey(namedCurve) {
      return ellipticExports.ec(this.getNamedCurve(namedCurve));
    }
    static exportPkcs8Key(key) {
      const keyInfo = new index$1.PrivateKeyInfo();
      keyInfo.privateKeyAlgorithm.algorithm = this.ASN_ALGORITHM;
      keyInfo.privateKeyAlgorithm.parameters = AsnConvert.serialize(new index$1.ObjectIdentifier(getOidByNamedCurve$1(key.algorithm.namedCurve)));
      keyInfo.privateKey = AsnConvert.serialize(this.exportEcKey(key));
      return AsnConvert.serialize(keyInfo);
    }
    static importPkcs8Key(data, namedCurve) {
      const keyInfo = AsnConvert.parse(data, index$1.PrivateKeyInfo);
      const privateKey = AsnConvert.parse(keyInfo.privateKey, index$1.EcPrivateKey);
      return this.importEcKey(privateKey, namedCurve);
    }
    static importSpkiKey(data, namedCurve) {
      const keyInfo = AsnConvert.parse(data, index$1.PublicKeyInfo);
      const publicKey = new index$1.EcPublicKey(keyInfo.publicKey);
      return this.importEcKey(publicKey, namedCurve);
    }
    static exportSpkiKey(key) {
      const publicKey = new index$1.EcPublicKey(new Uint8Array(key.data.getPublic("der")).buffer);
      const keyInfo = new index$1.PublicKeyInfo();
      keyInfo.publicKeyAlgorithm.algorithm = this.ASN_ALGORITHM;
      keyInfo.publicKeyAlgorithm.parameters = AsnConvert.serialize(new index$1.ObjectIdentifier(getOidByNamedCurve$1(key.algorithm.namedCurve)));
      keyInfo.publicKey = publicKey.value;
      return AsnConvert.serialize(keyInfo);
    }
    static importJwkKey(data) {
      let key;
      if (data.d) {
        key = JsonParser.fromJSON(data, {
          targetSchema: index$1.EcPrivateKey
        });
      } else {
        key = JsonParser.fromJSON(data, {
          targetSchema: index$1.EcPublicKey
        });
      }
      return this.importEcKey(key, data.crv);
    }
    static exportJwkKey(key) {
      const asnKey = this.exportEcKey(key);
      const jwk = JsonSerializer.toJSON(asnKey);
      jwk.ext = true;
      jwk.key_ops = key.usages;
      jwk.crv = key.algorithm.namedCurve;
      jwk.kty = "EC";
      return jwk;
    }
    static exportEcKey(ecKey) {
      if (ecKey.type === "private") {
        const privateKey = new index$1.EcPrivateKey();
        const point = new Uint8Array(ecKey.data.getPrivate("der").toArray());
        const pointPad = new Uint8Array(this.getPointSize(ecKey.algorithm.namedCurve) - point.length);
        privateKey.privateKey = concat(pointPad, point);
        privateKey.publicKey = new Uint8Array(ecKey.data.getPublic("der"));
        return privateKey;
      } else if (ecKey.data.pub) {
        return new index$1.EcPublicKey(new Uint8Array(ecKey.data.getPublic("der")).buffer);
      } else {
        throw new Error("Cannot get private or public key");
      }
    }
    static importEcKey(key, namedCurve) {
      const ecKey = this.initEcKey(namedCurve);
      if (key instanceof index$1.EcPublicKey) {
        return ecKey.keyFromPublic(new Uint8Array(key.value));
      }
      return ecKey.keyFromPrivate(new Uint8Array(key.privateKey));
    }
    static getPointSize(namedCurve) {
      switch (namedCurve) {
        case "P-256":
        case "K-256":
          return 32;
        case "P-384":
          return 48;
        case "P-521":
          return 66;
      }
      throw new Error("namedCurve: Is not recognized");
    }
  }
  EcCrypto.privateUsages = ["sign", "deriveKey", "deriveBits"];
  EcCrypto.publicUsages = ["verify"];
  EcCrypto.ASN_ALGORITHM = "1.2.840.10045.2.1";
  class EcdhProvider extends EcdhProvider$1 {
    constructor() {
      super(...arguments);
      this.namedCurves = ["P-256", "P-384", "P-521", "K-256", "brainpoolP256r1", "brainpoolP384r1", "brainpoolP512r1"];
    }
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return EcCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return EcCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return EcCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    onDeriveBits(algorithm, baseKey, length) {
      return __awaiter(this, void 0, void 0, function* () {
        EcCrypto.checkLib();
        const shared = baseKey.data.derive(algorithm.public.data.getPublic());
        let array = new Uint8Array(shared.toArray());
        let len = array.length;
        len = len > 32 ? len > 48 ? 66 : 48 : 32;
        if (array.length < len) {
          array = EcCrypto.concat(new Uint8Array(len - array.length), array);
        }
        const buf = array.slice(0, length / 8).buffer;
        return buf;
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      EcCrypto.checkCryptoKey(key);
    }
  }
  function b2a(buffer) {
    const buf = new Uint8Array(buffer);
    const res = [];
    for (let i = 0; i < buf.length; i++) {
      res.push(buf[i]);
    }
    return res;
  }
  class EcdsaProvider extends EcdsaProvider$1 {
    constructor() {
      super(...arguments);
      this.hashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512", "SHA3-256", "SHA3-384", "SHA3-512"];
      this.namedCurves = ["P-256", "P-384", "P-521", "K-256", "brainpoolP256r1", "brainpoolP384r1", "brainpoolP512r1"];
    }
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return EcCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return EcCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return EcCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    onSign(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        EcCrypto.checkLib();
        const crypto = new Crypto();
        const hash = yield crypto.subtle.digest(algorithm.hash, data);
        const array = b2a(hash);
        const signature = yield key.data.sign(array);
        const asnSignature = new index$1.EcDsaSignature();
        asnSignature.r = new Uint8Array(signature.r.toArray()).buffer;
        asnSignature.s = new Uint8Array(signature.s.toArray()).buffer;
        return asnSignature.toWebCryptoSignature();
      });
    }
    onVerify(algorithm, key, signature, data) {
      return __awaiter(this, void 0, void 0, function* () {
        EcCrypto.checkLib();
        const crypto = new Crypto();
        const sig = {
          r: new Uint8Array(signature.slice(0, signature.byteLength / 2)),
          s: new Uint8Array(signature.slice(signature.byteLength / 2))
        };
        const hashedData = yield crypto.subtle.digest(algorithm.hash, data);
        const array = b2a(hashedData);
        return key.data.verify(array, sig);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      EcCrypto.checkCryptoKey(key);
    }
  }
  const edOIDs = {
    [index$1.idEd448]: "Ed448",
    "ed448": index$1.idEd448,
    [index$1.idX448]: "X448",
    "x448": index$1.idX448,
    [index$1.idEd25519]: "Ed25519",
    "ed25519": index$1.idEd25519,
    [index$1.idX25519]: "X25519",
    "x25519": index$1.idX25519
  };
  function getOidByNamedCurve(namedCurve) {
    const oid = edOIDs[namedCurve.toLowerCase()];
    if (!oid) {
      throw new OperationError(`Cannot convert WebCrypto named curve '${namedCurve}' to OID`);
    }
    return oid;
  }
  class EdPrivateKey extends CryptoKey {
    constructor(algorithm, extractable, usages, data) {
      super(algorithm, extractable, "private", usages);
      this.data = data;
    }
    toJSON() {
      const json = {
        kty: "OKP",
        crv: this.algorithm.namedCurve,
        key_ops: this.usages,
        ext: this.extractable
      };
      return Object.assign(json, {
        d: Convert.ToBase64Url(Convert.FromHex(/^ed/i.test(json.crv) ? this.data.getSecret("hex") : this.data.getPrivate("hex")))
      });
    }
    fromJSON(json) {
      if (!json.d) {
        throw new OperationError(`Cannot get private data from JWK. Property 'd' is required`);
      }
      if (!json.crv) {
        throw new OperationError(`Cannot get named curve from JWK. Property 'crv' is required`);
      }
      const hexPrivateKey = Convert.ToHex(Convert.FromBase64Url(json.d));
      if (/^ed/i.test(json.crv)) {
        const eddsa = new ellipticExports.eddsa("ed25519");
        this.data = eddsa.keyFromSecret(hexPrivateKey);
      } else {
        const ecdhEs = ellipticExports.ec(json.crv.replace(/^x/i, "curve"));
        this.data = ecdhEs.keyFromPrivate(hexPrivateKey, "hex");
      }
      return this;
    }
  }
  class EdPublicKey extends CryptoKey {
    constructor(algorithm, extractable, usages, data) {
      super(algorithm, extractable, "public", usages);
      this.data = data;
    }
    toJSON() {
      const json = {
        kty: "OKP",
        crv: this.algorithm.namedCurve,
        key_ops: this.usages,
        ext: this.extractable
      };
      return Object.assign(json, {
        x: Convert.ToBase64Url(Convert.FromHex(this.data.getPublic("hex")))
      });
    }
    fromJSON(json) {
      if (!json.crv) {
        throw new OperationError(`Cannot get named curve from JWK. Property 'crv' is required`);
      }
      if (!json.x) {
        throw new OperationError(`Cannot get property from JWK. Property 'x' is required`);
      }
      const hexPublicKey = Convert.ToHex(Convert.FromBase64Url(json.x));
      if (/^ed/i.test(json.crv)) {
        const eddsa = new ellipticExports.eddsa(json.crv.toLowerCase());
        this.data = eddsa.keyFromPublic(hexPublicKey, "hex");
      } else {
        const ecdhEs = ellipticExports.ec(json.crv.replace(/^x/i, "curve"));
        this.data = ecdhEs.keyFromPublic(hexPublicKey, "hex");
      }
      return this;
    }
  }
  class EdCrypto {
    static checkLib() {
      if (typeof elliptic$1 === "undefined") {
        throw new OperationError("Cannot implement EC mechanism. Add 'https://peculiarventures.github.io/pv-webcrypto-tests/src/elliptic.js' script to your project");
      }
    }
    static concat(...buf) {
      const res = new Uint8Array(buf.map(item => item.length).reduce((prev, cur) => prev + cur));
      let offset = 0;
      buf.forEach(item => {
        for (let i = 0; i < item.length; i++) {
          res[offset + i] = item[i];
        }
        offset += item.length;
      });
      return res;
    }
    static generateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        const curve = "ed25519";
        let edKey;
        {
          const raw = exports.nativeCrypto.getRandomValues(new Uint8Array(32));
          const eddsa = new ellipticExports.eddsa(curve);
          edKey = eddsa.keyFromSecret(raw);
        }
        const prvKey = new EdPrivateKey(algorithm, extractable, keyUsages.filter(usage => this.privateKeyUsages.indexOf(usage) !== -1), edKey);
        const pubKey = new EdPublicKey(algorithm, true, keyUsages.filter(usage => this.publicKeyUsages.indexOf(usage) !== -1), edKey);
        return {
          privateKey: prvKey,
          publicKey: pubKey
        };
      });
    }
    static sign(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        const array = b2a(data);
        const signature = key.data.sign(array).toHex();
        return Convert.FromHex(signature);
      });
    }
    static verify(algorithm, key, signature, data) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        const array = b2a(data);
        const ok = key.data.verify(array, Convert.ToHex(signature));
        return ok;
      });
    }
    static deriveBits(algorithm, baseKey, length) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        const key = new Uint8Array(Convert.FromHex(baseKey.data.getSecret("hex")));
        const ecdh = new ellipticExports.ec("curve25519");
        const privateKey = ecdh.keyFromPrivate(Convert.ToHex(key), "hex");
        const publicHex = algorithm.public.data.getPublic("hex");
        new Uint8Array(Convert.FromHex(publicHex));
        const publicKey = algorithm.public.data.getPublic();
        const shared = privateKey.derive(publicKey);
        let array = new Uint8Array(shared.toArray());
        let len = array.length;
        len = len > 32 ? len > 48 ? 66 : 48 : 32;
        if (array.length < len) {
          array = EdCrypto.concat(new Uint8Array(len - array.length), array);
        }
        const buf = array.slice(0, length / 8).buffer;
        return buf;
      });
    }
    static exportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        switch (format.toLowerCase()) {
          case "jwk":
            return JsonSerializer.toJSON(key);
          case "pkcs8":
            {
              const raw = Convert.FromHex(key.data.getSecret("hex"));
              const keyInfo = new index$1.PrivateKeyInfo();
              keyInfo.privateKeyAlgorithm.algorithm = getOidByNamedCurve(key.algorithm.namedCurve);
              keyInfo.privateKey = AsnConvert.serialize(new OctetString(raw));
              return AsnConvert.serialize(keyInfo);
            }
          case "spki":
            {
              const raw = Convert.FromHex(key.data.getPublic("hex"));
              const keyInfo = new index$1.PublicKeyInfo();
              keyInfo.publicKeyAlgorithm.algorithm = getOidByNamedCurve(key.algorithm.namedCurve);
              keyInfo.publicKey = raw;
              return AsnConvert.serialize(keyInfo);
            }
          case "raw":
            {
              return Convert.FromHex(key.data.getPublic("hex"));
            }
          default:
            throw new OperationError("format: Must be 'jwk', 'raw', pkcs8' or 'spki'");
        }
      });
    }
    static importKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        switch (format.toLowerCase()) {
          case "jwk":
            {
              const jwk = keyData;
              if (jwk.d) {
                const asnKey = JsonParser.fromJSON(keyData, {
                  targetSchema: index$1.CurvePrivateKey
                });
                return this.importPrivateKey(asnKey, algorithm, extractable, keyUsages);
              } else {
                if (!jwk.x) {
                  throw new TypeError("keyData: Cannot get required 'x' field");
                }
                return this.importPublicKey(Convert.FromBase64Url(jwk.x), algorithm, extractable, keyUsages);
              }
            }
          case "raw":
            {
              return this.importPublicKey(keyData, algorithm, extractable, keyUsages);
            }
          case "spki":
            {
              const keyInfo = AsnConvert.parse(new Uint8Array(keyData), index$1.PublicKeyInfo);
              return this.importPublicKey(keyInfo.publicKey, algorithm, extractable, keyUsages);
            }
          case "pkcs8":
            {
              const keyInfo = AsnConvert.parse(new Uint8Array(keyData), index$1.PrivateKeyInfo);
              const asnKey = AsnConvert.parse(keyInfo.privateKey, index$1.CurvePrivateKey);
              return this.importPrivateKey(asnKey, algorithm, extractable, keyUsages);
            }
          default:
            throw new OperationError("format: Must be 'jwk', 'raw', 'pkcs8' or 'spki'");
        }
      });
    }
    static importPrivateKey(asnKey, algorithm, extractable, keyUsages) {
      const key = new EdPrivateKey(Object.assign({}, algorithm), extractable, keyUsages, null);
      key.fromJSON({
        crv: algorithm.namedCurve,
        d: Convert.ToBase64Url(asnKey.d)
      });
      return key;
    }
    static importPublicKey(asnKey, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        const key = new EdPublicKey(Object.assign({}, algorithm), extractable, keyUsages, null);
        key.fromJSON({
          crv: algorithm.namedCurve,
          x: Convert.ToBase64Url(asnKey)
        });
        return key;
      });
    }
  }
  EdCrypto.publicKeyUsages = ["verify"];
  EdCrypto.privateKeyUsages = ["sign", "deriveKey", "deriveBits"];
  class EdDsaProvider extends EdDsaProvider$1 {
    constructor() {
      super(...arguments);
      this.namedCurves = ["Ed25519"];
    }
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        const keys = yield EdCrypto.generateKey({
          name: this.name,
          namedCurve: algorithm.namedCurve.replace(/^ed/i, "Ed")
        }, extractable, keyUsages);
        return keys;
      });
    }
    onSign(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return EdCrypto.sign(algorithm, key, new Uint8Array(data));
      });
    }
    onVerify(algorithm, key, signature, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return EdCrypto.verify(algorithm, key, new Uint8Array(signature), new Uint8Array(data));
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return EdCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        const key = yield EdCrypto.importKey(format, keyData, Object.assign(Object.assign({}, algorithm), {
          name: this.name
        }), extractable, keyUsages);
        return key;
      });
    }
  }
  class EcdhEsProvider extends EcdhEsProvider$1 {
    constructor() {
      super(...arguments);
      this.namedCurves = ["X25519"];
    }
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        const keys = yield EdCrypto.generateKey({
          name: this.name,
          namedCurve: algorithm.namedCurve.replace(/^x/i, "X")
        }, extractable, keyUsages);
        return keys;
      });
    }
    onDeriveBits(algorithm, baseKey, length) {
      return __awaiter(this, void 0, void 0, function* () {
        const bits = yield EdCrypto.deriveBits(Object.assign(Object.assign({}, algorithm), {
          public: algorithm.public
        }), baseKey, length);
        return bits;
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return EdCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        const key = yield EdCrypto.importKey(format, keyData, Object.assign(Object.assign({}, algorithm), {
          name: this.name
        }), extractable, keyUsages);
        return key;
      });
    }
  }
  class Sha1Provider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.name = "SHA-1";
      this.usages = [];
    }
    onDigest(algorithm, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return ShaCrypto.digest(algorithm, data);
      });
    }
  }
  class Sha256Provider extends Sha1Provider {
    constructor() {
      super(...arguments);
      this.name = "SHA-256";
    }
  }
  class Sha512Provider extends Sha1Provider {
    constructor() {
      super(...arguments);
      this.name = "SHA-512";
    }
  }
  var sha3 = {};
  var binary = {};
  var int = {};
  (function (exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function imulShim(a, b) {
      var ah = a >>> 16 & 0xffff,
        al = a & 0xffff;
      var bh = b >>> 16 & 0xffff,
        bl = b & 0xffff;
      return al * bl + (ah * bl + al * bh << 16 >>> 0) | 0;
    }
    exports.mul = Math.imul || imulShim;
    function add(a, b) {
      return a + b | 0;
    }
    exports.add = add;
    function sub(a, b) {
      return a - b | 0;
    }
    exports.sub = sub;
    function rotl(x, n) {
      return x << n | x >>> 32 - n;
    }
    exports.rotl = rotl;
    function rotr(x, n) {
      return x << 32 - n | x >>> n;
    }
    exports.rotr = rotr;
    function isIntegerShim(n) {
      return typeof n === "number" && isFinite(n) && Math.floor(n) === n;
    }
    exports.isInteger = Number.isInteger || isIntegerShim;
    exports.MAX_SAFE_INTEGER = 9007199254740991;
    exports.isSafeInteger = function (n) {
      return exports.isInteger(n) && n >= -exports.MAX_SAFE_INTEGER && n <= exports.MAX_SAFE_INTEGER;
    };
  })(int);
  Object.defineProperty(binary, "__esModule", {
    value: true
  });
  var int_1 = int;
  function readInt16BE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    return (array[offset + 0] << 8 | array[offset + 1]) << 16 >> 16;
  }
  binary.readInt16BE = readInt16BE;
  function readUint16BE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    return (array[offset + 0] << 8 | array[offset + 1]) >>> 0;
  }
  binary.readUint16BE = readUint16BE;
  function readInt16LE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    return (array[offset + 1] << 8 | array[offset]) << 16 >> 16;
  }
  binary.readInt16LE = readInt16LE;
  function readUint16LE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    return (array[offset + 1] << 8 | array[offset]) >>> 0;
  }
  binary.readUint16LE = readUint16LE;
  function writeUint16BE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(2);
    }
    if (offset === void 0) {
      offset = 0;
    }
    out[offset + 0] = value >>> 8;
    out[offset + 1] = value >>> 0;
    return out;
  }
  binary.writeUint16BE = writeUint16BE;
  binary.writeInt16BE = writeUint16BE;
  function writeUint16LE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(2);
    }
    if (offset === void 0) {
      offset = 0;
    }
    out[offset + 0] = value >>> 0;
    out[offset + 1] = value >>> 8;
    return out;
  }
  binary.writeUint16LE = writeUint16LE;
  binary.writeInt16LE = writeUint16LE;
  function readInt32BE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    return array[offset] << 24 | array[offset + 1] << 16 | array[offset + 2] << 8 | array[offset + 3];
  }
  binary.readInt32BE = readInt32BE;
  function readUint32BE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    return (array[offset] << 24 | array[offset + 1] << 16 | array[offset + 2] << 8 | array[offset + 3]) >>> 0;
  }
  binary.readUint32BE = readUint32BE;
  function readInt32LE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    return array[offset + 3] << 24 | array[offset + 2] << 16 | array[offset + 1] << 8 | array[offset];
  }
  binary.readInt32LE = readInt32LE;
  function readUint32LE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    return (array[offset + 3] << 24 | array[offset + 2] << 16 | array[offset + 1] << 8 | array[offset]) >>> 0;
  }
  binary.readUint32LE = readUint32LE;
  function writeUint32BE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(4);
    }
    if (offset === void 0) {
      offset = 0;
    }
    out[offset + 0] = value >>> 24;
    out[offset + 1] = value >>> 16;
    out[offset + 2] = value >>> 8;
    out[offset + 3] = value >>> 0;
    return out;
  }
  binary.writeUint32BE = writeUint32BE;
  binary.writeInt32BE = writeUint32BE;
  function writeUint32LE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(4);
    }
    if (offset === void 0) {
      offset = 0;
    }
    out[offset + 0] = value >>> 0;
    out[offset + 1] = value >>> 8;
    out[offset + 2] = value >>> 16;
    out[offset + 3] = value >>> 24;
    return out;
  }
  binary.writeUint32LE = writeUint32LE;
  binary.writeInt32LE = writeUint32LE;
  function readInt64BE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    var hi = readInt32BE(array, offset);
    var lo = readInt32BE(array, offset + 4);
    return hi * 0x100000000 + lo - (lo >> 31) * 0x100000000;
  }
  binary.readInt64BE = readInt64BE;
  function readUint64BE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    var hi = readUint32BE(array, offset);
    var lo = readUint32BE(array, offset + 4);
    return hi * 0x100000000 + lo;
  }
  binary.readUint64BE = readUint64BE;
  function readInt64LE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    var lo = readInt32LE(array, offset);
    var hi = readInt32LE(array, offset + 4);
    return hi * 0x100000000 + lo - (lo >> 31) * 0x100000000;
  }
  binary.readInt64LE = readInt64LE;
  function readUint64LE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    var lo = readUint32LE(array, offset);
    var hi = readUint32LE(array, offset + 4);
    return hi * 0x100000000 + lo;
  }
  binary.readUint64LE = readUint64LE;
  function writeUint64BE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(8);
    }
    if (offset === void 0) {
      offset = 0;
    }
    writeUint32BE(value / 0x100000000 >>> 0, out, offset);
    writeUint32BE(value >>> 0, out, offset + 4);
    return out;
  }
  binary.writeUint64BE = writeUint64BE;
  binary.writeInt64BE = writeUint64BE;
  function writeUint64LE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(8);
    }
    if (offset === void 0) {
      offset = 0;
    }
    writeUint32LE(value >>> 0, out, offset);
    writeUint32LE(value / 0x100000000 >>> 0, out, offset + 4);
    return out;
  }
  binary.writeUint64LE = writeUint64LE;
  binary.writeInt64LE = writeUint64LE;
  function readUintBE(bitLength, array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    if (bitLength % 8 !== 0) {
      throw new Error("readUintBE supports only bitLengths divisible by 8");
    }
    if (bitLength / 8 > array.length - offset) {
      throw new Error("readUintBE: array is too short for the given bitLength");
    }
    var result = 0;
    var mul = 1;
    for (var i = bitLength / 8 + offset - 1; i >= offset; i--) {
      result += array[i] * mul;
      mul *= 256;
    }
    return result;
  }
  binary.readUintBE = readUintBE;
  function readUintLE(bitLength, array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    if (bitLength % 8 !== 0) {
      throw new Error("readUintLE supports only bitLengths divisible by 8");
    }
    if (bitLength / 8 > array.length - offset) {
      throw new Error("readUintLE: array is too short for the given bitLength");
    }
    var result = 0;
    var mul = 1;
    for (var i = offset; i < offset + bitLength / 8; i++) {
      result += array[i] * mul;
      mul *= 256;
    }
    return result;
  }
  binary.readUintLE = readUintLE;
  function writeUintBE(bitLength, value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(bitLength / 8);
    }
    if (offset === void 0) {
      offset = 0;
    }
    if (bitLength % 8 !== 0) {
      throw new Error("writeUintBE supports only bitLengths divisible by 8");
    }
    if (!int_1.isSafeInteger(value)) {
      throw new Error("writeUintBE value must be an integer");
    }
    var div = 1;
    for (var i = bitLength / 8 + offset - 1; i >= offset; i--) {
      out[i] = value / div & 0xff;
      div *= 256;
    }
    return out;
  }
  binary.writeUintBE = writeUintBE;
  function writeUintLE(bitLength, value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(bitLength / 8);
    }
    if (offset === void 0) {
      offset = 0;
    }
    if (bitLength % 8 !== 0) {
      throw new Error("writeUintLE supports only bitLengths divisible by 8");
    }
    if (!int_1.isSafeInteger(value)) {
      throw new Error("writeUintLE value must be an integer");
    }
    var div = 1;
    for (var i = offset; i < offset + bitLength / 8; i++) {
      out[i] = value / div & 0xff;
      div *= 256;
    }
    return out;
  }
  binary.writeUintLE = writeUintLE;
  function readFloat32BE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    var view = new DataView(array.buffer, array.byteOffset, array.byteLength);
    return view.getFloat32(offset);
  }
  binary.readFloat32BE = readFloat32BE;
  function readFloat32LE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    var view = new DataView(array.buffer, array.byteOffset, array.byteLength);
    return view.getFloat32(offset, true);
  }
  binary.readFloat32LE = readFloat32LE;
  function readFloat64BE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    var view = new DataView(array.buffer, array.byteOffset, array.byteLength);
    return view.getFloat64(offset);
  }
  binary.readFloat64BE = readFloat64BE;
  function readFloat64LE(array, offset) {
    if (offset === void 0) {
      offset = 0;
    }
    var view = new DataView(array.buffer, array.byteOffset, array.byteLength);
    return view.getFloat64(offset, true);
  }
  binary.readFloat64LE = readFloat64LE;
  function writeFloat32BE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(4);
    }
    if (offset === void 0) {
      offset = 0;
    }
    var view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    view.setFloat32(offset, value);
    return out;
  }
  binary.writeFloat32BE = writeFloat32BE;
  function writeFloat32LE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(4);
    }
    if (offset === void 0) {
      offset = 0;
    }
    var view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    view.setFloat32(offset, value, true);
    return out;
  }
  binary.writeFloat32LE = writeFloat32LE;
  function writeFloat64BE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(8);
    }
    if (offset === void 0) {
      offset = 0;
    }
    var view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    view.setFloat64(offset, value);
    return out;
  }
  binary.writeFloat64BE = writeFloat64BE;
  function writeFloat64LE(value, out, offset) {
    if (out === void 0) {
      out = new Uint8Array(8);
    }
    if (offset === void 0) {
      offset = 0;
    }
    var view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    view.setFloat64(offset, value, true);
    return out;
  }
  binary.writeFloat64LE = writeFloat64LE;
  var wipe$1 = {};
  Object.defineProperty(wipe$1, "__esModule", {
    value: true
  });
  function wipe(array) {
    for (var i = 0; i < array.length; i++) {
      array[i] = 0;
    }
    return array;
  }
  wipe$1.wipe = wipe;
  var __extends = commonjsGlobal && commonjsGlobal.__extends || function () {
    var extendStatics = function (d, b) {
      extendStatics = Object.setPrototypeOf || {
        __proto__: []
      } instanceof Array && function (d, b) {
        d.__proto__ = b;
      } || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
      };
      return extendStatics(d, b);
    };
    return function (d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  Object.defineProperty(sha3, "__esModule", {
    value: true
  });
  var binary_1 = binary;
  var wipe_1 = wipe$1;
  var Keccak = function () {
    function Keccak(capacity) {
      if (capacity === void 0) {
        capacity = 32;
      }
      this.capacity = capacity;
      this._sh = new Int32Array(25);
      this._sl = new Int32Array(25);
      this._state = new Uint8Array(200);
      this._pos = 0;
      this._finished = false;
      this.clean = this.reset;
      if (capacity <= 0 || capacity > 128) {
        throw new Error("SHA3: incorrect capacity");
      }
      this.blockSize = 200 - capacity;
    }
    Keccak.prototype.reset = function () {
      wipe_1.wipe(this._sh);
      wipe_1.wipe(this._sl);
      wipe_1.wipe(this._state);
      this._pos = 0;
      this._finished = false;
      return this;
    };
    Keccak.prototype.update = function (data) {
      if (this._finished) {
        throw new Error("SHA3: can't update because hash was finished");
      }
      for (var i = 0; i < data.length; i++) {
        this._state[this._pos++] ^= data[i];
        if (this._pos >= this.blockSize) {
          keccakf(this._sh, this._sl, this._state);
          this._pos = 0;
        }
      }
      return this;
    };
    Keccak.prototype._padAndPermute = function (paddingByte) {
      this._state[this._pos] ^= paddingByte;
      this._state[this.blockSize - 1] ^= 0x80;
      keccakf(this._sh, this._sl, this._state);
      this._finished = true;
      this._pos = 0;
    };
    Keccak.prototype._squeeze = function (dst) {
      if (!this._finished) {
        throw new Error("SHA3: squeezing before padAndPermute");
      }
      for (var i = 0; i < dst.length; i++) {
        if (this._pos === this.blockSize) {
          keccakf(this._sh, this._sl, this._state);
          this._pos = 0;
        }
        dst[i] = this._state[this._pos++];
      }
    };
    return Keccak;
  }();
  sha3.Keccak = Keccak;
  var SHA3 = function (_super) {
    __extends(SHA3, _super);
    function SHA3(digestLength) {
      if (digestLength === void 0) {
        digestLength = 32;
      }
      var _this = _super.call(this, digestLength * 2) || this;
      _this.digestLength = digestLength;
      return _this;
    }
    SHA3.prototype.finish = function (dst) {
      if (!this._finished) {
        this._padAndPermute(0x06);
      } else {
        this._pos = 0;
      }
      this._squeeze(dst);
      return this;
    };
    SHA3.prototype.digest = function () {
      var out = new Uint8Array(this.digestLength);
      this.finish(out);
      return out;
    };
    SHA3.prototype.saveState = function () {
      if (this._finished) {
        throw new Error("SHA3: cannot save finished state");
      }
      return new Uint8Array(this._state.subarray(0, this._pos));
    };
    SHA3.prototype.restoreState = function (savedState) {
      this._state.set(savedState);
      this._pos = savedState.length;
      this._finished = false;
      return this;
    };
    SHA3.prototype.cleanSavedState = function (savedState) {
      wipe_1.wipe(savedState);
    };
    return SHA3;
  }(Keccak);
  sha3.SHA3 = SHA3;
  var SHA3224 = function (_super) {
    __extends(SHA3224, _super);
    function SHA3224() {
      return _super.call(this, 224 / 8) || this;
    }
    return SHA3224;
  }(SHA3);
  sha3.SHA3224 = SHA3224;
  var SHA3256 = function (_super) {
    __extends(SHA3256, _super);
    function SHA3256() {
      return _super.call(this, 256 / 8) || this;
    }
    return SHA3256;
  }(SHA3);
  sha3.SHA3256 = SHA3256;
  var SHA3384 = function (_super) {
    __extends(SHA3384, _super);
    function SHA3384() {
      return _super.call(this, 384 / 8) || this;
    }
    return SHA3384;
  }(SHA3);
  sha3.SHA3384 = SHA3384;
  var SHA3512 = function (_super) {
    __extends(SHA3512, _super);
    function SHA3512() {
      return _super.call(this, 512 / 8) || this;
    }
    return SHA3512;
  }(SHA3);
  sha3.SHA3512 = SHA3512;
  function hash(digestLength, data) {
    var h = new SHA3(digestLength);
    h.update(data);
    var digest = h.digest();
    h.clean();
    return digest;
  }
  sha3.hash = hash;
  sha3.hash224 = function (data) {
    return hash(224 / 8, data);
  };
  var hash256 = sha3.hash256 = function (data) {
    return hash(256 / 8, data);
  };
  var hash384 = sha3.hash384 = function (data) {
    return hash(384 / 8, data);
  };
  var hash512 = sha3.hash512 = function (data) {
    return hash(512 / 8, data);
  };
  var SHAKE = function (_super) {
    __extends(SHAKE, _super);
    function SHAKE(bitSize) {
      var _this = _super.call(this, bitSize / 8 * 2) || this;
      _this.bitSize = bitSize;
      return _this;
    }
    SHAKE.prototype.stream = function (dst) {
      if (!this._finished) {
        this._padAndPermute(0x1f);
      }
      this._squeeze(dst);
    };
    return SHAKE;
  }(Keccak);
  sha3.SHAKE = SHAKE;
  var SHAKE128 = function (_super) {
    __extends(SHAKE128, _super);
    function SHAKE128() {
      return _super.call(this, 128) || this;
    }
    return SHAKE128;
  }(SHAKE);
  var SHAKE128_1 = sha3.SHAKE128 = SHAKE128;
  var SHAKE256 = function (_super) {
    __extends(SHAKE256, _super);
    function SHAKE256() {
      return _super.call(this, 256) || this;
    }
    return SHAKE256;
  }(SHAKE);
  var SHAKE256_1 = sha3.SHAKE256 = SHAKE256;
  var RNDC_HI = new Int32Array([0x00000000, 0x00000000, 0x80000000, 0x80000000, 0x00000000, 0x00000000, 0x80000000, 0x80000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x80000000, 0x80000000, 0x80000000, 0x80000000, 0x80000000, 0x00000000, 0x80000000, 0x80000000, 0x80000000, 0x00000000, 0x80000000]);
  var RNDC_LO = new Int32Array([0x00000001, 0x00008082, 0x0000808a, 0x80008000, 0x0000808b, 0x80000001, 0x80008081, 0x00008009, 0x0000008a, 0x00000088, 0x80008009, 0x8000000a, 0x8000808b, 0x0000008b, 0x00008089, 0x00008003, 0x00008002, 0x00000080, 0x0000800a, 0x8000000a, 0x80008081, 0x00008080, 0x80000001, 0x80008008]);
  function keccakf(sh, sl, buf) {
    var bch0, bch1, bch2, bch3, bch4;
    var bcl0, bcl1, bcl2, bcl3, bcl4;
    var th, tl;
    for (var i = 0; i < 25; i++) {
      sl[i] = binary_1.readUint32LE(buf, i * 8);
      sh[i] = binary_1.readUint32LE(buf, i * 8 + 4);
    }
    for (var r = 0; r < 24; r++) {
      bch0 = sh[0] ^ sh[5] ^ sh[10] ^ sh[15] ^ sh[20];
      bch1 = sh[1] ^ sh[6] ^ sh[11] ^ sh[16] ^ sh[21];
      bch2 = sh[2] ^ sh[7] ^ sh[12] ^ sh[17] ^ sh[22];
      bch3 = sh[3] ^ sh[8] ^ sh[13] ^ sh[18] ^ sh[23];
      bch4 = sh[4] ^ sh[9] ^ sh[14] ^ sh[19] ^ sh[24];
      bcl0 = sl[0] ^ sl[5] ^ sl[10] ^ sl[15] ^ sl[20];
      bcl1 = sl[1] ^ sl[6] ^ sl[11] ^ sl[16] ^ sl[21];
      bcl2 = sl[2] ^ sl[7] ^ sl[12] ^ sl[17] ^ sl[22];
      bcl3 = sl[3] ^ sl[8] ^ sl[13] ^ sl[18] ^ sl[23];
      bcl4 = sl[4] ^ sl[9] ^ sl[14] ^ sl[19] ^ sl[24];
      th = bch4 ^ (bch1 << 1 | bcl1 >>> 32 - 1);
      tl = bcl4 ^ (bcl1 << 1 | bch1 >>> 32 - 1);
      sh[0] ^= th;
      sh[5] ^= th;
      sh[10] ^= th;
      sh[15] ^= th;
      sh[20] ^= th;
      sl[0] ^= tl;
      sl[5] ^= tl;
      sl[10] ^= tl;
      sl[15] ^= tl;
      sl[20] ^= tl;
      th = bch0 ^ (bch2 << 1 | bcl2 >>> 32 - 1);
      tl = bcl0 ^ (bcl2 << 1 | bch2 >>> 32 - 1);
      sh[1] ^= th;
      sh[6] ^= th;
      sh[11] ^= th;
      sh[16] ^= th;
      sh[21] ^= th;
      sl[1] ^= tl;
      sl[6] ^= tl;
      sl[11] ^= tl;
      sl[16] ^= tl;
      sl[21] ^= tl;
      th = bch1 ^ (bch3 << 1 | bcl3 >>> 32 - 1);
      tl = bcl1 ^ (bcl3 << 1 | bch3 >>> 32 - 1);
      sh[2] ^= th;
      sh[7] ^= th;
      sh[12] ^= th;
      sh[17] ^= th;
      sh[22] ^= th;
      sl[2] ^= tl;
      sl[7] ^= tl;
      sl[12] ^= tl;
      sl[17] ^= tl;
      sl[22] ^= tl;
      th = bch2 ^ (bch4 << 1 | bcl4 >>> 32 - 1);
      tl = bcl2 ^ (bcl4 << 1 | bch4 >>> 32 - 1);
      sh[3] ^= th;
      sl[3] ^= tl;
      sh[8] ^= th;
      sl[8] ^= tl;
      sh[13] ^= th;
      sl[13] ^= tl;
      sh[18] ^= th;
      sl[18] ^= tl;
      sh[23] ^= th;
      sl[23] ^= tl;
      th = bch3 ^ (bch0 << 1 | bcl0 >>> 32 - 1);
      tl = bcl3 ^ (bcl0 << 1 | bch0 >>> 32 - 1);
      sh[4] ^= th;
      sh[9] ^= th;
      sh[14] ^= th;
      sh[19] ^= th;
      sh[24] ^= th;
      sl[4] ^= tl;
      sl[9] ^= tl;
      sl[14] ^= tl;
      sl[19] ^= tl;
      sl[24] ^= tl;
      th = sh[1];
      tl = sl[1];
      bch0 = sh[10];
      bcl0 = sl[10];
      sh[10] = th << 1 | tl >>> 32 - 1;
      sl[10] = tl << 1 | th >>> 32 - 1;
      th = bch0;
      tl = bcl0;
      bch0 = sh[7];
      bcl0 = sl[7];
      sh[7] = th << 3 | tl >>> 32 - 3;
      sl[7] = tl << 3 | th >>> 32 - 3;
      th = bch0;
      tl = bcl0;
      bch0 = sh[11];
      bcl0 = sl[11];
      sh[11] = th << 6 | tl >>> 32 - 6;
      sl[11] = tl << 6 | th >>> 32 - 6;
      th = bch0;
      tl = bcl0;
      bch0 = sh[17];
      bcl0 = sl[17];
      sh[17] = th << 10 | tl >>> 32 - 10;
      sl[17] = tl << 10 | th >>> 32 - 10;
      th = bch0;
      tl = bcl0;
      bch0 = sh[18];
      bcl0 = sl[18];
      sh[18] = th << 15 | tl >>> 32 - 15;
      sl[18] = tl << 15 | th >>> 32 - 15;
      th = bch0;
      tl = bcl0;
      bch0 = sh[3];
      bcl0 = sl[3];
      sh[3] = th << 21 | tl >>> 32 - 21;
      sl[3] = tl << 21 | th >>> 32 - 21;
      th = bch0;
      tl = bcl0;
      bch0 = sh[5];
      bcl0 = sl[5];
      sh[5] = th << 28 | tl >>> 32 - 28;
      sl[5] = tl << 28 | th >>> 32 - 28;
      th = bch0;
      tl = bcl0;
      bch0 = sh[16];
      bcl0 = sl[16];
      sh[16] = tl << 4 | th >>> 32 - 4;
      sl[16] = th << 4 | tl >>> 32 - 4;
      th = bch0;
      tl = bcl0;
      bch0 = sh[8];
      bcl0 = sl[8];
      sh[8] = tl << 13 | th >>> 32 - 13;
      sl[8] = th << 13 | tl >>> 32 - 13;
      th = bch0;
      tl = bcl0;
      bch0 = sh[21];
      bcl0 = sl[21];
      sh[21] = tl << 23 | th >>> 32 - 23;
      sl[21] = th << 23 | tl >>> 32 - 23;
      th = bch0;
      tl = bcl0;
      bch0 = sh[24];
      bcl0 = sl[24];
      sh[24] = th << 2 | tl >>> 32 - 2;
      sl[24] = tl << 2 | th >>> 32 - 2;
      th = bch0;
      tl = bcl0;
      bch0 = sh[4];
      bcl0 = sl[4];
      sh[4] = th << 14 | tl >>> 32 - 14;
      sl[4] = tl << 14 | th >>> 32 - 14;
      th = bch0;
      tl = bcl0;
      bch0 = sh[15];
      bcl0 = sl[15];
      sh[15] = th << 27 | tl >>> 32 - 27;
      sl[15] = tl << 27 | th >>> 32 - 27;
      th = bch0;
      tl = bcl0;
      bch0 = sh[23];
      bcl0 = sl[23];
      sh[23] = tl << 9 | th >>> 32 - 9;
      sl[23] = th << 9 | tl >>> 32 - 9;
      th = bch0;
      tl = bcl0;
      bch0 = sh[19];
      bcl0 = sl[19];
      sh[19] = tl << 24 | th >>> 32 - 24;
      sl[19] = th << 24 | tl >>> 32 - 24;
      th = bch0;
      tl = bcl0;
      bch0 = sh[13];
      bcl0 = sl[13];
      sh[13] = th << 8 | tl >>> 32 - 8;
      sl[13] = tl << 8 | th >>> 32 - 8;
      th = bch0;
      tl = bcl0;
      bch0 = sh[12];
      bcl0 = sl[12];
      sh[12] = th << 25 | tl >>> 32 - 25;
      sl[12] = tl << 25 | th >>> 32 - 25;
      th = bch0;
      tl = bcl0;
      bch0 = sh[2];
      bcl0 = sl[2];
      sh[2] = tl << 11 | th >>> 32 - 11;
      sl[2] = th << 11 | tl >>> 32 - 11;
      th = bch0;
      tl = bcl0;
      bch0 = sh[20];
      bcl0 = sl[20];
      sh[20] = tl << 30 | th >>> 32 - 30;
      sl[20] = th << 30 | tl >>> 32 - 30;
      th = bch0;
      tl = bcl0;
      bch0 = sh[14];
      bcl0 = sl[14];
      sh[14] = th << 18 | tl >>> 32 - 18;
      sl[14] = tl << 18 | th >>> 32 - 18;
      th = bch0;
      tl = bcl0;
      bch0 = sh[22];
      bcl0 = sl[22];
      sh[22] = tl << 7 | th >>> 32 - 7;
      sl[22] = th << 7 | tl >>> 32 - 7;
      th = bch0;
      tl = bcl0;
      bch0 = sh[9];
      bcl0 = sl[9];
      sh[9] = tl << 29 | th >>> 32 - 29;
      sl[9] = th << 29 | tl >>> 32 - 29;
      th = bch0;
      tl = bcl0;
      bch0 = sh[6];
      bcl0 = sl[6];
      sh[6] = th << 20 | tl >>> 32 - 20;
      sl[6] = tl << 20 | th >>> 32 - 20;
      th = bch0;
      tl = bcl0;
      bch0 = sh[1];
      bcl0 = sl[1];
      sh[1] = tl << 12 | th >>> 32 - 12;
      sl[1] = th << 12 | tl >>> 32 - 12;
      th = bch0;
      tl = bcl0;
      bch0 = sh[0];
      bch1 = sh[1];
      bch2 = sh[2];
      bch3 = sh[3];
      bch4 = sh[4];
      sh[0] ^= ~bch1 & bch2;
      sh[1] ^= ~bch2 & bch3;
      sh[2] ^= ~bch3 & bch4;
      sh[3] ^= ~bch4 & bch0;
      sh[4] ^= ~bch0 & bch1;
      bcl0 = sl[0];
      bcl1 = sl[1];
      bcl2 = sl[2];
      bcl3 = sl[3];
      bcl4 = sl[4];
      sl[0] ^= ~bcl1 & bcl2;
      sl[1] ^= ~bcl2 & bcl3;
      sl[2] ^= ~bcl3 & bcl4;
      sl[3] ^= ~bcl4 & bcl0;
      sl[4] ^= ~bcl0 & bcl1;
      bch0 = sh[5];
      bch1 = sh[6];
      bch2 = sh[7];
      bch3 = sh[8];
      bch4 = sh[9];
      sh[5] ^= ~bch1 & bch2;
      sh[6] ^= ~bch2 & bch3;
      sh[7] ^= ~bch3 & bch4;
      sh[8] ^= ~bch4 & bch0;
      sh[9] ^= ~bch0 & bch1;
      bcl0 = sl[5];
      bcl1 = sl[6];
      bcl2 = sl[7];
      bcl3 = sl[8];
      bcl4 = sl[9];
      sl[5] ^= ~bcl1 & bcl2;
      sl[6] ^= ~bcl2 & bcl3;
      sl[7] ^= ~bcl3 & bcl4;
      sl[8] ^= ~bcl4 & bcl0;
      sl[9] ^= ~bcl0 & bcl1;
      bch0 = sh[10];
      bch1 = sh[11];
      bch2 = sh[12];
      bch3 = sh[13];
      bch4 = sh[14];
      sh[10] ^= ~bch1 & bch2;
      sh[11] ^= ~bch2 & bch3;
      sh[12] ^= ~bch3 & bch4;
      sh[13] ^= ~bch4 & bch0;
      sh[14] ^= ~bch0 & bch1;
      bcl0 = sl[10];
      bcl1 = sl[11];
      bcl2 = sl[12];
      bcl3 = sl[13];
      bcl4 = sl[14];
      sl[10] ^= ~bcl1 & bcl2;
      sl[11] ^= ~bcl2 & bcl3;
      sl[12] ^= ~bcl3 & bcl4;
      sl[13] ^= ~bcl4 & bcl0;
      sl[14] ^= ~bcl0 & bcl1;
      bch0 = sh[15];
      bch1 = sh[16];
      bch2 = sh[17];
      bch3 = sh[18];
      bch4 = sh[19];
      sh[15] ^= ~bch1 & bch2;
      sh[16] ^= ~bch2 & bch3;
      sh[17] ^= ~bch3 & bch4;
      sh[18] ^= ~bch4 & bch0;
      sh[19] ^= ~bch0 & bch1;
      bcl0 = sl[15];
      bcl1 = sl[16];
      bcl2 = sl[17];
      bcl3 = sl[18];
      bcl4 = sl[19];
      sl[15] ^= ~bcl1 & bcl2;
      sl[16] ^= ~bcl2 & bcl3;
      sl[17] ^= ~bcl3 & bcl4;
      sl[18] ^= ~bcl4 & bcl0;
      sl[19] ^= ~bcl0 & bcl1;
      bch0 = sh[20];
      bch1 = sh[21];
      bch2 = sh[22];
      bch3 = sh[23];
      bch4 = sh[24];
      sh[20] ^= ~bch1 & bch2;
      sh[21] ^= ~bch2 & bch3;
      sh[22] ^= ~bch3 & bch4;
      sh[23] ^= ~bch4 & bch0;
      sh[24] ^= ~bch0 & bch1;
      bcl0 = sl[20];
      bcl1 = sl[21];
      bcl2 = sl[22];
      bcl3 = sl[23];
      bcl4 = sl[24];
      sl[20] ^= ~bcl1 & bcl2;
      sl[21] ^= ~bcl2 & bcl3;
      sl[22] ^= ~bcl3 & bcl4;
      sl[23] ^= ~bcl4 & bcl0;
      sl[24] ^= ~bcl0 & bcl1;
      sh[0] ^= RNDC_HI[r];
      sl[0] ^= RNDC_LO[r];
    }
    for (var i = 0; i < 25; i++) {
      binary_1.writeUint32LE(sl[i], buf, i * 8);
      binary_1.writeUint32LE(sh[i], buf, i * 8 + 4);
    }
  }
  class Sha3256Provider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.name = "SHA3-256";
      this.usages = [];
    }
    onDigest(algorithm, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return hash256(new Uint8Array(data)).buffer;
      });
    }
  }
  class Sha3384Provider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.name = "SHA3-384";
      this.usages = [];
    }
    onDigest(algorithm, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return hash384(new Uint8Array(data)).buffer;
      });
    }
  }
  class Sha3512Provider extends ProviderCrypto {
    constructor() {
      super(...arguments);
      this.name = "SHA3-512";
      this.usages = [];
    }
    onDigest(algorithm, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return hash512(new Uint8Array(data)).buffer;
      });
    }
  }
  class Shake128Provider extends Shake128Provider$1 {
    onDigest(algorithm, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const output = new Uint8Array(algorithm.length);
        new SHAKE128_1().update(new Uint8Array(data)).stream(output);
        return output.buffer;
      });
    }
  }
  class Shake256Provider extends Shake256Provider$1 {
    onDigest(algorithm, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const output = new Uint8Array(algorithm.length);
        new SHAKE256_1().update(new Uint8Array(data)).stream(output);
        return output.buffer;
      });
    }
  }
  class PbkdfCryptoKey extends CryptoKey {
    constructor(algorithm, extractable, usages, raw) {
      super(algorithm, extractable, "secret", usages);
      this.raw = raw;
    }
  }
  class Pbkdf2Provider extends Pbkdf2Provider$1 {
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return new PbkdfCryptoKey(algorithm, extractable, keyUsages, BufferSourceConverter.toUint8Array(keyData));
      });
    }
    onDeriveBits(algorithm, baseKey, length) {
      return __awaiter(this, void 0, void 0, function* () {
        let result;
        const salt = BufferSourceConverter.toUint8Array(algorithm.salt);
        const password = baseKey.raw;
        switch (algorithm.hash.name.toUpperCase()) {
          case "SHA-1":
            result = Pbkdf2HmacSha1(password, salt, algorithm.iterations, length >> 3);
            break;
          case "SHA-256":
            result = Pbkdf2HmacSha256(password, salt, algorithm.iterations, length >> 3);
            break;
          case "SHA-512":
            result = Pbkdf2HmacSha512(password, salt, algorithm.iterations, length >> 3);
            break;
          default:
            throw new OperationError(`algorithm.hash: '${algorithm.hash.name}' hash algorithm is not supported`);
        }
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      if (!(key instanceof PbkdfCryptoKey)) {
        throw new TypeError("key: Is not PbkdfCryptoKey");
      }
    }
  }
  var des$2 = {};
  var utils$2 = {};
  utils$2.readUInt32BE = function readUInt32BE(bytes, off) {
    var res = bytes[0 + off] << 24 | bytes[1 + off] << 16 | bytes[2 + off] << 8 | bytes[3 + off];
    return res >>> 0;
  };
  utils$2.writeUInt32BE = function writeUInt32BE(bytes, value, off) {
    bytes[0 + off] = value >>> 24;
    bytes[1 + off] = value >>> 16 & 0xff;
    bytes[2 + off] = value >>> 8 & 0xff;
    bytes[3 + off] = value & 0xff;
  };
  utils$2.ip = function ip(inL, inR, out, off) {
    var outL = 0;
    var outR = 0;
    for (var i = 6; i >= 0; i -= 2) {
      for (var j = 0; j <= 24; j += 8) {
        outL <<= 1;
        outL |= inR >>> j + i & 1;
      }
      for (var j = 0; j <= 24; j += 8) {
        outL <<= 1;
        outL |= inL >>> j + i & 1;
      }
    }
    for (var i = 6; i >= 0; i -= 2) {
      for (var j = 1; j <= 25; j += 8) {
        outR <<= 1;
        outR |= inR >>> j + i & 1;
      }
      for (var j = 1; j <= 25; j += 8) {
        outR <<= 1;
        outR |= inL >>> j + i & 1;
      }
    }
    out[off + 0] = outL >>> 0;
    out[off + 1] = outR >>> 0;
  };
  utils$2.rip = function rip(inL, inR, out, off) {
    var outL = 0;
    var outR = 0;
    for (var i = 0; i < 4; i++) {
      for (var j = 24; j >= 0; j -= 8) {
        outL <<= 1;
        outL |= inR >>> j + i & 1;
        outL <<= 1;
        outL |= inL >>> j + i & 1;
      }
    }
    for (var i = 4; i < 8; i++) {
      for (var j = 24; j >= 0; j -= 8) {
        outR <<= 1;
        outR |= inR >>> j + i & 1;
        outR <<= 1;
        outR |= inL >>> j + i & 1;
      }
    }
    out[off + 0] = outL >>> 0;
    out[off + 1] = outR >>> 0;
  };
  utils$2.pc1 = function pc1(inL, inR, out, off) {
    var outL = 0;
    var outR = 0;
    for (var i = 7; i >= 5; i--) {
      for (var j = 0; j <= 24; j += 8) {
        outL <<= 1;
        outL |= inR >> j + i & 1;
      }
      for (var j = 0; j <= 24; j += 8) {
        outL <<= 1;
        outL |= inL >> j + i & 1;
      }
    }
    for (var j = 0; j <= 24; j += 8) {
      outL <<= 1;
      outL |= inR >> j + i & 1;
    }
    for (var i = 1; i <= 3; i++) {
      for (var j = 0; j <= 24; j += 8) {
        outR <<= 1;
        outR |= inR >> j + i & 1;
      }
      for (var j = 0; j <= 24; j += 8) {
        outR <<= 1;
        outR |= inL >> j + i & 1;
      }
    }
    for (var j = 0; j <= 24; j += 8) {
      outR <<= 1;
      outR |= inL >> j + i & 1;
    }
    out[off + 0] = outL >>> 0;
    out[off + 1] = outR >>> 0;
  };
  utils$2.r28shl = function r28shl(num, shift) {
    return num << shift & 0xfffffff | num >>> 28 - shift;
  };
  var pc2table = [14, 11, 17, 4, 27, 23, 25, 0, 13, 22, 7, 18, 5, 9, 16, 24, 2, 20, 12, 21, 1, 8, 15, 26, 15, 4, 25, 19, 9, 1, 26, 16, 5, 11, 23, 8, 12, 7, 17, 0, 22, 3, 10, 14, 6, 20, 27, 24];
  utils$2.pc2 = function pc2(inL, inR, out, off) {
    var outL = 0;
    var outR = 0;
    var len = pc2table.length >>> 1;
    for (var i = 0; i < len; i++) {
      outL <<= 1;
      outL |= inL >>> pc2table[i] & 0x1;
    }
    for (var i = len; i < pc2table.length; i++) {
      outR <<= 1;
      outR |= inR >>> pc2table[i] & 0x1;
    }
    out[off + 0] = outL >>> 0;
    out[off + 1] = outR >>> 0;
  };
  utils$2.expand = function expand(r, out, off) {
    var outL = 0;
    var outR = 0;
    outL = (r & 1) << 5 | r >>> 27;
    for (var i = 23; i >= 15; i -= 4) {
      outL <<= 6;
      outL |= r >>> i & 0x3f;
    }
    for (var i = 11; i >= 3; i -= 4) {
      outR |= r >>> i & 0x3f;
      outR <<= 6;
    }
    outR |= (r & 0x1f) << 1 | r >>> 31;
    out[off + 0] = outL >>> 0;
    out[off + 1] = outR >>> 0;
  };
  var sTable = [14, 0, 4, 15, 13, 7, 1, 4, 2, 14, 15, 2, 11, 13, 8, 1, 3, 10, 10, 6, 6, 12, 12, 11, 5, 9, 9, 5, 0, 3, 7, 8, 4, 15, 1, 12, 14, 8, 8, 2, 13, 4, 6, 9, 2, 1, 11, 7, 15, 5, 12, 11, 9, 3, 7, 14, 3, 10, 10, 0, 5, 6, 0, 13, 15, 3, 1, 13, 8, 4, 14, 7, 6, 15, 11, 2, 3, 8, 4, 14, 9, 12, 7, 0, 2, 1, 13, 10, 12, 6, 0, 9, 5, 11, 10, 5, 0, 13, 14, 8, 7, 10, 11, 1, 10, 3, 4, 15, 13, 4, 1, 2, 5, 11, 8, 6, 12, 7, 6, 12, 9, 0, 3, 5, 2, 14, 15, 9, 10, 13, 0, 7, 9, 0, 14, 9, 6, 3, 3, 4, 15, 6, 5, 10, 1, 2, 13, 8, 12, 5, 7, 14, 11, 12, 4, 11, 2, 15, 8, 1, 13, 1, 6, 10, 4, 13, 9, 0, 8, 6, 15, 9, 3, 8, 0, 7, 11, 4, 1, 15, 2, 14, 12, 3, 5, 11, 10, 5, 14, 2, 7, 12, 7, 13, 13, 8, 14, 11, 3, 5, 0, 6, 6, 15, 9, 0, 10, 3, 1, 4, 2, 7, 8, 2, 5, 12, 11, 1, 12, 10, 4, 14, 15, 9, 10, 3, 6, 15, 9, 0, 0, 6, 12, 10, 11, 1, 7, 13, 13, 8, 15, 9, 1, 4, 3, 5, 14, 11, 5, 12, 2, 7, 8, 2, 4, 14, 2, 14, 12, 11, 4, 2, 1, 12, 7, 4, 10, 7, 11, 13, 6, 1, 8, 5, 5, 0, 3, 15, 15, 10, 13, 3, 0, 9, 14, 8, 9, 6, 4, 11, 2, 8, 1, 12, 11, 7, 10, 1, 13, 14, 7, 2, 8, 13, 15, 6, 9, 15, 12, 0, 5, 9, 6, 10, 3, 4, 0, 5, 14, 3, 12, 10, 1, 15, 10, 4, 15, 2, 9, 7, 2, 12, 6, 9, 8, 5, 0, 6, 13, 1, 3, 13, 4, 14, 14, 0, 7, 11, 5, 3, 11, 8, 9, 4, 14, 3, 15, 2, 5, 12, 2, 9, 8, 5, 12, 15, 3, 10, 7, 11, 0, 14, 4, 1, 10, 7, 1, 6, 13, 0, 11, 8, 6, 13, 4, 13, 11, 0, 2, 11, 14, 7, 15, 4, 0, 9, 8, 1, 13, 10, 3, 14, 12, 3, 9, 5, 7, 12, 5, 2, 10, 15, 6, 8, 1, 6, 1, 6, 4, 11, 11, 13, 13, 8, 12, 1, 3, 4, 7, 10, 14, 7, 10, 9, 15, 5, 6, 0, 8, 15, 0, 14, 5, 2, 9, 3, 2, 12, 13, 1, 2, 15, 8, 13, 4, 8, 6, 10, 15, 3, 11, 7, 1, 4, 10, 12, 9, 5, 3, 6, 14, 11, 5, 0, 0, 14, 12, 9, 7, 2, 7, 2, 11, 1, 4, 14, 1, 7, 9, 4, 12, 10, 14, 8, 2, 13, 0, 15, 6, 12, 10, 9, 13, 0, 15, 3, 3, 5, 5, 6, 8, 11];
  utils$2.substitute = function substitute(inL, inR) {
    var out = 0;
    for (var i = 0; i < 4; i++) {
      var b = inL >>> 18 - i * 6 & 0x3f;
      var sb = sTable[i * 0x40 + b];
      out <<= 4;
      out |= sb;
    }
    for (var i = 0; i < 4; i++) {
      var b = inR >>> 18 - i * 6 & 0x3f;
      var sb = sTable[4 * 0x40 + i * 0x40 + b];
      out <<= 4;
      out |= sb;
    }
    return out >>> 0;
  };
  var permuteTable = [16, 25, 12, 11, 3, 20, 4, 15, 31, 17, 9, 6, 27, 14, 1, 22, 30, 24, 8, 18, 0, 5, 29, 23, 13, 19, 2, 26, 10, 21, 28, 7];
  utils$2.permute = function permute(num) {
    var out = 0;
    for (var i = 0; i < permuteTable.length; i++) {
      out <<= 1;
      out |= num >>> permuteTable[i] & 0x1;
    }
    return out >>> 0;
  };
  utils$2.padSplit = function padSplit(num, size, group) {
    var str = num.toString(2);
    while (str.length < size) str = '0' + str;
    var out = [];
    for (var i = 0; i < size; i += group) out.push(str.slice(i, i + group));
    return out.join(' ');
  };
  var assert$3 = minimalisticAssert;
  function Cipher$3(options) {
    this.options = options;
    this.type = this.options.type;
    this.blockSize = 8;
    this._init();
    this.buffer = new Array(this.blockSize);
    this.bufferOff = 0;
    this.padding = options.padding !== false;
  }
  var cipher = Cipher$3;
  Cipher$3.prototype._init = function _init() {};
  Cipher$3.prototype.update = function update(data) {
    if (data.length === 0) return [];
    if (this.type === 'decrypt') return this._updateDecrypt(data);else return this._updateEncrypt(data);
  };
  Cipher$3.prototype._buffer = function _buffer(data, off) {
    var min = Math.min(this.buffer.length - this.bufferOff, data.length - off);
    for (var i = 0; i < min; i++) this.buffer[this.bufferOff + i] = data[off + i];
    this.bufferOff += min;
    return min;
  };
  Cipher$3.prototype._flushBuffer = function _flushBuffer(out, off) {
    this._update(this.buffer, 0, out, off);
    this.bufferOff = 0;
    return this.blockSize;
  };
  Cipher$3.prototype._updateEncrypt = function _updateEncrypt(data) {
    var inputOff = 0;
    var outputOff = 0;
    var count = (this.bufferOff + data.length) / this.blockSize | 0;
    var out = new Array(count * this.blockSize);
    if (this.bufferOff !== 0) {
      inputOff += this._buffer(data, inputOff);
      if (this.bufferOff === this.buffer.length) outputOff += this._flushBuffer(out, outputOff);
    }
    var max = data.length - (data.length - inputOff) % this.blockSize;
    for (; inputOff < max; inputOff += this.blockSize) {
      this._update(data, inputOff, out, outputOff);
      outputOff += this.blockSize;
    }
    for (; inputOff < data.length; inputOff++, this.bufferOff++) this.buffer[this.bufferOff] = data[inputOff];
    return out;
  };
  Cipher$3.prototype._updateDecrypt = function _updateDecrypt(data) {
    var inputOff = 0;
    var outputOff = 0;
    var count = Math.ceil((this.bufferOff + data.length) / this.blockSize) - 1;
    var out = new Array(count * this.blockSize);
    for (; count > 0; count--) {
      inputOff += this._buffer(data, inputOff);
      outputOff += this._flushBuffer(out, outputOff);
    }
    inputOff += this._buffer(data, inputOff);
    return out;
  };
  Cipher$3.prototype.final = function final(buffer) {
    var first;
    if (buffer) first = this.update(buffer);
    var last;
    if (this.type === 'encrypt') last = this._finalEncrypt();else last = this._finalDecrypt();
    if (first) return first.concat(last);else return last;
  };
  Cipher$3.prototype._pad = function _pad(buffer, off) {
    if (off === 0) return false;
    while (off < buffer.length) buffer[off++] = 0;
    return true;
  };
  Cipher$3.prototype._finalEncrypt = function _finalEncrypt() {
    if (!this._pad(this.buffer, this.bufferOff)) return [];
    var out = new Array(this.blockSize);
    this._update(this.buffer, 0, out, 0);
    return out;
  };
  Cipher$3.prototype._unpad = function _unpad(buffer) {
    return buffer;
  };
  Cipher$3.prototype._finalDecrypt = function _finalDecrypt() {
    assert$3.equal(this.bufferOff, this.blockSize, 'Not enough data to decrypt');
    var out = new Array(this.blockSize);
    this._flushBuffer(out, 0);
    return this._unpad(out);
  };
  var assert$2 = minimalisticAssert;
  var inherits$2 = inheritsExports;
  var utils$1 = utils$2;
  var Cipher$2 = cipher;
  function DESState() {
    this.tmp = new Array(2);
    this.keys = null;
  }
  function DES$2(options) {
    Cipher$2.call(this, options);
    var state = new DESState();
    this._desState = state;
    this.deriveKeys(state, options.key);
  }
  inherits$2(DES$2, Cipher$2);
  var des$1 = DES$2;
  DES$2.create = function create(options) {
    return new DES$2(options);
  };
  var shiftTable = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
  DES$2.prototype.deriveKeys = function deriveKeys(state, key) {
    state.keys = new Array(16 * 2);
    assert$2.equal(key.length, this.blockSize, 'Invalid key length');
    var kL = utils$1.readUInt32BE(key, 0);
    var kR = utils$1.readUInt32BE(key, 4);
    utils$1.pc1(kL, kR, state.tmp, 0);
    kL = state.tmp[0];
    kR = state.tmp[1];
    for (var i = 0; i < state.keys.length; i += 2) {
      var shift = shiftTable[i >>> 1];
      kL = utils$1.r28shl(kL, shift);
      kR = utils$1.r28shl(kR, shift);
      utils$1.pc2(kL, kR, state.keys, i);
    }
  };
  DES$2.prototype._update = function _update(inp, inOff, out, outOff) {
    var state = this._desState;
    var l = utils$1.readUInt32BE(inp, inOff);
    var r = utils$1.readUInt32BE(inp, inOff + 4);
    utils$1.ip(l, r, state.tmp, 0);
    l = state.tmp[0];
    r = state.tmp[1];
    if (this.type === 'encrypt') this._encrypt(state, l, r, state.tmp, 0);else this._decrypt(state, l, r, state.tmp, 0);
    l = state.tmp[0];
    r = state.tmp[1];
    utils$1.writeUInt32BE(out, l, outOff);
    utils$1.writeUInt32BE(out, r, outOff + 4);
  };
  DES$2.prototype._pad = function _pad(buffer, off) {
    if (this.padding === false) {
      return false;
    }
    var value = buffer.length - off;
    for (var i = off; i < buffer.length; i++) buffer[i] = value;
    return true;
  };
  DES$2.prototype._unpad = function _unpad(buffer) {
    if (this.padding === false) {
      return buffer;
    }
    var pad = buffer[buffer.length - 1];
    for (var i = buffer.length - pad; i < buffer.length; i++) assert$2.equal(buffer[i], pad);
    return buffer.slice(0, buffer.length - pad);
  };
  DES$2.prototype._encrypt = function _encrypt(state, lStart, rStart, out, off) {
    var l = lStart;
    var r = rStart;
    for (var i = 0; i < state.keys.length; i += 2) {
      var keyL = state.keys[i];
      var keyR = state.keys[i + 1];
      utils$1.expand(r, state.tmp, 0);
      keyL ^= state.tmp[0];
      keyR ^= state.tmp[1];
      var s = utils$1.substitute(keyL, keyR);
      var f = utils$1.permute(s);
      var t = r;
      r = (l ^ f) >>> 0;
      l = t;
    }
    utils$1.rip(r, l, out, off);
  };
  DES$2.prototype._decrypt = function _decrypt(state, lStart, rStart, out, off) {
    var l = rStart;
    var r = lStart;
    for (var i = state.keys.length - 2; i >= 0; i -= 2) {
      var keyL = state.keys[i];
      var keyR = state.keys[i + 1];
      utils$1.expand(l, state.tmp, 0);
      keyL ^= state.tmp[0];
      keyR ^= state.tmp[1];
      var s = utils$1.substitute(keyL, keyR);
      var f = utils$1.permute(s);
      var t = l;
      l = (r ^ f) >>> 0;
      r = t;
    }
    utils$1.rip(l, r, out, off);
  };
  var cbc = {};
  var assert$1 = minimalisticAssert;
  var inherits$1 = inheritsExports;
  var proto = {};
  function CBCState(iv) {
    assert$1.equal(iv.length, 8, 'Invalid IV length');
    this.iv = new Array(8);
    for (var i = 0; i < this.iv.length; i++) this.iv[i] = iv[i];
  }
  function instantiate(Base) {
    function CBC(options) {
      Base.call(this, options);
      this._cbcInit();
    }
    inherits$1(CBC, Base);
    var keys = Object.keys(proto);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      CBC.prototype[key] = proto[key];
    }
    CBC.create = function create(options) {
      return new CBC(options);
    };
    return CBC;
  }
  cbc.instantiate = instantiate;
  proto._cbcInit = function _cbcInit() {
    var state = new CBCState(this.options.iv);
    this._cbcState = state;
  };
  proto._update = function _update(inp, inOff, out, outOff) {
    var state = this._cbcState;
    var superProto = this.constructor.super_.prototype;
    var iv = state.iv;
    if (this.type === 'encrypt') {
      for (var i = 0; i < this.blockSize; i++) iv[i] ^= inp[inOff + i];
      superProto._update.call(this, iv, 0, out, outOff);
      for (var i = 0; i < this.blockSize; i++) iv[i] = out[outOff + i];
    } else {
      superProto._update.call(this, inp, inOff, out, outOff);
      for (var i = 0; i < this.blockSize; i++) out[outOff + i] ^= iv[i];
      for (var i = 0; i < this.blockSize; i++) iv[i] = inp[inOff + i];
    }
  };
  var assert = minimalisticAssert;
  var inherits = inheritsExports;
  var Cipher$1 = cipher;
  var DES$1 = des$1;
  function EDEState(type, key) {
    assert.equal(key.length, 24, 'Invalid key length');
    var k1 = key.slice(0, 8);
    var k2 = key.slice(8, 16);
    var k3 = key.slice(16, 24);
    if (type === 'encrypt') {
      this.ciphers = [DES$1.create({
        type: 'encrypt',
        key: k1
      }), DES$1.create({
        type: 'decrypt',
        key: k2
      }), DES$1.create({
        type: 'encrypt',
        key: k3
      })];
    } else {
      this.ciphers = [DES$1.create({
        type: 'decrypt',
        key: k3
      }), DES$1.create({
        type: 'encrypt',
        key: k2
      }), DES$1.create({
        type: 'decrypt',
        key: k1
      })];
    }
  }
  function EDE$1(options) {
    Cipher$1.call(this, options);
    var state = new EDEState(this.type, this.options.key);
    this._edeState = state;
  }
  inherits(EDE$1, Cipher$1);
  var ede = EDE$1;
  EDE$1.create = function create(options) {
    return new EDE$1(options);
  };
  EDE$1.prototype._update = function _update(inp, inOff, out, outOff) {
    var state = this._edeState;
    state.ciphers[0]._update(inp, inOff, out, outOff);
    state.ciphers[1]._update(out, outOff, out, outOff);
    state.ciphers[2]._update(out, outOff, out, outOff);
  };
  EDE$1.prototype._pad = DES$1.prototype._pad;
  EDE$1.prototype._unpad = DES$1.prototype._unpad;
  var utils = des$2.utils = utils$2;
  var Cipher = des$2.Cipher = cipher;
  var DES = des$2.DES = des$1;
  var CBC = des$2.CBC = cbc;
  var EDE = des$2.EDE = ede;
  var des = _mergeNamespaces({
    __proto__: null,
    CBC: CBC,
    Cipher: Cipher,
    DES: DES,
    EDE: EDE,
    default: des$2,
    utils: utils
  }, [des$2]);
  class DesCryptoKey extends CryptoKey {
    constructor(algorithm, extractable, usages, raw) {
      super(algorithm, extractable, "secret", usages);
      this.raw = raw;
    }
    toJSON() {
      const jwk = {
        kty: "oct",
        alg: this.getJwkAlgorithm(),
        k: Convert.ToBase64Url(this.raw),
        ext: this.extractable,
        key_ops: this.usages
      };
      return jwk;
    }
    getJwkAlgorithm() {
      switch (this.algorithm.name.toUpperCase()) {
        case "DES-CBC":
          return `DES-CBC`;
        case "DES-EDE3-CBC":
          return `3DES-CBC`;
        default:
          throw new AlgorithmError("Unsupported algorithm name");
      }
    }
  }
  class DesCrypto {
    static checkLib() {
      if (typeof des === "undefined") {
        throw new OperationError("Cannot implement DES mechanism. Add 'https://peculiarventures.github.io/pv-webcrypto-tests/src/des.js' script to your project");
      }
    }
    static checkCryptoKey(key) {
      if (!(key instanceof DesCryptoKey)) {
        throw new TypeError("key: Is not DesCryptoKey");
      }
    }
    static generateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        const raw = exports.nativeCrypto.getRandomValues(new Uint8Array(algorithm.length / 8));
        return new DesCryptoKey(algorithm, extractable, keyUsages, raw);
      });
    }
    static exportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        switch (format) {
          case "jwk":
            return key.toJSON();
          case "raw":
            return key.raw.buffer;
          default:
            throw new OperationError("format: Must be 'jwk' or 'raw'");
        }
      });
    }
    static importKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        let raw;
        if (isJWK(keyData)) {
          raw = Convert.FromBase64Url(keyData.k);
        } else {
          raw = BufferSourceConverter.toArrayBuffer(keyData);
        }
        if (algorithm.name === "DES-CBC" && raw.byteLength !== 8 || algorithm.name === "DES-EDE3-CBC" && raw.byteLength !== 24) {
          throw new OperationError("keyData: Is wrong key length");
        }
        const key = new DesCryptoKey({
          name: algorithm.name,
          length: raw.byteLength << 3
        }, extractable, keyUsages, new Uint8Array(raw));
        return key;
      });
    }
    static encrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.cipher(algorithm, key, data, true);
      });
    }
    static decrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.cipher(algorithm, key, data, false);
      });
    }
    static cipher(algorithm, key, data, encrypt) {
      return __awaiter(this, void 0, void 0, function* () {
        this.checkLib();
        const type = encrypt ? "encrypt" : "decrypt";
        let DesCipher;
        const iv = BufferSourceConverter.toUint8Array(algorithm.iv);
        switch (algorithm.name.toUpperCase()) {
          case "DES-CBC":
            DesCipher = CBC.instantiate(DES).create({
              key: key.raw,
              type,
              iv
            });
            break;
          case "DES-EDE3-CBC":
            DesCipher = CBC.instantiate(EDE).create({
              key: key.raw,
              type,
              iv
            });
            break;
          default:
            throw new OperationError("algorithm: Is not recognized");
        }
        const enc = DesCipher.update(new Uint8Array(data)).concat(DesCipher.final());
        return new Uint8Array(enc).buffer;
      });
    }
  }
  class DesCbcProvider extends DesProvider {
    constructor() {
      super(...arguments);
      this.keySizeBits = 64;
      this.ivSize = 8;
      this.name = "DES-CBC";
    }
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    onEncrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.encrypt(algorithm, key, data);
      });
    }
    onDecrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.decrypt(algorithm, key, data);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      DesCrypto.checkCryptoKey(key);
    }
  }
  class DesEde3CbcProvider extends DesProvider {
    constructor() {
      super(...arguments);
      this.keySizeBits = 192;
      this.ivSize = 8;
      this.name = "DES-EDE3-CBC";
    }
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.generateKey(algorithm, extractable, keyUsages);
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.exportKey(format, key);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.importKey(format, keyData, algorithm, extractable, keyUsages);
      });
    }
    onEncrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.encrypt(algorithm, key, data);
      });
    }
    onDecrypt(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        return DesCrypto.decrypt(algorithm, key, data);
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      DesCrypto.checkCryptoKey(key);
    }
  }
  const JsonBase64UrlConverter = {
    fromJSON: value => Buffer.from(Convert.FromBase64Url(value)),
    toJSON: value => Convert.ToBase64Url(value)
  };
  class HmacCryptoKey extends CryptoKey {
    get alg() {
      const hash = this.algorithm.hash.name.toUpperCase();
      return `HS${hash.replace("SHA-", "")}`;
    }
    set alg(value) {}
    constructor(algorithm = {
      name: "HMAC"
    }, extractable = false, usages = [], data = new Uint8Array(0)) {
      super(algorithm, extractable, "secret", usages);
      this.kty = "oct";
      this.data = data;
    }
  }
  __decorate([JsonProp({
    name: "ext",
    type: JsonPropTypes.Boolean,
    optional: true
  })], HmacCryptoKey.prototype, "extractable", void 0);
  __decorate([JsonProp({
    name: "key_ops",
    type: JsonPropTypes.String,
    repeated: true,
    optional: true
  })], HmacCryptoKey.prototype, "usages", void 0);
  __decorate([JsonProp({
    name: "k",
    converter: JsonBase64UrlConverter
  })], HmacCryptoKey.prototype, "data", void 0);
  __decorate([JsonProp({
    type: JsonPropTypes.String
  })], HmacCryptoKey.prototype, "kty", void 0);
  __decorate([JsonProp({
    type: JsonPropTypes.String
  })], HmacCryptoKey.prototype, "alg", null);
  class HmacProvider extends HmacProvider$1 {
    onGenerateKey(algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        const length = algorithm.length || this.getDefaultLength(algorithm.hash.name);
        const raw = exports.nativeCrypto.getRandomValues(new Uint8Array(length >> 3));
        const key = new HmacCryptoKey(algorithm, extractable, keyUsages, raw);
        return key;
      });
    }
    onSign(algorithm, key, data) {
      return __awaiter(this, void 0, void 0, function* () {
        let fn;
        switch (key.algorithm.hash.name.toUpperCase()) {
          case "SHA-1":
            fn = HmacSha1;
            break;
          case "SHA-256":
            fn = HmacSha256;
            break;
          case "SHA-512":
            fn = HmacSha512;
            break;
          default:
            throw new OperationError("key.algorithm.hash: Is not recognized");
        }
        const result = new fn(key.data).process(BufferSourceConverter.toUint8Array(data)).finish().result;
        return BufferSourceConverter.toArrayBuffer(result);
      });
    }
    onVerify(algorithm, key, signature, data) {
      return __awaiter(this, void 0, void 0, function* () {
        const signature2 = yield this.onSign(algorithm, key, data);
        return Convert.ToHex(signature2) === Convert.ToHex(signature);
      });
    }
    onImportKey(format, keyData, algorithm, extractable, keyUsages) {
      return __awaiter(this, void 0, void 0, function* () {
        let key;
        switch (format.toLowerCase()) {
          case "jwk":
            key = JsonParser.fromJSON(keyData, {
              targetSchema: HmacCryptoKey
            });
            break;
          case "raw":
            if (!BufferSourceConverter.isBufferSource(keyData)) {
              throw new TypeError("keyData: Is not ArrayBuffer or ArrayBufferView");
            }
            key = new HmacCryptoKey(algorithm, extractable, keyUsages, BufferSourceConverter.toUint8Array(keyData));
            break;
          default:
            throw new OperationError("format: Must be 'jwk' or 'raw'");
        }
        key.algorithm = {
          hash: {
            name: algorithm.hash.name
          },
          name: this.name,
          length: key.data.length << 3
        };
        key.extractable = extractable;
        key.usages = keyUsages;
        return key;
      });
    }
    onExportKey(format, key) {
      return __awaiter(this, void 0, void 0, function* () {
        switch (format.toLowerCase()) {
          case "jwk":
            {
              const jwk = JsonSerializer.toJSON(key);
              return jwk;
            }
          case "raw":
            return new Uint8Array(key.data).buffer;
          default:
            throw new OperationError("format: Must be 'jwk' or 'raw'");
        }
      });
    }
    checkCryptoKey(key, keyUsage) {
      super.checkCryptoKey(key, keyUsage);
      if (!(key instanceof HmacCryptoKey)) {
        throw new TypeError("key: Is not HMAC CryptoKey");
      }
    }
  }
  var _WrappedNativeCryptoKey_nativeKey;
  class WrappedNativeCryptoKey extends CryptoKey {
    constructor(algorithm, extractable, type, usages, nativeKey) {
      super(algorithm, extractable, type, usages);
      _WrappedNativeCryptoKey_nativeKey.set(this, void 0);
      __classPrivateFieldSet(this, _WrappedNativeCryptoKey_nativeKey, nativeKey, "f");
    }
    getNative() {
      return __classPrivateFieldGet(this, _WrappedNativeCryptoKey_nativeKey, "f");
    }
  }
  _WrappedNativeCryptoKey_nativeKey = new WeakMap();
  class SubtleCrypto extends SubtleCrypto$1 {
    static isAnotherKey(key) {
      if (typeof key === "object" && typeof key.type === "string" && typeof key.extractable === "boolean" && typeof key.algorithm === "object") {
        return !(key instanceof CryptoKey);
      }
      return false;
    }
    constructor() {
      super();
      this.browserInfo = BrowserInfo();
      this.providers.set(new AesCbcProvider());
      this.providers.set(new AesCtrProvider());
      this.providers.set(new AesEcbProvider());
      this.providers.set(new AesGcmProvider());
      this.providers.set(new AesKwProvider());
      this.providers.set(new DesCbcProvider());
      this.providers.set(new DesEde3CbcProvider());
      this.providers.set(new RsaSsaProvider());
      this.providers.set(new RsaPssProvider());
      this.providers.set(new RsaOaepProvider());
      this.providers.set(new RsaEsProvider());
      this.providers.set(new EcdsaProvider());
      this.providers.set(new EcdhProvider());
      this.providers.set(new Sha1Provider());
      this.providers.set(new Sha256Provider());
      this.providers.set(new Sha512Provider());
      this.providers.set(new Pbkdf2Provider());
      this.providers.set(new HmacProvider());
      this.providers.set(new EdDsaProvider());
      this.providers.set(new EcdhEsProvider());
      this.providers.set(new Sha3256Provider());
      this.providers.set(new Sha3384Provider());
      this.providers.set(new Sha3512Provider());
      this.providers.set(new Shake128Provider());
      this.providers.set(new Shake256Provider());
    }
    digest(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("digest", ...args);
      });
    }
    importKey(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        this.fixFirefoxEcImportPkcs8(args);
        return this.wrapNative("importKey", ...args);
      });
    }
    exportKey(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.fixFirefoxEcExportPkcs8(args)) || (yield this.wrapNative("exportKey", ...args));
      });
    }
    generateKey(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("generateKey", ...args);
      });
    }
    sign(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("sign", ...args);
      });
    }
    verify(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("verify", ...args);
      });
    }
    encrypt(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("encrypt", ...args);
      });
    }
    decrypt(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("decrypt", ...args);
      });
    }
    wrapKey(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("wrapKey", ...args);
      });
    }
    unwrapKey(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("unwrapKey", ...args);
      });
    }
    deriveBits(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("deriveBits", ...args);
      });
    }
    deriveKey(...args) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.wrapNative("deriveKey", ...args);
      });
    }
    wrapNative(method, ...args) {
      const _superIndex = name => super[name];
      return __awaiter(this, void 0, void 0, function* () {
        if (~["generateKey", "unwrapKey", "deriveKey", "importKey"].indexOf(method)) {
          this.fixAlgorithmName(args);
        }
        try {
          if (method !== "digest" || !args.some(a => a instanceof CryptoKey)) {
            const nativeArgs = this.fixNativeArguments(method, args);
            Debug.info(`Call native '${method}' method`, nativeArgs);
            const res = yield exports.nativeSubtle[method].apply(exports.nativeSubtle, nativeArgs);
            return this.fixNativeResult(method, args, res);
          }
        } catch (e) {
          Debug.warn(`Error on native '${method}' calling. ${e.message}`, e);
        }
        if (method === "wrapKey") {
          try {
            Debug.info(`Trying to wrap key by using native functions`, args);
            const data = yield this.exportKey(args[0], args[1]);
            const keyData = args[0] === "jwk" ? Convert.FromUtf8String(JSON.stringify(data)) : data;
            const res = yield this.encrypt(args[3], args[2], keyData);
            return res;
          } catch (e) {
            Debug.warn(`Cannot wrap key by native functions. ${e.message}`, e);
          }
        }
        if (method === "unwrapKey") {
          try {
            Debug.info(`Trying to unwrap key by using native functions`, args);
            const data = yield this.decrypt(args[3], args[2], args[1]);
            const keyData = args[0] === "jwk" ? JSON.parse(Convert.ToUtf8String(data)) : data;
            const res = yield this.importKey(args[0], keyData, args[4], args[5], args[6]);
            return res;
          } catch (e) {
            Debug.warn(`Cannot unwrap key by native functions. ${e.message}`, e);
          }
        }
        if (method === "deriveKey") {
          try {
            Debug.info(`Trying to derive key by using native functions`, args);
            const data = yield this.deriveBits(args[0], args[1], args[2].length);
            const res = yield this.importKey("raw", data, args[2], args[3], args[4]);
            return res;
          } catch (e) {
            Debug.warn(`Cannot derive key by native functions. ${e.message}`, e);
          }
        }
        if (method === "deriveBits" || method === "deriveKey") {
          for (const arg of args) {
            if (typeof arg === "object" && arg.public && SubtleCrypto.isAnotherKey(arg.public)) {
              arg.public = yield this.castKey(arg.public);
            }
          }
        }
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (SubtleCrypto.isAnotherKey(arg)) {
            args[i] = yield this.castKey(arg);
          }
        }
        const fn = _superIndex(method);
        if (typeof fn === "function") {
          return fn.apply(this, args);
        }
        throw new Error("Incorrect type of 'method'. Must be 'function'.");
      });
    }
    fixNativeArguments(method, args) {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const res = [...args];
      if (method === "importKey") {
        if (this.browserInfo.name === Browser.IE && ((_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.toLowerCase) === null || _b === void 0 ? void 0 : _b.call(_a)) === "jwk" && !BufferSourceConverter.isBufferSource(res[1])) {
          res[1] = Convert.FromUtf8String(JSON.stringify(res[1]));
        }
      }
      if (this.browserInfo.name === Browser.IE && args[1] instanceof WrappedNativeCryptoKey) {
        switch (method) {
          case "sign":
          case "verify":
          case "encrypt":
          case "decrypt":
            res[0] = Object.assign(Object.assign({}, this.prepareAlgorithm(res[0])), {
              hash: (_e = (_d = (_c = res[1]) === null || _c === void 0 ? void 0 : _c.algorithm) === null || _d === void 0 ? void 0 : _d.hash) === null || _e === void 0 ? void 0 : _e.name
            });
            break;
          case "wrapKey":
          case "unwrapKey":
            res[4] = Object.assign(Object.assign({}, this.prepareAlgorithm(res[4])), {
              hash: (_h = (_g = (_f = res[3]) === null || _f === void 0 ? void 0 : _f.algorithm) === null || _g === void 0 ? void 0 : _g.hash) === null || _h === void 0 ? void 0 : _h.name
            });
            break;
        }
      }
      for (let i = 0; i < res.length; i++) {
        const arg = res[i];
        if (arg instanceof WrappedNativeCryptoKey) {
          res[i] = arg.getNative();
        }
      }
      return res;
    }
    fixNativeResult(method, args, res) {
      var _a, _b;
      if (this.browserInfo.name === Browser.IE) {
        if (method === "exportKey") {
          if (((_b = (_a = args[0]) === null || _a === void 0 ? void 0 : _a.toLowerCase) === null || _b === void 0 ? void 0 : _b.call(_a)) === "jwk" && res instanceof ArrayBuffer) {
            return JSON.parse(Convert.ToUtf8String(res));
          }
        }
        if ("privateKey" in res) {
          const privateKeyUsages = ["sign", "decrypt", "unwrapKey", "deriveKey", "deriveBits"];
          const publicKeyUsages = ["verify", "encrypt", "wrapKey"];
          return {
            privateKey: this.wrapNativeKey(res.privateKey, args[0], args[1], args[2].filter(o => privateKeyUsages.includes(o))),
            publicKey: this.wrapNativeKey(res.publicKey, args[0], args[1], args[2].filter(o => publicKeyUsages.includes(o)))
          };
        } else if ("extractable" in res) {
          let algorithm;
          let usages;
          switch (method) {
            case "importKey":
              algorithm = args[2];
              usages = args[4];
              break;
            case "unwrapKey":
              algorithm = args[4];
              usages = args[6];
              break;
            case "generateKey":
              algorithm = args[0];
              usages = args[2];
              break;
            default:
              throw new OperationError("Cannot wrap native key. Unsupported method in use");
          }
          return this.wrapNativeKey(res, algorithm, res.extractable, usages);
        }
      }
      return res;
    }
    wrapNativeKey(key, algorithm, extractable, keyUsages) {
      if (this.browserInfo.name === Browser.IE) {
        const algs = ["RSASSA-PKCS1-v1_5", "RSA-PSS", "RSA-OAEP", "AES-CBC", "AES-CTR", "AES-KW", "HMAC"];
        const index = algs.map(o => o.toLowerCase()).indexOf(key.algorithm.name.toLowerCase());
        if (index !== -1) {
          const alg = this.prepareAlgorithm(algorithm);
          const newAlg = Object.assign(Object.assign({}, key.algorithm), {
            name: algs[index]
          });
          if (SubtleCrypto$1.isHashedAlgorithm(alg)) {
            newAlg.hash = {
              name: alg.hash.name.toUpperCase()
            };
          }
          Debug.info(`Wrapping ${algs[index]} crypto key to WrappedNativeCryptoKey`);
          return new WrappedNativeCryptoKey(newAlg, extractable, key.type, keyUsages, key);
        }
      }
      return key;
    }
    castKey(key) {
      return __awaiter(this, void 0, void 0, function* () {
        Debug.info("Cast native CryptoKey to linter key.", key);
        if (!key.extractable) {
          throw new Error("Cannot cast unextractable crypto key");
        }
        const provider = this.getProvider(key.algorithm.name);
        const jwk = yield this.exportKey("jwk", key);
        return provider.importKey("jwk", jwk, key.algorithm, true, key.usages);
      });
    }
    fixAlgorithmName(args) {
      if (this.browserInfo.name === Browser.Edge) {
        for (let i = 0; i < args.length; i++) {
          const arg = args[0];
          if (typeof arg === "string") {
            for (const algorithm of this.providers.algorithms) {
              if (algorithm.toLowerCase() === arg.toLowerCase()) {
                args[i] = algorithm;
                break;
              }
            }
          } else if (typeof arg === "object" && typeof arg.name === "string") {
            for (const algorithm of this.providers.algorithms) {
              if (algorithm.toLowerCase() === arg.name.toLowerCase()) {
                arg.name = algorithm;
              }
              if (typeof arg.hash === "string" && algorithm.toLowerCase() === arg.hash.toLowerCase() || typeof arg.hash === "object" && typeof arg.hash.name === "string" && algorithm.toLowerCase() === arg.hash.name.toLowerCase()) {
                arg.hash = {
                  name: algorithm
                };
              }
            }
          }
        }
      }
    }
    fixFirefoxEcImportPkcs8(args) {
      const preparedAlgorithm = this.prepareAlgorithm(args[2]);
      const algName = preparedAlgorithm.name.toUpperCase();
      if (this.browserInfo.name === Browser.Firefox && args[0] === "pkcs8" && ~["ECDSA", "ECDH"].indexOf(algName) && ~["P-256", "P-384", "P-521"].indexOf(preparedAlgorithm.namedCurve)) {
        if (!BufferSourceConverter.isBufferSource(args[1])) {
          throw new TypeError("data: Is not ArrayBuffer or ArrayBufferView");
        }
        const preparedData = BufferSourceConverter.toArrayBuffer(args[1]);
        const keyInfo = AsnConvert.parse(preparedData, index$1.PrivateKeyInfo);
        const privateKey = AsnConvert.parse(keyInfo.privateKey, index$1.EcPrivateKey);
        const jwk = JsonSerializer.toJSON(privateKey);
        jwk.ext = true;
        jwk.key_ops = args[4];
        jwk.crv = preparedAlgorithm.namedCurve;
        jwk.kty = "EC";
        args[0] = "jwk";
        args[1] = jwk;
      }
    }
    fixFirefoxEcExportPkcs8(args) {
      return __awaiter(this, void 0, void 0, function* () {
        try {
          if (this.browserInfo.name === Browser.Firefox && args[0] === "pkcs8" && ~["ECDSA", "ECDH"].indexOf(args[1].algorithm.name) && ~["P-256", "P-384", "P-521"].indexOf(args[1].algorithm.namedCurve)) {
            const jwk = yield this.exportKey("jwk", args[1]);
            const ecKey = JsonParser.fromJSON(jwk, {
              targetSchema: index$1.EcPrivateKey
            });
            const keyInfo = new index$1.PrivateKeyInfo();
            keyInfo.privateKeyAlgorithm.algorithm = EcCrypto.ASN_ALGORITHM;
            keyInfo.privateKeyAlgorithm.parameters = AsnConvert.serialize(new index$1.ObjectIdentifier(getOidByNamedCurve$1(args[1].algorithm.namedCurve)));
            keyInfo.privateKey = AsnConvert.serialize(ecKey);
            return AsnConvert.serialize(keyInfo);
          }
        } catch (err) {
          Debug.error(err);
          return null;
        }
      });
    }
  }
  SubtleCrypto.methods = ["digest", "importKey", "exportKey", "sign", "verify", "generateKey", "encrypt", "decrypt", "deriveBits", "deriveKey", "wrapKey", "unwrapKey"];
  class Crypto extends Crypto$1 {
    constructor() {
      super(...arguments);
      this.subtle = new SubtleCrypto();
    }
    get nativeCrypto() {
      return exports.nativeCrypto;
    }
    getRandomValues(array) {
      return exports.nativeCrypto.getRandomValues(array);
    }
  }
  function WrapFunction(subtle, name) {
    const fn = subtle[name];
    subtle[name] = function () {
      const args = arguments;
      return new Promise((resolve, reject) => {
        const op = fn.apply(subtle, args);
        op.oncomplete = e => {
          resolve(e.target.result);
        };
        op.onerror = _e => {
          reject(`Error on running '${name}' function`);
        };
      });
    };
  }
  if (typeof self !== "undefined" && self["msCrypto"]) {
    WrapFunction(exports.nativeSubtle, "generateKey");
    WrapFunction(exports.nativeSubtle, "digest");
    WrapFunction(exports.nativeSubtle, "sign");
    WrapFunction(exports.nativeSubtle, "verify");
    WrapFunction(exports.nativeSubtle, "encrypt");
    WrapFunction(exports.nativeSubtle, "decrypt");
    WrapFunction(exports.nativeSubtle, "importKey");
    WrapFunction(exports.nativeSubtle, "exportKey");
    WrapFunction(exports.nativeSubtle, "wrapKey");
    WrapFunction(exports.nativeSubtle, "unwrapKey");
    WrapFunction(exports.nativeSubtle, "deriveKey");
    WrapFunction(exports.nativeSubtle, "deriveBits");
  }
  if (!Math.imul) {
    Math.imul = function imul(a, b) {
      const ah = a >>> 16 & 0xffff;
      const al = a & 0xffff;
      const bh = b >>> 16 & 0xffff;
      const bl = b & 0xffff;
      return al * bl + (ah * bl + al * bh << 16 >>> 0) | 0;
    };
  }
  const window$1 = typeof self === "undefined" ? undefined : self;
  if (exports.nativeCrypto) {
    Object.freeze(exports.nativeCrypto.getRandomValues);
  }
  try {
    if (window$1 && !(self.crypto && self.crypto.subtle)) {
      delete self.crypto;
      window$1.crypto = new Crypto();
      Object.freeze(window$1.crypto);
    }
  } catch (e) {
    Debug.error(e);
  }
  const crypto = window$1.crypto;
  exports.Crypto = Crypto;
  exports.CryptoKey = CryptoKey;
  exports.crypto = crypto;
  exports.setCrypto = setCrypto;
  return exports;
}({});
