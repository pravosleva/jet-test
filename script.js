let _setCustomResult = (arg) => {
  let { msg, bgColor='#D1B37D', color='black' } = arg;
  //document.getElementById('resultTable').innerHTML = '<strong>' + msg + '</strong>';
  //document.getElementById('resultTable').style.background = bgColor;
  //document.getElementById('resultTable').style.color = color;
  document.getElementById('status').innerHTML = '<strong>' + msg + '</strong>';
  document.getElementById('status').style.background = bgColor;
  document.getElementById('status').style.color = color;
};

function onCheckBoxChange (checkBox) {
  let callbackAsResolve = (jetsArr) => {
    //console.table(jetsArr);
    document.getElementById('resultTable').innerHTML = _getTableHTML(jetsArr);
    document.getElementById('resultTable').style.background = '#69ADA4';//#748CB5
    document.getElementById('resultTable').style.color = 'white';
    document.getElementById('reportTime').innerHTML = new Date();
    _setCustomResult({ msg: 'Received.', bgColor: '#69ADA4', color: 'white' });
  },
  callbackAsReject = (err) => {
    //console.error(err);
    //document.getElementById('resultTable').innerHTML = '<strong>Error: ' + (err || 'Trying to reconnect...') + '</strong>';
    //document.getElementById('resultTable').style.background = '#ee5f5b';
    //document.getElementById('resultTable').style.color = 'white';
    document.getElementById('status').innerHTML = '<strong>Error: ' + (err || 'Trying to reconnect...') + '</strong>';
    document.getElementById('status').style.background = '#ee5f5b';
    document.getElementById('status').style.color = 'white';
  };
  if (checkBox.checked) {
    var switched_ON = true;
    _setCustomResult({ msg: 'Connection...' });
    var handlerForCheckBox = (event) => {
      if (!checkBox.checked) {
        switched_ON = false;
        _setCustomResult({ msg: 'Polling switched off...', bgColor: '#69ADA4', color: 'white' });
        checkBox.removeEventListener('change', handlerForCheckBox);
      } else { /* nothing */ }
    };
    checkBox.addEventListener ("change", handlerForCheckBox);
    startPollingByConditions ({
      url: 'https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48',
      /* response example:
        {"full_count":9550,"version":4,"fcc280c":["424599",55.7655,34.3593,257,34000,436,"1541","F-UUWW2","A320","VQ-BSL",1512972705,"SVO","BUD","SU2032",0,64,"AFL2032",0]
      */
      toBeOrNotToBe: () => switched_ON,
      interval: 3000,
      callbackAsResolve,
      callbackAsReject
    });
  } else { _setCustomResult({ msg: 'Polling switched off...', bgColor: '#69ADA4', color: 'white' }); };
}

function myAsyncRequest (url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => resolve(JSON.parse(xhr.responseText));
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
}

function myTimeoutPromise (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

function startPollingByConditions (arg) {
  let { url, toBeOrNotToBe, interval, callbackAsResolve, callbackAsReject } = arg;
  console.log ("startPollingByConditions ()", url, toBeOrNotToBe(), interval);
  _setCustomResult({ msg: 'Loading...' });
  if (toBeOrNotToBe()) {
    myAsyncRequest (url)
      .then (
        function (result){
          console.log (`startPollingByConditions () is done.`);
          callbackAsResolve(result);
          return (myTimeoutPromise (interval));
        },
        function(){
          callbackAsReject(`startPollingByConditions () is failed: Trying to reconnect...`);
          return (myTimeoutPromise (interval));
        }
      )
      .then (function (){
        console.log (`startPollingByConditions () was called again...`);
        startPollingByConditions ({ url, toBeOrNotToBe, interval, callbackAsResolve, callbackAsReject });
      })
      .catch (function (err) {
        console.log (`startPollingByConditions () is failed! Nothing else.`);
        //callbackAsReject(`startPollingByConditions () is failed: Trying to reconnect...`);
        //startPollingByConditions ({ url, toBeOrNotToBe, interval, callbackAsResolve, callbackAsReject });
      });
  } else { _setCustomResult({ msg: 'Polling stopped.' }); }
}

// fn to detect the distance between two points
let getDistanceBetween2PointsOnSphere = (coordinatesObj1, coordinatesObj2, r=6371, h=4000) => {
  let { lat: lat1, lon: lon1 } = coordinatesObj1,
    { lat: lat2, lon: lon2 } = coordinatesObj2,
    pi = Math.PI;
  // need to convert to radians:
  lat1 = lat1*pi/180;
  lat2 = lat2*pi/180;
  lon1 = lon1*pi/180;
  lon2 = lon2*pi/180;
  return (
    r * Math.acos( Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon1-lon2) )
  );
}

function _getTableHTML(jetsObj) {
  /*
    TODO:
    [1, 2] coordinates
    [3] vector, grad
    [4] height, ft
    [5] speed, kh
    [11, 12] airport codes (from/to)
    [13, 16] flight number
  */
  // need to sort jets by distance
  let airportCoordinates = { lat: 55.410307, lon: 37.902451 };
  let jetsOnly = [];
  for(propName in jetsObj){
    if (jetsObj[propName] instanceof Array) {
      //console.log(jetsObj[propName]);
      jetsObj[propName].push( getDistanceBetween2PointsOnSphere(
        airportCoordinates,
        { lat: jetsObj[propName][1], lon: jetsObj[propName][2] },
        // height should be sent too!
      ) );
      jetsOnly.push(jetsObj[propName]);
    }
  }
  // 19th elements

  // new variable is unnessesary
  jetsOnly.sort((element1, element2) => {
    return element1[18] - element2[18]
  });
  //console.log(jetsOnly);

  // so, jets array was sorted by compare function which was received as argument...
  let html = "<table><thead>" +
    "<tr>" +
    "<th>Coords</th>" +
    "<th class='sm-hidden'>Speed, km/h</th>" +
    "<th class='sm-hidden'>Vector, deg</th>" +
    "<th class='sm-hidden'>Height, m</th>" +
    "<th>From-To</th>" +
    "<th class='sm-hidden'>Flight number</th>" +
    "<th>Dist., km</th>" +
  "</tr>";
  html += '</thead>';
  html += '<tbody>';
  /*
    SO:
    [1, 2] coordinates
    [5] speed, kh= x1.852 km/h
    [3] vector, grad (could be got val from 0 to 360)
    [4] height, ft= x0.0003048 km= x0.3048 km
    [11, 12] airport codes (from/to)
    [13, 16] flight number
  */
  for (jetNum in jetsOnly) {
    html += "<tr>" +
      "<td>" + jetsOnly[jetNum][1] + ", " + jetsOnly[jetNum][2] + "</td>" +
      "<td class='sm-hidden'>" + (jetsOnly[jetNum][5]*1.852).toFixed(0) + "</td>" +
      "<td class='sm-hidden'>" + jetsOnly[jetNum][3] + "</td>" +
      "<td class='sm-hidden'>" + (jetsOnly[jetNum][4]*0.3048).toFixed(0) + "</td>" +
      "<td>" + (String(jetsOnly[jetNum][11]) || 'N/A') + "-" + (jetsOnly[jetNum][12] || 'N/A') + "</td>" +
      "<td class='sm-hidden'>" + (jetsOnly[jetNum][13] || 'N/A') + " / " + (jetsOnly[jetNum][16] || 'N/A') + "</td>" +
      "<td>" + jetsOnly[jetNum][18].toFixed(0) + "</td>" +
    "</tr>";
  };
  html += '</tbody></table>';
  return html;
}
