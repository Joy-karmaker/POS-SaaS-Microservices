import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly Category: "Category";
    readonly Product: "Product";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const CategoryScalarFieldEnum: {
    readonly id: "id";
    readonly tenant_id: "tenant_id";
    readonly name: "name";
    readonly description: "description";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum];
export declare const ProductScalarFieldEnum: {
    readonly id: "id";
    readonly tenant_id: "tenant_id";
    readonly category_id: "category_id";
    readonly name: "name";
    readonly sku: "sku";
    readonly barcode: "barcode";
    readonly price: "price";
    readonly cost_price: "cost_price";
    readonly stock_quantity: "stock_quantity";
    readonly is_active: "is_active";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const CategoryOrderByRelevanceFieldEnum: {
    readonly name: "name";
    readonly description: "description";
};
export type CategoryOrderByRelevanceFieldEnum = (typeof CategoryOrderByRelevanceFieldEnum)[keyof typeof CategoryOrderByRelevanceFieldEnum];
export declare const ProductOrderByRelevanceFieldEnum: {
    readonly name: "name";
    readonly sku: "sku";
    readonly barcode: "barcode";
};
export type ProductOrderByRelevanceFieldEnum = (typeof ProductOrderByRelevanceFieldEnum)[keyof typeof ProductOrderByRelevanceFieldEnum];
