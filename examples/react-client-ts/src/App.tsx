import * as React from 'react'
import { observer } from 'mobx-react'
import { withRouter, Outlet } from 'mobx-little-router-react'
import styled, { injectGlobal } from 'styled-components'
import Header from './components/Header'

export interface IApp {
  router: any
}

@observer
class App extends React.Component<IApp, {}> {
  render() {
    return (
      <div>
        {<Header />}
        <Viewport>
          <p>pathname: <b>{JSON.stringify(this.props.router._store.location.pathname)}</b></p>
          <Outlet key='main' />
          <Outlet name='modal' />
        </Viewport>
      </div>
    )
  }
}

const Viewport = styled.div`
  padding: 54px 18px;
`

injectGlobal`
  body {
    font-family: "Helvetica Neue", sans-serif;
    padding: 0;
    margin: 0;

    * {
      box-sizing: border-box;
    }
  }

  input:focus,
  select:focus,
  textarea:focus,
  button:focus {
    outline: none;
  }
`

export default withRouter(App)
