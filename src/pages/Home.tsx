import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ipcRenderer } from 'electron';
import '../tabPage.css';
import { useStore, View } from '../store/tab-page-store';
import URLBox from '../components/URLBox';
import PinButton from '../components/PinButton';
import FuzzyTabs from '../components/FuzzyTabs';
import ClickerParent from '../components/Clicker';
import Background from '../components/Background';
import History from '../components/History';
import Columns from '../components/Columns';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Workspace from '../components/Workspace';

const MainContent = observer(() => {
  const { tabPageStore } = useStore();

  if (tabPageStore.View === View.WorkSpace) {
    return <Workspace />;
  }
  return tabPageStore.View === View.Tabs ? <Columns /> : <FuzzyTabs />;
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
    <Container>
      <URLBox />
      <MainContent />
      <Footer />
    </Container>
  );
});

const Home = observer(() => {
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
    <Background
      onClick={(e) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (e.target.id === 'header' || e.target.id === 'footer') {
          tabPageStore.View = View.Tabs;
        }
      }}
    >
      <Content />
      <History />
      <PinButton />
    </Background>
  );
});

export default Home;
