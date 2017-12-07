document.addEventListener('DOMContentLoaded', function(){ // Аналог $(document).ready(function(){
  /*
  // Если должен быть найден один элемент
  if((e = document.querySelector("#form_error_message_frontend + div > div:last-child label")) !== null)
    e.classList.add('last'); // Аналог выборки и присвоения класса
  // Если элементов будет много
  Array.prototype.forEach.call(document.querySelectorAll("#form_error_message_frontend + div > div:last-child label"), function(e){
   e.classList.add('last');
  });
  */
  let controlElementId = 'timeOutEnabled';
  let checkbox = document.getElementById(controlElementId);
  let _actionByCheckBox = (checked) => {
    console.log();
    switch(checked){
      case true: POLLING_CALL(controlElementId); break;
      default: console.info(`Switched off. Polling was not called.`); break;
    }
  };
  // need to set the handler to checkbox:
  if ("onpropertychange" in checkbox) {// for old IE
    checkbox.onpropertychange = function() {
      if (event.propertyName == "checked") {
        _actionByCheckBox(checkbox.checked);
      }
    };
  } else {// for others browsers
    checkbox.onchange = function() { _actionByCheckBox(checkbox.checked) };
  }
});

// REQUEST
let _xhr = new XMLHttpRequest();
let _setTestHeaders = (r) => {
  r.setRequestHeader("Accept-Language", "en-US,en;q=0.8");
  r.setRequestHeader("Host", "headers.jsontest.com");
  r.setRequestHeader("Accept-Charset", "ISO-8859-1,utf-8;q=0.7,*;q=0.3");
  r.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
};
let request = function() {
  document.getElementById('resultTable').innerHTML = '<span>Loading...</span>';
  _xhr.open('GET', 'http://validate.jsontest.com/?json={"key":"value"}', false);
  _setTestHeaders(_xhr);
  _xhr.send();
  switch(_xhr.status){
    case 200:
      console.table( JSON.parse(_xhr.responseText) );
      document.getElementById('resultTable').innerHTML = '<span>Table should be rebuilt.</span>';
      //...
      break;
    default:// as error handler
      console.log( _xhr.status + ': ' + _xhr.statusText );
      document.getElementById('resultTable').innerHTML = '<span>Failed.</span>';
      break;
  };
  return false;
};

// POLLING WITH PROMISE. Read more: https://davidwalsh.name/javascript-polling
let _polling = (fn, timeout=3100, interval=1000) => {
  let endTime = Number(new Date()) + timeout;
  let checkConditions = function(resolve, reject) {
    // if the condition is met, we're done!
    let result = fn();
    if(result) {
      resolve(result);
    }
    // if the condition isn't met but the timeout hasn't elapsed, go again
    else if (Number(new Date()) < endTime) {
      setTimeout(checkConditions, interval, resolve, reject);
    }
    // didn't match and too much time, reject!
    else {
      reject(new Error('timed out for ' + fn + ': ' + arguments));
    }
  };
  return new Promise(checkConditions);
};
let POLLING_CALL = (controlElementId) => {
  _polling(request)
    .then(function() {// arg fn is resolved - WHY DOES IT NEVER CALLED?
      console.log('Done.');
    })
    .catch(function(err) {// arg fn rejected
      console.log(`Fail: ${err}`);
      let checkbox = document.getElementById(controlElementId);
      checkbox.checked = false;
    document.getElementById('resultTable').innerHTML = '<span>Cleared.</span>';
    });
};
