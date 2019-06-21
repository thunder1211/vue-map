export function getCars () {
  const data = []
  for (let index = 0; index < 500; index++) {
    // const BJcenter = { lng: 116.404, lat: 39.915 }
    const CNcenter = { lng: 107.95761, lat: 35.046946 } // 大概中间位置
    const radius = 30
    const id = new Date().getTime() + '_' + index
    const lng = CNcenter.lng + Math.random() * radius * 2 - radius
    const lat = CNcenter.lat + Math.random() * radius * 2 - radius
    const rotation = 360 * Math.random()
    const isOffline = Math.random() > 0.9
    const element = {
      id,
      isOffline,
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
