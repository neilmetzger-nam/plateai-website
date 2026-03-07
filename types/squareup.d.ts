declare module "squareup" {
  export class Client {
    constructor(config: {
      accessToken: string;
      environment: string;
    });
    customersApi: {
      searchCustomers(body: Record<string, unknown>): Promise<{
        result: { customers?: Array<{ id: string }> };
      }>;
      createCustomer(body: Record<string, unknown>): Promise<{
        result: { customer: { id: string } };
      }>;
    };
    cardsApi: {
      createCard(body: Record<string, unknown>): Promise<{
        result: { card: { id: string } };
      }>;
    };
    subscriptionsApi: {
      createSubscription(body: Record<string, unknown>): Promise<{
        result: { subscription: { id: string } };
      }>;
    };
  }
  export const Environment: {
    Production: string;
    Sandbox: string;
  };
}
