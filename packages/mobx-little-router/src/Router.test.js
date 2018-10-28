// @flow
import { createMemoryHistory } from 'history'
import Middleware from './middleware/Middleware'
import { EventTypes } from './events'
import Navigation from './model/Navigation'
import Router from './Router'
import delay from './util/delay'

describe('Router', () => {
  let router: any

  beforeEach(() => {
    router = new Router(
      createMemoryHistory(),
      [
        { path: '', match: 'full' },
        {
          path: 'a',
          children: [
            {
              path: 'a2',
              children: [
                {
                  path: 'a3',
                  children: [
                    {
                      path: 'a4'
                    }
                  ]
                }
              ]
            }
          ]
        },
        { path: 'b' },
        { path: 'c' }
      ],
      () => ({ message: 'Hello' }),
      Middleware.EMPTY
    )

    return router.start()
  })

  afterEach(() => {
    router.stop()
  })

  describe('events', () => {
    test('handling transition events', async () => {
      router._scheduler.dispatch(
        abortNavigation('PUSH', { pathname: '/' }, { pathname: '/a' })
      )
      await delay(0)
      await delay(0)

      expect(router.location.pathname).toEqual('/a')

      router._scheduler.dispatch(abortNavigation('GO_BACK', { pathname: '/' }, null))
      await delay(0)
      await delay(0)

      expect(router.location.pathname).toEqual('/')

      router._scheduler.dispatch(
        abortNavigation('REPLACE', { pathname: '/' }, { pathname: '/b' })
      )
      await delay(0)
      await delay(0)

      expect(router.location.pathname).toEqual('/b')
    })
  })

  test('stringify query into query', async () => {
    await router.push({ pathname: '/a', query: { b: '2', c: '3' } })
    expect(router.location.search).toEqual('?b=2&c=3')

    await router.push({ pathname: '/a', query: {} })
    expect(router.location.search).toEqual('')

    await router.push(({ pathname: '/a', query: null }: any)) // In case of dynamic `any` being pushed.
    expect(router.location.search).toEqual('')

    await router.push(undefined)
    expect(router.location.search).toEqual('')
  })

  test('string query is passed as it is', async () => {
    const stringQuery = encodeURI('search[user_name]=John')
    await router.push({ pathname: '/a', query: stringQuery })
    expect(router.location.search).toEqual('?' + stringQuery)

    await router.push('')
    expect(router.location.search).toEqual('')
  })

  test('updateQuery', async () => {
    await router.updateQuery({ x: '1' })
    expect(router.location.search).toEqual('?x=1')

    await router.updateQuery({ y: '2' }, { merge: true })
    expect(router.location.search).toEqual('?x=1&y=2')

    await router.updateQuery({ y: '3' }, { merge: true })
    expect(router.location.search).toEqual('?x=1&y=3')

    await router.updateQuery({ y: '4', z: '5' })
    expect(router.location.search).toEqual('?y=4&z=5')

    await router.updateQuery({ y: '4', z: undefined }, { merge: true })
    expect(router.location.search).toEqual('?y=4')

    await router.updateQuery({})
    expect(router.location.search).toEqual('')
  })

  test('createHref string', () => {
    expect(router.createHref('/a/b/c')).toBe('/a/b/c')
    expect(router.createHref('')).toBe('/')
  })

  test('createHref object', () => {
    expect(router.createHref({ pathname: '/a/b/c' })).toBe('/a/b/c')
    expect(router.createHref({ pathname: '/a/b/c', search: '?hey=1' })).toBe('/a/b/c?hey=1')
    expect(router.createHref({ pathname: '/a/b/c', hash: '#ok' })).toBe('/a/b/c#ok')
    expect(router.createHref({})).toBe('/')
  })

  test('createHref undefined', () => {
    expect(router.createHref(undefined)).toBe('/')
    expect(router.createHref(null)).toBe('/')
  })

  test('resolvePath', async () => {
    await router.push('/a/a2/a3/a4/')

    expect(router.resolvePath('/a')).toBe('/a')
    expect(router.resolvePath('/a/')).toBe('/a/')
    expect(router.resolvePath('/a/../b')).toBe('/b')
    expect(router.resolvePath('/a/./b')).toBe('/a/b')

    expect(router.resolvePath('a5')).toBe('/a/a2/a3/a4/a5')

    expect(router.resolvePath('..')).toBe('/a/a2/a3')
    expect(router.resolvePath('../')).toBe('/a/a2/a3/')
    expect(router.resolvePath('../b4')).toBe('/a/a2/a3/b4')
    expect(router.resolvePath('../../b3')).toBe('/a/a2/b3')
    expect(router.resolvePath('../../../b2')).toBe('/a/b2')
    expect(router.resolvePath('../../../../b')).toBe('/b')

    expect(router.resolvePath('./')).toBe('/a/a2/a3/a4/')
    expect(router.resolvePath('./b5')).toBe('/a/a2/a3/a4/b5')
    expect(router.resolvePath('./b5/b6')).toBe('/a/a2/a3/a4/b5/b6')
    expect(router.resolvePath('./b5/../c5')).toBe('/a/a2/a3/a4/c5')

    // Can't go past the root
    expect(router.resolvePath('../../../../../../../../../b')).toBe('/b')

    // Optional cwd argument (defaults to router.location.pathname)
    expect(router.resolvePath('../', '/a/a2/a3/a4')).toBe('/a/a2/a3/')
    expect(router.resolvePath('../', '/a/a2/a3/a4/')).toBe('/a/a2/a3/')
    expect(router.resolvePath('..', '/a/a2/a3/a4')).toBe('/a/a2/a3')
    expect(router.resolvePath('..', '/a/a2/a3/a4/')).toBe('/a/a2/a3')
    expect(router.resolvePath('../../', '/a/a2/a3/a4/')).toBe('/a/a2/')
    expect(router.resolvePath('../b4', '/a/a2/a3/a4/')).toBe('/a/a2/a3/b4')
    expect(router.resolvePath('./b5', '/a/a2/a3/a4/')).toBe('/a/a2/a3/a4/b5')
  })
})

function abortNavigation(navigationType: *, from: *, to: *) {
  return {
    type: EventTypes.NAVIGATION_CANCELLED,
    nextNavigation: new Navigation({
      type: navigationType,
      from,
      to
    })
  }
}
