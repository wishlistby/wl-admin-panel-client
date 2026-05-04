export type HttpErrorDetails = {
  field?: string;
  message: string;
};

const fieldLabelMap: Record<string, string> = {
  Name: 'Название',
  Slug: 'Slug',
  Code: 'Код',
  Currency: 'Валюта',
  FullPath: 'Full path',
  Title: 'Title',
  Term: 'Термин',
  SynonymsJson: 'Synonyms JSON',
  SearchTerm: 'Поисковый запрос',
  TargetUrl: 'Target URL',
  Url: 'URL',
  Sku: 'SKU',
  'Product.Name': 'Название товара',
  'Product.Slug': 'Slug товара',
  'Product.ProductTypeId': 'Тип товара',
  'Product.PrimaryCategoryId': 'Основная категория',
  'ProductVariant.Name': 'Название SKU',
  'ProductVariant.Sku': 'SKU',
  'Payload.Name': 'Название',
  'Payload.Slug': 'Slug',
  'Payload.Code': 'Код',
  'Payload.Currency': 'Валюта',
};

function getFieldLabel(field?: string) {
  if (!field) {
    return null;
  }

  if (fieldLabelMap[field]) {
    return fieldLabelMap[field];
  }

  const parts = field.split('.');
  const lastPart = parts.at(-1) ?? field;
  return fieldLabelMap[lastPart] ?? lastPart;
}

export class HttpError extends Error {
  status: number;
  code?: string;
  details: HttpErrorDetails[];

  constructor(message: string, options?: { status?: number; code?: string; details?: HttpErrorDetails[] }) {
    super(message);
    this.name = 'HttpError';
    this.status = options?.status ?? 500;
    this.code = options?.code;
    this.details = options?.details ?? [];
  }
}

export function toUserMessage(error: unknown) {
  if (error instanceof HttpError) {
    if (error.details.length > 0) {
      const lines = error.details.map((item) => {
        const label = getFieldLabel(item.field);
        if (label && !item.message.includes(label)) {
          return `${label}: ${item.message}`;
        }

        return item.message;
      });

      return `Нужно исправить следующие поля:\n${lines.map((line) => `• ${line}`).join('\n')}`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка. Попробуйте ещё раз.';
}
