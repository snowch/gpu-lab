// Copyright © 2026 Christopher Snow.
import scenes from './devices-scenes.json' with {type:'json'};
import media from './devices-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderDevicesVideo=()=>recordingContent({slug:'devices',chapter:2,title:'Follow tensor values between CPU and GPU',scenes,media});
