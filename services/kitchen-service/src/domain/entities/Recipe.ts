import { Recipe } from '@restaurant/shared-types';

export const RECIPES: Recipe[] = [
  {
    id: 1,
    name: 'Tomato Rice',
    ingredients: [
      { ingredient: 'tomato', quantity: 2 },
      { ingredient: 'rice', quantity: 1 },
      { ingredient: 'onion', quantity: 1 },
    ],
  },
  {
    id: 2,
    name: 'Chicken Salad',
    ingredients: [
      { ingredient: 'chicken', quantity: 1 },
      { ingredient: 'lettuce', quantity: 2 },
      { ingredient: 'lemon', quantity: 1 },
      { ingredient: 'cheese', quantity: 1 },
    ],
  },
  {
    id: 3,
    name: 'Meat & Potatoes',
    ingredients: [
      { ingredient: 'meat', quantity: 1 },
      { ingredient: 'potato', quantity: 2 },
      { ingredient: 'ketchup', quantity: 1 },
    ],
  },
  {
    id: 4,
    name: 'Cheesy Lemon Rice',
    ingredients: [
      { ingredient: 'rice', quantity: 2 },
      { ingredient: 'cheese', quantity: 2 },
      { ingredient: 'lemon', quantity: 1 },
    ],
  },
  {
    id: 5,
    name: 'Classic Burger',
    ingredients: [
      { ingredient: 'meat', quantity: 1 },
      { ingredient: 'lettuce', quantity: 1 },
      { ingredient: 'tomato', quantity: 1 },
      { ingredient: 'onion', quantity: 1 },
      { ingredient: 'ketchup', quantity: 1 },
    ],
  },
  {
    id: 6,
    name: 'Chicken Stew',
    ingredients: [
      { ingredient: 'chicken', quantity: 2 },
      { ingredient: 'potato', quantity: 1 },
      { ingredient: 'tomato', quantity: 1 },
      { ingredient: 'onion', quantity: 1 },
    ],
  },
];
