import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class TutilsModule {

  range24: number[] = []
  range60: number[] = []

  constructor (){
    /*
    let range24$ = range(24);
    let range60$ = range(60);

    range24$.pipe(
      map(
        (item) => {
          this.range24.push(item);
          //return arr;
        }
      ),
      takeLast(1)
    )

    range60$.pipe(
      map(
        (item) => {
          this.range60.push(item);
          //return arr;
        }
      ),
      takeLast(1)
    )*/
    for(let i=0; i < 60; i++)
    {
      if(i < 24)
      {
        this.range24.push(i);
      }
      
      this.range60.push(i);
    }
  }

  private gx(t, h) {
    return 3.793068 * h * Math.exp(17.2694 * t / (t + 238.3));
  }

  private hx(t, g) {
    return 1.007 * t - 0.026 + g * (2.501 + 0.00184 * t) + 0.00419 * t;
  }

  CtoF(c: number) {
    return 1.8 * c + 32;
  }

  FtoC(f: number) {
    return (f - 32) * (5 / 9);
  }

  colorT(t: number, cloudiness: number, rainIntensity: number, visibility: number, sunAngle: number) {
    if(!cloudiness){
      cloudiness = 0;
    }

    var hue;
    var sat = (1 - cloudiness)*40 + 60;
    t = this.CtoF(t);

    if(rainIntensity >= 1){
      sat = Math.max(60 - (rainIntensity - 1)*10, 30);
    }

    //    if (!colors) {
    let colors = [
      [0, 270],
      [14, 240],
      [32, 180],
      //[41, 144],
      [44.6, 150],
      [50, 120],
      [55.4, 90],
      [68, 60],
      [80, 45],
      [90, 30],
      //[90, 255, 128, 0],
      [100, 0],
      [100, 360],
      [125, 360]
    ];

    var lum = 0;
    if(visibility < 5) {
      lum = (0.67662 - 0.10119 * Math.log(visibility)) * 100;
    } else if (t > 100) {
      lum = Math.max(150 - t, 10);
    } else {
      lum = 50;
    }

    if (sunAngle <= -12){
        lum *= 0.3;
    } else if (sunAngle > -12 && sunAngle < 0){
        lum *= this.transicion(0.3, 1, -12, 0, sunAngle);
    }

    if (t <= 0) hue = 270;
    else if (t > 125) hue = 360;
    else {
      var index = 0;
      for (index = 0; index < colors.length - 2; index++)
        if (t >= colors[index][0] && t < colors[index + 1][0])
          break;

      hue = this.transicion(colors[index][1], colors[index + 1][1], colors[index][0], colors[index + 1][0], t);
    }

    return [hue, sat, lum];
  }

  private transicion(start1: number, end1: number, start2: number, end2: number, value2: number) {
    var proporcion = (value2 - start2) / (end2 - start2);
    return start1 + (end1 - start1) * proporcion;
  }

  formatHSL(hsl: number[]) {
    let h = hsl[0]
    let s = hsl[1]
    let l = hsl[2]

    return "hsl(" + h + ", " + s + "%, " + l + "%)";
  }

  breathCondensation(t1: number, h1: number) {
    //http://www.sciencebits.com/exhalecondense
    t1 *= 1.0;
    h1 *= 1.0;

    //Breathe
    var t0 = 35;
    var h0 = 0.93;
    var g0 = this.gx(t0, h0);
    var h0 = this.hx(t0, g0);

    //Air
    var g1 = this.gx(t1, h1);
    h1 = this.hx(t1, g1);

    var maxH = -1;
    //var tMax = 0;
    var gMax = 0;
    var fMax = 0;
    var startRatio = -1;
    var endRatio = 0;

    const STEP = 100;

    for (var f = 0; f < 1; f += 1 / STEP) {
      var gf = g0 * (1 - f) + g1 * f;
      var hf = h0 * (1 - f) + h1 * f;
      var tf = (hf - 2.501 * gf + 0.026) / (1.007 + 0.00184 * gf);
      var rhf = gf / (3.7931 * Math.exp(17.2694 * tf / (tf + 238.3)));

      if (rhf > maxH) {
        maxH = rhf;
        fMax = f;
        gMax = gf;
      }

      if (rhf > 1) {
        if (startRatio < 0) startRatio = f;
        endRatio = f;
      }
    }

    return maxH > 1 ? endRatio - startRatio : 0;
  }

  dewPoint(temperature: number, humidity: number): number {
    let n = (Math.log(humidity) + (17.27*temperature/(237.3 + temperature)))/17.27;
    let dewPoint = 237.73 * n / (1 - n);
    return dewPoint;
  }

  humidityFromDewP(dewPoint: number, temperature: number){
    const vaporPressure = (t) => 6.112 * Math.exp(17.502 * t / (240.97 + t));

    let ed = vaporPressure(temperature);
    let ew = vaporPressure(dewPoint);
    return Math.min(1, ew/ed);
  }

  temperatureFromDewP(dewPoint: number, humidity: number){
    return (dewPoint - 112 * Math.pow(humidity, 1/8) + 112)/(0.9 * Math.pow(humidity, 1/8) + 0.1);
  }

  heatIndex(temperature: number, humidity: number) {
    //https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
    var f = this.CtoF(temperature);
    humidity = humidity * 100.0;
    var hi = 0

    if (f > 80) {
        hi = -42.379 + 2.04901523 * f + 10.14333127 * humidity - 0.22475541 * f * humidity - 0.00683783 * f * f - 0.05481717 * humidity * humidity + 0.00122874 * f * f * humidity + 0.00085282 * f * humidity * humidity - 0.00000199 * humidity * humidity * f * f;

        if (humidity < 13 && f >= 80 && f <= 112) {
            hi -= ((13 - humidity) / 4) * Math.sqrt((17 - Math.abs(humidity - 95.0)) / 17)
        }

        if (humidity > 85 && f >= 80 && f <= 87) {
            hi += ((humidity - 85) / 10) * ((87 - humidity) / 5)
        }
    } else {
        hi = 0.5 * (f + 61.0 + ((f - 68.0) * 1.2) + (humidity * 0.094));
    }

    return this.FtoC(hi);
  }


  windChill(temperature: number, windSpeed: number): number {
    return 13.12 + 0.6215*temperature - 11.37*Math.pow(windSpeed, 0.16) 
      + 0.3965 * temperature * Math.pow(windSpeed, 0.16);
  }

  snowProbability(temperature: number, humidity: number) {
    //http://www.sciencebits.com/SnowAboveFreezing
    temperature *= 1.0;
    humidity *= 1.0;

    let p = Math.min(1, Math.max(1.0788 - 0.5809 * (-5.3721 * humidity * humidity + 15.167 * humidity + temperature - 9.9154), 0));

    return p;
  }
}
