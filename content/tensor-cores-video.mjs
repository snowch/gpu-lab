// Copyright © 2026 Christopher Snow.
import scenes from './tensor-cores-scenes.json' with {type:'json'};
import media from './tensor-cores-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderPrecisionVideo=()=>recordingContent({slug:'tensor-cores',chapter:10,title:'Follow input rounding into FP32 sums',scenes,media});
