// @flow
import { observable } from 'mobx'
import type { Config, RouteStateTreeNode } from './types'
import { TreeNode } from '../util/tree'
import defaultCreateKey from '../util/createKey'
import * as m from './matchers'
import { array, string, optional, func, createValidator } from '../validation'

function NOP(a: *, b: *) {
  return Promise.resolve()
}

// Don't run validators in production bundle
const validate =
  process.env.NODE_ENV === 'production'
    ? createValidator({})
    : createValidator({
        path: string,
        children: optional(array),
        loadChildren: optional(func),
        onError: optional(func),
        canActivate: optional(func),
        canDeactivate: optional(func),
        onTransition: optional(func),
        onEnter: optional(func),
        onExit: optional(func),
        willActivate: optional(func),
        willDeactivate: optional(func),
        willResolve: optional(func)
      })

type GetContext = () => *

export default function createRouteStateTreeNode(
  config: Config<*>,
  getContext: ?GetContext,
  createKey: () => string = defaultCreateKey
): RouteStateTreeNode<*, *> {
  const matcher = getMatcher(config)

  validate(config)

  getContext = typeof getContext === 'function' ? getContext : () => ({})

  const children =
    typeof config.children !== 'undefined'
      ? config.children.map(x =>
          // Chains the context down to children.
          createRouteStateTreeNode(x, getContext, createKey)
        )
      : []

  return TreeNode(
    observable(
      {
        key: typeof config.key === 'string' ? config.key : createKey(),
        path: config.path,
        matcher: matcher(config.path),
        query: typeof config.query !== 'undefined' ? config.query : [],
        params: config.params !== null ? config.params : {},
        loadChildren: typeof config.loadChildren === 'function' ? config.loadChildren : null,
        canActivate: config.canActivate || NOP,
        canDeactivate: config.canDeactivate || NOP,
        willActivate: config.willActivate || NOP,
        willDeactivate: config.willDeactivate || NOP,
        willResolve: config.willResolve || NOP,
        onError: config.onError || null,
        onTransition: config.onTransition || null,
        onEnter: config.onEnter || null,
        onExit: config.onExit || null,
        getContext,
        getData: config.getData || (() => ({})),
        // This prop is meant for middleware to add annotations that it may need to perform its task.
        // e.g. validate config needs to add some hash for equality checks between tree nodes.
        etc: config.etc || {}
      },
      {
        matcher: observable.ref,
        loadChildren: observable.ref,
        canActivate: observable.ref,
        canDeactivate: observable.ref,
        willActivate: observable.ref,
        willDeactivate: observable.ref,
        willResolve: observable.ref,
        onError: observable.ref,
        onTransition: observable.ref,
        onEnter: observable.ref,
        onExit: observable.ref,
        getData: observable.ref,
        etc: observable.ref
      }
    ),
    children
  )
}

export function getMatcher(config: Config<*>) {
  // Catch-all matcher for handling "NotFound", etc.
  if (config.path === '**') return m.any

  // Match was specified.
  if (config.match) return m[config.match]

  // If we are in a leaf node, then match must be full.
  if (!config.children && typeof config.loadChildren !== 'function') return m.full

  // Otherwise we default to partial.
  return m.partial
}
