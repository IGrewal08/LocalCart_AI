export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({
      auth,
      request: { nextUrl },
    }: {
      auth: string;
      request: { nextUrl: string };
    }) {},
  },
  providers: [],
};
