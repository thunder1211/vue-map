<template>
  <div class="mapWrap">
    <div class="headerSpace"></div>
    <baidu-map class="bm-view" :center="pos" :zoom="5" :scroll-wheel-zoom="true" @load="onloadMap" @ready="onReady" @tilesloaded="onTilesloaded">
      <bml-marker-clusterer :averageCenter="true">
        <template v-for="car in cars">
          <bm-marker :dragging="false" :icon="carIcon"
            :key="car.key"
            :position="{lng: car.lng, lat: car.lat}"
            @click="onClickMarker({lng: car.lng, lat: car.lat})"
            :rotation="car.rotation"
          />
        </template>
      </bml-marker-clusterer>
      <bm-control>
        <button @click="onClickControl">自定义控件</button>
      </bm-control>
      <bm-scale anchor="BMAP_ANCHOR_TOP_RIGHT"></bm-scale>
      <bm-geolocation anchor="BMAP_ANCHOR_BOTTOM_RIGHT" :showAddressBar="true" :autoLocation="true"></bm-geolocation>
    </baidu-map>
  </div>
</template>

<script>

// import BMap from 'vue-baidu-map'
import {BmlMarkerClusterer} from 'vue-baidu-map'
import carIcon_img from "../assets/carIcon.png"
import {getCars} from "../api/gps"
import { _debounce } from "../utils/index"

export default {
  name: 'home',
  data() {
    return {
      carIcon: null,
      pos: null,
      cars: [],
      aveMap: []
    }
  },
  components: {
    BmlMarkerClusterer
  },
  created() {
    this.create_debounce()
  },
  mounted() {
  },
  methods: {
    // 初始化防抖函数
    create_debounce() {
      this.onTilesloaded_debounce = _debounce(() => {
        console.log('--------- onTilesloaded ---------')
        this.setCars()
      }, 1000)
    },
    make_carIcon() {
      // this.carIcon = new this.BMap.Icon(carIcon_img, new this.BMap.Size(48,48))
      this.carIcon = {
        url: carIcon_img,
        size: { width: 48, height: 48 }
      }
    },
    getCars() {
      let cars = getCars()
      // cars = this.filterCars(cars)
      // this.filterCars(cars)
      cars.forEach((item, index) => item.key = new Date().getTime() + '_' + index)
      this.cars = cars
    },
    onClickMarker(arg) {
      this.pos = arg
    },
    onClickControl() {
      const bs = this.getBounds()
      console.log(bs)
    },
    setCars() {
      this.getCars()
      // let time = 0
      // const _this = this
      // if(this.interval_setCars) {
      //   clearInterval(this.interval_setCars)
      // }
      // this.interval_setCars = setInterval(function() {
      //   _this.getCars()
      //   time += 3
      //   if(time > 0) clearInterval(_this.interval_setCars)
      // }, 5000);
    },
    getBounds() {
      const bs = this.map.getBounds();   //获取可视区域
      const bssw = bs.getSouthWest();   //可视区域左下角
      const bsne = bs.getNorthEast();   //可视区域右上角
      console.log('bssw:', bssw, 'bsne:', bsne)
      return {bssw, bsne}
    },
    getMapBlockCount() {
      const { width, height} = this.map.getSize()
      const isCeil_w = width % 100 > 50
      const isCeil_h = height % 100 > 50
      const lng_count = isCeil_w ? Math.ceil(width / 100) : Math.floor(width / 100)
      const lat_count = isCeil_h ? Math.ceil(height / 100) : Math.floor(height / 100)
      console.log({ lng_count, lat_count})
      return { lng_count, lat_count}
    },
    // 过滤出显示范围内的车辆
    filterCars(cars) {
      const { bssw, bsne } = this.getBounds()
      let filteredData = []
      for (let index = 0; index < cars.length; index++) {
        const _car = cars[index];
        const result = _check(_car)
        if(!result) continue
        filteredData.push(_car)
      }
      function _check(car) {
        return (car.lng > bssw.lng) && (car.lat > bssw.lat) && (car.lng < bsne.lng) && (car.lat < bsne.lat)
      }
      console.log('filteredData: ', filteredData)
      return filteredData
    },
    getCurrentPosition() {
      const _this = this
      const geolocation = new this.BMap.Geolocation();
      geolocation.getCurrentPosition(function(r){
        if(this.getStatus() == BMAP_STATUS_SUCCESS){
          // alert('您的位置：'+r.point.lng+','+r.point.lat);
          _this.pos = {lng: r.point.lng, lat: r.point.lat}
        }
        else {
          alert('failed'+this.getStatus());
        }        
      },{enableHighAccuracy: true})
      //关于状态码
      //BMAP_STATUS_SUCCESS	检索成功。对应数值“0”。
      //BMAP_STATUS_CITY_LIST	城市列表。对应数值“1”。
      //BMAP_STATUS_UNKNOWN_LOCATION	位置结果未知。对应数值“2”。
      //BMAP_STATUS_UNKNOWN_ROUTE	导航结果未知。对应数值“3”。
      //BMAP_STATUS_INVALID_KEY	非法密钥。对应数值“4”。
      //BMAP_STATUS_INVALID_REQUEST	非法请求。对应数值“5”。
      //BMAP_STATUS_PERMISSION_DENIED	没有权限。对应数值“6”。(自 1.1 新增)
      //BMAP_STATUS_SERVICE_UNAVAILABLE	服务不可用。对应数值“7”。(自 1.1 新增)
      //BMAP_STATUS_TIMEOUT	超时。对应数值“8”。(自 1.1 新增)
    },
    // 生命周期顺序：load 》ready 》 tilesloaded
    onloadMap() {
      console.log(`--------- onloadMap ---------`)
    },
    onReady({BMap, map}) {
      console.log(`--------- onReady ---------`)
      this.BMap = BMap
      this.map = map
      this.make_carIcon()
      this.getCurrentPosition()
    },
    // 当地图所有图块完成加载时触发此事件
    onTilesloaded() {
      this.onTilesloaded_debounce()
    }
  }
}
</script>

<style>
.mapWrap{
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: -1;
  top: 0;
  width: 100%;
  height: 100%;
}
.headerSpace{
  width: 100%;
  height: 50px;
}
.bm-view {
  flex: 1;
  width: 100%;
}
</style>
