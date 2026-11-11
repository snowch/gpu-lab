// Copyright © 2026 Christopher Snow.
import scenes from './requests-scenes.json' with {type:'json'};
import media from './requests-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderRequestsVideo=()=>recordingContent({slug:'requests',chapter:5,title:'Group five reads into memory sectors',scenes,media});
