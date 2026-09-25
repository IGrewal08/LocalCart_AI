import { preferences } from '@/lib/db/preferences';
import { MealTime, Prisma } from '../../generated/prisma/client';

export enum mealTime {
  breakfast = 'BREAKFAST',
  lunch = 'LUNCH',
  dinner = 'DINNER',
  snacks = 'SNACKS',
}

export type UserWriteData = {
  email: string;
  name: string;
  password: string;
};

export const userResponse = {
  select: {
    id: true,
    createdAt: true,
    name: true,
    email: true,
    password: false,
    providers: false,
    meals: false,
    logs: false,
    preference: false,
  },
} satisfies Prisma.UserDefaultArgs;

export type UserResponse = Prisma.UserGetPayload<typeof userResponse>;

export type UserUpdateInput = {
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  newPassword?: string;
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
} satisfies Prisma.LogDefaultArgs;

export type LogWithMealAndProduct = Prisma.LogGetPayload<
  typeof logWithMealAndProduct
>;

export type ProductWriteData = {
  code: string;
  productName: string;
  price?: number;
  notes?: string;
  calories: number;
  totalCarbs: number;
  fiber: number;
  addedSugar: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  protein: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  iron: number;
  potassium: number;
  sodium: number;
  cholesterol: number;
  keywords?: string[];
  brands?: string[];
  additives?: string[];
  categories?: string[];
  ingredients?: string[];
};

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

export type PreferenceWriteData = {
  preferences: String[];
};
