import { Purchase } from '../entities/Purchase';

export interface IPurchaseRepository {
  create(ingredient: string, quantityReceived: number, success: boolean): Promise<Purchase>;
  findAll(): Promise<Purchase[]>;
}
