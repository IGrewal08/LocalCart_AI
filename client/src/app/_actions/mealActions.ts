import { prisma } from '@/prisma';
import { mealWithProducts, MealWithProducts } from '@/types';
import z from 'zod';
import {
  MealOrderByWithRelationInput,
  SortOrder,
} from '../../generated/prisma/internal/prismaNamespace';
import { assertMealExists, assertUserExists } from '@/lib/db/guards';
import { validateAndExecute } from '@/lib/createAction';
import { Meal } from '../../generated/prisma/client';

const searchMealSchema = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),
});

const createMealSchema = z.object({
  name: z
    .string()
    .min(2, 'Meal name must be at least 2 letters long')
    .optional(),
  notes: z.string().optional(),
  products: z
    .array(
      z.object({
        productId: z
          .string()
          .min(1, 'Product ID must be at least on letter long'),
        quantity: z.number().optional(),
        unit: z.string().optional(),
      }),
    )
    .optional(),
});

export async function idMeaAction(
  userId: string,
  mealId: string,
): Promise<{ success: boolean; errors?: any; data?: MealWithProducts }> {
  try {
    await assertUserExists(userId);

    const res: MealWithProducts = await prisma.meal.findFirst({
      where: {
        userId,
        id: mealId,
      },
      include: mealWithProducts.include,
    });
    return { success: true, data: res };
  } catch (error: any) {
    return {
      success: false,
      errors: { message: error.message },
    };
  }
}

export async function searchMealAction(
  userId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: MealWithProducts[] }> {
  const rawData = {
    search: formData.get('search'),
    sort: formData.get('sort'),
  };

  return validateAndExecute(searchMealSchema, rawData, async (data) => {
    await assertUserExists(userId);

    const ORDER_MAP: Record<string, MealOrderByWithRelationInput> = {
      newest: { created_at: SortOrder.desc },
      oldest: { created_at: SortOrder.asc },
      a_z: { name: SortOrder.asc },
      z_a: { name: SortOrder.desc },
    };

    const primarySort = ORDER_MAP[data.sort ?? 'newest'] ?? ORDER_MAP['newest'];

    const orderBy: MealOrderByWithRelationInput[] = [
      primarySort,
      { id: 'desc' },
    ];

    return await prisma.meal.findMany({
      where: {
        userId,
        ...(data.search && {
          OR: [
            { name: { contains: data.search, mode: 'insensitive' } },
            {
              products: {
                some: {
                  product: {
                    productName: { contains: data.search, mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        }),
      },
      include: mealWithProducts.include,
      orderBy,
    });
  });
}

export async function createMealAction(
  userId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: MealWithProducts }> {
  const rawData = {
    name: formData.get('name'),
    notes: formData.get('notes'),
    products: formData.getAll('product'),
  };

  return validateAndExecute(createMealSchema, rawData, async (data) => {
    await assertUserExists(userId);

    if (data.products?.length) {
      const productIds = data.products.map((p) => p.productId);
      const existingCount = await prisma.product.count({
        where: { id: { in: productIds }, userId },
      });

      if (existingCount !== productIds.length) {
        throw new Error(
          `One or more products do not exist or belong to user with ID ${userId}`,
        );
      }
    }

    return await prisma.meal.create({
      data: {
        userId,
        name: data.name!,
        notes: data.notes,
        products: {
          createMany: {
            data: data.products!.map((product) => ({
              productId: product.productId,
              quantity: product.quantity ?? 1,
              unit: product.unit,
            })),
          },
        },
      },
      include: mealWithProducts.include,
    });
  });
}

export async function updateMealAction(
  userId: string,
  mealId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: MealWithProducts }> {
  const rawData = {
    name: formData.get('name'),
    notes: formData.get('notes'),
    products: formData.getAll('product'),
  };

  return validateAndExecute(createMealSchema, rawData, async (data) => {
    await assertMealExists(userId, mealId);

    if (data.products?.length) {
      const productIds = data.products.map((p) => p.productId);
      const existCount = await prisma.product.count({
        where: { id: { in: productIds }, userId },
      });
      if (existCount !== productIds.length) {
        throw new Error(
          `One or more products do not exist or belong to user with ID ${userId}`,
        );
      }
    }

    return await prisma.meal.update({
      where: { id: mealId },
      data: {
        name: data.name,
        notes: data.notes,
        ...(data.products && {
          products: {
            set: data.products!.map((product) => ({
              productId: product.productId,
              quantity: product.quantity ?? 1,
              unit: product.unit,
            })),
          },
        }),
      },
      include: mealWithProducts.include,
    });
  });
}

export async function deleteMealAction(
  userId: string,
  mealId: string,
): Promise<{ success: boolean; errors?: any; data?: Meal }> {
  try {
    await assertMealExists(userId, mealId);

    const res = await prisma.meal.delete({
      where: { id: mealId },
    });
    return { success: true, data: res };
  } catch (error: any) {
    return {
      success: false,
      errors: { message: error.message },
    };
  }
}
