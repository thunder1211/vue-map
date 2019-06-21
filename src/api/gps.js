export function getCars () {
  const data = []
  for (let index = 0; index < 500; index++) {
    const BJcenter = { lng: 116.404, lat: 39.915 }
    const radius = 0.3
    const id = new Date().getTime() + '_' + index
    const lng = BJcenter.lng + Math.random() * radius * 2 - radius
    const lat = BJcenter.lat + Math.random() * radius * 2 - radius
    const rotation = 360 * Math.random()
    const isMulti = Math.random() > 0.9
    const element = {
      id,
      isMulti,
      lng,
      lat,
      pos: {
        lng,
        lat
      },
      rotation
    }
    data.push(element)
  }
  // console.log(data)
  return data
}
