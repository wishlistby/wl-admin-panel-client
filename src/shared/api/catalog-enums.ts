export const attributeDataTypeValues = ['Text', 'Number', 'Boolean', 'Date', 'Option', 'MultiOption', 'Json'] as const;
export const productStatusValues = ['Draft', 'Published', 'Archived', 'OutOfStock'] as const;
export const productVisibilityValues = ['Visible', 'Hidden', 'SearchOnly', 'DirectLinkOnly'] as const;
export const productCollectionTypeValues = ['Manual', 'Dynamic', 'NewArrivals', 'Bestsellers', 'Featured', 'Seasonal'] as const;
export const mediaTypeValues = ['Image', 'Video', 'Document'] as const;
export const productRelationTypeValues = ['Similar', 'Accessory', 'Replacement', 'Bundle', 'CrossSell', 'UpSell'] as const;
export const seoLandingPageTypeValues = ['Category', 'Brand', 'Collection', 'CategoryBrand', 'CategoryAttribute', 'CustomFilter'] as const;

export type AttributeDataTypeKey = (typeof attributeDataTypeValues)[number];
export type ProductStatusKey = (typeof productStatusValues)[number];
export type ProductVisibilityKey = (typeof productVisibilityValues)[number];
export type ProductCollectionTypeKey = (typeof productCollectionTypeValues)[number];
export type MediaTypeKey = (typeof mediaTypeValues)[number];
export type ProductRelationTypeKey = (typeof productRelationTypeValues)[number];
export type SeoLandingPageTypeKey = (typeof seoLandingPageTypeValues)[number];

function createEnumHelpers<const TValues extends readonly string[]>(values: TValues) {
  const options = values.map((value, index) => ({ value, label: value, apiValue: index }));
  const byName = new Map(values.map((value, index) => [value, index]));

  const fromApi = (value: string | number | null | undefined): TValues[number] => {
    if (typeof value === 'string' && byName.has(value)) {
      return value as TValues[number];
    }

    if (typeof value === 'number' && value >= 0 && value < values.length) {
      return values[value];
    }

    return values[0];
  };

  const toApi = (value: string | number | null | undefined): number => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string' && byName.has(value)) {
      return byName.get(value)!;
    }

    return 0;
  };

  return { options, fromApi, toApi };
}

export const attributeDataTypeEnum = createEnumHelpers(attributeDataTypeValues);
export const productStatusEnum = createEnumHelpers(productStatusValues);
export const productVisibilityEnum = createEnumHelpers(productVisibilityValues);
export const productCollectionTypeEnum = createEnumHelpers(productCollectionTypeValues);
export const mediaTypeEnum = createEnumHelpers(mediaTypeValues);
export const productRelationTypeEnum = createEnumHelpers(productRelationTypeValues);
export const seoLandingPageTypeEnum = createEnumHelpers(seoLandingPageTypeValues);
