// Copyright © 2026 Christopher Snow.
import scenes from './scheduling-scenes.json' with {type:'json'};
import media from './scheduling-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderSchedulingVideo=()=>recordingContent({slug:'scheduling',chapter:6,title:'Choose a ready warp while another waits',scenes,media});
