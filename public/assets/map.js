const getRippleHtml = (x = 0, y = 0) => `<div class="map-ripple" style="top:${y}px;left:${x};"><svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-ripple"><circle cx="50" cy="50" r="36.2267" fill="none"   stroke="#b81e0b" stroke-width="4"><animate attributeName="r" calcMode="spline" values="0;50" keyTimes="0;1" dur="1" keySplines="0 0.2 0.8 1" begin="-0.5s" repeatCount="indefinite"></animate><animate attributeName="opacity" calcMode="spline" values="1;0" keyTimes="0;1" dur="1" keySplines="0.2 0 0.8 1" begin="-0.5s" repeatCount="indefinite"></animate></circle><circle cx="50" cy="50" r="8.88485" fill="none" stroke="#f06022" stroke-width="4"><animate attributeName="r" calcMode="spline" values="0;50" keyTimes="0;1" dur="1" keySplines="0 0.2 0.8 1" begin="0s" repeatCount="indefinite"></animate><animate attributeName="opacity" calcMode="spline" values="1;0" keyTimes="0;1" dur="1" keySplines="0.2 0 0.8 1" begin="0s" repeatCount="indefinite"></animate></circle></svg></div>`

function initMap() {
    const canvas = document.getElementById("overlay-canvas");
    const mapBase = $('#map')
    const mapImg = document.getElementById('map-img')
    const mapHoverInfo = $('#map .map-hover-info')
    const droneStatusBase = $('#drone-status-base')
    const planButton = $('.summary-button-plan')
    const droneNumberInput = $('#input-drone-number')
    const medNumberInput = $('#input-med-number')

    function updateMapHoverInfo({zoneId, damageRate, needed}) {
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
    const deployNewDrone = (x, y) => {
        const id = drones.length
        const imgTag = new Image();
        imgTag.src = "./assets/drone.png";

        const droneId = id + 1;
        drones.push({
            id,
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
            battery: Math.random() * 50 + 50,
        });
        document.getElementById('msg-box1').innerText = drones.length;

        const droneMode = Math.random() > 0.5 ? 'Cellular' : 'P2P'
        droneStatusBase.append(`<div class="drone-block"><h2 class="drone-name">Drone #${droneId}</h2><div class="drone-status">Status: <strong class="drone-status-text">Idle</strong></div><div class="drone-mode">Model: <strong>${droneMode}</strong></div><div class="drone-battery-container">Battery: <strong><span class="drone-battery"></span></strong></div><div class="drone-scan"><h3 class="drone-scan-name">Area:</h3><div class="drone-scan-img"></div></div></div>`)
        const drone$ = droneStatusBase.find('.drone-block').last()
        drones[id].statusText$ = drone$.find('.drone-status-text')
        drones[id].areaImg$ = drone$.find('.drone-scan-img')
        drones[id].battery$ = drone$.find('.drone-battery')
        drones[id].mode$ = drone$.find('.drone-mode')
    };

    const damagedLocations = [];
    const setDamagedLocation = (x, y) => {
        const imgTag = new Image();
        imgTag.src = "./assets/alert.png";
        const id = damagedLocations.length;
        damagedLocations.push({
            id,
            x: x,
            y, y,
            image: imgTag,
            width: 30,
            height: 30,
            assignedDroneId: null,
            assignedMedicalId: null,
            pathToMedicalStation: [],
            zoneId: id + 1,
            damageRate: Math.random(),
            needed: {
                meds: Math.random() > 0.5,
                search: Math.random() > 0.5,
                drone: Math.random() > 0.5,
                build: Math.random() > 0.5,
            },
        });

        mapBase.append(getRippleHtml(x, y));
        const ripple = mapBase.find('.map-ripple').last();
        ripple.mouseenter(function () {
            updateMapHoverInfo(damagedLocations[id])
        });
        ripple.mousemove(function (e) {
            const offset = window.innerWidth / 2 < e.screenX ? 200 : 0
            mapHoverInfo.css('top', e.offsetY + y);
            mapHoverInfo.css('left', e.offsetX + x - offset)
        });
        ripple.mouseleave(function (e) {
            mapHoverInfo.css('top', -9999)
            mapHoverInfo.css('left', -9999)
        })
    };

    const medicalStations = [];
    const setMedicalStation = (x, y) => {
        const imgTag = new Image();
        imgTag.src = "./assets/medical-vector-2.png";
        const id = medicalStations.length;
        medicalStations.push({
            id: id,
            x: x,
            y: y,
            width: 30,
            height: 30,
            image: imgTag,
        });
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
                    deployNewDrone(position[0], position[1]);
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
                    document.getElementById('msg-box2').innerText = count;
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
            document.getElementById('msg-box2').innerText = count

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

                if (drones[minDroneId].statusText$) {
                    drones[minDroneId].statusText$.html('Scanning')
                }
            }
        }

        for (let location of damagedLocations) {
            if (location.assignedMedicalId !== null)
                continue;
            let min = Number.MAX_SAFE_INTEGER;
            let minStationId = null;
            for (let station of medicalStations) {
                const distance = Math.sqrt(Math.pow(station.x - location.x, 2) + Math.pow(station.y - location.y, 2));
                if (distance <= min) {
                    min = distance;
                    minStationId = station.id;
                }
                location.assignedMedicalId = minStationId;
                station = medicalStations[minStationId];

                location.pathToMedicalStation = [];
                let x_bound = station.x;
                let y_bound = station.y;
                for (let i = 0; i < 1; i++) {
                    const x_max = Math.max(location.x, x_bound);
                    const x_min = Math.min(location.x, x_bound);
                    const y_max = Math.max(location.y, y_bound);
                    const y_min = Math.min(location.y, y_bound);
                    let x = Math.floor(Math.random() * (x_max - x_min) + x_min);
                    let y = Math.floor(Math.random() * (y_max - y_min) + y_min);
                    location.pathToMedicalStation.push([x, y]);
                    x_bound = x;
                    y_bound = y;
                }

                // pathToMedicalStation
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

            drone.areaImg$.css('background-position', `-${drone.x}px -${drone.y}px`)
            drone.battery -= Math.random() * 0.05
            drone.battery$.css('width', drone.battery + '%')
        }

        // render damaged location
        for (let location of damagedLocations) {
            ctx.drawImage(location.image, location.x - location.width / 2, location.y - location.height / 2, location.width, location.height)

            if (location.assignedMedicalId !== null) {
                ctx.beginPath();
                ctx.moveTo(location.x, location.y);

                for (let point of location.pathToMedicalStation) {
                    ctx.lineTo(point[0], point[1]);
                    ctx.moveTo(point[0], point[1]);
                }
                const station = medicalStations[location.assignedMedicalId];
                ctx.lineTo(station.x, station.y);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#32CD32';
                ctx.stroke();
            }
        }

        // render medical location
        for (let location of medicalStations) {
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

    planButton.click(function (e) {
        for (let i = 0; i < droneNumberInput.val(); i++) {
            setDamagedLocation(Math.random() * 800 + 100, Math.random() * 300 + 100)
        }

        setTimeout(() => {
            const droneNumber = parseInt(droneNumberInput.val()) || 10;
            for (let i = 0; i < droneNumber; i++) {
                let x, y;
                if (Math.random() > 0.5) {
                    x = Math.random() * 50
                    y = Math.random() * 500 + 100
                } else {
                    x = Math.random() * 800 + 100
                    y = Math.random() * 50
                }
                deployNewDrone(x, y)
            }

            setTimeout(() => {
                for (let i = 0; i < medNumberInput.val(); i++) {
                    setMedicalStation(Math.random() * 800 + 100, Math.random() * 300 + 100)
                }
            }, 1000);
        }, 1000);


    })
}
