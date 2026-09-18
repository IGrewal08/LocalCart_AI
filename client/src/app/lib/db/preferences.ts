import { prisma } from '@/prisma';
import { Preference } from '../../../generated/prisma/client';
import { PreferenceWriteData } from '@/types';

export const preferences = {
  idPreference: async (
    userId: string,
    preferenceId: string,
  ): Promise<Preference> => {
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          userId,
        },
      });
      if (!existingUser)
        throw new Error(`User with ID ${userId} does not exist`);
      const res = await prisma.preference.findFirst({
        where: {
          userId,
          preferenceId,
        },
      });
      if (!res)
        throw new Error(
          `Preference with ID ${preferenceId} not found for user ${userId}`,
        );
      return res;
    } catch (error) {
      console.error(`Error fetching preference with ID ${preferenceId}`, error);
      throw error;
    }
  },

  createPreference: async (
    userId: string,
    data: PreferenceWriteData,
  ): Promise<Preference> => {
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          userId,
        },
      });
      if (!existingUser)
        throw new Error(`User with ID ${userId} does not exist`);
      const res = await prisma.preference.create({
        data: {
          userId,
          preferences: data?.preferences.length ? data.preferences : [],
        },
      });
      if (!res)
        throw new Error(`Failed to create preferences for user ${userId}`);
      return res;
    } catch (error) {
      console.error(`Error creating preferences for user ${userId}`, error);
      throw error;
    }
  },

  updatePreference: async (
    userId: string,
    preferenceId: string,
    data: PreferenceWriteData,
  ): Promise<Preference> => {
    try {
      const existingPreference = await prisma.preference.findFirst({
        where: {
          userId,
          preferenceId,
        },
      });
      if (!existingPreference)
        throw new Error(
          `Preference with ID ${preferenceId} not found for user ${userId}`,
        );
      const res = await prisma.preference.upsert({
        where: {
          userId,
          preferenceId,
        },
        create: { userId, preferences: preferences ? preferences : [] },
        update: { preferences: preferences ? preferences : [] },
      });
      if (!res)
        throw new Error(`Failed to update preferences for user ${userId}`);
      return res;
    } catch (error) {
      console.error(
        `Error updating preferences for user ${userId} with ID ${preferenceId}`,
        error,
      );
      throw error;
    }
  },

  deletePreference: async (
    userId: string,
    preferenceId: string,
  ): Promise<Preference> => {
    try {
      const existingPreference = await prisma.preference.findFirst({
        where: {
          userId,
          preferenceId,
        },
      });
      if (!existingPreference)
        throw new Error(
          `Preference with ID ${preferenceId} not found for user ${userId}`,
        );
      const res = await prisma.preference.delete({
        where: {
          userId,
          preferenceId,
        },
      });
      if (!res)
        throw new Error(`Failed to delete preferences for user ${userId}`);
      return res;
    } catch (error) {
      console.error(
        `Error deleting preferences for user ${userId} with ID ${preferenceId}`,
        error,
      );
      throw error;
    }
  },
};
