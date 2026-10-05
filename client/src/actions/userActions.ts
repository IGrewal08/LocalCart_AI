import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserResponse, userResponse } from '@/types';
import { assertEmailExists, assertUserExists } from '@/lib/guards';
import { validateAndExecute } from '@/lib/createAction';
import { authenticatedAction } from '@/lib/authWrapper';

('use server');

const createUserSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  name: z.string().min(2, 'Name must be at least two character long.'),
  password: z
    .string()
    .min(4, 'Password must be at least four characters long.'),
});

const updateUserSchema = z
  .object({
    email: z.email(),
    name: z
      .string()
      .min(2, 'Name must be at least two character long.')
      .optional(),
    password: z
      .string()
      .min(4, 'Password must be at least four characters long.')
      .optional(),
    newPassword: z
      .string()
      .min(4, 'New password must be at least four characters long.')
      .optional(),
  })
  .refine((data) => data.password !== data.newPassword, {
    message: 'New password cannot be the same as password',
    path: ['newPassword'],
  });

export async function idUserAction(
  userId: string,
): Promise<{ success: boolean; errors?: any; data?: UserResponse }> {
  return await authenticatedAction(async () => {
    try {
      await assertUserExists(userId);

      const res: UserResponse = await prisma.user.findUnique({
        where: { userId },
        select: userResponse.select,
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

export async function createUserAction(
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: UserResponse }> {
  const rawData = {
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
  };

  return await authenticatedAction(async () => {
    return await validateAndExecute(createUserSchema, rawData, async (data) => {
      await assertEmailExists(data.email);

      const hashedPassword = await bcrypt.hash(
        data.password,
        await bcrypt.genSalt(10),
      );

      data.password = hashedPassword;

      return await prisma.user.create({
        data: data,
        select: userResponse.select,
      });
    });
  });
}

export async function updateUserAction(
  userId: string,
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: UserResponse }> {
  const rawData = {
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
    newPassword: formData.get('newPassword'),
  };

  return await authenticatedAction(async () => {
    return await validateAndExecute(updateUserSchema, rawData, async (data) => {
      const existingUser = await assertUserExists(userId);
      await assertEmailExists(data.email);

      if (data.password) {
        const match = await bcrypt.compare(
          data.password,
          existingUser.password,
        );
        if (!match) {
          return {
            success: false,
            errors: { message: `Invalid email or password for user ${userId}` },
          };
        }

        data.password = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(10),
        );
      }

      return await prisma.user.update({
        where: { userId },
        data,
        select: userResponse.select,
      });
    });
  });
}

export async function deleteUserAction(
  userId: string,
  email: string,
): Promise<{ success: boolean; errors?: any; data?: void }> {
  return await authenticatedAction(async () => {
    try {
      await assertUserExists(userId);
      const verifiedEmail = await assertEmailExists(email);

      if (userId != verifiedEmail.userId) {
        return {
          success: false,
          errors: {
            message: `User with email ${email} does not exist for this user ID ${userId}.`,
          },
        };
      }

      await prisma.user.delete({
        where: { userId, email },
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errors: { message: error.message },
      };
    }
  });
}
