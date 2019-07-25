function initControlsAndDataSources () {
  const apps = [{
    name: "Populations",
    image: "icons8-xamarin-100.png"
  },
  {
    name: "Socials",
    image: "icons8-ask.fm-100.png"
  },
  {
    name: "Biometrics",
    image: "icons8-brave-web-browser-100.png"
  },
  {
    name: "Weathers",
    image: "icons8-cloudflare-100.png"
  },
  {
    name: "Environments",
    image: "icons8-firebase-100.png"
  },
  {
    name: "Measures",
    image: "goop.png"
  },
  {
    name: "Historical",
    image: "icons8-lunacy-100.png"
  },
  {
    name: "Predictive",
    image: "icons8-oovoo-100.png"
  },
  {
    name: "Sensors",
    image: "icons8-weibo-100.png"
  },
  {
    name: "Traffic",
    image: "icons8-joomla-100.png"
  }]

  const toName = (n = '') => n[0].toUpperCase() + n.slice(1)

  function updateSummary() {
    const totalTime = inputData.keyHour * 3600 * 1000
    const timeNeeded = (1 - Math.min(inputData.numDrones * 3.7, 100) / 101 * 0.7 - Math.min(inputData.numMeds * 1.5, 20) / 21 * 0.3) * totalTime
    const hours = (timeNeeded / 1000 / 3600).toFixed(2)
    const numSources = dataSources.find('.data-source:not(.data-source-disable)').length
    summaryContent.html(`<p>
      There will be <strong>${inputData.numDrones} drones</strong> scanning the map and <strong>${inputData.numMeds} meds units</strong> will be dispatched.
      <br>
      <strong>${numSources} sources</strong> of 3rd party data will be connected to evaluate the rescue route.
      <br>
      The total recume time is about <strong>${hours} hours</strong>.
    </p>`)
  }

  const inputData = {
    numDrones: 10,
    numMeds: 3,
    keyHour: 12
  }
  const dataSources = $('.data-sources')
  const summaryContent = $('.summary-content')

  apps.forEach(({ name, image }) => {
    dataSources.append(`<div class="data-source"><div class="data-source-img" style="background-image:url(./assets/app-icon/${image});"></div><h4 class="data-source-title">${toName(name)}</h4></div>`)
  })

  dataSources.find('.data-source').on('click', function (e) {
    $(this).toggleClass('data-source-disable')
    updateSummary()
  })

  const dataInputs = $('input[data-id]')
  dataInputs.change(function (e) {
    const dataId = $(this).data('id')
    inputData[dataId] = e.target.value
    updateSummary()
  })

  updateSummary()
}