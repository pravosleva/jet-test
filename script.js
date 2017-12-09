function onCheckBoxChange (checkBox) {
  if (checkBox.checked) { // Запускаем поллинг, только если галочка нажата
    var flag = true;  // Флаг уйдёт в замыкание, его будет возвращать toBeOrNotToBe
    /*
      В handler будет функция которая будет добавлена в обработчики события "change"
      чекбокса. Когда галочка будет снята, она поменяет flag на false и уберёт себя
      из обработчиков события.
    */
    var handler = function(event) {
      if (!checkBox.checked) { /* на самом деле эта проверка не
                                  нужна, потому что мы знаем, что
                                  checkBox.checked было true,
                                  когда добавляли обработчик,
                                  значит теперь оно может быть
                                  только false. */
        flag = false;
        checkBox.removeEventListener('change', handler);
        document.getElementById('resultTable').innerHTML = '<span>Polling switched off.</span>';
        document.getElementById('resultTable').style.background = 'yellow';
        document.getElementById('resultTable').style.color = 'black';
      }
    };
    checkBox.addEventListener ("change", handler);
    startPolling ({
      url: 'http://selection4test.ru:1111/jetsArray',
      toBeOrNotToBe: () => { return (flag); },
      interval: 3000
    });
  }
}

/*
  Это XMLHttpRequest завёрнутый в промис, прямо с сайта Mozilla.
  myAsyncRequest возвращает промис.
*/
function myAsyncRequest (url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => resolve(JSON.parse(xhr.responseText));
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
}

/*
  Это setTimeout завёрнутый в промис.
  myTimeoutPromise возвращает промис.
*/
function myTimeoutPromise (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(function(){resolve();}, ms);
  });
}

/*
  Эта функция запускает поллинг по адресу url с интервалом interval в мс, и
  остановится только тогда, когда toBeOrNotToBe вернёт false.
  В случае успешного запроса она выводит его в консоль (а надо бы, наверное,
  передать ещё один параметр - коллбэк, которому передавался бы результат
  успешного запроса).
*/
function startPolling (arg) {
  let { url, toBeOrNotToBe, interval } = arg;
  console.log ("startPolling ()", url, toBeOrNotToBe(), interval);
  if (toBeOrNotToBe()) {
    myAsyncRequest (url)
      .then (function (result){ // Запрос прошёл успешно
        console.table(result);
        document.getElementById('resultTable').innerHTML = _getTableHTML(result);
        document.getElementById('resultTable').style.background = '#374c6b';
        document.getElementById('resultTable').style.color = 'white';
        document.getElementById('reportTime').innerHTML = new Date();
        return (myTimeoutPromise (interval));
      })
      .then (function (){ // Таймаут сработал
        startPolling ({ url, toBeOrNotToBe, interval });
      })
      .catch (function (err) {
        /* Ошибка могла возникнуть только у XMLHttpRequest, так как
        у setTimeout ошибок не бывает. Ошибка XMLHttpRequest означает
        проблемы с сетью или с сервером, но поллинг можно продолжить,
        если считать, что проблемы временные. */
        console.log ("An error occured.");
        document.getElementById('resultTable').innerHTML = '<span>Error: ' + err + '</span>';
        document.getElementById('resultTable').style.background = 'red';
        document.getElementById('resultTable').style.color = 'white';
        // Поллинг продолжается.
        startPolling ({ url, toBeOrNotToBe, interval });
      });
  }
}

/*
  Это setTimeout завёрнутый в промис.
  myTimeoutPromise возвращает промис.
*/
function myTimeoutPromise (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(function(){resolve();}, ms);
  });
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
