import React, { ComponentClass, ComponentElement, RefObject } from 'react';
import ReactDOM from 'react-dom';
import StackItem from './StackItem';
import { NotificationItemProps, NotificationAPIReturn } from './PropsType';
import { Positions } from './enums';

function isAtBottom(position: Positions) {
  return position.indexOf('bottom') === 0;
}

function getPosition(position?: Positions): Positions {
  return (position && Positions[position]) || Positions.topRight;
}

export default class StackManager {
  private notifyList: ComponentElement<NotificationItemProps, StackItem>[] = [];

  private component: ComponentClass<NotificationItemProps, {}>;

  private containerCls: string;

  private keySeed = 0;

  private componentName: string;

  constructor(component: ComponentClass<NotificationItemProps, {}>, componentName: string) {
    this.containerCls = `${(component.defaultProps as NotificationItemProps).prefixCls}-container`;
    this.component = component;
    this.componentName = componentName;
  }

  private render(position: Positions) {
    const list = this.notifyList.filter((item) => item.props.position === position);
    ReactDOM.render(<>{list}</>, this.getContainerDom(position, true));
  }

  private getContainerDom(position: Positions, create?: boolean) {
    const positionCls = `${this.containerCls}--${position}`;
    let div = document.querySelector(`.${positionCls}`);
    if (!div && create) {
      div = document.createElement('div');
      div.className = `${this.containerCls} ${positionCls}`;
      document.body.appendChild(div);
    }
    return div as HTMLDivElement;
  }

  private remove(key: string, position: Positions) {
    const index = this.notifyList.findIndex((item) => item.key === key);
    if (index > -1) {
      this.notifyList.splice(index, 1);
      this.render(position);
    }
  }

  // To display a new StackItem
  open(props: NotificationItemProps): NotificationAPIReturn {
    this.keySeed += 1;
    const newKey = props.key || String(this.keySeed);
    const position = getPosition(props.position);
    const newRef = React.createRef<StackItem>();
    const stackItem = (
      <StackItem
        {...props}
        key={newKey}
        ref={newRef}
        position={position}
        Component={this.component}
        name={`${this.componentName}--${position}`}
        willUnmount={() => this.remove(newKey, position)}
      />
    );
    if (isAtBottom(position)) {
      this.notifyList.unshift(stackItem);
    } else {
      this.notifyList.push(stackItem);
    }
    this.render(position);
    return { close: () => this.close(newKey) };
  }

  // To close single one
  close(key: string) {
    const notify = this.notifyList.find((item) => item.key === key);
    if (notify) {
      const { current } = notify.ref as RefObject<StackItem>;
      current && current.close();
    }
  }

  // To close all
  closeAll() {
    this.notifyList.forEach((notify) => {
      const { current } = notify.ref as RefObject<StackItem>;
      current && current.close();
    });
  }

  // To unmount & reomve container dom
  destroy() {
    this.notifyList.length = 0;
    Object.keys(Positions).forEach((position: Positions) => {
      const div = this.getContainerDom(position);
      if (div) {
        ReactDOM.unmountComponentAtNode(div);
        document.body.removeChild(div);
      }
    });
  }
}