export function shuffleArray(arr) {
  var i = arr.length,
    temp,
    index;
  while (i > 0) {
    index = Math.floor(Math.random() * i);
    i--;
    temp = arr[i];
    arr[i] = arr[index];
    arr[index] = temp;
  }
  return arr;
}
export function Timer(callback, delay) {
  var timerId,
    start,
    active = true,
    remaining = delay;

  this.pause = function() {
    active = false;
    window.clearTimeout(timerId);
    remaining -= new Date() - start;
  };

  this.resume = function() {
    start = new Date();
    active = true;
    window.clearTimeout(timerId);
    timerId = window.setTimeout(callback, remaining);
  };
  this.isActive = function() {
    return active;
  };

  this.resume();
}
export function RecurringTimer(callback, delay) {
  var timerId,
    start,
    active = true,
    remaining = delay;

  this.pause = function() {
    active = false;
    window.clearTimeout(timerId);
    remaining -= new Date() - start;
  };
  this.clear = function() {
    active = null;
    window.clearTimeout(timerId);
  };
  this.resume = function() {
    if (!active) {
      run();
      active = true;
    }
  };
  this.isActive = function() {
    return active;
  };
  var run = function() {
    start = new Date();
    timerId = window.setTimeout(function() {
      remaining = delay;
      run();
      callback();
    }, remaining);
  };

  run();
}
var logIndex = 0;
export function Log(obj) {
  logIndex++;
  console.log("LOG " + logIndex + ":____________________________________");
  for (let prop in obj) {
    console.log(prop + " == ", obj[prop]);
  }
  console.log("____________________________________");
}
