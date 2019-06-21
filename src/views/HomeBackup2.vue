<template>
  <div class="mapWrap">
    <div class="headerSpace"></div>
    <baidu-map class="bm-view" :center="pos" :zoom="12" :scroll-wheel-zoom="true" @load="onloadMap" @ready="onReady" @tilesloaded="onTilesloaded">
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
        this.averageMap()
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
      cars = this.filterCars(cars)
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
      let time = 0
      const _this = this
      if(this.interval_setCars) {
        clearInterval(this.interval_setCars)
      }
      this.interval_setCars = setInterval(function() {
        _this.getCars()
        time += 3
        if(time > 0) clearInterval(_this.interval_setCars)
      }, 5000);
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
    // 把地图显示范围 垂直(vertical) 水平(horizontal) 方向分成若干个块儿
    averageMap() {
      const { bssw, bsne } = this.getBounds()
      const { lng_count, lat_count} = this.getMapBlockCount()
      const ave_lng = (bsne.lng - bssw.lng) / lng_count
      const ave_lat = (bsne.lat - bssw.lat) / lat_count
      let _aveMap = [] // 三维数组，每个二级数组是「横向分块儿」的每块儿范围经温度
      let _aveMap_final = [] // 二维数组，每个子数组是块儿的「对角线」位置的经纬度（打散后的_aveMap）

      const _ave_vertical = [] // 垂直方向的分块儿「起始经纬度(非对角线)」二维数组[ [H_start,H_end],[H_start,H_end], ... ]
      for (let index = 0; index < lat_count; index++) {
        const prev_vertical_end = index === 0 ? bssw : _ave_vertical[index - 1][1]
        let this_vertical_area = null
        if(index === (lat_count - 1)) {
          this_vertical_area = [prev_vertical_end, {lng: prev_vertical_end.lng, lat: bsne.lat}]
        } else {
          this_vertical_area = [prev_vertical_end, {lng: prev_vertical_end.lng, lat: prev_vertical_end.lat + ave_lat}]
        }
        _ave_vertical.push(this_vertical_area)
        const _ave_horizontal = [] // 水平方向分块儿的「起始经纬度(对角线)」 二维数组[ [H_start,H_end],[H_start,H_end], ... ]
        for (let index2 = 0; index2 < lng_count; index2++) {
          const this_vertical_start = this_vertical_area[0].lat
          const this_vertical_end   = this_vertical_area[1].lat
          // debugger
          const prev_horizontal_end = index2 === 0 ? bssw : _ave_horizontal[index2 - 1][1]
          let this_horizontal_area = null
          if(index2 === (lng_count - 1)) {
            this_horizontal_area =[
              {lat: this_vertical_start, lng: prev_horizontal_end.lng},
              {lat: this_vertical_end  , lng: bsne.lng, }
            ]
          } else {
            this_horizontal_area =[
              {lat: this_vertical_start, lng: prev_horizontal_end.lng},
              {lat: this_vertical_end  , lng: prev_horizontal_end.lng + ave_lng }
            ]
          }
          _ave_horizontal.push(this_horizontal_area)
        }
        _aveMap.push(_ave_horizontal)
      }
      for (let index = 0; index < _aveMap.length; index++) {
        const element = _aveMap[index];
        _aveMap_final = [..._aveMap_final, ...element]
      }
      let _aveMap_final_console = [] // 控制台方便查看！！！
      for (let index = 0; index < _aveMap_final.length; index++) {
        const element = _aveMap_final[index];
        _aveMap_final_console.push([
          JSON.stringify(element[0]),
          JSON.stringify(element[1])
        ])
      }
      console.log('_aveMap_final_console:')
      console.table(_aveMap_final_console)
      this.aveMap = _aveMap_final
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
    // 一定区域内多辆车合并到一个点，并过滤出显示范围内的车辆
    filterCars2(cars) {
      let filteredData = []
      const blockData = []
      for (let index = 0; index < cars.length; index++) {
        const _car = cars[index];
        const { carItem, aveIndex} = this._check_carInfo(_car)
        // debugger
        if(aveIndex < 0) continue
        if(!blockData[aveIndex]) blockData[aveIndex] = []
        blockData[aveIndex].push(carItem)
        // filteredData.push(_car)
      }
      console.log('blockData: ', blockData)
      for (let index2 = 0; index2 < blockData.length; index2++) {
        // debugger
        filteredData = [...filteredData, ...blockData[index2]]
        
      }
      console.log('filteredData: ', filteredData)
      return filteredData
    },
    _check_carInfo(car) {
      let carItem = null
      let aveIndex = -1
      this.aveMap.some((item, index) => {
        // console.log(item, index)
        const _sw = item[0]
        const _ne = item[1]
        if ((car.lng > _sw.lng) && (car.lat > _sw.lat) && (car.lng < _ne.lng) && (car.lat < _ne.lat)) {
          carItem = item
          aveIndex = index
          return true
        }
        return false
      })
      return { carItem, aveIndex}
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
