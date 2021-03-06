import { observer } from 'mobx-react-lite';
import { Instance, isValidReference } from 'mobx-state-tree';
import React, { useEffect, useRef } from 'react';
import { runInAction } from 'mobx';
import { DraggableCore, DraggableData } from 'react-draggable';
import { ipcRenderer } from 'electron';
import { useStore } from '../../store/tab-page-store';
import { easeOut, overTrash } from './utils';
import { lerp } from '../../utils/utils';
import {
  Group,
  GroupHeader,
  GroupResize,
  HeaderInput,
  HeaderText,
} from './style';
import RedX from '../RedX';
import redX from '../../../assets/x-letter.svg';
import {
  groupBorder,
  groupPadding,
  groupTitleHeight,
  ItemGroup,
  widthPixelsToInt,
} from '../../store/workspace/item-group';
import { Workspace } from '../../store/workspace/workspace';

const MainGroup = observer(
  ({
    workspace,
    group,
  }: {
    workspace: Instance<typeof Workspace>;
    group: Instance<typeof ItemGroup>;
  }) => {
    const { tabPageStore, workspaceStore } = useStore();

    const targetGroupSize = group.size();
    const lerpValue = easeOut(group.animationLerp);

    const groupTitleBoxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (
        isValidReference(() => group) &&
        tabPageStore.editingGroupId === group.id
      ) {
        setTimeout(() => {
          groupTitleBoxRef.current?.select();
        }, 10);
      }
    }, [tabPageStore.editingGroupId, group]);

    useEffect(() => {
      if (group.shouldEditTitle) {
        group.setShouldEditTitle(false);
        runInAction(() => {
          tabPageStore.activeGroupBoxRef = groupTitleBoxRef;
          tabPageStore.editingGroupId = group.id;
        });
        if (groupTitleBoxRef.current !== null) {
          groupTitleBoxRef.current.value = group.title;
        }
      }
    }, [group, group.shouldEditTitle, tabPageStore]);

    const [groupScreenX, groupScreenY] = workspace.worldToScreen(
      group.x,
      group.y
    );

    const groupHeight = lerp(
      group.animationStartHeight,
      targetGroupSize[1],
      lerpValue
    );

    return (
      <DraggableCore
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onStart={(_, data) => {
          if (group.id === 'inbox') {
            return;
          }

          workspace.moveToFront(group);
          group.setDragMouseStart(data.x, data.y);

          const [screenGroupX, screenGroupY] = workspace.worldToScreen(
            group.x,
            group.y
          );

          if (
            data.x >
            screenGroupX + (group.size()[0] - 10) * workspace.scale
          ) {
            group.setTempResizeWidth(group.width);
            group.setResizing(true);
          } else if (
            data.y >=
            screenGroupY +
              (groupTitleHeight + groupPadding + groupBorder) * workspace.scale
          ) {
            group.setBeingDragged(true);
            workspace.setAnyDragging(true);
          }
        }}
        onDrag={(_, data: DraggableData) => {
          if (group.id === 'inbox') {
            return;
          }

          const screenGroupX = workspace.worldToScreen(group.x, group.y)[0];

          if (group.resizing) {
            group.setTempResizeWidth(
              widthPixelsToInt((data.x - screenGroupX) / workspace.scale)
            );
            workspace.setGroupWidth(Math.floor(group.tempResizeWidth), group);
          } else {
            if (
              !group.beingDragged &&
              tabPageStore.editingGroupId !== group.id
            ) {
              const xDif = data.x - group.dragMouseStartX;
              const yDif = data.y - group.dragMouseStartY;
              const distSquared = xDif * xDif + yDif * yDif;
              if (distSquared > 5 * 5) {
                group.setBeingDragged(true);
                workspace.setAnyDragging(true);
              }
            }

            if (group.beingDragged) {
              group.setOverTrash(overTrash([data.x, data.y], workspace));
              workspace.setAnyOverTrash(group.overTrash);

              const worldDelta = workspace.screenVectorToWorldVector(
                data.deltaX,
                data.deltaY
              );
              group.move(worldDelta[0], worldDelta[1]);
            }
          }
        }}
        onStop={(_, data) => {
          if (group.id === 'inbox') {
            return;
          }

          const screenGroupX = workspace.worldToScreen(group.x, group.y)[0];

          if (
            !group.beingDragged &&
            !group.resizing &&
            tabPageStore.editingGroupId !== group.id
          ) {
            runInAction(() => {
              tabPageStore.activeGroupBoxRef = groupTitleBoxRef;
              tabPageStore.editingGroupId = group.id;
            });
            if (groupTitleBoxRef.current !== null) {
              groupTitleBoxRef.current.value = group.title;
            }
          }

          if (group.resizing) {
            const roundFunc = group.height() === 1 ? Math.round : Math.floor;
            group.setTempResizeWidth(
              widthPixelsToInt((data.x - screenGroupX) / workspace.scale)
            );
            const newWidth = roundFunc(group.tempResizeWidth);
            if (newWidth !== group.width) {
              ipcRenderer.send('mixpanel-track', 'resize workspace group');
            }
            workspace.setGroupWidth(newWidth, group, true);
            group.setResizing(false);
          }

          if (group.overTrash) {
            workspace.deleteGroup(group, workspaceStore.dataPath);
            workspace.setAnyDragging(false);
            workspace.setAnyOverTrash(false);
            return;
          }

          group.setBeingDragged(false);
          group.setOverTrash(false);
          workspace.setAnyDragging(false);
          workspace.setAnyOverTrash(false);
        }}
      >
        <Group
          style={{
            transformOrigin: '0px 0px',
            transform: `scale(${
              group.id === 'inbox' ? workspace.inboxScale : workspace.scale
            })`,
            width: lerp(
              group.animationStartWidth,
              targetGroupSize[0],
              lerpValue
            ),
            height:
              group.id === 'inbox'
                ? Math.max(groupHeight, workspace.height)
                : groupHeight,
            left: groupScreenX,
            top: groupScreenY,
            zIndex: group.id === 'inbox' ? 10000000 - 1 : group.zIndex,
            border:
              group.id === 'inbox'
                ? `${groupBorder}px solid transparent`
                : `${groupBorder}px solid rgba(0,0,0,0.1)`,
            display: group.id === 'hidden' ? 'none' : 'block',
            cursor: group.beingDragged ? 'grabbing' : 'auto',
            color: group.textColor,
            boxShadow:
              group.id === 'inbox'
                ? ''
                : 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            backgroundColor:
              group.id === 'inbox' ? 'transparent' : group.groupColor,
          }}
          onMouseOver={() => {
            group.setHovering(true);
          }}
          onMouseLeave={() => {
            group.setHovering(false);
          }}
        >
          <GroupHeader
            style={{
              height: groupTitleHeight + groupPadding,
              cursor: (() => {
                if (group.id === 'inbox') {
                  return 'auto';
                }
                return group.beingDragged ? 'grabbing' : 'pointer';
              })(),
              color: group.textColor,
            }}
          >
            <HeaderText
              style={{
                display:
                  tabPageStore.editingGroupId === group.id ? 'none' : 'block',
                color: group.id === 'inbox' ? 'rgb(50,50,50)' : group.textColor,
              }}
            >
              {group.id === 'inbox' ? 'Inbox' : group.title}
            </HeaderText>
            <HeaderInput
              ref={groupTitleBoxRef}
              type="text"
              spellCheck="false"
              style={{
                display:
                  tabPageStore.editingGroupId === group.id ? 'block' : 'none',
                height: groupTitleHeight + groupPadding,
                color: group.textColor,
              }}
              onMouseDown={(e) => {
                if (e.button !== 1) {
                  e.stopPropagation();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  e.preventDefault();
                  if (groupTitleBoxRef.current !== null) {
                    groupTitleBoxRef.current.blur();
                  }
                }
              }}
              onBlur={(e) => {
                runInAction(() => {
                  tabPageStore.activeGroupBoxRef = null;
                  tabPageStore.editingGroupId = '';
                });
                if (
                  e.currentTarget.value !== '' &&
                  e.currentTarget.value !== group.title
                ) {
                  ipcRenderer.send('mixpanel-track', 'rename workspace group');
                  group.setTitle(e.currentTarget.value);
                }
              }}
            />
            <RedX
              id="InboxX"
              style={{
                display: group.id === 'inbox' ? 'flex' : 'none',
                right: 10,
                top: 13,
              }}
              hoverColor="rgba(255, 0, 0, 1)"
              onClick={(e) => {
                e.stopPropagation();

                workspace.inboxGroup.itemArrangement.forEach((itemId) => {
                  const item = workspace.items.get(itemId);
                  if (typeof item !== 'undefined') {
                    workspace.deleteItem(
                      item,
                      workspace.inboxGroup,
                      workspaceStore.dataPath
                    );
                  }
                });
              }}
            >
              <img draggable={false} src={redX} alt="x" width="20px" />
            </RedX>
          </GroupHeader>
          <GroupResize
            style={{
              display: group.id === 'inbox' ? 'none' : 'block',
            }}
          />
        </Group>
      </DraggableCore>
    );
  }
);

export default MainGroup;
