// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

// https://stackoverflow.com/a/40294058/3863059
// https://jsfiddle.net/pahund/5qtt2Len/1/
// https://stackoverflow.com/a/1042676/3863059

// https://github.com/dfahlander/Dexie.js/blob/2008d32233e6e39865c9ab02f323d1748246ae1d/src/utils.js#L189

export function deepClone(object: any) {
  const ctor = object ? object.constructor : null;
  if (object === null || typeof object !== 'object' || ctor === ArrayBuffer || ctor === Blob || ctor === File) {
    return object;
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
  if (ctor === Date || ctor === RegExp || ctor === Function || ctor === JSON ||
    ctor === String || ctor === Number || ctor === Boolean ||
    ctor === Set || ctor === Map || ctor === WeakMap || ctor === WeakSet) {
    return new ctor(object);
  }

  const result = new ctor();
  Object.keys(object)
    .forEach(key => result[key] = deepClone(object[key]));

  return result;
}
