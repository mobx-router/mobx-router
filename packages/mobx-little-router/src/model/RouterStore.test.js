// @flow
import { runInAction, autorun } from 'mobx'
import type { Route, PathElement } from './types'
import RouterStore from './RouterStore'
import createRouteStateTreeNode from './createRouteStateTreeNode'
import createRoute from './createRoute'

describe('RouterStore', () => {
  let store, root, getContext

  beforeEach(() => {
    getContext = jest.fn(() => ({
      message: 'Hello'
    }))
    root = createRouteStateTreeNode({ path: '' }, getContext)
    store = new RouterStore(root)
  })

  test('Initial parent', () => {
    expect(store.state.root.value.path).toEqual('')
    expect(store.cache.get(store.state.root.value.key)).toBe(store.state.root)
  })

  test('Updating current nodes', () => {
    const a = {
      path: 'a',
      key: 'a',
      children: [],
      params: {
        x: '1'
      }
    }

    store.replaceChildren(store.state.root, [a])
    store.updateRoutes([createRoute(store.getNodeUnsafe('a'), '1', '1', { x: '1' }, {})])

    expect(store.routes[0]).toEqual(
      expect.objectContaining({
        params: { x: '1' },
        node: expect.objectContaining({
          value: expect.objectContaining({
            path: 'a'
          })
        })
      })
    )

    store.updateRoutes([createRoute(store.getNodeUnsafe('a'), '2', '2', { x: '2' }, {})])

    expect(store.routes[0]).toEqual(
      expect.objectContaining({
        params: { x: '2' },
        node: expect.objectContaining({
          value: expect.objectContaining({
            path: 'a'
          })
        })
      })
    )

    expect(store.prevRoutes[0]).toEqual(
      expect.objectContaining({
        params: { x: '1' },
        node: expect.objectContaining({
          value: expect.objectContaining({
            path: 'a'
          })
        })
      })
    )

    expect(store.getRouteUnsafe('a').params.x).toBe('2')
    expect(store.getParams('a')).toEqual({ x: '2' })
  })

  test('Building routes from path', () => {
    const dataSpy = jest.fn(() => Promise.resolve())
    const a = createRouteStateTreeNode({ path: 'a', getData: () => dataSpy('a') })
    const b = createRouteStateTreeNode({ path: 'b', getData: () => dataSpy('b') })
    const c = createRouteStateTreeNode({ path: 'c', getData: () => dataSpy('c') })

    const aRoute = createRoute(a, '', '/a/1', { x: '1' }, {})
    const bRoute = createRoute(b, '/a/1', '/b/1', { y: '1' }, {})

    const currRoutes = [aRoute, bRoute]

    store.routes.replace(currRoutes)

    const nextPath1: PathElement<*, *>[] = [
      { node: a, params: { x: '1' }, parentUrl: '', segment: '/a/1', remaining: '/b/1/c/1' },
      { node: b, params: { y: '1' }, parentUrl: '/a/1', segment: '/b/1', remaining: '/c/1' },
      { node: c, params: { z: '1' }, parentUrl: '/a/1/b/1', segment: '/c/1', remaining: '' }
    ]

    const nextRoutes1 = store.getNextRoutes(nextPath1, ({}: any))

    expect(nextRoutes1.length).toEqual(3)
    expect(nextRoutes1[0]).toBe(store.routes[0])
    expect(nextRoutes1[1]).toBe(store.routes[1])
    expect(nextRoutes1[2]).toBeDefined() // Newly created route.

    const nextPath2: PathElement<*, *>[] = [
      { node: a, params: { x: '2' }, parentUrl: '', segment: '/a/2', remaining: '/b/1/c/1' },
      { node: b, params: { y: '1' }, parentUrl: '/a/2', segment: '/b/1', remaining: '/c/1' },
      { node: c, params: { z: '1' }, parentUrl: '/a/2/b/1', segment: '/c/1', remaining: '' }
    ]

    const nextRoutes2 = store.getNextRoutes(nextPath2, ({}: any))

    expect(nextRoutes2.length).toEqual(3)
    expect(nextRoutes2[0]).not.toBe(store.routes[0]) // Params Changed so different route
    expect(nextRoutes2[1]).not.toBe(store.routes[1]) // Parant params changed so this changes too
    expect(nextRoutes2[2]).toBeDefined() // Newly created route.
  })

  test('Routes with query params', () => {
    const a = {
      path: 'a',
      key: 'a',
      children: [],
      query: ['q']
    }

    const b = {
      path: 'b',
      key: 'b',
      children: [],
      query: ['r']
    }

    store.replaceChildren(store.state.root, [a, b])
    store.updateRoutes([createRoute(store.getNodeUnsafe('a'), '', '', {}, { q: 'hey' })])

    expect(store.routes[0]).toEqual(
      expect.objectContaining({
        query: { q: 'hey' },
        node: expect.objectContaining({
          value: expect.objectContaining({
            path: 'a'
          })
        })
      })
    )

    store.updateRoutes([createRoute(store.getNodeUnsafe('b'), '', '', {}, { r: 'what' })])

    expect(store.routes[0]).toEqual(
      expect.objectContaining({
        query: { r: 'what' },
        node: expect.objectContaining({
          value: expect.objectContaining({
            path: 'b'
          })
        })
      })
    )
  })
})
