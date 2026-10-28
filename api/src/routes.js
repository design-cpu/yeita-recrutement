/* Les routes de données, enregistrées par construireApp. */
import { routesCandidats } from "./candidats.js";
import { routesOptions } from "./options.js";
import { routesSauvegardes } from "./sauvegardes.js";
import { routesDeploiement } from "./deploiement.js";

export const routesApi = [routesCandidats, routesOptions, routesSauvegardes, routesDeploiement];
