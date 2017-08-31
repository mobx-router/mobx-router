// @flow
import type { ActivatedRoute } from 'mobx-little-router'
import React, { createElement, Component } from 'react'
import { extendObservable, action } from 'mobx'
import { observer } from 'mobx-react'

const transitioningClassName = 'transitioning'

const classNames = {
  transitioning: 'transitioning',
  entering: 'entering',
  leaving: 'leaving',
  enter: 'enter',
  leave: 'leave'
}

class TransitionGroup extends Component {
  props: {
    from: ?Object,
    to: ?Object,
    isTransitioning: boolean,
    idx: number
  }

  transitionState: string

  constructor(props) {
    super(props)

    extendObservable(this, {
      transitionState: 'stopped'
    })
  }

  start = action(() => {
    this.transitionState = 'started'
  })

  stop = action(() => {
    this.transitionState = 'stopped'
  })

  componentDidUpdate() {
    const { isTransitioning } = this.props

    if (isTransitioning && this.transitionState === 'stopped') {
      setTimeout(() => { this.start() })
    } else if (!isTransitioning && this.transitionState === 'started') {
      this.stop()
    }
  }

  render() {
    const { from, to, isTransitioning } = this.props
    const nodes = []

    let fromClassName = ''
    let toClassName = ''

    if (isTransitioning) {
      if (from) {
        fromClassName = `${classNames.transitioning} ${classNames.leaving}`
      }
      if (to) {
        toClassName = `${classNames.transitioning} ${classNames.entering}`
      }

      if (this.transitionState === 'started') {
        from && (fromClassName += ` ${classNames.leave}`)
        to && (toClassName += ` ${classNames.enter}`)
      }
    }

    if (from && isTransitioning) {
      nodes.push({ node: from, className: fromClassName })
    }
    if (to) {
      nodes.push({ node: to, className: toClassName })
    }

    return (
      <div className="transition-group">
        {nodes.map(({ node, className }) =>
          createElement(node.data.component, { key: generateKey(node), params: node.params, className })
        )}
      </div>
    )
  }
}

const generateKey = (node: ActivatedRoute<*, *>) => {
  return [
    node.key,
    Object.keys(node.params).map(key => `${key}:${node.params[key]}`)
  ].join('-')
}

export default observer(TransitionGroup)