function onCheckBoxChange (checkBox) {
  if (checkBox.checked) {
    var switched_ON = true;
    var handlerForCheckBox = (event) => {
        if (!checkBox.checked) {
          switched_ON = false;
          checkBox.removeEventListener('change', handlerForCheckBox);
          document.getElementById('resultTable').innerHTML = '<span>Polling switched off.</span>';
          document.getElementById('resultTable').style.background = 'yellow';
          document.getElementById('resultTable').style.color = 'black';
        } else { /* nothing */ }
      },
      callbackAsResolve = (jetsArr) => {
        console.table(jetsArr);
        document.getElementById('resultTable').innerHTML = _getTableHTML(jetsArr);
        document.getElementById('resultTable').style.background = '#374c6b';
        document.getElementById('resultTable').style.color = 'white';
        document.getElementById('reportTime').innerHTML = new Date();
      },
      callbackAsReject = (err) => {
        console.error(err);
        document.getElementById('resultTable').innerHTML = '<span>Error: ' + err + '</span>';
        document.getElementById('resultTable').style.background = 'red';
        document.getElementById('resultTable').style.color = 'white';
      };
    checkBox.addEventListener ("change", handlerForCheckBox);
    startPollingByConditions ({
      url: 'http://selection4test.ru:1111/jetsArray',
      toBeOrNotToBe: () => switched_ON,
      interval: 3000,
      callbackAsResolve,
      callbackAsReject
    });
  }
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
  if (toBeOrNotToBe()) {
    myAsyncRequest (url)
      .then (function (result){
        console.log (`startPollingByConditions () is done.`);
        callbackAsResolve(result);
        return (myTimeoutPromise (interval));
      })
      .then (function (){
        console.log (`startPollingByConditions () was called again...`);
        startPollingByConditions ({ url, toBeOrNotToBe, interval, callbackAsResolve, callbackAsReject });
      })
      .catch (function (err) {
        console.log (`startPollingByConditions () is failed: ${err}`);
        callbackAsReject(err);
        startPollingByConditions ({ url, toBeOrNotToBe, interval, callbackAsResolve, callbackAsReject });
      });
  } else { }
}

// fn to detect the distance between two points
let getDistanceBetween2PointsOnSphere = (coordinatesObj1, coordinatesObj2, r=6371) => {
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

function _getTableHTML(jetsArray) {
  // need to sort jets by distance
  let airportCoordinates = { lat: 55.410307, lon: 37.902451 };
  // each element of jets arr should have his current distance as prop which name will be distanceToAirport
  jetsArray.forEach(function callback(element, index, array) {
    // your iterator should be there
    element.distanceToAirport = getDistanceBetween2PointsOnSphere(airportCoordinates, { lat: element.coordinates.lat, lon: element.coordinates.lon });
  });
  // new variable is unnessesary
  jetsArray.sort((element1, element2) => {
    return element1.distanceToAirport - element2.distanceToAirport
  });
  // so, jets array was sorted by compare function which was received as argument...

  let html = '<table><thead>';
  html += "<tr><th>Flight Number</th><th>Coordinates</th><th>Distance to Airport</th></tr>";
  html += '</thead>';
  html += '<tbody>';

  for (jetNum in jetsArray) {
    html += "<tr>" +
      "<td>" + jetsArray[jetNum].flightNumber + "</td>" +
      "<td>" + JSON.stringify(jetsArray[jetNum].coordinates) + "</td>" +
      "<td>" + jetsArray[jetNum].distanceToAirport.toFixed(2) + "</td>" +
    "</tr>";
  };

  html += '</tbody></table>';
  return html;
}
