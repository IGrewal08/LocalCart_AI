import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/prisma';
import { UserResponse, userResponse, UserWriteData } from '@/types';
('use server');

const createUserSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  name: z.string().min(2, 'Name must be at least two character long.'),
  password: z
    .string()
    .min(4, 'Password must be at least four characters long.'),
});

export async function idUserAction(
  userId: string,
): Promise<{ success: boolean; errors?: any; data?: UserResponse }> {
  try {
    const res: UserResponse = await prisma.user.findUnique({
      where: { userId },
      select: userResponse.select,
    });

    if (!res) throw new Error(`User with ID ${userId} not found`);

    return { success: true, data: res };
  } catch (error) {
    console.error(`Error fetching user with ID ${userId}`, error);

    return {
      success: false,
      errors: {
        message: `Failed to retrieve user with ID ${userId}. ${error}`,
      },
    };
  }
}

export async function createUserAction(
  formData: FormData,
): Promise<{ success: boolean; errors?: any; data?: UserResponse }> {
  const rawData = {
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
  };

  const validateData = createUserSchema.safeParse(rawData);

  if (!validateData.success) {
    return {
      success: false,
      errors: z.treeifyError(validateData.error),
    };
  }

  const data: UserWriteData = validateData.data as UserWriteData;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return {
        success: false,
        errors: {
          email: 'User with this email already exists',
        },
      };
    }

    const hashedPassword = await bcrypt.hash(
      data.password,
      await bcrypt.genSalt(10),
    );

    data.password = hashedPassword;

    const res = await prisma.user.create({
      data: data,
      select: userResponse.select,
    });

    if (!res) throw new Error(`Failed to create user for email ${data?.email}`);

    return { success: true, data: res };
  } catch (error) {
    console.error(`Error creating user`, error);

    return {
      success: false,
      errors: {
        message: 'An error occurred while creating the user.',
      },
    };
  }
}

const updateUserData = z
  .object({
    email: z.email().optional(),
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

  const validateData = updateUserData.safeParse(rawData);

  if (!validateData.success) {
    return {
      success: false,
      errors: z.treeifyError(validateData.error),
    };
  }

  const data = validateData.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        userId,
      },
    });

    if (!existingUser) {
      return {
        success: false,
        errors: {
          userId: 'User with this ID does not exist',
        },
      };
    }

    if (data.email) {
      const userWithSameEmail = await prisma.user.findFirst({
        where: {
          email: data.email,
        },
      });

      if (userWithSameEmail && userWithSameEmail.userId !== userId) {
        return {
          success: false,
          errors: {
            email: `User with email ${data.email} already exists`,
          },
        };
      }
    }

    if (data.password) {
      const match = await bcrypt.compare(data.password, existingUser.password);
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

    const res: UserResponse = await prisma.user.update({
      where: {
        userId,
      },
      data,
      select: userResponse.select,
    });

    if (!res) throw new Error(`Failed to update user ${userId}`);

    return {
      success: true,
      data: res,
    };
  } catch (error) {
    console.error(`Error updating user with ID ${userId}`, error);

    return {
      success: false,
      errors: {
        message: `An error occurred when updating this user ${userId}.`,
      },
    };
  }
}

export async function deleteUserAction(
  userId: string,
  email: string,
): Promise<{ success: boolean; errors?: any; data?: void }> {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        userId,
      },
    });

    if (!existingUser) {
      return {
        success: false,
        errors: {
          email: `User with email ${email} does not exist`,
        },
      };
    }

    if (email) {
      const userWithSameEmail = await prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (userWithSameEmail && userWithSameEmail.email !== userId) {
        return {
          success: false,
          errors: {
            message: `User with email ${email} does not exist for this user`,
          },
        };
      }
    }

    const res = await prisma.user.delete({
      where: {
        userId,
        email,
      },
    });

    if (!res) throw new Error(`Failed to delete user with ID ${userId}`);

    return { success: true };
  } catch (error) {
    console.error(`Error deleting user with ID ${userId}`, error);

    return {
      success: false,
      errors: {
        message: `An error occurred when deleting this user ${userId}.`,
      },
    };
  }
}
