import { prisma } from './prisma';

export async function assertUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: userId });
  if (!user) throw new Error(`User with ID ${userId} does not exist.`);
  return user;
}

export async function assertEmailExists(email: string) {
  const user = await prisma.user.findFirst({
    where: { email },
  });
  if (!user) throw new Error(`User with email ${email} already exists.`);
  return user;
}

export async function assertProductExists(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { userId, id: productId },
  });
  if (!product)
    throw new Error(
      `Product with ID ${productId} not found for user with ID ${userId}.`,
    );
  return product;
}

export async function assertMealExists(userId: string, mealId: string) {
  const meal = await prisma.meal.findFirst({
    where: { userId, id: mealId },
  });
  if (!meal)
    throw new Error(
      `Meal with ID ${mealId} does not exist for user with ID ${userId}.`,
    );
  return meal;
}

export async function assertPreferenceExist(
  userId: string,
  preferenceId: string,
) {
  const preference = await prisma.preference.findFirst({
    where: { userId, id: preferenceId },
  });
  if (!preference)
    throw new Error(
      `Preference with ID ${preferenceId} does not exist for user with ID ${userId}.`,
    );
  return preference;
}

export async function assertLogExists(userId: string, date: Date) {
  const log = await prisma.log.findFirst({
    where: { userId, date },
  });
  if (!log)
    throw new Error(
      `Log with date ${date.toString()} does not exits for user with ID ${userId}.`,
    );
  return log;
}

export async function assertLogExistsById(userId: string, logId: string) {
  const log = await prisma.log.findFirst({
    where: {
      id: logId,
      userId,
    },
  });
  if (!log)
    throw new Error(
      `Log with ID ${logId} does not exist for user with ID ${userId}`,
    );
  return log;
}
