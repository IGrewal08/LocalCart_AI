import {
  userResponse,
  UserResponse,
  UserUpdateInput,
  UserWriteData,
} from '@/types';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

export const user = {
  idUser: async (userId: string): Promise<UserResponse> => {
    try {
      const res = await prisma.user.findUnique({
        where: { userId },
        select: userResponse.select,
      });

      if (!res) throw new Error(`User with ID ${userId} not found`);

      return res;
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}`, error);
      throw error;
    }
  },

  createUser: async (data: UserWriteData): Promise<UserResponse> => {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
        },
      });

      if (existingUser)
        throw new Error(`User with email ${data?.email} already exist`);

      const hashedPassword = await bcrypt.hash(
        data.password,
        await bcrypt.genSalt(10),
      );

      data.password = hashedPassword;

      const res = await prisma.user.create({
        data,
        select: userResponse.select,
      });

      if (!res)
        throw new Error(`Failed to create user for email ${data?.email}`);
      return res;
    } catch (error) {
      console.error(`Error creating user`, error);
      throw error;
    }
  },

  updateUser: async (
    userId: string,
    data: UserUpdateInput,
  ): Promise<UserResponse> => {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          userId,
        },
      });

      if (!existingUser)
        throw new Error(`User with with ID ${userId} not found`);

      if (data.email) {
        const userWithSameEmail = await prisma.user.findFirst({
          where: {
            email: data.email,
          },
        });

        if (userWithSameEmail && userWithSameEmail.userId !== userId) {
          throw new Error(`User with email ${data.email} already exists`);
        }
      }

      if (data.password) {
        const match = await bcrypt.compare(
          data.password,
          existingUser.password,
        );
        if (!match)
          throw new Error(`Invalid email or password for user ${userId}`);

        data.password = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(10),
        );
      }

      const res = await prisma.user.update({
        where: {
          userId,
        },
        data,
        select: userResponse.select,
      });

      if (!res) throw new Error(`Failed to update user ${userId}`);

      return res;
    } catch (error) {
      console.error(`Error updating user with ID ${userId}`, error);
      throw error;
    }
  },

  deleteUser: async (userId: string, email: string): Promise<void> => {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          userId,
        },
      });
      if (existingUser)
        throw new Error(`User with email ${email} already exist`);

      if (email) {
        const userWithSameEmail = await prisma.user.findFirst({
          where: {
            email,
          },
        });

        if (userWithSameEmail && userWithSameEmail.email !== userId) {
          throw new Error(
            `User with email ${email} does not belong to this user`,
          );
        }
      }
      const res = await prisma.user.delete({
        where: {
          userId,
          email,
        },
      });

      if (!res) throw new Error(`Failed to delete user with ID ${userId}`);

      return res;
    } catch (error) {
      console.error(`Error deleting user with ID ${userId}`, error);
      throw error;
    }
  },
};
