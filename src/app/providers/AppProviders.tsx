import type { PropsWithChildren } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HttpError, toUserMessage } from '@/shared/api/http-error';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { NotificationViewport, pushErrorNotification, pushSuccessNotification } from '@/shared/ui/notifications';

type MutationNotificationMeta = {
  successTitle?: string;
  successMessage?: string;
  errorTitle?: string;
  suppressGlobalSuccess?: boolean;
  suppressGlobalError?: boolean;
};

function getMutationMeta(meta: unknown): MutationNotificationMeta {
  return typeof meta === 'object' && meta !== null ? meta : {};
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      pushErrorNotification('Не удалось загрузить данные', toUserMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      const meta = getMutationMeta(mutation.options.meta);
      if (meta.suppressGlobalSuccess) {
        return;
      }

      pushSuccessNotification(
        meta.successTitle ?? 'Готово',
        meta.successMessage ?? 'Операция выполнена успешно.',
      );
    },
    onError: (error, _variables, _context, mutation) => {
      const meta = getMutationMeta(mutation.options.meta);
      if (meta.suppressGlobalError) {
        return;
      }

      const fallbackTitle =
        error instanceof HttpError && error.code === 'catalog.priceList.inUse'
          ? 'Нельзя удалить прайс-лист'
          : error instanceof HttpError && error.code === 'catalog.product.validation'
            ? 'Проверьте карточку товара'
          : error instanceof HttpError &&
              ['catalog.attributeDefinition.duplicateCode', 'catalog.attributeDefinition.groupRequired', 'catalog.attributeDefinition.groupNotFound'].includes(error.code ?? '')
            ? 'Не удалось сохранить атрибут'
          : error instanceof HttpError && error.details.length > 0
            ? 'Проверьте заполнение формы'
            : 'Не удалось выполнить действие';
      const title = meta.errorTitle ?? fallbackTitle;

      pushErrorNotification(
        title,
        toUserMessage(error),
      );
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 0,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <NotificationViewport />
      </AuthProvider>
    </QueryClientProvider>
  );
}
