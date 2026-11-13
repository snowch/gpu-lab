// Copyright © 2026 Christopher Snow.
import scenes from './hello-scenes.json' with {type:'json'};
import media from './hello-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderHelloVideo=()=>recordingContent({slug:'hello',chapter:1,title:'Trace five values through GPU threads',scenes,media});
