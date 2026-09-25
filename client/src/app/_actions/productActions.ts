import { prisma } from '@/prisma';
import { z } from 'zod';
import { SortOrder } from '../../generated/prisma/internal/prismaNamespace';
import type { ProductOrderByWithRelationInput } from '../../generated/prisma/internal/prismaNamespace';
import { Product } from '../../generated/prisma/client';
import { ProductWriteData } from '@/types';
('use server');

export async function idProductAction(
  userId: string,
  productId: string,
): Promise<{ success: boolean; errors?: any; data?: Product | undefined }> {
  try {
    const res = await prisma.product.findFirst({
      where: {
        userId,
        id: productId,
      },
    });

    if (!res)
      throw new Error(`Product ${productId} not found for user ${userId}`);

    return { success: true, data: res };
  } catch (error) {
    console.error(`Error fetching product ${productId}`, error);
    return {
      success: false,
      errors: {
        message: `Failed to retrieved product with ID ${productId}. ${error}`,
      },
    };
  }
}

const searchProductData = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),
});

export async function searchProductAction(
  userId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: Product[] }> {
  const rawData = {
    search: formData.get('search'),
    sort: formData.get('sort'),
  };

  const validateData = searchProductData.safeParse(rawData);
  if (!validateData.success) {
    return {
      success: false,
      errors: z.treeifyError(validateData.error),
    };
  }
  const data = validateData.data;

  try {
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

    const res = await prisma.product.findMany({
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

    if (!res)
      throw new Error(
        `Products on search ${data.search}, sort ${data.sort} not found for user ${userId}`,
      );

    return { success: true, data: res };
  } catch (error) {
    console.error(
      `Error fetching product on search ${data.search}, ${data.sort}`,
      error,
    );
    return {
      success: false,
      errors: {
        message: `Failed to retrieve product with search ${data.search}`,
      },
    };
  }
}

const createProductData = z.object({
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

  const validateData = createProductData.safeParse(rawData);

  if (!validateData.success) {
    return {
      success: false,
      errors: z.treeifyError(validateData.error),
    };
  }
  const data: ProductWriteData = validateData.data as ProductWriteData;

  try {
    const res = await prisma.product.create({
      data: {
        userId,
        keywords: data?.keywords?.length ? data.keywords : [],
        brands: data?.brands?.length ? data.brands : [],
        additives: data?.additives?.length ? data.additives : [],
        categories: data?.categories?.length ? data.categories : [],
        ingredients: data?.ingredients?.length ? data.ingredients : [],
      },
    });

    if (!res)
      throw new Error(
        `Product ${data.productName} not created for user ${userId}`,
      );

    return { success: true, data: res };
  } catch (error) {
    console.error(`Error creating product ${data.productName}`, error);
    return {
      success: false,
      errors: {
        message: `An error occurred while creating the product.`,
      },
    };
  }
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

  const validateData = createProductData.safeParse(rawData);

  if (!validateData.success) {
    return {
      success: false,
      errors: z.treeifyError(validateData.error),
    };
  }

  const data: ProductWriteData = validateData.data as ProductWriteData;

  try {
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
    });

    if (!existingProduct)
      return {
        success: false,
        errors: {
          product: `Product ${productId} not found or unauthorized for user ${userId}`,
        },
      };

    const res = await prisma.product.update({
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

    if (!res) throw Error(`Product ${productId} not found for user ${userId}`);

    return { success: true, data: res };
  } catch (error) {
    console.error(`Error updating product ${productId}`, error);

    return {
      success: false,
      errors: {
        message: `An error occurred when updating the product ${productId} `,
      },
    };
  }
}

export async function deleteProductAction(
  userId: string,
  productId: string,
): Promise<{ success: boolean; errors?: any; data?: Product }> {
  try {
    const existingProduct = await prisma.findFirst({
      where: {
        id: productId,
        userId,
      },
    });

    if (!existingProduct) {
      return {
        success: false,
        errors: {
          product: `Product ${productId} not found or unauthorized for user ${userId}`,
        },
      };
    }

    const res = await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    if (!res) throw Error(`Product ${productId} not found for user ${userId}`);

    return { success: true, data: res };
  } catch (error) {
    console.error(`Error deleting product ${productId}`, error);
    return {
      success: false,
      errors: {
        message: `An error occurred when deleting the product ${productId}`,
      },
    };
  }
}
