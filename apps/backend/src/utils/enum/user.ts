/**
 * 用户角色
 */
export enum Role {
  /**普通用户（可以浏览和收藏房源）*/
  USER = 1,
  /** 房东（可以发布房源） */
  LANDLORD = 2,
  /** 中介经理（管理多个房源和用户） */
  AGENCY_MANAGER = 4,
  /** 财务管理员（管理资金和支付） */
  FINANCE_ADMIN = 8,
  /** 内容管理员（管理房源审核和举报） */
  CONTENT_ADMIN = 16,
  /** 超级管理员（拥有最高权限） */
  SUPER_ADMIN = 32,
}

/**
 * 用户权限
 */
export enum Permission {
  /** 禁止访问 */
  FORBIDDEN = 0,
  /** 查看房源列表 */
  VIEW_LISTINGS = 1,
  /** 创建房源 */
  CREATE_LISTINGS = 2,
  /** 编辑房源 */
  EDIT_LISTINGS = 4,
  /** 删除房源 */
  DELETE_LISTINGS = 8,
  /** 管理用户 */
  MANAGE_USERS = 16,
  /** 管理支付 */
  MANAGE_PAYMENTS = 32,
  /** 查看数据统计 */
  VIEW_ANALYTICS = 64,
  /** 超级权限（覆盖所有权限） */
  SUPER_ACCESS = 128,
}
