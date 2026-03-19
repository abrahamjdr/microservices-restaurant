export interface IMarketPort {
  buyIngredient(ingredient: string, quantity: number): Promise<number>;
}
