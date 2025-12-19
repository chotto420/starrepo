/**
 * Supabaseクエリへのフィルター適用ユーティリティ
 */

import { FilterCondition } from './types';

/**
 * 単一のフィルター条件をクエリに適用
 * @param query Supabaseクエリビルダー
 * @param filter フィルター条件
 */
export function applyFilter(
    query: any,
    filter: FilterCondition
): any {
    switch (filter.operator) {
        case '=':
            return query.eq(filter.field, filter.value);
        case '>':
            return query.gt(filter.field, filter.value);
        case '>=':
            return query.gte(filter.field, filter.value);
        case '<':
            return query.lt(filter.field, filter.value);
        case '<=':
            return query.lte(filter.field, filter.value);
        case 'IS_NOT_NULL':
            return query.not(filter.field, 'is', null);
        case 'IS_NULL':
            return query.is(filter.field, null);
        default:
            return query;
    }
}

/**
 * 複数のフィルター条件をクエリに適用
 * @param query Supabaseクエリビルダー
 * @param filters フィルター条件の配列
 */
export function applyFilters(
    query: any,
    filters: FilterCondition[]
): any {
    let result = query;
    for (const filter of filters) {
        result = applyFilter(result, filter);
    }
    return result;
}
