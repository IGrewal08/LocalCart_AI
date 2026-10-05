import z from 'zod';
import { prisma } from '@/lib/prisma';
import { Preference } from '@/generated/prisma/client';
import { assertPreferenceExist, assertUserExists } from '@/lib/guards';
import { validateAndExecute } from '@/lib/createAction';

('user server');

const searchPreferenceSchema = z.object({
  preferences: z.array(
    z.string().min(2, 'Preference must be at least 2 letters long.'),
  ),
});

export async function idPreferenceAction(
  userId: string,
  preferenceId: string,
): Promise<{ success: boolean; errors?: any; data?: Preference }> {
  try {
    await assertUserExists(userId);

    const res: Preference = await assertPreferenceExist(userId, preferenceId);
    return { success: true, data: res };
  } catch (error: any) {
    return {
      success: false,
      errors: { message: error.message },
    };
  }
}

export async function createPreferenceAction(
  userId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: Preference }> {
  const rawData = { preferences: formData.getAll('preference') };

  return validateAndExecute(searchPreferenceSchema, rawData, async (data) => {
    await assertUserExists(userId);

    return await prisma.preference.create({
      data: {
        userId,
        preferences: data?.preferences.length ? data.preferences : [],
      },
    });
  });
}

export async function updatePreferenceAction(
  userId: string,
  preferenceId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: Preference }> {
  const rawData = { preferences: formData.getAll('preference') };

  return validateAndExecute(searchPreferenceSchema, rawData, async (data) => {
    await assertPreferenceExist(userId, preferenceId);

    return await prisma.preference.upsert({
      where: { userId, id: preferenceId },
      create: { userId, preferences: data.preferences },
      update: { preferences: data.preferences },
    });
  });
}

export async function deletePreferenceAction(
  userId: string,
  preferenceId: string,
): Promise<{ success: boolean; errors?: any; data?: Preference }> {
  try {
    await assertPreferenceExist(userId, preferenceId);

    const res: Preference = await prisma.preference.delete({
      where: { userId, id: preferenceId },
    });
    return { success: true, data: res };
  } catch (error: any) {
    return {
      success: false,
      errors: { message: error.message },
    };
  }
}
