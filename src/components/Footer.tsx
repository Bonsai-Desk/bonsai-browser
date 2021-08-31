import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import React from 'react';
import { ipcRenderer } from 'electron';
import { useStore, View } from '../store/tab-page-store';
import HistoryButton from './HistoryButton';

export const NavButtonParent = styled.button`
  position: absolute;
  bottom: 0;
  right: 135px;
  width: 125px;
  height: 50px;
  border-radius: 10px;
  border: none;
  outline: none;

  :hover {
    background-color: lightgray;
  }
`;

const FooterParent = styled.div`
  width: 100%;
  height: 85px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const FooterButtonParent = styled.button`
  border: none;
  outline: none;
  width: 100px;
  height: 75px;
  border-radius: 1rem;
  margin: 0 2px 0 2px;
  overflow: hidden;

  :hover {
    filter: brightness(0.7);
  }
`;

const WorkspaceButtons = observer(() => {
  const { tabPageStore, workspaceStore } = useStore();

  const buttons = Array.from(workspaceStore.workspaces.values()).map(
    (workspace) => {
      return (
        <FooterButtonParent
          key={workspace.id}
          style={{
            backgroundColor:
              tabPageStore.View === View.WorkSpace &&
              workspace.id === workspaceStore.activeWorkspaceId
                ? '#ffaf54'
                : 'white',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            runInAction(() => {
              if (
                tabPageStore.View === View.WorkSpace &&
                workspaceStore.activeWorkspaceId === workspace.id
              ) {
                ipcRenderer.send(
                  'mixpanel-track',
                  'toggle off workspace with button'
                );
                tabPageStore.View = View.Tabs;
              } else {
                ipcRenderer.send(
                  'mixpanel-track',
                  'toggle on workspace with button'
                );
                workspaceStore.setActiveWorkspaceId(workspace.id);
                tabPageStore.View = View.WorkSpace;
              }
            });
          }}
        >
          {workspace.name}
        </FooterButtonParent>
      );
    }
  );

  return (
    <>
      {buttons}
      <FooterButtonParent
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={() => {
          const workspace = workspaceStore.createWorkspace('new workspace');
          workspace.setShouldEditName(true);
          workspaceStore.setActiveWorkspaceId(workspace.id);
          runInAction(() => {
            tabPageStore.View = View.WorkSpace;
          });
        }}
      >
        +
      </FooterButtonParent>
    </>
  );
});

const Footer = observer(() => {
  const { tabPageStore } = useStore();
  return (
    <FooterParent id="footer">
      <WorkspaceButtons />
      <HistoryButton />
      <NavButtonParent
        onClick={() => {
          runInAction(() => {
            if (tabPageStore.View === View.Tabs) {
              tabPageStore.View = View.NavigatorDebug;
            } else if (tabPageStore.View === View.NavigatorDebug) {
              tabPageStore.View = View.Tabs;
            }
          });
        }}
      >
        debug
      </NavButtonParent>
    </FooterParent>
  );
});

export default Footer;
