export interface Purchase {
  id: string;
  ingredient: string;
  quantityReceived: number;
  requestedAt: Date;
  success: boolean;
}
