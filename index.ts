/**
 * 书源规则解析器主入口文件
 * Book Source Rule Parser - TypeScript Version
 * 支持 CSS、XPath、JSON、正则、JS 选择器和组合运算规则
 */

// ==================== 类型定义 ====================

/**
 * 选择器类型枚举
 */
export enum SelectorType {
  CSS = 'css',
  XPATH = 'xpath',
  JSON = 'json',
  REGEX = 'regex',
  JS = 'js',
  TEXT = 'text'
}

/**
 * 运算符类型枚举
 */
export enum OperatorType {
  /** 回退机制 || */
  FALLBACK = '||',
  /** 字段拼接 && */
  CONCAT = '&&',
  /** 属性提取 @ */
  ATTR = '@',
  /** 索引选择 [] */
  INDEX = '[]',
  /** 正则净化 ## */
  REGEX_CLEAN = '##',
  /** 条件过滤 :contains( */
  CONTAINS = ':contains('
}

/**
 * 解析结果
 */
export interface ParseResult<T = any> {
  /** 解析是否成功 */
  success: boolean;
  /** 解析结果数据 */
  data: T;
  /** 错误信息（失败时） */
  error?: string;
  /** 错误列表（失败时） */
  errors?: Array<{
    message: string;
    code?: string;
    details?: any;
  }>;
  /** 使用的规则 */
  rule: string;
  /** 选择器类型 */
  selector: string;
  /** 元数据 */
  metadata?: {
    /** 执行时间(ms) */
    duration?: number;
    /** 是否使用缓存 */
    cached?: boolean;
    /** 其他元信息 */
    [key: string]: any;
  };
}

/**
 * 批量解析结果
 */
export type ParseBatchResult<T extends Record<string, string>> = {
  [K in keyof T]: ParseResult;
};

/**
 * 规则上下文
 */
export interface RuleContext {
  /** 数据源（DOM、HTML字符串、JSON字符串等） */
  source: Document | Element | string;
  /** 变量上下文 */
  variables?: Record<string, any>;
  /** 解析选项 */
  options?: RuleEngineOptions;
  /** 父级上下文 */
  parent?: RuleContext;
}

/**
 * 选择器配置
 */
export interface SelectorConfig {
  /** 选择器类型 */
  type: SelectorType | string;
  /** 选择器表达式 */
  expression: string;
  /** 属性提取（可选） */
  attribute?: string;
  /** 索引（可选） */
  index?: number | string;
  /** 附加选项 */
  options?: Record<string, any>;
}

/**
 * 规则引擎配置选项
 */
export interface RuleEngineOptions {
  /** 解析超时时间(ms)，默认 5000 */
  timeout?: number;
  /** 最大递归深度，默认 10 */
  maxDepth?: number;
  /** 启用缓存，默认 true */
  enableCache?: boolean;
  /** 缓存大小限制，默认 100 */
  cacheSize?: number;
  /** 严格模式（抛出错误而非返回null），默认 false */
  strictMode?: boolean;
  /** 调试模式，默认 false */
  debug?: boolean;
  /** 自定义选择器 */
  customSelectors?: Record<string, SelectorFunction>;
  /** 自定义操作符 */
  customOperators?: Record<string, OperatorFunction>;
}

/**
 * 自定义选择器函数
 */
export type SelectorFunction = (
  source: any,
  expression: string,
  context?: RuleContext
) => any;

/**
 * 自定义操作符函数
 */
export type OperatorFunction = (
  left: any,
  right: any,
  context?: RuleContext
) => any;

// ==================== 导入 JavaScript 实现 ====================

import { 
  BookSourceRuleEngine as JSRuleEngine,
  createRuleEngine as jsCreateRuleEngine,
  parseRule as jsParseRule,
  parseRules as jsParseRules
} from './src/engine.js';

import {
  SelectorType as JSSelectorType,
  OperatorType as JSOperatorType,
  isEmpty as jsIsEmpty,
  RuleParseError as JSRuleParseError
} from './src/types.js';

// ==================== 核心类 ====================

/**
 * 书源规则解析引擎
 */
