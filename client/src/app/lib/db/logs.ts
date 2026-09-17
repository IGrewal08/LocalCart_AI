import {
  logWithMealAndProduct,
  LogWithMealAndProduct,
  LogWriteData,
} from '@/types';
import { prisma } from '@/prisma';
import { meals } from './meals';
import { products } from './products';
import { Meal, MealTime, Product } from '../../../generated/prisma/client';
import { log } from 'console';

export const logs = {
  idLog: async (
    userId: string,
    logId: string,
  ): Promise<LogWithMealAndProduct> => {
    try {
      const res = prisma.log.findFirst({
        where: {
          userId,
          logId,
        },
        include: logWithMealAndProduct.include,
      });
      if (!res) throw new Error(`Log ${logId} not found for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error fetching log ${logId}`, error);
      throw error;
    }
  },

  dateLog: async (
    userId: string,
    date: Date,
  ): Promise<LogWithMealAndProduct[]> => {
    try {
      const existingLogs = await prisma.log.findFirst({
        where: {
          userId,
          date,
        },
      });
      if (!existingLogs)
        throw new Error(`Log on date ${date} not found for user ${userId}`);

      const res = await prisma.log.findMany({
        where: {
          userId,
          date,
        },
        include: logWithMealAndProduct.include,
      });

      if (!res)
        throw new Error(
          `Log with date ${date} was not created for user ${userId}`,
        );
      return res;
    } catch (error) {
      console.error(`Error fetching log for date ${date}`, error);
      throw error;
    }
  },

  searchLog: async (
    userId: string,
    search?: string,
    sort?: string,
  ): Promise<(Meal | Product)[]> => {
    try {
      const fetchMeals = await meals.searchMeal(userId, search, sort);
      const fetchProducts = await products.searchProduct(userId, search, sort);
      return [...fetchMeals, ...fetchProducts];
    } catch (error) {
      console.error(
        `Error fetching meal and product on search ${search}, ${sort}`,
        error,
      );
      throw error;
    }
  },

  createLog: async (
    userId: string,
    data: LogWriteData,
    time: MealTime,
  ): Promise<LogWithMealAndProduct> => {
    try {
      const existingMeals = await prisma.meal.findMany({
        where: {
          id: {
            in: data.meals!.map((meal) => meal.mealId),
          },
        },
      });
      if (existingMeals.length !== data.meals!.length)
        throw new Error('Some meal IDs do not exist');
      const existingProducts = await prisma.product.findMany({
        where: {
          id: {
            in: data.products!.map((product) => product.productId),
          },
        },
      });
      if (existingProducts.length !== data.products!.length)
        throw new Error('Some product IDs do not exists');
      const res = await prisma.log.create({
        data: {
          userId,
          time,
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
      if (!res)
        throw new Error(`Log for ${time} was not created for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error creating ${time} log`, error);
      throw error;
    }
  },

  updateLog: async (
    userId: string,
    logId: string,
    data: LogWriteData,
  ): Promise<LogWithMealAndProduct> => {
    try {
      const existingLog = await prisma.log.findUnique({
        where: {
          id: logId,
        },
      });
      if (!existingLog) throw new Error(`Log ${logId} was not found`);
      const existingMeals = await prisma.meal.findMany({
        where: {
          id: {
            in: data.meals!.map((meal) => meal.mealId),
          },
        },
      });
      if (existingMeals.length !== data.meals!.length)
        throw new Error('Some meal IDs do not exist');
      const existingProducts = await prisma.product.findMany({
        where: {
          id: {
            in: data.products!.map((product) => product.productId),
          },
        },
      });
      if (existingProducts.length !== data.products!.length)
        throw new Error('Some product IDs do not exists');
      const res = await prisma.log.update({
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
      if (!res)
        throw new Error(`Log ${logId} was not updated for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error updating log ${logId}`, error);
      throw error;
    }
  },

  deleteLog: async (userId: string, logId: string): Promise<void> => {
    try {
      const existingLog = await prisma.product.findFirst({
        where: { id: logId, userId },
      });
      if (!existingLog)
        throw new Error(
          `Log ${logId} not found or unauthorized for user ${userId}`,
        );
      const res = await prisma.log.delete({
        where: { id: logId },
      });
      if (!res) throw new Error(`Log ${logId} not found for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error deleting log ${logId}`, error);
      throw error;
    }
  },
};
