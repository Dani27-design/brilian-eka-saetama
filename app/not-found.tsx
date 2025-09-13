import { Metadata } from 'next';
import ErrorLayout from '@/components/ErrorPages/ErrorLayout';
import Error404 from '@/components/ErrorPages/Error404';

export const metadata: Metadata = {
  title: '404 - Page Not Found | PT Brilian Eka Saetama',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <ErrorLayout errorCode="404">
      <Error404 />
    </ErrorLayout>
  );
}