export class BookSourceRuleEngine {
  private _engine: any;

  /**
   * 创建规则引擎实例
   * @param options - 配置选项
   */
  constructor(options?: RuleEngineOptions) {
    this._engine = new JSRuleEngine(options);
  }

  /**
   * 解析单个规则
   * @param source - 数据源（HTML字符串、JSON字符串等）
   * @param rule - 规则表达式
   * @param context - 上下文（可选）
   * @returns 解析结果
   */
  async parse<T = any>(
    source: string | Document | Element,
    rule: string,
    context?: Partial<RuleContext>
  ): Promise<ParseResult<T>> {
    return this._engine.parse(source, rule, context);
  }

  /**
   * 批量解析多个规则
   * @param source - 数据源
   * @param rules - 规则对象 {key: rule}
   * @param context - 上下文（可选）
   * @returns 批量解析结果
   */
  async parseBatch<T extends Record<string, string>>(
    source: string | Document | Element,
    rules: T,
    context?: Partial<RuleContext>
  ): Promise<ParseBatchResult<T>> {
    return this._engine.parseBatch(source, rules, context);
  }

  /**
   * 解析数组/列表数据
   * @param source - 数据源
   * @param itemRule - 列表项选择器
   * @param fieldRules - 字段提取规则
   * @param context - 上下文（可选）
   * @returns 数组解析结果
   */
  async parseArray<T = any>(
    source: string | Document | Element,
    itemRule: string,
    fieldRules: Record<string, string>,
    context?: Partial<RuleContext>
  ): Promise<T[]> {
    return this._engine.parseArray(source, itemRule, fieldRules, context);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this._engine.clearCache();
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    cacheSize: number;
    cacheHits: number;
    cacheMisses: number;
    totalParses: number;
  } {
    return this._engine.getStats();
  }
}

/**
 * RuleEngine 别名（向后兼容）
 */
export class RuleEngine extends BookSourceRuleEngine {}

// ==================== 工厂函数 ====================

/**
 * 创建规则引擎实例
 * @param options - 配置选项
 * @returns 规则引擎实例
 */
export function createRuleEngine(options?: RuleEngineOptions): BookSourceRuleEngine {
  return new BookSourceRuleEngine(options);
}

/**
 * 解析单个规则（静态方法）
 * @param source - 数据源
 * @param rule - 规则表达式
 * @param context - 上下文（可选）
 * @returns 解析结果
 */
export function parseRule<T = any>(
  source: string | Document | Element,
  rule: string,
  context?: Partial<RuleContext>
): Promise<ParseResult<T>> {
  return jsParseRule(source as any, rule, context as any);
}

/**
 * 批量解析规则（静态方法）
 * @param source - 数据源
 * @param rules - 规则对象
 * @param context - 上下文（可选）
 * @returns 批量解析结果
 */
export function parseRules<T extends Record<string, string>>(
  source: string | Document | Element,
  rules: T,
  context?: Partial<RuleContext>
): Promise<ParseBatchResult<T>> {
  return jsParseRules(source as any, rules as any, context as any) as Promise<ParseBatchResult<T>>;
}

// ==================== 工具函数 ====================

/**
 * 判断值是否为空
 * @param value - 要判断的值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  return jsIsEmpty(value);
}

/**
 * 规则解析错误类
 */
export class RuleParseError extends Error {
  code?: string;
  details?: any;
  rule?: string;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'RuleParseError';
    this.code = code;
    this.details = details;
    
    // 设置原型链
    Object.setPrototypeOf(this, RuleParseError.prototype);
  }
}

// ==================== 重新导出选择器和操作符 ====================

// 导出所有选择器
export * from './src/selectors/index.js';

// 导出所有运算符
export * from './src/operators/index.js';

// ==================== 默认导出 ====================

/**
 * 默认导出：快速使用的工厂函数
 * @param options - 配置选项
 * @returns 规则引擎实例
 */
export default function createBookSourceParser(
  options: RuleEngineOptions = {}
): BookSourceRuleEngine {
  return createRuleEngine(options);
}
