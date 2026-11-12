// Copyright © 2026 Christopher Snow.
import scenes from './inference-scenes.json' with {type:'json'};
import media from './inference-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderInferenceVideo=()=>recordingContent({slug:'inference',chapter:12,title:'Connect cache capacity to inference budgets',scenes,media});
