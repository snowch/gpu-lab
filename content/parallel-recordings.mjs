// Copyright © 2026 Christopher Snow.
import scenes from './histograms-scenes.json' with {type:'json'};
import media from './histograms-media.json' with {type:'json'};
import scanScenes from './scan-scenes.json' with {type:'json'};
import scanMedia from './scan-media.json' with {type:'json'};
import compactionScenes from './compaction-scenes.json' with {type:'json'};
import compactionMedia from './compaction-media.json' with {type:'json'};
import progressScenes from './progress-scenes.json' with {type:'json'};
import progressMedia from './progress-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export {parallelRecordings} from '../src/parallel-recordings.mjs';
const recordings={progress:{scenes:progressScenes,media:progressMedia},histograms:{scenes,media},scan:{scenes:scanScenes,media:scanMedia},compaction:{scenes:compactionScenes,media:compactionMedia}};
export function renderParallelRecording(recap){return recordingContent({...recap,...recordings[recap.slug]});}
