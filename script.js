document.addEventListener('DOMContentLoaded', function(){ // Аналог $(document).ready(function(){
  let controlElementId = 'timeOutEnabled';
  let checkbox = document.getElementById(controlElementId);
  let _actionByCheckBoxChange = (checked) => {
    startPollingByConditions(() => {return (checkbox.checked);});
  };
  // need to set the handler to checkbox:
  checkbox.onchange = function() { _actionByCheckBoxChange(checkbox.checked) };
});

let myAsyncRequest = (url) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => resolve(JSON.parse(xhr.responseText));// JSON should be received by server!
    xhr.onerror = () => reject(`Error of the myAsyncRequest (): ${xhr.statusText || 'xhr.statusText is nothing'}`);
    xhr.send();
  });
}

function _delay (ms=3000) {
  return new Promise((res, rej) => {
    if (true) { setTimeout(res, ms); } else { rej(); }
  });
}

function startPollingByConditions (toBeOrNotToBe, url='http://validate.jsontest.com/?json={"key":"value"}') {
  if (toBeOrNotToBe ()) {
    document.getElementById('resultTable').innerHTML = '<span>Loading...</span>';
    myAsyncRequest(url)
      .then((data) => {
        // do smthn with data...
        console.table(data);
        document.getElementById('resultTable').innerHTML = '<span>Table updated.</span>';
        // next polling session...
        _delay()
          .then(() => { startPollingByConditions (toBeOrNotToBe, url); })
          .catch((err) => { console.log(`startPollingByConditions () was not called: ${err}`); });
      })
      .catch((err) => {
        // err handler
        console.error(err);
        document.getElementById('resultTable').innerHTML = '<span>Error: ' + err + '</span>';
        // next polling session...
        _delay()
          .then(() => { startPollingByConditions (toBeOrNotToBe, url); })
          .catch((err) => { console.log(`startPollingByConditions () was not called: ${err}`); });
      });
  } else {
    console.log(`myAsyncRequest () was not called. Check the conditions...`);
    document.getElementById('resultTable').innerHTML = '<span>Polling switched off.</span>';
  }
}
