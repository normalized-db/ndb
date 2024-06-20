export class Queue<T> {

  constructor(private readonly data: T[] = []) {
  }

  public get length(): number {
    return this.data.length;
  }

  public get isEmpty(): boolean {
    return this.length === 0;
  }

  public enqueue(item: T) {
    this.data.push(item);
  }

  public dequeue(): T {
    return this.data.shift();
  }

  public clear() {
    this.data.splice(0, this.length);
  }
}
