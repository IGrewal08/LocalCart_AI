import { mealWithProducts, MealWithProducts, MealWriteData } from '@/types';
import { Meal } from '../../../generated/prisma/client';
import { prisma } from '@/prisma';
import { MealOrderByWithRelationInput } from '../../../generated/prisma/models';
import { SortOrder } from '../../../generated/prisma/internal/prismaNamespace';

export const meals = {
  idMeal: async (userId: string, mealId: string): Promise<MealWithProducts> => {
    try {
      const res = await prisma.meal.findFirst({
        where: {
          userId,
          id: mealId,
        },
        include: mealWithProducts.include,
      });

      if (!res) throw new Error(`Meal ${mealId} not found for user ${userId}`);

      return res;
    } catch (error) {
      console.error(`Error fetching meal ${mealId}`, error);
      throw error;
    }
  },

  searchMeal: async (
    userId: string,
    search?: string,
    sort?: string,
  ): Promise<MealWithProducts[]> => {
    try {
      const ORDER_MAP: Record<string, MealOrderByWithRelationInput> = {
        newest: { created_at: SortOrder.desc },
        oldest: { created_at: SortOrder.asc },
        a_z: { name: SortOrder.asc },
        z_a: { name: SortOrder.desc },
      };

      const primarySort = ORDER_MAP[sort ?? 'newest'] ?? ORDER_MAP['newest'];

      const orderBy: MealOrderByWithRelationInput[] = [
        primarySort,
        { id: 'desc' },
      ];

      const res = await prisma.meal.findMany({
        where: {
          userId,
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              {
                products: {
                  some: {
                    product: {
                      productName: { contains: search, mode: 'insensitive' },
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

      if (!res)
        throw new Error(
          `Meals on search ${search}, sort ${sort} not found for user ${userId}`,
        );

      return res;
    } catch (error) {
      console.error(`Error fetching meal on search ${search}, ${sort}`, error);
      throw error;
    }
  },

  createMeal: async (
    userId: string,
    data: MealWriteData,
  ): Promise<MealWithProducts> => {
    try {
      if (data.products?.length) {
        const productIds = data.products.map((p) => p.productId);
        const existingCount = await prisma.product.count({
          where: { id: { in: productIds }, userId },
        });

        if (existingCount !== productIds.length)
          throw new Error(
            `One or more products do not exist or do not belong to user ${userId}`,
          );
      }

      const res = await prisma.meal.create({
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

      if (!res)
        throw new Error(`Meal ${data.name} was not created for user ${userId}`);

      return res;
    } catch (error) {
      console.error(`Error creating meal ${data.name}`, error);
      throw error;
    }
  },

  updateMeal: async (
    userId: string,
    mealId: string,
    data: MealWriteData,
  ): Promise<MealWithProducts> => {
    try {
      const existingMeal = await prisma.meal.findFirst({
        where: { id: mealId, userId },
      });
      if (!existingMeal)
        throw new Error(`Meal ${mealId} not found for user ${userId}`);

      if (data.products?.length) {
        const productIds = data.products.map((p) => p.productId);
        const existCount = await prisma.product.count({
          where: { id: { in: productIds }, userId },
        });
        if (existCount !== productIds.length)
          throw new Error(
            `One or more products do not exist or do not belong to user ${userId}`,
          );
      }

      const res = await prisma.meal.update({
        where: { id: mealId },
        data: {
          name: data.name,
          notes: data.notes,
          ...(data.products && {
            products: {
              deleteMany: {},
              create: data.products.map((product) => ({
                productId: product.productId,
                quantity: product.quantity ?? 1,
                unit: product.unit,
              })),
            },
          }),
        },
        include: mealWithProducts.include,
      });

      if (!res)
        throw new Error(`Meal ${mealId} was not updated for user ${userId}`);

      return res;
    } catch (error) {
      console.error(`Error updating meal ${mealId}`, error);
      throw error;
    }
  },

  deleteMeal: async (userId: string, mealId: string): Promise<void> => {
    try {
      const existingProduct = await prisma.product.findFirst({
        where: { id: mealId, userId },
      });

      if (!existingProduct)
        throw new Error(
          `Meal ${mealId} not found or unauthorized for user ${userId}`,
        );

      const res = await prisma.meal.delete({
        where: { id: mealId },
      });

      if (!res) throw new Error(`Meal ${mealId} not found for user ${userId}`);

      return res;
    } catch (error) {
      console.error(`Error deleting meal ${mealId}`, error);
      throw error;
    }
  },
};
