export const ROLES = {
    ADMIN: 'admin',
    BRANCH: 'branch',
    AGENT: 'agent',
    CUSTOMER: 'customer'
};

// Admin Permissions (top level - all power)
export const canAddAdmin = (userRole) => userRole === ROLES.ADMIN;
export const canDeleteAdmin = (userRole) => userRole === ROLES.ADMIN;

// Branch Panel Permissions
export const canAddCustomer = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canViewCustomer = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canUpdateCustomer = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canDeleteCustomer = (userRole) => userRole === ROLES.ADMIN;

export const canAddAgent = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canViewAgent = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canUpdateAgent = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canDeleteAgent = (userRole) => userRole === ROLES.ADMIN;

export const canAddLuggage = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canUpdateLuggage = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canViewLuggage = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);

// Agent Panel Permissions
export const canViewParcel = (userRole) => [ROLES.AGENT, ROLES.BRANCH, ROLES.ADMIN].includes(userRole);
export const canPickupParcel = (userRole) => [ROLES.AGENT, ROLES.ADMIN].includes(userRole);
export const canDropParcel = (userRole) => [ROLES.AGENT, ROLES.ADMIN].includes(userRole);
export const canUpdateParcel = (userRole) => [ROLES.BRANCH, ROLES.ADMIN].includes(userRole);

// Customer Panel Permissions
export const canAddParcel = (userRole) => [ROLES.CUSTOMER, ROLES.ADMIN].includes(userRole);