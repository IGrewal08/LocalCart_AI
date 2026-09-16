import { Prisma } from '../../generated/prisma/client';

export enum mealTime {
  breakfast = 'BREAKFAST',
  lunch = 'LUNCH',
  dinner = 'DINNER',
  snacks = 'SNACKS',
}

export type User = {
  id: string;
  email: string;
  name: string;
};

export type Provider = {
  id: string;
  providerName: string;
};

export const mealWithProducts = {
  include: {
    products: {
      include: {
        product: true,
      },
    },
  },
} satisfies Prisma.MealDefaultArgs;

export type MealWithProducts = Prisma.MealGetPayload<typeof mealWithProducts>;
