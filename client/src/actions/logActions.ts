import { validateAndExecute } from '@/lib/createAction';
import {
  assertLogExists,
  assertLogExistsById,
  assertMealExists,
  assertProductExists,
  assertUserExists,
} from '@/lib/guards';
import { prisma } from '@/lib/prisma';
import {
  logWithMealAndProduct,
  LogWithMealAndProduct,
  MealWithProducts,
} from '@/types';
import z from 'zod';
import { MealTime, Product } from '@/generated/prisma/client';
import { searchMealAction } from './mealActions';
import { searchProductAction } from './productActions';
import { Log } from '@/generated/prisma/browser';

('use server');

const createLogSchema = z.object({
  time: z.enum(MealTime),
  products: z.array(
    z.object({
      productId: z
        .string()
        .min(1, 'ProductId must be at least a character long.'),
      quantity: z.number().min(0),
      unit: z.string().default('g'),
    }),
  ),
  meals: z.array(
    z.object({
      quantity: z.number().min(0),
      mealId: z.string().min(1, 'MealId must be at least a character long.'),
    }),
  ),
});

export async function idLogAction(
  userId: string,
  logId: string,
): Promise<{ success: boolean; errors?: any; data?: LogWithMealAndProduct }> {
  try {
    await assertUserExists(userId);
    const res: LogWithMealAndProduct = await prisma.log.findFirst({
      where: { userId, id: logId },
      include: logWithMealAndProduct.include,
    });
    return { success: true, data: res };
  } catch (error: any) {
    return {
      success: false,
      errors: { message: error.message },
    };
  }
}

export async function dateLogAction(
  userId: string,
  date: Date,
): Promise<{ success: boolean; errors?: any; data?: LogWithMealAndProduct[] }> {
  try {
    await assertUserExists(userId);
    await assertLogExists(userId, date);
    const res: LogWithMealAndProduct[] = await prisma.log.findMany({
      where: { userId, date },
      include: logWithMealAndProduct.include,
    });
    return { success: true, data: res };
  } catch (error: any) {
    return {
      success: false,
      errors: { message: error.message },
    };
  }
}

export async function searchLogAction(
  userId: string,
  formData: FormData,
): Promise<{
  success: boolean;
  errors?: any;
  data?: (MealWithProducts | Product)[];
}> {
  try {
    const fetchMeals = await searchMealAction(userId, formData);
    const fetchProducts = await searchProductAction(userId, formData);

    let result: (MealWithProducts | Product)[] = [];

    if (fetchMeals.success && fetchMeals.data)
      result = [...fetchMeals.data, ...result];
    if (fetchProducts.success && fetchProducts.data)
      result = [...fetchProducts.data, ...result];

    if (!Array.isArray(result))
      throw new Error(
        'searchMealAction or searchProductAction did not return arrays.',
      );

    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { message: error.message },
    };
  }
}

export async function createLogAction(
  userId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: LogWithMealAndProduct }> {
  const rawData = {
    time: formData.get('time'),
    products: formData.getAll('product'),
    meals: formData.getAll('meal'),
  };

  return await validateAndExecute(createLogSchema, rawData, async (data) => {
    await Promise.all(
      data.meals.map(async (meal) => {
        await assertMealExists(userId, meal.mealId);
      }),
    );

    await Promise.all(
      data.products.map(async (product) => {
        await assertProductExists(userId, product.productId);
      }),
    );

    return await prisma.log.create({
      data: {
        userId,
        time: data.time,
        products: {
          createMany: {
            data: data.products!.map((product) => ({
              productId: product.productId,
              quantity: product.quantity ?? 1,
              unit: product.unit ?? 'g',
            })),
          },
        },
        meals: {
          createMany: {
            data: data.meals!.map((meal) => ({
              mealId: meal.mealId,
              quantity: meal.quantity ?? 1,
            })),
          },
        },
      },
      include: logWithMealAndProduct.include,
    });
  });
}

export async function updateLogAction(
  userId: string,
  logId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: LogWithMealAndProduct }> {
  const rawData = {
    time: formData.get('time'),
    products: formData.getAll('product'),
    meals: formData.getAll('meal'),
  };

  return await validateAndExecute(createLogSchema, rawData, async (data) => {
    await assertLogExistsById(userId, logId);
    await Promise.all(
      data.meals.map(async (meal) => {
        await assertMealExists(userId, meal.mealId);
      }),
    );

    await Promise.all(
      data.products.map(async (product) => {
        await assertProductExists(userId, product.productId);
      }),
    );

    return await prisma.log.update({
      where: { id: logId },
      data: {
        time: data.time,
        ...(data.meals && {
          meals: {
            set: data.meals!.map((meal) => ({
              mealId: meal.mealId,
              quantity: meal.quantity ?? 1,
            })),
          },
        }),
        ...(data.products && {
          products: {
            set: data.products!.map((product) => ({
              productId: product.productId,
              quantity: product.quantity ?? 1,
              unit: product.unit ?? 'g',
            })),
          },
        }),
      },
      include: logWithMealAndProduct.include,
    });
  });
}

export async function deleteLogAction(
  userId: string,
  logId: string,
): Promise<{ success: boolean; errors?: any; data?: Log }> {
  try {
    await assertLogExistsById(userId, logId);
    const res = await prisma.log.delete({
      where: { id: logId },
    });
    return { success: true, data: res };
  } catch (error: any) {
    return {
      success: false,
      errors: { message: error.message },
    };
  }
}
