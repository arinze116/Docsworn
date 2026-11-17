import { HostedRequestError } from "./errors.js";

export class SingleFlightGate {
  private active = 0;

  constructor(private readonly limit = 1) {}

  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      throw new HostedRequestError("A live audit is already running. Try again shortly.", 503, "WORKER_BUSY", 60);
    }
    this.active += 1;
    try {
      return await operation();
    } finally {
      this.active -= 1;
    }
  }
}
