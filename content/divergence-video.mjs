// Copyright © 2026 Christopher Snow.
import scenes from './divergence-scenes.json' with {type:'json'};
import media from './divergence-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderDivergenceVideo=()=>recordingContent({slug:'divergence',chapter:7,title:'Follow active masks through different paths',scenes,media});
