import { Metadata } from 'next';
import ErrorLayout from '@/components/ErrorPages/ErrorLayout';
import Error404 from '@/components/ErrorPages/Error404';

export const metadata: Metadata = {
  title: '404 - Admin Page Not Found | PT Brilian Eka Saetama',
  description: 'The admin page you are looking for could not be found.',
};

export default function AdminNotFound() {
  return (
    <ErrorLayout errorCode="404" showLines={false}>
      <Error404 
        isAdmin={true}
        suggestions={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Products', href: '/admin/products' },
          { label: 'Customers', href: '/admin/customers' },
          { label: 'Contracts', href: '/admin/contracts' },
        ]}
      />
    </ErrorLayout>
  );
}