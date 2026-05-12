import { useDeferredValue, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import type { AdminPagedResult, BaseEntity } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Dialog } from '@/shared/ui/Dialog';
import { formatDate } from '@/shared/lib/format';
import { useSessionState } from '@/shared/lib/session-state';

interface ResourceManagerProps<T extends BaseEntity, TForm extends Record<string, unknown>> {
  queryKey: string;
  title: string;
  description: string;
  list: (request: { page: number; pageSize: number; search: string; includeInactive: boolean }) => Promise<AdminPagedResult<T>>;
  getById: (id: string) => Promise<T>;
  create: (payload: TForm) => Promise<string>;
  update: (id: string, payload: TForm) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toForm: (entity?: T) => TForm;
  renderSummary: (entity: T) => React.ReactNode;
  renderForm: (form: TForm, setForm: React.Dispatch<React.SetStateAction<TForm>>) => React.ReactNode;
}

export function ResourceManager<T extends BaseEntity, TForm extends Record<string, unknown>>({
  queryKey,
  title,
  description,
  list,
  getById,
  create,
  update,
  remove,
  toForm,
  renderSummary,
  renderForm,
}: ResourceManagerProps<T, TForm>) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useSessionState(`${queryKey}:search`, '');
  const deferredSearch = useDeferredValue(search);
  const [open, setOpen] = useSessionState(`${queryKey}:open`, false);
  const [editingId, setEditingId] = useSessionState<string | null>(`${queryKey}:editing-id`, null);
  const [form, setForm] = useSessionState<TForm>(`${queryKey}:form`, () => toForm());

  const listRequest = useMemo(
    () => ({ page: 1, pageSize: 100, search: deferredSearch, includeInactive: true }),
    [deferredSearch],
  );

  const query = useQuery({
    queryKey: [queryKey, listRequest],
    queryFn: () => list(listRequest),
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await update(editingId, form);
        return editingId;
      }

      return create(form);
    },
    meta: {
      successTitle: editingId ? 'Запись обновлена' : 'Запись создана',
      successMessage: `${title}: изменения успешно сохранены.`,
      errorTitle: `${title}: не удалось сохранить запись`,
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
      setEditingId(null);
      setForm(toForm());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: remove,
    meta: {
      successTitle: 'Запись удалена',
      successMessage: `${title}: запись успешно удалена.`,
      errorTitle: `${title}: не удалось удалить запись`,
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  async function handleCreate() {
    setEditingId(null);
    setForm(toForm());
    setOpen(true);
  }

  async function handleEdit(id: string) {
    const entity = await getById(id);
    setEditingId(id);
    setForm(toForm(entity));
    setOpen(true);
  }

  return (
    <>
      <Card
        title={title}
        description={description}
        actions={
          <div className="toolbar">
            <div className="search-box">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск" />
            </div>
            <Button onClick={handleCreate}>
              <Plus size={16} />
              <span>Добавить</span>
            </Button>
          </div>
        }
      >
        <div className="stack-list">
          {query.isLoading && <div className="empty-state">Загрузка...</div>}
          {!query.isLoading && query.data?.items.length === 0 && (
            <div className="empty-state">Справочник пока пуст. Можно начать с первой записи.</div>
          )}

          {query.data?.items.map((item) => (
            <article key={item.id} className="entity-row">
              <div className="entity-summary">
                {renderSummary(item)}
                <small>Обновлено {formatDate(item.lastUpdate)}</small>
              </div>
              <div className="entity-actions">
                <Button variant="ghost" onClick={() => handleEdit(item.id)}>
                  Редактировать
                </Button>
                <Button variant="danger" onClick={() => deleteMutation.mutate(item.id)}>
                  Удалить
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Dialog
        open={open}
        title={editingId ? 'Редактирование' : 'Создание'}
        description="Изменения сразу подготовлены для API admin-контроллеров webshop."
        onClose={() => setOpen(false)}
      >
        <div className="form-grid form-grid-2">{renderForm(form, setForm)}</div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
