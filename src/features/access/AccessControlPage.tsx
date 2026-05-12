import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { adminAccessApi } from '@/shared/api/admin-access-api';
import type { AdminAccessEditor, PermissionOption, UpdateAdminUserAccessRequest } from '@/shared/api/types';
import { useAuth } from '@/shared/auth/AuthProvider';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { SelectField, TextField } from '@/shared/ui/Fields';

function groupPermissions(permissions: PermissionOption[]) {
  return permissions.reduce<Record<string, PermissionOption[]>>((accumulator, permission) => {
    accumulator[permission.group] ??= [];
    accumulator[permission.group].push(permission);
    return accumulator;
  }, {});
}

export function AccessControlPage() {
  const { auth, hasRole } = useAuth();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDirectPermissions, setSelectedDirectPermissions] = useState<string[]>([]);

  const canManageAccess = hasRole('superAdmin');
  const optionsQuery = useQuery({
    queryKey: ['admin-access-options'],
    queryFn: adminAccessApi.options,
    enabled: canManageAccess,
    staleTime: 5 * 60_000,
  });

  const lookupQuery = useQuery({
    queryKey: ['admin-access-user', submittedQuery],
    queryFn: () => adminAccessApi.lookupUser(submittedQuery),
    enabled: submittedQuery.length > 0 && canManageAccess,
  });

  useEffect(() => {
    if (!lookupQuery.data) {
      return;
    }

    setSelectedRole(lookupQuery.data.user.role);
    setSelectedDirectPermissions(lookupQuery.data.user.directPermissions);
  }, [lookupQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!lookupQuery.data) {
        return;
      }

      const payload: UpdateAdminUserAccessRequest = {
        role: selectedRole,
        directPermissions: selectedDirectPermissions,
      };

      await adminAccessApi.updateUserAccess(lookupQuery.data.user.userId, payload);
    },
    meta: {
      successTitle: 'Доступ сохранён',
      successMessage: 'Роль и прямые права пользователя обновлены.',
      errorTitle: 'Не удалось сохранить доступ',
    },
    onSuccess: async () => {
      if (!submittedQuery) {
        return;
      }

      await lookupQuery.refetch();
    },
  });

  const editor = lookupQuery.data;
  const groupedPermissions = useMemo(
    () => groupPermissions(editor?.availablePermissions ?? []),
    [editor?.availablePermissions],
  );

  if (!canManageAccess) {
    return (
      <Card
        title="Доступ ограничен"
        description="Эта секция доступна только пользователям с ролью superAdmin."
      >
        <div className="forbidden-panel">
          <ShieldAlert size={22} />
          <div>
            <strong>Недостаточно прав</strong>
            <p>Для управления ролями и правами нужен superAdmin.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <Card
        title="Роли и права"
        description="Поиск по email или id пользователя, назначение базовой роли и прямых permission claims."
        actions={
          auth?.session ? (
            <div className="status-chip">
              <ShieldCheck size={14} />
              <span>{auth.session.email ?? auth.session.userName ?? auth.session.userId}</span>
            </div>
          ) : undefined
        }
      >
        <form
          className="search-row"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query.trim());
          }}
        >
          <TextField
            label="Email или user id"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="user@example.com или guid"
            trailing={<Search size={16} className="field-inline-icon" />}
          />
          <Button type="submit" disabled={!query.trim() || lookupQuery.isFetching}>
            {lookupQuery.isFetching ? 'Ищем...' : 'Найти пользователя'}
          </Button>
        </form>
      </Card>

      {editor && (
        <div className="grid-two access-layout">
          <Card
            title="Пользователь"
            description="Базовая роль задаёт стартовый набор прав. Прямые permissions используются как точечные добавления."
          >
            <div className="page-stack">
              <div className="entity-summary">
                <strong>{editor.user.email ?? 'Без email'}</strong>
                <span>ID: {editor.user.userId}</span>
                <small>Username: {editor.user.userName || 'не задан'}</small>
              </div>

              <SelectField
                label="Роль"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                options={editor.availableRoles.map((role) => ({
                  value: role.name,
                  label: `${role.displayName} (${role.permissions.length} permissions)`,
                }))}
              />

              <div className="permission-section">
                <div className="permission-section-head">
                  <strong>Права роли</strong>
                  <small>Эти права приходят из выбранной роли и не редактируются здесь поштучно.</small>
                </div>
                <div className="chip-grid">
                  {resolveRolePermissions(editor, selectedRole).map((permission) => (
                    <span key={permission} className="permission-chip is-readonly">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Итоговые права"
            description="Это объединение прав роли и прямых claims пользователя."
          >
            <div className="chip-grid">
              {resolveEffectivePermissions(editor, selectedRole, selectedDirectPermissions).map((permission) => (
                <span key={permission} className="permission-chip">
                  {permission}
                </span>
              ))}
            </div>
          </Card>

          <Card
            title="Прямые права"
            description="Эти claims дополняют роль. Чтобы убрать базовое право, смените роль на более узкую."
            className="grid-span-2"
            actions={
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!selectedRole || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Сохраняем...' : 'Сохранить доступ'}
              </Button>
            }
          >
            <div className="permission-groups">
              {Object.entries(groupedPermissions).map(([group, permissions]) => (
                <section key={group} className="permission-group-card">
                  <header>
                    <strong>{group}</strong>
                    <small>{permissions.length} permissions</small>
                  </header>

                  <div className="permission-list">
                    {permissions.map((permission) => {
                      const checked = selectedDirectPermissions.includes(permission.value);

                      return (
                        <label key={permission.value} className="permission-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setSelectedDirectPermissions((current) =>
                                event.target.checked
                                  ? [...current, permission.value].filter((value, index, array) => array.indexOf(value) === index)
                                  : current.filter((value) => value !== permission.value),
                              );
                            }}
                          />
                          <span>
                            <strong>{permission.value}</strong>
                            <small>{permission.description}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function resolveRolePermissions(editor: AdminAccessEditor, role: string) {
  return editor.availableRoles.find((item) => item.name === role)?.permissions ?? [];
}

function resolveEffectivePermissions(editor: AdminAccessEditor, role: string, directPermissions: string[]) {
  return [...new Set([...resolveRolePermissions(editor, role), ...directPermissions])].sort((left, right) => left.localeCompare(right));
}
