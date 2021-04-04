import * as React from 'react'
import {Component, ReactNode} from 'react'

interface Props {
  loadMore: (pageLoaded: number) => void // 加载更多的回调
  loader: ReactNode // 显示 Loading 的元素
  throttle: number // offset 临界值，小于则开始加载
  hasMore?: boolean // 是否还有更多可以加载
  pageStart?: number // 页面初始页
  getScrollParent?: () => HTMLElement // 获取 parentElement 的回调
  useWindow?: boolean // 是否以 window 作为 scrollEl
}

class InfiniteScroll extends Component<Props, any> {
  private scrollComponent: HTMLDivElement | null = null // 当前滚动的组件
  private loadingMore = false // 是否正在加载更多
  private pageLoaded = 0 // 当前加载页数

  constructor(props: Props) {
    super(props);
    this.scrollListener = this.scrollListener.bind(this)
  }

  scrollListener() {
    const node = this.scrollComponent
    if (!node) return

    const parentNode = this.getParentElement(node)
    if (!parentNode) return

    let offset;

    if (this.props.useWindow) {
      const doc = document.documentElement || document.body.parentElement || document.body
      const scrollTop = window.pageYOffset || doc.scrollTop

      offset = this.calculateOffset(node, scrollTop)
    } else {
      offset = node.scrollHeight - parentNode.scrollTop - parentNode.clientHeight
    }

    if (offset < this.props.throttle) {
      node.removeEventListener('scroll', this.scrollListener)

      this.props.loadMore(this.pageLoaded += 1)
      this.loadingMore = true
    }
  }

  calculateOffset(el: HTMLElement | null, scrollTop: number) {
    if (!el) return 0

    return this.calculateTopPosition(el) + el.offsetHeight - scrollTop - window.innerHeight
  }

  calculateTopPosition(el: HTMLElement | null): number {
    if (!el) return 0

    return el.offsetTop + this.calculateTopPosition(el.offsetParent as HTMLElement)
  }

  getParentElement(el: HTMLElement | null): HTMLElement | null {
    const scrollParent = this.props.getScrollParent && this.props.getScrollParent()

    if (scrollParent) {
      return scrollParent
    }

    return el && el.parentElement
  }

  attachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement || !this.props.hasMore) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl.addEventListener('scroll', this.scrollListener)
  }

  detachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement) return

    parentElement.removeEventListener('scroll', this.scrollListener)
  }

  componentDidMount() {
    this.attachScrollListener()
    this.pageLoaded = this.props.pageStart || 0
  }

  componentWillUnmount() {
    this.detachScrollListener()
  }

  render() {
    const {children, loader, hasMore} = this.props

    return (
      <div ref={node => this.scrollComponent = node}>
        {children}
        {hasMore && loader}
      </div>
    )
  }
}

export default InfiniteScroll
