import { MealWithProducts } from '@/types';
import { Meal } from '../../../generated/prisma/client';
import { prisma } from '@/prisma';
import {
  MealOrderByWithRelationInput,
  ProductOrderByWithRelationInput,
} from '../../../generated/prisma/models';
import { SortOrder } from '../../../generated/prisma/internal/prismaNamespace';
import { product } from './products';

export const meals = {
  idMeal: async (userId: string, mealId: string): Promise<MealWithProducts> => {
    try {
      const res = await prisma.meal.findUnique({
        where: {
          userId,
          id: mealId,
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
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

      const orderBy: ProductOrderByWithRelationInput[] = [
        primarySort,
        { id: 'desc' },
      ];

      const res = await prisma.meal.findMany({
        where: {
          userId,
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              products: {
                some: {
                  product: {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
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
    data: Partial<MealWithProducts>,
  ): Promise<MealWithProducts> => {
    try {
      if (data.products) {
        for (const product of data.products) {
          const productExists = await prisma.product.findUnique({
            where: { id: product.productId },
          });
          if (!productExists)
            throw new Error(
              `Product with id ${product.productId} does not exist`,
            );
        }
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
    data: Partial<MealWithProducts>,
  ): Promise<MealWithProducts> => {
    try {
      if (data.products) {
        for (const product of data.products) {
          const productExists = await prisma.product.findUnique({
            where: { id: product.productId },
          });
          if (!productExists)
            throw new Error(
              `Product with id ${product.productId} does not exist`,
            );
        }
      }
      const res = await prisma.meal.update({
        where: {
          userId,
          mealId,
        },
        data: {
          ...data,
          products: {
            upsert: data.products
              ? data.products.map((product) => ({
                  where: {
                    mealId_productId: {
                      mealId,
                      productId: product.productId,
                    },
                  },
                  create: {
                    mealId,
                    productId: product.productId,
                    quantity: product.quantity ?? 1,
                    unit: product.unit,
                  },
                  update: {
                    quantity: product.quantity ?? 1,
                    unit: product.unit,
                  },
                }))
              : undefined,
          },
        },
        include: {
          products: true,
        },
      });
      if (!res)
        throw new Error(`Meal ${mealId} was not updated for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error updating meal ${mealId}`, error);
      throw error;
    }
  },
  deleteMeal: async (userId: string, mealId: string): Promise<Meal> => {
    try {
      const res = await prisma.meal.delete({
        where: {
          userId,
          id: mealId,
        },
      });
      if (!res) throw new Error(`Meal ${mealId} not found for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error deleting meal ${mealId}`, error);
      throw error;
    }
  },
};
