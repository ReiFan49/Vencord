/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/*
  Making src/plugins/index.ts more modular is another work to do?
  For now temporarily placed at @api for easy access.
*/

import { Logger } from "@utils/Logger";
import { Plugin } from "@utils/types";
import { UtilTypes, FluxDispatcher } from "@webpack/common";
import { FluxEvents } from "@webpack/types";

const interceptingFluxPlugins = new Set<string>();
const interceptingFluxWrappedFunctions = new Map<string, UtilTypes.FluxCallbackPredicate[]>();

export function subscribePluginFluxInterceptors(p: Plugin, fluxDispatcher: typeof FluxDispatcher) {
  if (!p.fluxInterceptors) return;
  if (interceptingFluxPlugins.has(p.name)) return;

  interceptingFluxPlugins.add(p.name);
  if (!interceptingFluxWrappedFunctions.has(p.name))
    interceptingFluxWrappedFunctions.set(p.name, []);
  const ary = interceptingFluxWrappedFunctions.get(p.name)!;
  
  for (const interceptor of p.fluxInterceptors)
    ary.push(interceptor.wrapped),
    fluxDispatcher._interceptors.push(interceptor.wrapped);
}

export function unsubscribePluginFluxInterceptors(p: Plugin, fluxDispatcher: typeof FluxDispatcher) {
  if (!p.fluxInterceptors) return;

  interceptingFluxPlugins.delete(p.name);
  const ary = interceptingFluxWrappedFunctions.has(p.name) ? interceptingFluxWrappedFunctions.get(p.name)! : [];
  for (const interceptor of ary) {
    const lookupIndex = fluxDispatcher._interceptors.findIndex(function(interceptorRaw){
      return interceptorRaw === interceptor;
    });
    if (typeof lookupIndex !== 'number') continue;
    if (lookupIndex < 0) continue;

    fluxDispatcher._interceptors.splice(lookupIndex, 1);
  }
  ary.splice(0);
}