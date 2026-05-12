import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { partnerProductsApi } from '@/shared/api/partner-products-api';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

export function PartnersPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['partner-products'],
    queryFn: async () => {
      const page = await partnerProductsApi.list({ page: 1, pageSize: 100 });
      return page.items;
    },
  });

  const invalidateMutation = useMutation({
    mutationFn: partnerProductsApi.invalidateCacheRegion,
    meta: {
      successTitle: 'Кэш сброшен',
      successMessage: 'Кэш партнёрских товаров успешно инвалидирован.',
      errorTitle: 'Не удалось сбросить кэш партнёров',
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partner-products'] });
    },
  });

  return (
    <div className="page-stack">
      <Card
        title="Горячие товары"
        description="Публичная выдача для старого mobile-контракта теперь собирается из настоящих Product."
        actions={
          <Button variant="secondary" onClick={() => invalidateMutation.mutate()} disabled={invalidateMutation.isPending}>
            <RefreshCw size={16} />
            <span>{invalidateMutation.isPending ? 'Сбрасываем кэш...' : 'Сбросить кэш'}</span>
          </Button>
        }
      >
        <div className="stack-list">
          {query.data?.map((item) => (
            <article key={item.id} className="entity-row">
              <div className="entity-summary">
                <strong>{item.name || 'Без названия'}</strong>
                <span>
                  {item.shop || 'Без бренда'} · {item.price ?? 0} {item.currency || ''}
                  {item.oldPrice ? ` · старая ${item.oldPrice}` : ''}
                </span>
                <small>{item.url || 'Slug не задан'}</small>
                {item.shopUrl && <small>{item.shopUrl}</small>}
              </div>
            </article>
          ))}
          {query.data?.length === 0 && <div className="empty-state">Горячие товары пока не выбраны в разделе «Товары».</div>}
        </div>
      </Card>
    </div>
  );
}
