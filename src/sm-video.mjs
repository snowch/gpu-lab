// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
const video=document.getElementById('sm-video');
registerExperiment('sm-recording',()=>({
  time:Number.isFinite(video.currentTime)?video.currentTime:0,
  volume:video.volume,rate:video.playbackRate,muted:video.muted,
}),saved=>{
  video.pause();
  if(Number.isFinite(saved.volume)&&saved.volume>=0&&saved.volume<=1)video.volume=saved.volume;
  if(Number.isFinite(saved.rate)&&saved.rate>=0.25&&saved.rate<=4){video.defaultPlaybackRate=saved.rate;video.playbackRate=saved.rate;}
  video.muted=saved.muted===true;
  if(Number.isFinite(saved.time)&&saved.time>0){
    const seek=()=>{video.currentTime=Math.min(saved.time,Number.isFinite(video.duration)?video.duration: saved.time);};
    if(video.readyState>=1)seek();
    else{video.addEventListener('loadedmetadata',seek,{once:true});video.preload='metadata';video.load();}
  }
});
