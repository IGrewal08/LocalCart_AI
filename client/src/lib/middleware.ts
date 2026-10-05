import NextAuth from 'next-auth';
import { authConfig } from '../../auth.config';
import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!login|signup|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});
