import { Router, Route, Switch, useParams, Redirect } from 'wouter';
import VideoWithControls from '@/components/video/VideoWithControls';
import Home from '@/pages/Home';
import { VIDEOS_BY_SLUG } from '@/videos/registry';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

function VideoRoute() {
  const { slug } = useParams<{ slug: string }>();
  const config = VIDEOS_BY_SLUG[slug];
  if (!config) return <Redirect to="/" />;
  return <VideoWithControls config={config} />;
}

export default function App() {
  return (
    <Router base={base}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/:slug" component={VideoRoute} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Router>
  );
}
