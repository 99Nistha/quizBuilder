import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Play from './pages/Play.jsx';
import Result from './pages/Result.jsx';
import CreatePick from './pages/CreatePick.jsx';
import Create from './pages/Create.jsx';
import Browse from './pages/Browse.jsx';
import Privacy from './pages/Privacy.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:slug" element={<Play />} />
        <Route path="/r/:id" element={<Result />} />
        <Route path="/make" element={<CreatePick />} />
        <Route path="/make/:type" element={<Create />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/browse/:category" element={<Browse />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
