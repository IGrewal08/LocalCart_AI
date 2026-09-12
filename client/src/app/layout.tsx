import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | LocalCart AI',
    default: 'LocalCart AI',
  },
  description:
    'LocalCart AI is a meal planner with AI integration to help you generate weekly meal plans based on your dietary preferences, budget, and local availability.',
  metadataBase: process.env.URL,
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <title>LocalCart AI</title>
      <body>{children}</body>
    </html>
  );
}
