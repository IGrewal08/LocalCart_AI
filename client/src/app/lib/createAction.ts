import z from 'zod';

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; errors: any };

export async function validateAndExecute<TSchema extends z.ZodType, TResult>(
  schema: TSchema,
  rawData: unknown,
  action: (data: z.infer<TSchema>) => Promise<TResult>,
): Promise<ActionResponse<TResult>> {
  const validation = schema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      errors: z.treeifyError(validation.error),
    };
  }

  try {
    const data = await action(validation.data);
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      errors: {
        message: error.message || 'An unexpected error occurred.',
      },
    };
  }
}
