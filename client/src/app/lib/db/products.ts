import { prisma } from '@/prisma';
import { Product } from '../../../generated/prisma/client';
import { SortOrder } from '../../../generated/prisma/internal/prismaNamespace';
import type { ProductOrderByWithRelationInput } from '../../../generated/prisma/models/Product';

type ProductWriteData = {
  productName: string;
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

export const product = {
  idProduct: async (
    userId: string,
    productId: string,
  ): Promise<Product | undefined> => {
    try {
      const res = await prisma.product.findUnique({
        where: {
          userId,
          id: productId,
        },
      });
      if (!res)
        throw new Error(`Product ${productId} not found for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error fetching product ${productId}`, error);
      throw error;
    }
  },
  searchProduct: async (
    userId: string,
    search?: string | undefined,
    sort?: string,
  ): Promise<Product[]> => {
    try {
      const ORDER_MAP: Record<string, ProductOrderByWithRelationInput> = {
        newest: { createdAt: SortOrder.desc },
        oldest: { createdAt: SortOrder.asc },
        a_z: { productName: SortOrder.asc },
        z_a: { productName: SortOrder.desc },
      };

      const primarySort = ORDER_MAP[sort ?? 'newest'] ?? ORDER_MAP['newest']!;

      const orderBy: ProductOrderByWithRelationInput[] = [
        primarySort,
        { id: 'desc' },
      ];

      const res = await prisma.product.findMany({
        where: {
          userId,
          ...(search && {
            OR: [
              {
                productName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                keywords: {
                  has: search,
                  mode: 'insensitive',
                },
              },
              {
                brands: {
                  has: search,
                  mode: 'insensitive',
                },
              },
              {
                categories: {
                  has: search,
                  mode: 'insensitive',
                },
              },
              {
                ingredients: {
                  has: search,
                  mode: 'insensitive',
                },
              },
            ],
          }),
        },
        orderBy,
      });
      if (!res)
        throw new Error(
          `Products on search ${search}, sort ${sort} not found for user ${userId}`,
        );
      return res;
    } catch (error) {
      console.error(
        `Error fetching product on search ${search}, ${sort}`,
        error,
      );
      throw error;
    }
  },
  createProduct: async (
    userId: string,
    data: Partial<ProductWriteData>,
  ): Promise<Product> => {
    try {
      const res = await prisma.product.create({
        data: {
          userId,
          ...data,
          keywords: data?.keywords?.length ? data.keywords : null,
          brands: data?.brands?.length ? data.brands : null,
          additives: data?.additives?.length ? data.additives : null,
          categories: data?.categories?.length ? data.categories : null,
          ingredients: data?.ingredients?.length ? data.ingredients : null,
        },
      });
      if (!res)
        throw new Error(
          `Product ${data.productName} not created for user ${userId}`,
        );
      return res;
    } catch (error) {
      console.error(`Error creating product ${data.productName}`, error);
      throw error;
    }
  },
  updateProduct: async (
    userId: string,
    productId: string,
    data: Partial<ProductWriteData>,
  ): Promise<Product> => {
    try {
      const res = await prisma.product.update({
        where: { userId: userId, id: productId },
        data: {
          ...data,
          keywords: data?.keywords?.length ? data.keywords : null,
          brands: data?.brands?.length ? data.brands : null,
          additives: data?.additives?.length ? data.additives : null,
          categories: data?.categories?.length ? data.categories : null,
          ingredients: data?.ingredients?.length ? data.ingredients : null,
        },
      });
      if (!res)
        throw Error(`Product ${productId} not found for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error updating product ${productId}`, error);
      throw error;
    }
  },
  deleteProduct: async (
    userId: string,
    productId: string,
  ): Promise<Product> => {
    try {
      const res = await prisma.product.delete({
        where: {
          userId,
          id: productId,
        },
      });
      if (!res)
        throw Error(`Product ${productId} not found for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error deleting product ${productId}`, error);
      throw error;
    }
  },
};
