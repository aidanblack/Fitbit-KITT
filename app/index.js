import clock from "clock";
import document from "document";
import * as messaging from "messaging";
import * as simpleSettings from "./device-settings";
import { preferences } from "user-settings";
import * as util from "../common/utils";
import { me } from "appbit";
import { HeartRateSensor } from "heart-rate";
import { BodyPresenceSensor } from "body-presence";
import { today } from "user-activity";
import { battery } from "power";
import * as weather from 'fitbit-weather/app';

const settings;
const primaryDisplay = document.getElementById("primaryDisplay");
const altDisplay = document.getElementById("altDisplay");
const sideButtons = document.getElementsByClassName("sideButton");
const hrm;
const voiceAnimate = document.getElementById("voiceAnimate");
const lightDisplay = document.getElementById("lightDisplay");
const pursuit = document.getElementById("pursuit");
const timeDisplay = document.getElementById("time");
const dateDisplay = document.getElementById("date");
const timeDisplayAlt = document.getElementById("time2");
const dateDisplayAlt = document.getElementById("date2");
const weatherAlt = document.getElementById("temp");
const dynamicDisplay = document.getElementById("goal");
var temperature = 0;
var statDisplay = "BA";

function settingsCallback(data) {
  settings = data;
}

simpleSettings.initialize(settingsCallback);

messaging.peerSocket.addEventListener("message", (evt) => {
  if (evt && evt.data && evt.data.key) {
    settings[evt.data.key] = evt.data.value;
    //console.log(`${evt.data.key} : ${evt.data.value}`); // Good for debugging
  }
});

if (HeartRateSensor) {
  hrm = new HeartRateSensor({ frequency: 1 });
  hrm.start();
  hrm.addEventListener("reading", () => function(){
    console.log(hrm.heartRate);
    let runner = document.getElementById("animateElement").animate();
    runner.duration(hrm.heartRate / 100);
    runner.start();
  });
}

function updateDisplay() {
  let activeGoal = document.getElementById(statDisplay);
  sideButtons = document.getElementsByClassName("sideButton");
  sideButtons.forEach(element => { 
    if(element.id != statDisplay) element.style.opacity = 0.5;
  })
  activeGoal.style.opacity = 1;

  // return the cached value if it is less than 30 minutes old 
  weather.fetch(30 * 60 * 1000).then(weather => {
    if (settings.tempUnit.selected == "1") {
      temperature = Math.round(weather.temperatureF);
    }
    else {
      temperature = Math.round(weather.temperatureC);
    }
  }).catch(error => console.log(JSON.stringify(error)));
  weatherAlt.text = `${temperature}°`;
  if (statDisplay == "WE") {
    dynamicDisplay.text = `${temperature}°`;
  }
  else if (me.permissions.granted("access_activity")) {
    if (statDisplay == "ST") dynamicDisplay.text = `${today.adjusted.steps}`;
    if (statDisplay == "DI") dynamicDisplay.text = `${(today.adjusted.distance * 0.0006213712).toFixed(2)}`;
    if (statDisplay == "FL") dynamicDisplay.text = `${today.adjusted.elevationGain}`;
    if (statDisplay == "CA") dynamicDisplay.text = `${today.adjusted.calories}`;
    if (statDisplay == "ZO") dynamicDisplay.text = `${today.adjusted.activeZoneMinutes.total}`;
    if (statDisplay == "HR") dynamicDisplay.text = `${hrm.heartRate}`;
  }
  else statDisplay = "BA";
  if (statDisplay == "BA") dynamicDisplay.text = `${battery.chargeLevel}%`;

  let scanner = document.getElementsByClassName("wew");
  for(let segment = 1; segment < 9; segment++) {
    scanner[segment - 1].style.opacity = Math.min((battery.chargeLevel / 100) / segment * 8, 1);
  }
}

for(let element in sideButtons) { 
  sideButtons[element].addEventListener("click", (evt) => {
    statDisplay = sideButtons[element].id;
    updateDisplay();
  });
}

pursuit.addEventListener("click", (evt) => {
  if(statDisplay == "ST") statDisplay = "DI";
  else if(statDisplay == "DI") statDisplay = "FL";
  else if(statDisplay == "FL") statDisplay = "CA";
  else if(statDisplay == "CA") statDisplay = "ZO";
  else if(statDisplay == "ZO") statDisplay = "HR";
  else if(statDisplay == "HR") statDisplay = "WE";
  else if(statDisplay == "WE") statDisplay = "BA";
  else if(statDisplay == "BA") statDisplay = "ST";
  updateDisplay();
});

voiceAnimate.addEventListener("click", (evt) => {
    primaryDisplay.style.visibility = "hidden";
    altDisplay.style.visibility = "visible";
});
altDisplay.addEventListener("click", (evt) => {
    altDisplay.style.visibility = "hidden";
    primaryDisplay.style.visibility = "visible";
});

voiceAnimate.animate("enable");

clock.granularity = "seconds";
clock.ontick = (evt) => {
  let now = evt.date;
  let hours = now.getHours();
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  let mins = util.zeroPad(now.getMinutes());
  let secs = util.zeroPad(now.getSeconds());
  timeDisplay.text = `${hours}:${mins}:${secs}`;
  dateDisplay.text = `${now.getMonth() + 1}/${now.getDate()}/${now.getYear() + 1900}`;
  timeDisplayAlt.text = `${hours}:${mins}:${secs}`;
  dateDisplayAlt.text = `${now.getMonth() + 1}/${now.getDate()}/${now.getYear() + 1900}`;

  updateDisplay();
}
