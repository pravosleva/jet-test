document.addEventListener('DOMContentLoaded', function(){ // Аналог $(document).ready(function(){
  let controlElementId = 'timeOutEnabled';
  let checkbox = document.getElementById(controlElementId);
  let _actionByCheckBoxChange = (checked) => {
    startPollingByConditions({
      toBeOrNotToBe: () => { return (checkbox.checked) },
      url: 'http://localhost:1111/jetsArray'
    });
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

function startPollingByConditions (arg) {
  let { toBeOrNotToBe, url='http://validate.jsontest.com/?json={"key":"value"}' } = arg;
  if (toBeOrNotToBe ()) {
    document.getElementById('resultTable').innerHTML = '<span>Loading...</span>';
    myAsyncRequest(url)
      .then((data) => {
        // do smthn with data...
        console.table(data);
        document.getElementById('resultTable').innerHTML = _getTableHTML(data);
        document.getElementById('resultTable').style.background = '#374c6b';
        document.getElementById('resultTable').style.color = 'white';
        document.getElementById('reportTime').innerHTML = new Date();
        // next polling session...
        _delay()
          .then(() => { startPollingByConditions ({ toBeOrNotToBe, url }); })
          .catch((err) => { console.log(`startPollingByConditions () was not called: ${err}`); });
      })
      .catch((err) => {
        // err handler
        console.error(err);
        document.getElementById('resultTable').innerHTML = '<span>Error: ' + err + '</span>';
        document.getElementById('resultTable').style.background = 'red';
        document.getElementById('resultTable').style.color = 'white';
        // next polling session...
        _delay()
          .then(() => { startPollingByConditions ({ toBeOrNotToBe, url }); })
          .catch((err) => { console.log(`startPollingByConditions () was not called: ${err}`); });
      });
  } else {
    console.log(`myAsyncRequest () was not called. Check the conditions...`);
    document.getElementById('resultTable').innerHTML = '<span>Polling switched off.</span>';
    document.getElementById('resultTable').style.background = 'yellow';
    document.getElementById('resultTable').style.color = 'black';
  }
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
