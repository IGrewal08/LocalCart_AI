import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SortOrder } from '@/generated/prisma/internal/prismaNamespace';
import type { ProductOrderByWithRelationInput } from '@/generated/prisma/internal/prismaNamespace';
import { Product } from '@/generated/prisma/client';
import { assertProductExists, assertUserExists } from '@/lib/guards';
import { validateAndExecute } from '@/lib/createAction';
import { authenticatedAction } from '@/lib/authWrapper';

('use server');

const searchProductSchema = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),
});

export const createProductSchema = z.object({
  code: z.string(),
  productName: z
    .string()
    .min(2, 'Product name must be at least 2 characters long.'),
  price: z.number().optional(),
  notes: z.string().optional(),
  calories: z.number().min(0, 'Calories must be a positive number.'),
  totalCarbs: z.number().min(0, 'Total carbs must be a positive number.'),
  fiber: z.number().min(0, 'Fiber must be a positive number.'),
  addedSugar: z.number().min(0, 'Added sugar must be a positive number.'),
  totalFat: z.number().min(0, 'Total fat must be a positive number.'),
  saturatedFat: z.number().min(0, 'Saturated fat must be a positive number.'),
  transFat: z.number().min(0, 'Trans fat must be a positive number.'),
  protein: z.number().min(0, 'Protein must be a positive number.'),
  vitaminA: z.number().min(0, 'Vitamin A must be a positive number.'),
  vitaminC: z.number().min(0, 'Vitamin C must be a positive number.'),
  vitaminD: z.number().min(0, 'Vitamin D must be a positive number.'),
  iron: z.number().min(0, 'Iron must be a positive number.'),
  potassium: z.number().min(0, 'Potassium must be a positive number.'),
  sodium: z.number().min(0, 'Sodium must be a positive number.'),
  cholesterol: z.number().min(0, 'Cholesterol must be a positive number.'),
  keywords: z
    .array(z.string().min(2, 'Each keyword must be at least 2 characters'))
    .optional(),
  brands: z
    .array(z.string().min(2, 'Each brand must be at least 2 characters'))
    .optional(),
  additives: z
    .array(z.string().min(2, 'Each additive must be at least 2 characters'))
    .optional(),
  categories: z
    .array(z.string().min(2, 'Each category must be at least 2 characters'))
    .optional(),
  ingredients: z
    .array(z.string().min(2, 'Each ingredient must be at least 2 characters'))
    .optional(),
});

export async function idProductAction(
  userId: string,
  productId: string,
): Promise<{ success: boolean; errors?: any; data?: Product }> {
  return await authenticatedAction(async () => {
    try {
      const product: Product = await assertProductExists(userId, productId);
      return { success: true, data: product };
    } catch (error: any) {
      return {
        success: false,
        errors: { message: error.message },
      };
    }
  });
}

export async function searchProductAction(
  userId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: Product[] }> {
  const rawData = {
    search: formData.get('search'),
    sort: formData.get('sort'),
  };

  return await authenticatedAction(async () => {
    return await validateAndExecute(
      searchProductSchema,
      rawData,
      async (data) => {
        await assertUserExists(userId);
        const ORDER_MAP: Record<string, ProductOrderByWithRelationInput> = {
          newest: { createdAt: SortOrder.desc },
          oldest: { createdAt: SortOrder.asc },
          a_z: { productName: SortOrder.asc },
          z_a: { productName: SortOrder.desc },
        };

        const primarySort =
          ORDER_MAP[data.sort ?? 'newest'] ?? ORDER_MAP['newest']!;

        const orderBy: ProductOrderByWithRelationInput[] = [
          primarySort,
          { id: 'desc' },
        ];

        return await prisma.product.findMany({
          where: {
            userId,
            ...(data.search && {
              OR: [
                { productName: { contains: data.search, mode: 'insensitive' } },
                { keywords: { has: data.search } },
                { brands: { has: data.search } },
                { categories: { has: data.search } },
                { ingredients: { has: data.search } },
              ],
            }),
          },
          orderBy,
        });
      },
    );
  });
}

