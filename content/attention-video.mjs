// Copyright © 2026 Christopher Snow.
import scenes from './attention-scenes.json' with {type:'json'};
import media from './attention-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderAttentionVideo=()=>recordingContent({slug:'attention',chapter:11,title:'Update attention totals without full score matrices',scenes,media});
