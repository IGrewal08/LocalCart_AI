import { MealTime, Prisma } from '../../generated/prisma/client';

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

export type MealProductWrite = {
  productId: string;
  quantity?: number;
  unit?: string | null;
};

export type MealWriteData = {
  name?: string;
  notes?: string | null;
  products?: MealProductWrite[];
};

export const logWithMealAndProduct = {
  include: {
    products: {
      include: {
        product: true,
      },
    },
    meals: {
      include: {
        meal: true,
      },
    },
  },
};

export type LogWithMealAndProduct = Prisma.LogGetPayload<
  typeof logWithMealAndProduct
>;

export type LogProductWrite = {
  productId: string;
  quantity: number;
  unit?: string | 'g';
};

export type LogMealWrite = {
  quantity: number;
  mealId: string;
};

export type LogWriteData = {
  time: MealTime;
  products: LogProductWrite[];
  meals: LogMealWrite[];
};
