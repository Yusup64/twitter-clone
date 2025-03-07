/**
 * User Roles
 */
export enum Role {
  /** Regular user (can browse and favorite listings) */
  USER = 1,
  /** Landlord (can publish listings) */
  LANDLORD = 2,
  /** Agency Manager (manages multiple listings and users) */
  AGENCY_MANAGER = 4,
  /** Finance Admin (manages funds and payments) */
  FINANCE_ADMIN = 8,
  /** Content Admin (manages listing reviews and reports) */
  CONTENT_ADMIN = 16,
  /** Super Admin (has the highest permissions) */
  SUPER_ADMIN = 32,
}

/**
 * User Permissions
 */
export enum Permission {
  /** Forbidden access */
  FORBIDDEN = 0,
  /** View listings */
  VIEW_LISTINGS = 1,
  /** Create listings */
  CREATE_LISTINGS = 2,
  /** Edit listings */
  EDIT_LISTINGS = 4,
  /** Delete listings */
  DELETE_LISTINGS = 8,
  /** Manage users */
  MANAGE_USERS = 16,
  /** Manage payments */
  MANAGE_PAYMENTS = 32,
  /** View analytics */
  VIEW_ANALYTICS = 64,
  /** Super access (overrides all permissions) */
  SUPER_ACCESS = 128,
}

/**
 * Exterior Types
 */
export enum ExteriorType {
  GARDEN = 1,
  BALCONY = 2,
  PARKING = 4,
  CAVE = 8,
  OTHER = 16,
}
