import { vi } from "vitest";

export class TestEventSource extends EventTarget {
  static instances: TestEventSource[] = [];

  readonly url: string;
  close = vi.fn();

  constructor(url: string) {
    super();
    this.url = url;
    TestEventSource.instances.push(this);
  }

  emit(name: string, data?: unknown) {
    this.dispatchEvent(
      data === undefined ? new Event(name) : new MessageEvent(name, { data: JSON.stringify(data) }),
    );
  }
}
