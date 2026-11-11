// Copyright © 2026 Christopher Snow.
import scenes from './layout-scenes.json' with {type:'json'};
import media from './layout-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderLayoutVideo=()=>recordingContent({slug:'layout',chapter:4,title:'Follow tensor views into memory',scenes,media});
