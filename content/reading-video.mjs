// Copyright © 2026 Christopher Snow.
import scenes from './reading-scenes.json' with {type:'json'};
import media from './reading-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderReadingVideo=()=>recordingContent({slug:'reading',chapter:3,title:'Select tensor rows and columns',scenes,media});
