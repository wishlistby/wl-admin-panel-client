import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerProductsApi } from '@/shared/api/partner-products-api';
import type { PartnerProductMutationRequest } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { CheckboxField, TextAreaField, TextField } from '@/shared/ui/Fields';
import { Dialog } from '@/shared/ui/Dialog';

const emptyForm = (): PartnerProductMutationRequest => ({
  name: '',
  url: '',
  photoUrl: '',
  price: 0,
  currency: 'BYN',
  description: '',
  shop: '',
  shopId: null,
  partner: '',
  partnerId: null,
  isActive: true,
  isHot: false,
  startDate: new Date().toISOString(),
  endDate: null,
});

export function PartnersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerProductMutationRequest>(emptyForm);

  const query = useQuery({
    queryKey: ['partner-products'],
    queryFn: async () => {
      const page = await partnerProductsApi.list({ page: 1, pageSize: 100 });
      return page.items;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await partnerProductsApi.update(editingId, form);
        return;
      }

      return partnerProductsApi.create(form);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partner-products'] });
      setEditingId(null);
      setForm(emptyForm());
      setOpen(false);
    },
  });

  const batchMutation = useMutation({
    mutationFn: partnerProductsApi.createTestBatch,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partner-products'] });
    },
  });

  const invalidateMutation = useMutation({
    mutationFn: partnerProductsApi.invalidateCacheRegion,
  });

  const deleteMutation = useMutation({
    mutationFn: partnerProductsApi.removeById,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partner-products'] });
    },
  });

  return (
    <div className="page-stack">
      <Card
        title="Партнерские товары"
        description="Отдельный поток для внешних товарных предложений вне основной каталоговой модели."
        actions={
          <div className="toolbar">
            <Button variant="secondary" onClick={() => batchMutation.mutate()} disabled={batchMutation.isPending}>
              {batchMutation.isPending ? 'Создаём batch...' : 'Тестовый batch'}
            </Button>
            <Button variant="secondary" onClick={() => invalidateMutation.mutate()} disabled={invalidateMutation.isPending}>
              {invalidateMutation.isPending ? 'Сбрасываем кэш...' : 'Сбросить кэш'}
            </Button>
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
                setOpen(true);
              }}
            >
              Добавить
            </Button>
          </div>
        }
      >
        <div className="stack-list">
          {query.data?.map((item) => (
            <article key={item.id} className="entity-row">
              <div className="entity-summary">
                <strong>{item.name || 'Без названия'}</strong>
                <span>
                  {item.shop || 'Без магазина'} · {item.price} {item.currency || ''}
                </span>
              </div>
              <div className="entity-actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(item.id);
                    setForm({
                      name: item.name ?? '',
                      url: item.url ?? '',
                      photoUrl: item.photoUrl ?? '',
                      price: item.price,
                      currency: item.currency ?? 'BYN',
                      description: item.description ?? '',
                      shop: item.shop ?? '',
                      shopId: item.shopId ?? null,
                      partner: '',
                      partnerId: null,
                      isActive: item.isActive,
                      isHot: false,
                      startDate: new Date().toISOString(),
                      endDate: null,
                    });
                    setOpen(true);
                  }}
                >
                  Редактировать
                </Button>
                <Button variant="danger" onClick={() => deleteMutation.mutate(item.id)}>
                  Удалить
                </Button>
              </div>
            </article>
          ))}
          {query.data?.length === 0 && <div className="empty-state">Партнерские товары пока не заведены.</div>}
        </div>
      </Card>

      <Dialog
        open={open}
        title={editingId ? 'Редактирование партнерского товара' : 'Новый партнерский товар'}
        description="Эта сущность живёт отдельно от основного товарного каркаса каталога."
        onClose={() => setOpen(false)}
      >
        <div className="form-grid form-grid-2">
          <TextField label="Название" value={form.name ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <TextField label="Цена" type="number" value={String(form.price)} onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))} />
          <TextField label="Валюта" value={form.currency ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} />
          <TextField label="Магазин" value={form.shop ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, shop: event.target.value }))} />
          <TextField className="field-span-2" label="URL товара" value={form.url ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))} />
          <TextField className="field-span-2" label="URL фото" value={form.photoUrl ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, photoUrl: event.target.value }))} />
          <TextAreaField className="field-span-2" label="Описание" rows={4} value={form.description ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          <TextField label="Partner" value={form.partner ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, partner: event.target.value }))} />
          <TextField label="Start date" type="datetime-local" value={(form.startDate ?? '').slice(0, 16)} onChange={(event) => setForm((prev) => ({ ...prev, startDate: new Date(event.target.value).toISOString() }))} />
          <CheckboxField label="Активен" checked={form.isActive} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
          <CheckboxField label="Hot" checked={form.isHot} onChange={(value) => setForm((prev) => ({ ...prev, isHot: value }))} />
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
