export class TypeMismatchError extends Error {

  constructor(parentType: string, parentField: string, expectedArray: boolean) {
    super(`"${parentType}.${parentField}" is expected to be an ${expectedArray
      ? 'array'
      : 'object'} but got ${expectedArray ? 'object' : 'array'}.`);
  }
}
