import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ReactNode } from 'react';
import { ToastViewport } from '../ui/Toast';

interface LayoutProps {
  children?: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children || <Outlet />}
        </div>
      </main>
      <ToastViewport className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-h-screen w-full sm:max-w-md" />
    </div>
  );
};