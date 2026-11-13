// Copyright © 2026 Christopher Snow.
import scenes from './putting-it-together-scenes.json' with {type:'json'};
import media from './putting-it-together-media.json' with {type:'json'};
import {recordingContent} from '../src/recording-view.mjs';
export const renderInvestigationVideo=()=>recordingContent({slug:'putting-it-together',chapter:14,title:'Turn matrix reuse into a testable hypothesis',scenes,media});
