import styled from 'styled-components';
import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useStore } from '../../store/tab-page-store';

const URLBoxParent = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  align-items: center;
`;

const Input = styled.input`
  background-color: rgba(0, 0, 0, 0.25);
  font-size: 1rem;
  font-weight: normal;
  border-radius: 0.2rem;
  outline: none;
  border: none;
  padding: 0.5rem 1.25rem 0.5rem 1.25rem;
  width: 20rem;
  height: 1rem;
  color: white;
  ::placeholder {
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
  }
`;

const Header = observer(({ onViewPage }: { onViewPage: boolean }) => {
  const { tabPageStore } = useStore();

  const urlBoxRef = useRef<HTMLInputElement>(null);
  const [urlFocus, setUrlFocus] = useState(false);

  useEffect(() => {
    tabPageStore.urlBoxRef = urlBoxRef;
  });
  return (
    <URLBoxParent
      id="header"
      style={{
        position: onViewPage ? 'absolute' : 'static',
        top: onViewPage ? '0' : 'auto',
        zIndex: onViewPage ? 1 : 'auto',
        height: tabPageStore.innerBounds.y,
      }}
      onMouseOver={() => {
        runInAction(() => {
          tabPageStore.hoveringUrlInput = true;
        });
      }}
      onMouseLeave={() => {}}
    >
      <Input
        type="text"
        spellCheck={false}
        ref={urlBoxRef}
        placeholder="Search Google or type a URL"
        value={tabPageStore.urlText}
        onInput={(e) => {
          tabPageStore.setUrlText(e.currentTarget.value);
        }}
        onClick={() => {
          if (urlBoxRef.current != null && !urlFocus) {
            setUrlFocus(true);
            urlBoxRef.current.select();
          }
        }}
        onBlur={() => {
          setUrlFocus(false);
          if (urlBoxRef.current != null) {
            urlBoxRef.current.blur();
            window.getSelection()?.removeAllRanges();
          }
        }}
      />
    </URLBoxParent>
  );
});

export default Header;
