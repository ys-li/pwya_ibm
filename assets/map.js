const getRippleHtml = (x = 0, y = 0) => `<div class="map-ripple" style="top:${y}px;left:${x};"><svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-ripple"><circle cx="50" cy="50" r="36.2267" fill="none"   stroke="#b81e0b" stroke-width="4"><animate attributeName="r" calcMode="spline" values="0;50" keyTimes="0;1" dur="1" keySplines="0 0.2 0.8 1" begin="-0.5s" repeatCount="indefinite"></animate><animate attributeName="opacity" calcMode="spline" values="1;0" keyTimes="0;1" dur="1" keySplines="0.2 0 0.8 1" begin="-0.5s" repeatCount="indefinite"></animate></circle><circle cx="50" cy="50" r="8.88485" fill="none" stroke="#f06022" stroke-width="4"><animate attributeName="r" calcMode="spline" values="0;50" keyTimes="0;1" dur="1" keySplines="0 0.2 0.8 1" begin="0s" repeatCount="indefinite"></animate><animate attributeName="opacity" calcMode="spline" values="1;0" keyTimes="0;1" dur="1" keySplines="0.2 0 0.8 1" begin="0s" repeatCount="indefinite"></animate></circle></svg></div>`

function initMap () {
  const canvas = document.getElementById("overlay-canvas");
  const mapBase = $('#map')
  const mapHoverInfo = $('#map .map-hover-info')

  function updateMapHoverInfo ({ zoneId, damageRate, needed }) {
    mapHoverInfo.html(`Damage area <strong>#${zoneId}</strong><br><strong>${(damageRate * 100).toFixed(1)}%</strong> broken<br>${Object.keys(needed).filter(k => needed[k]).map(k => `<span class="tag">${k[0].toUpperCase() + k.slice(1).toLowerCase()}</span>`).join('')}`)
  }

  var width = canvas.width;
  var height = canvas.height;
  console.log(width, height);
  const ctx = canvas.getContext("2d");
  // ctx.imageSmoothingEnabled = false;
  // clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // second per frame
  const secondPerFrame = 0.033;

  // init drone objects
  const num_drones = 0;
  const drones = [];
  // const dronesInitPosition = [];
  const deployNewDrone = (id, x, y) => {
    const imgTag = new Image();
    imgTag.src = "./assets/drone.png";

    drones.push({
      id: id,
      image: imgTag,
      x: x,
      y: y,
      width: 30,
      height: 30,
      speed: 50, // pixel per second
      xGoal: x,
      yGoal: y,
      selected: false,
      assignedLocationId: null,
      currentTargetPositionIndex: 0,
      assignedPositions: [],
    });
    document.getElementById('msg-box1').innerText = (`Drone Deployed: ${drones.length}`);
  };

  const damagedLocations = [];
  const setDamagedLocation = (x, y) => {
    const imgTag = new Image();
    imgTag.src = "./assets/alert.png";
    const id = damagedLocations.length
    damagedLocations.push({
      id,
      x: x,
      y, y,
      image: imgTag,
      width: 30,
      height: 30,
      assignedDroneId: null,
      zoneId: id + 1,
      damageRate: Math.random(),
      needed: {
        meds: Math.random() > 0.5,
        search: Math.random() > 0.5,
        drone: Math.random() > 0.5,
        build: Math.random() > 0.5,
      },
    });
    console.log(x, y, damagedLocations);

    mapBase.append(getRippleHtml(x, y))
    const ripple = mapBase.find('.map-ripple').last()
    ripple.mouseenter(function () {
      updateMapHoverInfo(damagedLocations[id])
    })
    ripple.mousemove(function (e) {
      const offset = window.innerWidth / 2 < e.screenX ? 200 : 0
      mapHoverInfo.css('top', e.offsetY + y)
      mapHoverInfo.css('left', e.offsetX + x - offset)
    })
    ripple.mouseleave(function (e) {
      mapHoverInfo.css('top', -9999)
      mapHoverInfo.css('left', -9999)
    })
  };

  // drone control listener
  const getCursorPosition = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return [x, y];
  };

  let mousedown = false;
  let dragging = false;
  let xSelectionStart = -10;
  let ySelectionStart = -10;
  let xSelectionEnd = -10;
  let ySelectionEnd = -10;

  canvas.addEventListener('mousedown', (e) => {
    const position = getCursorPosition(canvas, e);
    console.log(e.which, e.ctrlKey);
    switch (e.which) {
      case 3: // right click
        // instruct drones fly to that location
        console.log(`Selected Location ${position}`);
        for (let drone of drones) {
          if (drone.selected) {
            drone.xGoal = position[0];
            drone.yGoal = position[1];
          }
        }
        break;
      case 1: // left click
        if (e.ctrlKey) {
          // deploy new drone
          console.log('deploy');
          deployNewDrone(drones.length, position[0], position[1]);
        }
        if (e.shiftKey) {
          setDamagedLocation(position[0], position[1]);
        } else {
          // update selection
          xSelectionStart = position[0];
          ySelectionStart = position[1];
          mousedown = true;
          let count = 0;
          for (let drone of drones) {
            drone.selected = false;
            const clickDistance = Math.sqrt(Math.pow(drone.x - position[0], 2) + Math.pow(drone.y - position[1], 2));
            if (clickDistance <= drone.width) {
              drone.selected = true;
              count++;
              break
            }
          }

          console.log(`Selected number of Drones ${count}`);
          document.getElementById('msg-box2').innerText = (`Drone Selected: ${count}`);
        }
        break;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (mousedown) {
      const position = getCursorPosition(canvas, e);
      dragging = true;
      xSelectionEnd = position[0];
      ySelectionEnd = position[1];
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    if (dragging) {
      const selectionRectX = Math.min(xSelectionStart, xSelectionEnd);
      const selectionRectY = Math.min(ySelectionStart, ySelectionEnd);
      const selectionRectWidth = Math.abs(xSelectionEnd - xSelectionStart);
      const selectionRectHeight = Math.abs(ySelectionEnd - ySelectionStart);

      let count = 0;
      for (let drone of drones) {
        drone.selected = false;
        console.log(drone.x, (selectionRectX + selectionRectWidth), drone.x >= selectionRectX && drone.x <= (selectionRectX + selectionRectWidth))
        if (drone.x >= selectionRectX && drone.x <= (selectionRectX + selectionRectWidth) &&
          drone.y >= selectionRectY && drone.y <= (selectionRectY + selectionRectHeight)
        ) {
          drone.selected = true;
          count++;
        }
      }
      console.log(`Selected number of Drones ${count}`);
      document.getElementById('msg-box2').innerText = (`Drone Selected: ${count}`);

      dragging = false;
      xSelectionStart = -10;
      xSelectionEnd = -10;
      ySelectionStart = -10;
      ySelectionEnd = -10;
    }
    mousedown = false;
  });


  const calculateFrame = () => {
    // assign task
    for (let location of damagedLocations) {
      if (location.assignedDroneId !== null)
        continue;
      let min = Number.MAX_SAFE_INTEGER;
      let minDroneId = null;
      for (let drone of drones) {
        const distance = Math.sqrt(Math.pow(drone.x - location.x, 2) + Math.pow(drone.y - location.y, 2));
        if (distance <= min && drone.assignedLocationId == null) {
          min = distance;
          minDroneId = drone.id;
        }
      }
      if (minDroneId !== null) {
        drones[minDroneId].assignedLocationId = location.id;
        drones[minDroneId].assignedPositions = [
          [location.x - 30, location.y - 30],
          [location.x - 30, location.y + 30],
          [location.x + 30, location.y + 30],
          [location.x + 30, location.y - 30]
        ];
        drones[minDroneId].currentTargetPositionIndex = 0;
        location.assignedDroneId = minDroneId;
      }
    }


    // calculate drones' values
    for (let drone of drones) {
      if (drone.assignedLocationId !== null) {
        const targetPosition = drone.assignedPositions[drone.currentTargetPositionIndex];
        // console.log(drone.currentTargetPositionIndex);
        drone.xGoal = targetPosition[0];
        drone.yGoal = targetPosition[1];
      }
      let goalDistance = Math.sqrt(Math.pow(drone.x - drone.xGoal, 2) + Math.pow(drone.y - drone.yGoal, 2));

      if (goalDistance >= 2) {
        // calculate the drone movement
        const nextDistance = drone.speed * secondPerFrame;
        const similarRatio = nextDistance / goalDistance;
        const nextXStep = similarRatio * (Math.abs(drone.xGoal - drone.x));
        const nextYStep = similarRatio * (Math.abs(drone.yGoal - drone.y));

        if (drone.x < drone.xGoal) {
          drone.x = drone.x + nextXStep;
        } else {
          drone.x = drone.x - nextXStep;
        }
        if (drone.y < drone.yGoal) {
          drone.y = drone.y + nextYStep;
        } else {
          drone.y = drone.y - nextYStep;
        }
      } else if (drone.assignedLocationId !== null) {
        if (drone.currentTargetPositionIndex !== 3)
          drone.currentTargetPositionIndex += 1;
        else
          drone.currentTargetPositionIndex = 0;
      }
    }
  };

  const renderFrame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // clear canvas

    if (dragging) {
      // render selection
      const selectionRectX = Math.min(xSelectionStart, xSelectionEnd);
      const selectionRectY = Math.min(ySelectionStart, ySelectionEnd);
      const selectionRectWidth = Math.abs(xSelectionEnd - xSelectionStart);
      const selectionRectHeight = Math.abs(ySelectionEnd - ySelectionStart);
      ctx.beginPath();
      ctx.rect(selectionRectX, selectionRectY, selectionRectWidth, selectionRectHeight);
      ctx.strokeStyle = '#333333';
      ctx.stroke();
    }

    // render drones
    for (let drone of drones) {
      if (drone.selected) {
        ctx.beginPath();
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(drone.x - drone.width / 2, drone.y + drone.height / 2, drone.width, 2);
        ctx.stroke();
      }
      ctx.drawImage(drone.image, drone.x - drone.width / 2, drone.y - drone.height / 2, drone.width, drone.height);     // draw image at current position
      const goalDistance = Math.sqrt(Math.pow(drone.x - drone.xGoal, 2) + Math.pow(drone.y - drone.yGoal, 2));
      if (goalDistance >= 2) {
        // render drone target line
        ctx.beginPath();
        ctx.moveTo(drone.x, drone.y);
        ctx.lineTo(drone.xGoal, drone.yGoal);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
      }
    }

    // render damaged location
    for (let location of damagedLocations) {
      ctx.drawImage(location.image, location.x - location.width / 2, location.y - location.height / 2, location.width, location.height)
    }
  };

  const runFrame = () => {
    // console.log('run');
    calculateFrame();
    renderFrame();
  };

  // 1000 = 1 second, 30 fps -> 0.033s per frame
  setInterval(runFrame, 33);
}
