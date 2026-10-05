import { auth } from '@/auth';

export async function authenticatedAction<T>(
  actionLogic: () => Promise<T>,
): Promise<T> {
  const session = await auth();

  // return { success: false, message: { 'incorrect route etc.' }}
  // handle logging out if session is not found
  if (!session || !session.user)
    throw new Error('Unauthorized. You must be logged in to do this.');

  return actionLogic();
}