export async function createProductAction(
  userId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: Product }> {
  const rawData = {
    code: formData.get('code'),
    productName: formData.get('productName'),
    price: formData.get('price'),
    notes: formData.get('notes'),
    calories: formData.get('calories'),
    totalCarbs: formData.get('totalCarbs'),
    fiber: formData.get('fiber'),
    addedSugar: formData.get('addedSugar'),
    totalFat: formData.get('totalFat'),
    saturatedFat: formData.get('saturatedFat'),
    transFat: formData.get('transFat'),
    protein: formData.get('protein'),
    vitaminA: formData.get('vitaminA'),
    vitaminC: formData.get('vitaminC'),
    vitaminD: formData.get('vitaminD'),
    iron: formData.get('iron'),
    potassium: formData.get('potassium'),
    sodium: formData.get('sodium'),
    cholesterol: formData.get('cholesterol'),
    keywords: formData.getAll('keywords'),
    brands: formData.getAll('bands'),
    additives: formData.getAll('additives'),
    categories: formData.getAll('categories'),
    ingredients: formData.getAll('ingredients'),
  };

  return await authenticatedAction(async () => {
    return await validateAndExecute(
      createProductSchema,
      rawData,
      async (data) => {
        await assertUserExists(userId);
        return await prisma.product.create({
          data: {
            userId,
            keywords: data?.keywords?.length ? data.keywords : [],
            brands: data?.brands?.length ? data.brands : [],
            additives: data?.additives?.length ? data.additives : [],
            categories: data?.categories?.length ? data.categories : [],
            ingredients: data?.ingredients?.length ? data.ingredients : [],
          },
        });
      },
    );
  });
}

export async function updateProductAction(
  userId: string,
  productId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: Product }> {
  const rawData = {
    code: formData.get('code'),
    productName: formData.get('productName'),
    price: formData.get('price'),
    notes: formData.get('notes'),
    calories: formData.get('calories'),
    totalCarbs: formData.get('totalCarbs'),
    fiber: formData.get('fiber'),
    addedSugar: formData.get('addedSugar'),
    totalFat: formData.get('totalFat'),
    saturatedFat: formData.get('saturatedFat'),
    transFat: formData.get('transFat'),
    protein: formData.get('protein'),
    vitaminA: formData.get('vitaminA'),
    vitaminC: formData.get('vitaminC'),
    vitaminD: formData.get('vitaminD'),
    iron: formData.get('iron'),
    potassium: formData.get('potassium'),
    sodium: formData.get('sodium'),
    cholesterol: formData.get('cholesterol'),
    keywords: formData.getAll('keywords'),
    brands: formData.getAll('bands'),
    additives: formData.getAll('additives'),
    categories: formData.getAll('categories'),
    ingredients: formData.getAll('ingredients'),
  };
  return await authenticatedAction(async () => {
    return await validateAndExecute(
      createProductSchema,
      rawData,
      async (data) => {
        await assertProductExists(userId, productId);
        return await prisma.product.update({
          where: { id: productId },
          data: {
            ...data,
            keywords: data.keywords ?? undefined,
            brands: data.brands ?? undefined,
            additives: data.additives ?? undefined,
            categories: data.categories ?? undefined,
            ingredients: data.ingredients ?? undefined,
          },
        });
      },
    );
  });
}

export async function deleteProductAction(
  userId: string,
  productId: string,
): Promise<{ success: boolean; errors?: any; data?: Product }> {
  return await authenticatedAction(async () => {
    try {
      await assertProductExists(userId, productId);
      const res = await prisma.product.delete({
        where: { id: productId },
      });
      return { success: true, data: res };
    } catch (error: any) {
      return {
        success: false,
        errors: { message: error.message },
      };
    }
  });
}
