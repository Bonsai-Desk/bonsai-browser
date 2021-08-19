import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ipcRenderer } from 'electron';
import '../tabPage.css';
import { useStore, View } from '../store/tab-page-store';
import URLBox from '../components/URLBox';
import Workspace from '../components/Workspace';
import PinButton from './PinButton';
import FuzzyTabs from '../components/FuzzyTabs';
import ClickerParent from '../components/Clicker';
import Wrapper from '../components/Wrapper';
import HistoryModalLocal from '../components/History';
import TabColumns from '../components/Column';
import Footer from '../components/Footer';
import Background from '../components/Background';

const MainContent = observer(() => {
  const { tabPageStore } = useStore();

  if (tabPageStore.View === View.WorkSpace) {
    return (
      <>
        <ClickerParent
          onClick={() => {
            tabPageStore.View = View.Tabs;
          }}
        />
        <Workspace />
      </>
    );
  }
  return (
    <div style={{ height: '100%', padding: '0 0 0 1rem' }}>
      {tabPageStore.View === View.Tabs ? <TabColumns /> : <FuzzyTabs />}
    </div>
  );
});

const Content = observer(() => {
  const { tabPageStore } = useStore();

  if (tabPageStore.View === View.None) {
    return (
      <ClickerParent
        onClick={() => {
          ipcRenderer.send('click-main');
        }}
      />
    );
  }

  return (
    <Background>
      <URLBox />
      <MainContent />
      <Footer />
    </Background>
  );
});

const Tabs = observer(() => {
  const { tabPageStore } = useStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      tabPageStore.handleKeyDown(e);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tabPageStore]);

  const [hasRunOnce, setHasRunOnce] = useState(false);

  useEffect(() => {
    if (hasRunOnce) {
      return;
    }
    setHasRunOnce(true);
  }, [hasRunOnce, tabPageStore]);

  return (
    <Wrapper>
      <Content />
      <HistoryModalLocal />
      <PinButton />
    </Wrapper>
  );
});

export default Tabs;
