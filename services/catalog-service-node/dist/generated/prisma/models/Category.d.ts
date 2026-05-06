import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type CategoryModel = runtime.Types.Result.DefaultSelection<Prisma.$CategoryPayload>;
export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null;
    _avg: CategoryAvgAggregateOutputType | null;
    _sum: CategorySumAggregateOutputType | null;
    _min: CategoryMinAggregateOutputType | null;
    _max: CategoryMaxAggregateOutputType | null;
};
export type CategoryAvgAggregateOutputType = {
    id: number | null;
    tenant_id: number | null;
};
export type CategorySumAggregateOutputType = {
    id: number | null;
    tenant_id: number | null;
};
export type CategoryMinAggregateOutputType = {
    id: number | null;
    tenant_id: number | null;
    name: string | null;
    description: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type CategoryMaxAggregateOutputType = {
    id: number | null;
    tenant_id: number | null;
    name: string | null;
    description: string | null;
    created_at: Date | null;
    updated_at: Date | null;
};
export type CategoryCountAggregateOutputType = {
    id: number;
    tenant_id: number;
    name: number;
    description: number;
    created_at: number;
    updated_at: number;
    _all: number;
};
export type CategoryAvgAggregateInputType = {
    id?: true;
    tenant_id?: true;
};
export type CategorySumAggregateInputType = {
    id?: true;
    tenant_id?: true;
};
export type CategoryMinAggregateInputType = {
    id?: true;
    tenant_id?: true;
    name?: true;
    description?: true;
    created_at?: true;
    updated_at?: true;
};
export type CategoryMaxAggregateInputType = {
    id?: true;
    tenant_id?: true;
    name?: true;
    description?: true;
    created_at?: true;
    updated_at?: true;
};
export type CategoryCountAggregateInputType = {
    id?: true;
    tenant_id?: true;
    name?: true;
    description?: true;
    created_at?: true;
    updated_at?: true;
    _all?: true;
};
export type CategoryAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
    cursor?: Prisma.CategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | CategoryCountAggregateInputType;
    _avg?: CategoryAvgAggregateInputType;
    _sum?: CategorySumAggregateInputType;
    _min?: CategoryMinAggregateInputType;
    _max?: CategoryMaxAggregateInputType;
};
export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
    [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateCategory[P]> : Prisma.GetScalarType<T[P], AggregateCategory[P]>;
};
export type CategoryGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithAggregationInput | Prisma.CategoryOrderByWithAggregationInput[];
    by: Prisma.CategoryScalarFieldEnum[] | Prisma.CategoryScalarFieldEnum;
    having?: Prisma.CategoryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CategoryCountAggregateInputType | true;
    _avg?: CategoryAvgAggregateInputType;
    _sum?: CategorySumAggregateInputType;
    _min?: CategoryMinAggregateInputType;
    _max?: CategoryMaxAggregateInputType;
};
export type CategoryGroupByOutputType = {
    id: number;
    tenant_id: number;
    name: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    _count: CategoryCountAggregateOutputType | null;
    _avg: CategoryAvgAggregateOutputType | null;
    _sum: CategorySumAggregateOutputType | null;
    _min: CategoryMinAggregateOutputType | null;
    _max: CategoryMaxAggregateOutputType | null;
};
export type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<CategoryGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], CategoryGroupByOutputType[P]> : Prisma.GetScalarType<T[P], CategoryGroupByOutputType[P]>;
}>>;
export type CategoryWhereInput = {
    AND?: Prisma.CategoryWhereInput | Prisma.CategoryWhereInput[];
    OR?: Prisma.CategoryWhereInput[];
    NOT?: Prisma.CategoryWhereInput | Prisma.CategoryWhereInput[];
    id?: Prisma.IntFilter<"Category"> | number;
    tenant_id?: Prisma.IntFilter<"Category"> | number;
    name?: Prisma.StringFilter<"Category"> | string;
    description?: Prisma.StringNullableFilter<"Category"> | string | null;
    created_at?: Prisma.DateTimeFilter<"Category"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"Category"> | Date | string;
    products?: Prisma.ProductListRelationFilter;
};
export type CategoryOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    tenant_id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    products?: Prisma.ProductOrderByRelationAggregateInput;
    _relevance?: Prisma.CategoryOrderByRelevanceInput;
};
export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.CategoryWhereInput | Prisma.CategoryWhereInput[];
    OR?: Prisma.CategoryWhereInput[];
    NOT?: Prisma.CategoryWhereInput | Prisma.CategoryWhereInput[];
    tenant_id?: Prisma.IntFilter<"Category"> | number;
    name?: Prisma.StringFilter<"Category"> | string;
    description?: Prisma.StringNullableFilter<"Category"> | string | null;
    created_at?: Prisma.DateTimeFilter<"Category"> | Date | string;
    updated_at?: Prisma.DateTimeFilter<"Category"> | Date | string;
    products?: Prisma.ProductListRelationFilter;
}, "id">;
export type CategoryOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    tenant_id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
    _count?: Prisma.CategoryCountOrderByAggregateInput;
    _avg?: Prisma.CategoryAvgOrderByAggregateInput;
    _max?: Prisma.CategoryMaxOrderByAggregateInput;
    _min?: Prisma.CategoryMinOrderByAggregateInput;
    _sum?: Prisma.CategorySumOrderByAggregateInput;
};
export type CategoryScalarWhereWithAggregatesInput = {
    AND?: Prisma.CategoryScalarWhereWithAggregatesInput | Prisma.CategoryScalarWhereWithAggregatesInput[];
    OR?: Prisma.CategoryScalarWhereWithAggregatesInput[];
    NOT?: Prisma.CategoryScalarWhereWithAggregatesInput | Prisma.CategoryScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Category"> | number;
    tenant_id?: Prisma.IntWithAggregatesFilter<"Category"> | number;
    name?: Prisma.StringWithAggregatesFilter<"Category"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"Category"> | string | null;
    created_at?: Prisma.DateTimeWithAggregatesFilter<"Category"> | Date | string;
    updated_at?: Prisma.DateTimeWithAggregatesFilter<"Category"> | Date | string;
};
export type CategoryCreateInput = {
    tenant_id: number;
    name: string;
    description?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    products?: Prisma.ProductCreateNestedManyWithoutCategoryInput;
};
export type CategoryUncheckedCreateInput = {
    id?: number;
    tenant_id: number;
    name: string;
    description?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    products?: Prisma.ProductUncheckedCreateNestedManyWithoutCategoryInput;
};
export type CategoryUpdateInput = {
    tenant_id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    products?: Prisma.ProductUpdateManyWithoutCategoryNestedInput;
};
export type CategoryUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    tenant_id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    products?: Prisma.ProductUncheckedUpdateManyWithoutCategoryNestedInput;
};
export type CategoryCreateManyInput = {
    id?: number;
    tenant_id: number;
    name: string;
    description?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type CategoryUpdateManyMutationInput = {
    tenant_id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CategoryUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    tenant_id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CategoryOrderByRelevanceInput = {
    fields: Prisma.CategoryOrderByRelevanceFieldEnum | Prisma.CategoryOrderByRelevanceFieldEnum[];
    sort: Prisma.SortOrder;
    search: string;
};
export type CategoryCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tenant_id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type CategoryAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tenant_id?: Prisma.SortOrder;
};
export type CategoryMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tenant_id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type CategoryMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tenant_id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    created_at?: Prisma.SortOrder;
    updated_at?: Prisma.SortOrder;
};
export type CategorySumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tenant_id?: Prisma.SortOrder;
};
export type CategoryNullableScalarRelationFilter = {
    is?: Prisma.CategoryWhereInput | null;
    isNot?: Prisma.CategoryWhereInput | null;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type StringFieldUpdateOperationsInput = {
    set?: string;
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
};
export type CategoryCreateNestedOneWithoutProductsInput = {
    create?: Prisma.XOR<Prisma.CategoryCreateWithoutProductsInput, Prisma.CategoryUncheckedCreateWithoutProductsInput>;
    connectOrCreate?: Prisma.CategoryCreateOrConnectWithoutProductsInput;
    connect?: Prisma.CategoryWhereUniqueInput;
};
export type CategoryUpdateOneWithoutProductsNestedInput = {
    create?: Prisma.XOR<Prisma.CategoryCreateWithoutProductsInput, Prisma.CategoryUncheckedCreateWithoutProductsInput>;
    connectOrCreate?: Prisma.CategoryCreateOrConnectWithoutProductsInput;
    upsert?: Prisma.CategoryUpsertWithoutProductsInput;
    disconnect?: Prisma.CategoryWhereInput | boolean;
    delete?: Prisma.CategoryWhereInput | boolean;
    connect?: Prisma.CategoryWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.CategoryUpdateToOneWithWhereWithoutProductsInput, Prisma.CategoryUpdateWithoutProductsInput>, Prisma.CategoryUncheckedUpdateWithoutProductsInput>;
};
export type CategoryCreateWithoutProductsInput = {
    tenant_id: number;
    name: string;
    description?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type CategoryUncheckedCreateWithoutProductsInput = {
    id?: number;
    tenant_id: number;
    name: string;
    description?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
};
export type CategoryCreateOrConnectWithoutProductsInput = {
    where: Prisma.CategoryWhereUniqueInput;
    create: Prisma.XOR<Prisma.CategoryCreateWithoutProductsInput, Prisma.CategoryUncheckedCreateWithoutProductsInput>;
};
export type CategoryUpsertWithoutProductsInput = {
    update: Prisma.XOR<Prisma.CategoryUpdateWithoutProductsInput, Prisma.CategoryUncheckedUpdateWithoutProductsInput>;
    create: Prisma.XOR<Prisma.CategoryCreateWithoutProductsInput, Prisma.CategoryUncheckedCreateWithoutProductsInput>;
    where?: Prisma.CategoryWhereInput;
};
export type CategoryUpdateToOneWithWhereWithoutProductsInput = {
    where?: Prisma.CategoryWhereInput;
    data: Prisma.XOR<Prisma.CategoryUpdateWithoutProductsInput, Prisma.CategoryUncheckedUpdateWithoutProductsInput>;
};
export type CategoryUpdateWithoutProductsInput = {
    tenant_id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CategoryUncheckedUpdateWithoutProductsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    tenant_id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    created_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updated_at?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type CategoryCountOutputType = {
    products: number;
};
export type CategoryCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    products?: boolean | CategoryCountOutputTypeCountProductsArgs;
};
export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategoryCountOutputTypeSelect<ExtArgs> | null;
};
export type CategoryCountOutputTypeCountProductsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ProductWhereInput;
};
export type CategorySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tenant_id?: boolean;
    name?: boolean;
    description?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
    products?: boolean | Prisma.Category$productsArgs<ExtArgs>;
    _count?: boolean | Prisma.CategoryCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["category"]>;
