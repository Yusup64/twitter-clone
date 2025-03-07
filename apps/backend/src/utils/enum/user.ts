/**
 * User Roles
 */
export enum Role {
  /** Regular user (can browse and bookmark listings) */
  USER = 1,
  /** Landlord (can publish listings) */
  LANDLORD = 2,
  /** Agency Manager (manages multiple listings and users) */
  AGENCY_MANAGER = 4,
  /** Finance Administrator (manages funds and payments) */
  FINANCE_ADMIN = 8,
  /** Content Administrator (handles listing reviews and reports) */
  CONTENT_ADMIN = 16,
  /** Super Administrator (has the highest level of permissions) */
  SUPER_ADMIN = 32,
}

/**
 * User Permissions
 */
export enum Permission {
  /** Access denied */
  FORBIDDEN = 0,
  /** View property listings */
  VIEW_LISTINGS = 1,
  /** Create new listings */
  CREATE_LISTINGS = 2,
  /** Edit existing listings */
  EDIT_LISTINGS = 4,
  /** Delete listings */
  DELETE_LISTINGS = 8,
  /** Manage users */
  MANAGE_USERS = 16,
  /** Manage payments */
  MANAGE_PAYMENTS = 32,
  /** View analytics and reports */
  VIEW_ANALYTICS = 64,
  /** Super access (grants all permissions) */
  SUPER_ACCESS = 128,
}
