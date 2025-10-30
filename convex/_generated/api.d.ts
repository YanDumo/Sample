/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as demoData from "../demoData.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as owners from "../owners.js";
import type * as pets from "../pets.js";
import type * as router from "../router.js";
import type * as userProfiles from "../userProfiles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  auth: typeof auth;
  demoData: typeof demoData;
  http: typeof http;
  inventory: typeof inventory;
  owners: typeof owners;
  pets: typeof pets;
  router: typeof router;
  userProfiles: typeof userProfiles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
