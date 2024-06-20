export class MissingKeyError extends Error {

  constructor(type: string, keyField: string) {
    super(`Key ${keyField} is missing in object of type ${type}`);
  }
}
