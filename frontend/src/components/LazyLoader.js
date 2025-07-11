"use client";

import { Suspense, lazy } from 'react';

// Компонент загрузки
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-gray-600">Загрузка...</span>
  </div>
);

// Ленивая загрузка компонентов
export const LazyChart = lazy(() => import('recharts').then(module => ({
  default: ({ children, ...props }) => <div {...props}>{children}</div>
})));

export const LazyTurnoverChart = lazy(() => 
  import('../app/tenant/[tenantId]/turnover/page.js').then(module => ({
    default: module.default
  }))
);

// HOC для ленивой загрузки
export const withLazyLoading = (Component, fallback = <LoadingSpinner />) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  const WrappedComponent = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

// Компонент для условной загрузки
export const ConditionalLoader = ({ 
  condition, 
  component: Component, 
  fallback = <LoadingSpinner />,
  ...props 
}) => {
  if (!condition) {
    return fallback;
  }
  
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}; 