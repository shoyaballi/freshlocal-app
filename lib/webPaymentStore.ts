type PaymentResolver = (result: { success: boolean; error?: string }) => void;

let clientSecret: string | null = null;
let resolver: PaymentResolver | null = null;
let listeners: Array<() => void> = [];

export const webPaymentStore = {
  getClientSecret: () => clientSecret,

  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },

  startPayment(secret: string): Promise<{ success: boolean; error?: string }> {
    clientSecret = secret;
    listeners.forEach((fn) => fn());
    return new Promise((resolve) => {
      resolver = resolve;
    });
  },

  completePayment(result: { success: boolean; error?: string }) {
    resolver?.(result);
    resolver = null;
    clientSecret = null;
    listeners.forEach((fn) => fn());
  },
};
