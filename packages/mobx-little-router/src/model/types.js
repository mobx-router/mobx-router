// @flow
import type { History, Location as HistoryLocation } from 'history'
import type { ITreeNode } from '../util/tree'
import type { TransitionFn } from '../transition/types'
import type { MatchFn, Matcher } from './matchers'
import type Navigation from './Navigation'

export type { MatchFn, Matcher }

export type Query = { [key: string]: string | {} }
export type Params = { [key: string]: string | number | boolean | null | void }


export type Location = HistoryLocation & {
  params: Params,
  query: Query
}

export type LocationShape = $Shape<Location>

export type Href = LocationShape | string

export type Config<D> = BasicConfig<D> | RedirectConfig<D>

export type BasicConfig<D: Object> = {
  path: string,
  query?: Array<string>,
  params?: Params,
  getData?: () => D,
  key?: string,
  children?: Config<D>[],
  loadChildren?: LoadChildrenConfigFn<D>,
  match?: 'full' | 'partial',
  canActivate?: GuardFn,
  canDeactivate?: GuardFn,
  willActivate?: LifecycleFn,
  willDeactivate?: LifecycleFn,
  willResolve?: LifecycleFn,
  onError?: ErrorHandler,
  onTransition?: TransitionFn,
  onEnter?: LifecycleEndFn,
  onExit?: LifecycleEndFn,
  etc?: any
}

export type RedirectConfig<D: Object> = {
  path: string,
  query?: empty,
  redirectTo: Href,
  getData?: () => D,
  key?: string,
  children?: empty,
  match?: 'full' | 'partial',
  canActivate?: empty,
  canDeactivate?: empty,
  willActivate?: empty,
  willDeactivate?: empty,
  willResolve?: empty,
  onError?: empty,
  onTransition?: empty,
  onEnter?: empty,
  onExit?: empty,
  etc?: any
}

export type LoadChildrenConfigFn<D> = () => Promise<any>

export type GuardFn = (
  route: Route<*, *>,
  nav: Navigation
) => boolean | Promise<void>

export type LifecycleFn = (
  route: Route<*, *>,
  nav: Navigation
) => Promise<void>

export type LifecycleEndFn = (
  route: Route<*, *>
) => void

export type Setter = () => void

export type ResolveFn = (
  route: Route<*, *>,
  nav: Navigation
) => Promise<void | Setter>

export type ErrorHandler = (route: Route<*, *>, navigation: Navigation, err: Error) => Promise<any>

export type LoadChildrenRouteStateTreeNode = () => Promise<any>

export type RouteValue<C: Object, D: Object> = {
  key: string,
  // Original path provided to this route node.
  path: string,
  query: Array<string>,
  matcher: Matcher,
  loadChildren?: null | LoadChildrenRouteStateTreeNode,
  canActivate: GuardFn,
  canDeactivate: GuardFn,
  willActivate: LifecycleFn,
  willDeactivate: LifecycleFn,
  willResolve: ResolveFn,
  onError: null | ErrorHandler,
  onTransition: null | TransitionFn,
  onEnter: null | LifecycleEndFn,
  onExit: null | LifecycleEndFn,
  getContext: () => C,
  getData: () => D,
  etc: Object
}

export type RouteStateTreeNode<C, D> = ITreeNode<RouteValue<C, D>>

export type PathElement<C, D> = {
  node: RouteStateTreeNode<C, D>,
  remaining: string,
  parentUrl: string,
  segment: string,
  params: Params
}

export type Route<C,D> = {
  key: string,
  value: string,
  node: RouteStateTreeNode<C, D>,
  data: D,
  context: C,
  params: Params,
  query: Query,
  segment: string, // This is the matched segment from URL. e.g. "/123" for ":id"
  parentUrl: string,
  onTransition: null | TransitionFn
}
