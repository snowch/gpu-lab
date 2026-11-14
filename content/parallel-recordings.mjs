// Copyright © 2026 Christopher Snow.
import scenes from './histograms-scenes.json' with {type:'json'};
import media from './histograms-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export {parallelRecordings} from '../src/parallel-recordings.mjs';
const recordings={histograms:{scenes,media}};
export function renderParallelRecording(recap){return recordingContent({...recap,...recordings[recap.slug]});}
