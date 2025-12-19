/**
 * ランキングリクエストの入力検証
 * セキュリティ対策として、すべての入力値を検証
 */

import { RankingRequest, RankingType, ValidationResult } from './types';
import { MAX_PAGE, MAX_LIMIT, MIN_LIMIT } from './constants';

/** 有効なランキングタイプのリスト */
export const VALID_RANKING_TYPES: RankingType[] = [
    'overall',
    'playing',
    'favorites',
    'likeRatio',
    'trending',
    'newest',
    'updated',
    'rating',
    'reviews',
    'mylist',
    'hidden',
    'favoriteRatio'
];

/** 有効なジャンルのリスト */
export const VALID_GENRES = [
    'All',
    'Adventure',
    'Fighting',
    'FPS',
    'Platformer',
    'RPG',
    'Simulation',
    'Sports',
    'Town and City',
    'Building',
    'Horror',
    'Naval',
    'Comedy',
    'Medieval',
    'Military',
    'Sci-Fi',
    'Western',
    'all' // クエリパラメータで使用
];

/**
 * ランキングタイプの検証
 */
export function validateRankingType(type: string): ValidationResult {
    if (!VALID_RANKING_TYPES.includes(type as RankingType)) {
        return {
            valid: false,
            error: `Invalid ranking type: ${type}. Must be one of: ${VALID_RANKING_TYPES.join(', ')}`
        };
    }
    return { valid: true };
}

/**
 * ジャンルの検証
 */
export function validateGenre(genre: string): ValidationResult {
    if (genre && genre !== 'all' && !VALID_GENRES.includes(genre)) {
        return {
            valid: false,
            error: `Invalid genre: ${genre}. Must be one of: ${VALID_GENRES.join(', ')}`
        };
    }
    return { valid: true };
}

/**
 * ページ番号の検証
 */
export function validatePage(page: number): ValidationResult {
    if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
        return {
            valid: false,
            error: `Invalid page: ${page}. Must be an integer between 1 and ${MAX_PAGE}`
        };
    }
    return { valid: true };
}

/**
 * リミットの検証
 */
export function validateLimit(limit: number): ValidationResult {
    if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
        return {
            valid: false,
            error: `Invalid limit: ${limit}. Must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}`
        };
    }
    return { valid: true };
}

/**
 * ランキングリクエスト全体の検証
 */
export function validateRankingRequest(request: RankingRequest): ValidationResult {
    // ランキングタイプの検証
    const typeResult = validateRankingType(request.type);
    if (!typeResult.valid) {
        return typeResult;
    }

    // ジャンルの検証
    if (request.genre) {
        const genreResult = validateGenre(request.genre);
        if (!genreResult.valid) {
            return genreResult;
        }
    }

    // ページの検証
    if (request.page !== undefined) {
        const pageResult = validatePage(request.page);
        if (!pageResult.valid) {
            return pageResult;
        }
    }

    // リミットの検証
    if (request.limit !== undefined) {
        const limitResult = validateLimit(request.limit);
        if (!limitResult.valid) {
            return limitResult;
        }
    }

    return { valid: true };
}

/**
 * 安全なページ番号の取得（範囲外の値を補正）
 */
export function sanitizePage(page?: number): number {
    if (!page || !Number.isInteger(page)) {
        return 1;
    }
    return Math.max(1, Math.min(page, MAX_PAGE));
}

/**
 * 安全なリミットの取得（範囲外の値を補正）
 */
export function sanitizeLimit(limit?: number, defaultLimit: number = 50): number {
    if (!limit || !Number.isInteger(limit)) {
        return defaultLimit;
    }
    return Math.max(MIN_LIMIT, Math.min(limit, MAX_LIMIT));
}
