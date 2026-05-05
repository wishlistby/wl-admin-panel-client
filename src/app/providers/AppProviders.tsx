import type { PropsWithChildren } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HttpError, toUserMessage } from '@/shared/api/http-error';
import { NotificationViewport, pushErrorNotification } from '@/shared/ui/notifications';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        pushErrorNotification('Не удалось обновить данные', toUserMessage(error));
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const title =
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
      {children}
      <NotificationViewport />
    </QueryClientProvider>
  );
}
