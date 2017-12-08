document.addEventListener('DOMContentLoaded', function(){ // Аналог $(document).ready(function(){
  let controlElementId = 'timeOutEnabled';
  let checkbox = document.getElementById(controlElementId);
  let _actionByCheckBox = (checked) => {
    startPollingByConditions(() => {return (checkbox.checked);});
  };
  // need to set the handler to checkbox:
  checkbox.onchange = function() { _actionByCheckBox(checkbox.checked) };
});

let myAsyncRequest = (url) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => resolve(JSON.parse(xhr.responseText));// JSON should be received by server!
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
}


/*
myAsyncRequest('http://validate.jsontest.com/?json={"key":"value"}')
  .then((data) => {
    console.table(data);
  })
  .catch((err) => {
    console.err(err);
  });
*/

/*
function startPollingByConditions (toBeOrNotToBe, url = 'http://validate.jsontest.com/?json={"key":"value"}', interval = 3000) {
  if (toBeOrNotToBe ()) {
    setTimeout (() => {
      myAsyncRequest(url)
        .then((data) => {
          console.table(data);
          startPollingByConditions (toBeOrNotToBe, url, interval);
        })
        .catch((err) => {
          console.error(err);
          startPollingByConditions (toBeOrNotToBe, url, interval);
        });
    }, interval);
  }
}
*/

function startPollingByConditions (toBeOrNotToBe, url = 'http://validate.jsontest.com/?json={"key":"value"}', interval = 3000) {
  if (toBeOrNotToBe ()) {
    myAsyncRequest(url)
      .then((data) => {
        console.table(data);
        setTimeout (() => {
          startPollingByConditions (toBeOrNotToBe, url, interval);
        }, interval);
      })
      .catch((err) => {
        console.error(err);
        setTimeout (() => {
          startPollingByConditions (toBeOrNotToBe, url, interval);
        }, interval);
      });
  }
}

//startPollingByConditions ();
