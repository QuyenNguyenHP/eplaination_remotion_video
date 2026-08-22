import {Composition} from 'remotion';import episode from '../data/episode.json';import {ExplainerVideo,getDuration} from './ExplainerVideo';
export const Root=()=> <Composition id="EXPLAINER-VIDEO" component={ExplainerVideo} width={1080} height={1920} fps={30} durationInFrames={getDuration(episode)} defaultProps={{episode}}/>;
