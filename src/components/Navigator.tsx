import React, { useRef } from 'react';
import styled, { css } from 'styled-components';
import { observer } from 'mobx-react-lite';
import { ipcRenderer } from 'electron';
import { useStore } from '../store/tab-page-store';
import { goBack, INode } from '../store/history-store';

const NavigatorParent = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(255, 0, 0, 0.25);
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  justify-content: space-between;
`;

const NavigatorPanel = styled.div`
  background: rgba(0, 0, 0, 0.25);
  border-radius: 1rem;
  overflow: scroll;
  ::-webkit-scrollbar {
    display: none;
  }
  div + div {
    margin-top: 10px;
  }
  ${({
    width,
    height,
    margin,
  }: {
    width: string;
    height: string;
    margin: string;
  }) => css`
    height: ${height};
    margin: 0 ${margin} 0 ${margin};
    width: ${width};
  `}
`;

const NavigatorItemParent = styled.div`
  color: white;
  width: 100%;
  padding-top: 56.25%;
  background-color: black;
  border-radius: 1rem;
`;

interface Dimensions {
  width: number;
  height: number;
  margin: number;
}

function asPx(a: number) {
  return `${a}px`;
}

enum Direction {
  Back,
  Forward,
}

const NavigatorItem = observer(
  ({ node, dir }: { node: INode; dir: Direction }) => {
    const { historyStore } = useStore();
    return (
      <NavigatorItemParent
        onClick={() => {
          if (dir === Direction.Back) {
            goBack(historyStore, node);
          }
        }}
      >
        {node.data.url}
      </NavigatorItemParent>
    );
  }
);

const Panel = observer(
  ({
    items,
    dim,
    dir,
  }: {
    items: INode[];
    dim: Dimensions;
    dir: Direction;
  }) => {
    const { width, height, margin } = dim;
    return (
      <NavigatorPanel
        width={asPx(width)}
        height={asPx(height)}
        margin={asPx(margin)}
      >
        {items.map((item) => (
          <NavigatorItem key={item.id} node={item} dir={dir} />
        ))}
      </NavigatorPanel>
    );
  }
);

const Navigator = observer(() => {
  const backRef = useRef(null);
  const { tabPageStore, historyStore } = useStore();
  const gutter =
    (tabPageStore.screen.width - tabPageStore.innerBounds.width) / 2;
  const margin = 20;
  const width = gutter - 2 * margin;
  const { height } = tabPageStore.innerBounds;
  const head = historyStore.heads.get(historyStore.active);
  const leftItems = head && head.parent ? [head.parent] : [];
  const rightItems = head ? head.children.slice().reverse() : [];
  return (
    <NavigatorParent
      ref={backRef}
      onClick={(e) => {
        if (backRef.current && e.target === backRef.current) {
          ipcRenderer.send('click-main');
        }
      }}
    >
      <Panel
        dir={Direction.Back}
        items={leftItems}
        dim={{ width, height, margin }}
      />
      <Panel
        dir={Direction.Forward}
        items={rightItems}
        dim={{ width, height, margin }}
      />
    </NavigatorParent>
  );
});

export default Navigator;