export type CategorySelectScalar = {
    id?: boolean;
    tenant_id?: boolean;
    name?: boolean;
    description?: boolean;
    created_at?: boolean;
    updated_at?: boolean;
};
export type CategoryOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "tenant_id" | "name" | "description" | "created_at" | "updated_at", ExtArgs["result"]["category"]>;
export type CategoryInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    products?: boolean | Prisma.Category$productsArgs<ExtArgs>;
    _count?: boolean | Prisma.CategoryCountOutputTypeDefaultArgs<ExtArgs>;
};
export type $CategoryPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Category";
    objects: {
        products: Prisma.$ProductPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }, ExtArgs["result"]["category"]>;
    composites: {};
};
export type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$CategoryPayload, S>;
export type CategoryCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: CategoryCountAggregateInputType | true;
};
export interface CategoryDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Category'];
        meta: {
            name: 'Category';
        };
    };
    findUnique<T extends CategoryFindUniqueArgs>(args: Prisma.SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends CategoryFindFirstArgs>(args?: Prisma.SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends CategoryFindManyArgs>(args?: Prisma.SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends CategoryCreateArgs>(args: Prisma.SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends CategoryCreateManyArgs>(args?: Prisma.SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    delete<T extends CategoryDeleteArgs>(args: Prisma.SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends CategoryUpdateArgs>(args: Prisma.SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends CategoryDeleteManyArgs>(args?: Prisma.SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends CategoryUpdateManyArgs>(args: Prisma.SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    upsert<T extends CategoryUpsertArgs>(args: Prisma.SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma.Prisma__CategoryClient<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends CategoryCountArgs>(args?: Prisma.Subset<T, CategoryCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], CategoryCountAggregateOutputType> : number>;
    aggregate<T extends CategoryAggregateArgs>(args: Prisma.Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>;
    groupBy<T extends CategoryGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: CategoryGroupByArgs['orderBy'];
    } : {
        orderBy?: CategoryGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: CategoryFieldRefs;
}
export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    products<T extends Prisma.Category$productsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Category$productsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface CategoryFieldRefs {
    readonly id: Prisma.FieldRef<"Category", 'Int'>;
    readonly tenant_id: Prisma.FieldRef<"Category", 'Int'>;
    readonly name: Prisma.FieldRef<"Category", 'String'>;
    readonly description: Prisma.FieldRef<"Category", 'String'>;
    readonly created_at: Prisma.FieldRef<"Category", 'DateTime'>;
    readonly updated_at: Prisma.FieldRef<"Category", 'DateTime'>;
}
export type CategoryFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where: Prisma.CategoryWhereUniqueInput;
};
export type CategoryFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where: Prisma.CategoryWhereUniqueInput;
};
export type CategoryFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
    cursor?: Prisma.CategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CategoryScalarFieldEnum | Prisma.CategoryScalarFieldEnum[];
};
export type CategoryFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
    cursor?: Prisma.CategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CategoryScalarFieldEnum | Prisma.CategoryScalarFieldEnum[];
};
export type CategoryFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
    cursor?: Prisma.CategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CategoryScalarFieldEnum | Prisma.CategoryScalarFieldEnum[];
};
export type CategoryCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.CategoryCreateInput, Prisma.CategoryUncheckedCreateInput>;
};
export type CategoryCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.CategoryCreateManyInput | Prisma.CategoryCreateManyInput[];
    skipDuplicates?: boolean;
};
export type CategoryUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.CategoryUpdateInput, Prisma.CategoryUncheckedUpdateInput>;
    where: Prisma.CategoryWhereUniqueInput;
};
export type CategoryUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.CategoryUpdateManyMutationInput, Prisma.CategoryUncheckedUpdateManyInput>;
    where?: Prisma.CategoryWhereInput;
    limit?: number;
};
export type CategoryUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where: Prisma.CategoryWhereUniqueInput;
    create: Prisma.XOR<Prisma.CategoryCreateInput, Prisma.CategoryUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.CategoryUpdateInput, Prisma.CategoryUncheckedUpdateInput>;
};
export type CategoryDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where: Prisma.CategoryWhereUniqueInput;
};
export type CategoryDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CategoryWhereInput;
    limit?: number;
};
export type Category$productsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ProductSelect<ExtArgs> | null;
    omit?: Prisma.ProductOmit<ExtArgs> | null;
    include?: Prisma.ProductInclude<ExtArgs> | null;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    cursor?: Prisma.ProductWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ProductScalarFieldEnum | Prisma.ProductScalarFieldEnum[];
};
export type CategoryDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
};
