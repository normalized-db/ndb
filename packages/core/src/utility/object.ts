export function isNull(object: any): boolean {
  return typeof object === 'undefined' || object === null;
}

export function isObject(object: any): boolean {
  return !isNull(object) && typeof object === 'object';
}
