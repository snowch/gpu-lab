// Copyright © 2026 Christopher Snow.
import scenes from './launch-from-input-scenes.json' with {type:'json'};
import media from './launch-from-input-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderLaunchFromInputVideo=()=>recordingContent({slug:'launch-from-input',chapter:3,title:'Derive CUDA storage and launches from inputs',scenes,media});
