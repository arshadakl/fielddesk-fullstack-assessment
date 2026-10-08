export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AppController_getHello"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bootstrap anonymous or fetch session CSRF token; refetch after login */
        get: operations["AuthController_csrf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AuthController_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Revoke session; bootstrap anonymous CSRF first if session is stale */
        post: operations["AuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List organisation users */
        get: operations["UsersController_list"];
        put?: never;
        /** Create a new user in the organisation */
        post: operations["UsersController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get user details by ID */
        get: operations["UsersController_getById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update user profile */
        patch: operations["UsersController_update"];
        trace?: never;
    };
    "/api/v1/users/{id}/role": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update user role and atomically revoke active sessions */
        put: operations["UsersController_updateRole"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/organisation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current organisation summary */
        get: operations["OrganisationController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update organisation settings */
        patch: operations["OrganisationController_update"];
        trace?: never;
    };
    "/api/v1/work-orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List work orders with role-aware scoping */
        get: operations["WorkOrdersController_list"];
        put?: never;
        /** Create a new work order */
        post: operations["WorkOrdersController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/work-orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get work order details */
        get: operations["WorkOrdersController_getById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update work order details */
        patch: operations["WorkOrdersController_update"];
        trace?: never;
    };
    "/api/v1/work-orders/{id}/assign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Assign technician and schedule window with concurrency overlap protection */
        post: operations["WorkOrdersController_assign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/work-orders/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Update work order status */
        post: operations["WorkOrdersController_updateStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/work-orders/{id}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get chronological activity history of work order events */
        get: operations["WorkOrdersController_listEvents"];
        put?: never;
        /** Submit an immutable progress event with idempotent deduplication */
        post: operations["WorkOrdersController_submitEvent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_live"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_ready"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        CsrfResDto: {
            csrfToken: string;
        };
        LoginDto: {
            email: string;
            password: string;
        };
        OrganisationResDto: {
            /** Format: uuid */
            id: string;
            name: string;
        };
        AuthUserResDto: {
            /** Format: uuid */
            id: string;
            email: string;
            name: string;
            /** @enum {string} */
            role: "OWNER" | "DISPATCHER" | "TECHNICIAN";
            organisation: components["schemas"]["OrganisationResDto"];
        };
        AuthResDto: {
            user: components["schemas"]["AuthUserResDto"];
        };
        UserResDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            organisationId: string;
            email: string;
            name: string;
            /** @enum {string} */
            role: "OWNER" | "DISPATCHER" | "TECHNICIAN";
            /** Format: date-time */
            createdAt: string;
        };
        UserListResDto: {
            items: components["schemas"]["UserResDto"][];
            /** @example 10 */
            total: number;
            /** @example 1 */
            page: number;
            /** @example 20 */
            limit: number;
        };
        CreateUserDto: {
            /** @example tech1@company.com */
            email: string;
            /** @example Ravi Kumar */
            name: string;
            /** @example TemporaryPass123 */
            password: string;
            /**
             * @example TECHNICIAN
             * @enum {string}
             */
            role: "OWNER" | "DISPATCHER" | "TECHNICIAN";
        };
        UpdateUserDto: {
            /** @example Ravi Kumar */
            name?: string;
        };
        UpdateUserRoleDto: {
            /**
             * @example DISPATCHER
             * @enum {string}
             */
            role: "OWNER" | "DISPATCHER" | "TECHNICIAN";
        };
        UpdateOrganisationDto: {
            /** @example Clearbrook Maintenance Ltd */
            name: string;
        };
        WorkOrderResDto: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            organisationId: string;
            /** @example WO-0001 */
            reference: string;
            /** @example HVAC repair on 3rd floor */
            title: string;
            description: string;
            /** @enum {string} */
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
            /** @enum {string} */
            status: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
            /** @example Main Headquarters */
            siteName: string;
            /** Format: uuid */
            creatorId: string;
            creatorName: string;
            /** Format: uuid */
            assignedTechnicianId?: string | null;
            assignedTechnicianName?: string | null;
            /** Format: date-time */
            scheduledStart?: string | null;
            /** Format: date-time */
            scheduledEnd?: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        WorkOrderListResDto: {
            items: components["schemas"]["WorkOrderResDto"][];
            /** @example 10 */
            total: number;
            /** @example 1 */
            page: number;
            /** @example 20 */
            limit: number;
        };
        CreateWorkOrderDto: {
            /** @example HVAC repair on 3rd floor */
            title: string;
            /** @example AC unit leaking water and making rattling noise. */
            description: string;
            /**
             * @default MEDIUM
             * @enum {string}
             */
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
            /** @example Main Headquarters */
            siteName: string;
            /** Format: uuid */
            assignedTechnicianId?: string;
            /** Format: date-time */
            scheduledStart?: string;
            /** Format: date-time */
            scheduledEnd?: string;
        };
        UpdateWorkOrderDto: {
            /** @example Updated HVAC repair title */
            title?: string;
            description?: string;
            /** @enum {string} */
            priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
            siteName?: string;
        };
        AssignWorkOrderDto: {
            /** Format: uuid */
            assignedTechnicianId: string;
            /** Format: date-time */
            scheduledStart: string;
            /** Format: date-time */
            scheduledEnd: string;
        };
        UpdateWorkOrderStatusDto: {
            /** @enum {string} */
            status: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
        };
        ProgressEventPayloadDto: {
            /**
             * @description Target work order status transition if event updates status
             * @example in_progress
             */
            status?: string;
            /**
             * @description Progress note or field comments
             * @example Work commenced on 3rd floor AC compressor
             */
            note?: string;
        };
        SubmitProgressEventDto: {
            /**
             * @description Unique client-supplied idempotency key
             * @example evt-10001
             */
            eventId: string;
            /**
             * @example STATUS_CHANGED
             * @enum {string}
             */
            type: "STATUS_CHANGED" | "NOTE_ADDED" | "WORK_STARTED" | "WORK_COMPLETED";
            /**
             * Format: date-time
             * @description ISO-8601 timestamp when the event occurred on the field device
             * @example 2026-08-04T10:30:00.000Z
             */
            occurredAt: string;
            /**
             * @description Validated progress payload containing optional status and bounded note
             * @example {
             *       "status": "in_progress",
             *       "note": "Technician arrived on site"
             *     }
             */
            payload: components["schemas"]["ProgressEventPayloadDto"];
        };
        WorkOrderEventUserDto: {
            /** Format: uuid */
            id: string;
            /** @example Arjun Nair */
            name: string;
            /** @example TECHNICIAN */
            role: string;
        };
        WorkOrderEventResDto: {
            /** Format: uuid */
            id: string;
            /** @example evt-10001 */
            eventId: string;
            /** Format: uuid */
            organisationId: string;
            /** Format: uuid */
            workOrderId: string;
            /** @enum {string} */
            type: "STATUS_CHANGED" | "NOTE_ADDED" | "WORK_STARTED" | "WORK_COMPLETED";
            /** Format: date-time */
            occurredAt: string;
            /**
             * @description Event payload object
             * @example {
             *       "status": "in_progress",
             *       "note": "Technician arrived on site"
             *     }
             */
            payload: Record<string, never>;
            /** Format: date-time */
            createdAt: string;
            user: components["schemas"]["WorkOrderEventUserDto"];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    AppController_getHello: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_csrf: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CsrfResDto"];
                };
            };
        };
    };
    AuthController_login: {
        parameters: {
            query?: never;
            header: {
                Origin: string;
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthResDto"];
                };
            };
            /** @description Invalid email or password */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rate limited; Retry-After indicates seconds */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthResDto"];
                };
            };
        };
    };
    AuthController_logout: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Cookies cleared; session revoked if active */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UsersController_list: {
        parameters: {
            query?: {
                role?: "OWNER" | "DISPATCHER" | "TECHNICIAN";
                search?: string;
                page?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserListResDto"];
                };
            };
        };
    };
    UsersController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateUserDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResDto"];
                };
            };
        };
    };
    UsersController_getById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResDto"];
                };
            };
        };
    };
    UsersController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResDto"];
                };
            };
        };
    };
    UsersController_updateRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserRoleDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResDto"];
                };
            };
        };
    };
    OrganisationController_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganisationResDto"];
                };
            };
        };
    };
    OrganisationController_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateOrganisationDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganisationResDto"];
                };
            };
        };
    };
    WorkOrdersController_list: {
        parameters: {
            query?: {
                status?: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
                priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
                assignedTechnicianId?: string;
                search?: string;
                page?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkOrderListResDto"];
                };
            };
        };
    };
    WorkOrdersController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWorkOrderDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkOrderResDto"];
                };
            };
        };
    };
    WorkOrdersController_getById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkOrderResDto"];
                };
            };
        };
    };
    WorkOrdersController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWorkOrderDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkOrderResDto"];
                };
            };
        };
    };
    WorkOrdersController_assign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignWorkOrderDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkOrderResDto"];
                };
            };
        };
    };
    WorkOrdersController_updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWorkOrderStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkOrderResDto"];
                };
            };
        };
    };
    WorkOrdersController_listEvents: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkOrderEventResDto"][];
                };
            };
        };
    };
    WorkOrdersController_submitEvent: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubmitProgressEventDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkOrderEventResDto"];
                };
            };
            /** @description Conflict on invalid status transition or duplicate event ID mismatch */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HealthController_live: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HealthController_ready: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
