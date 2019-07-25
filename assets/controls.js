function initControlsAndDataSources () {
  const apps = [{
    name: "Populations",
    image: "icons8-xamarin-100.png"
  },
  {
    name: "Environments",
    image: "https://loading.io/spinners/lava-lamp/index.lava-lamp-preloader.svg"
  },
  {
    name: "Predictive",
    image: "https://loading.io/spinners/sunny/index.solar-light-ajax-spinner.svg"
  },
  
  {
    name: "Biometrics",
    image: "icons8-brave-web-browser-100.png"
  },
  {
    name: "Weathers",
    image: "https://loading.io/spinners/rainy/index.rainy-preloader.svg"
  },
  {
    name: "Resources",
    image: "goop.png"
  },
  {
    name: "Historical",
    image: "https://loading.io/spinners/equalizer/index.equalizer-bars-loader.svg"
  },
  {
    name: "Sensors",
    image: "https://loading.io/spinners/radio/index.broadcast-rss-wifi-signal-preloader-gif.svg"
  },
  {
    name: "Socials",
    image: "icons8-ask.fm-100.png"
  },
  {
    name: "Traffic",
    image: "https://loading.io/spinners/globe/index.globe-earth-spinner.svg"
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
    const imageUrl = image.startsWith('http') ? image : `./assets/app-icon/${image}`
    dataSources.append(`<div class="data-source"><div class="data-source-img" style="background-image:url(${imageUrl});"></div><h4 class="data-source-title">${toName(name)}</h4></div>`)
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