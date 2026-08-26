import percentRank from 'percentile-rank';


export class UtilsService {

  range24: number[] = [];
  range60: number[] = [];

  constructor() {
    for (let i = 0; i < 60; i++) {
      if (i < 24) {
        this.range24.push(i);
      }
      this.range60.push(i);
    }
  }

  private static gx(t, h) {
    return 3.793068 * h * Math.exp(17.2694 * t / (t + 238.3));
  }

  private static hx(t, g) {
    return 1.007 * t - 0.026 + g * (2.501 + 0.00184 * t) + 0.00419 * t;
  }

  static CtoF(c: number) {
    return 1.8 * c + 32;
  }

  static FtoC(f: number) {
    return (f - 32) * (5 / 9);
  }

  static colorT(t: number, cloudiness: number, rainIntensity: number, sunAngle: number, visibility?: number) {
    const MIN_FOG_LUMINOSITY = 15, MAX_FOG_LUMINOSITY = 100, MAX_SUN_ANGLE_FOG = 24;

    if (!cloudiness) {
      cloudiness = 0;
    }

    var hue;
    var sat = (1 - cloudiness) * 40 + 60;
    t = this.CtoF(t);

    if (rainIntensity >= 1) {
      sat = Math.max(60 - (rainIntensity - 1) * 10, 30);
    }

    let colors = [
      [0, 270],
      [14, 240],
      [32, 180],
      [44.6, 150],
      [50, 120],
      [55.4, 90],
      [68, 60],
      [80, 45],
      [90, 30],
      [100, 0],
      [100, 360],
      [125, 360]
    ];

    let fogLum = 0;

    if (visibility && visibility < 5) {
      if (sunAngle >= MAX_SUN_ANGLE_FOG) {
        fogLum = MAX_FOG_LUMINOSITY;
      } else if (sunAngle <= -12) {
        fogLum = MIN_FOG_LUMINOSITY;
      } else {
        fogLum = this.transition(MIN_FOG_LUMINOSITY, MAX_FOG_LUMINOSITY, -12, MAX_SUN_ANGLE_FOG, sunAngle);
      }
    } else if (t > 100) {
      fogLum = Math.max(150 - t, 10);
    } else {
      fogLum = 50;
    }
    
    const fogFactor = Math.max(Math.min(0.258977 - 0.1609112 * Math.log(visibility), 1), 0);
    let lum = this.transition(50, fogLum, 0, 1, fogFactor);
    sat = this.transition(sat, 0, 0, 1, fogFactor);

    if (sunAngle <= -12) {
      lum *= 0.3;
    } else if (sunAngle > -12 && sunAngle < 0) {
      lum *= this.transition(0.3, 1, -12, 0, sunAngle);
    }

    if (t <= 0) hue = 270;
    else if (t > 125) hue = 360;
    else {
      var index = 0;
      for (index = 0; index < colors.length - 2; index++)
        if (t >= colors[index][0] && t < colors[index + 1][0])
          break;

      hue = this.transition(colors[index][1], colors[index + 1][1], colors[index][0], colors[index + 1][0], t);
    }

    return [hue, sat, lum];
  }

  static transition(targetStart: number, targetEnd: number, originStart: number, originEnd: number, value: number) {
    var proporcion = (value - originStart) / (originEnd - originStart);
    return targetStart + (targetEnd - targetStart) * proporcion;
  }

  static formatHSL(hsl: number[]) {
    let h = hsl[0]
    let s = hsl[1]
    let l = hsl[2]

    return "hsl(" + h + ", " + s + "%, " + l + "%)";
  }

  static breathCondensation(t1: number, h1: number) {
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

  static dewPoint(temperature: number, humidity: number): number {
    let n = (Math.log(humidity) + (17.27 * temperature / (237.3 + temperature))) / 17.27;
    let dewPoint = 237.73 * n / (1 - n);
    return dewPoint;
  }

  static humidityFromDewP(dewPoint: number, temperature: number) {
    const vaporPressure = (t) => 6.112 * Math.exp(17.502 * t / (240.97 + t));

    let ed = vaporPressure(temperature);
    let ew = vaporPressure(dewPoint);
    return Math.min(1, ew / ed);
  }

  static indoorHumidityFromDewPoint(dewPoint: number, indoorTemperature: number): number {
    return Math.max(0.01, Math.min(1, this.humidityFromDewP(dewPoint, indoorTemperature)));
  }

  static indoorFeelsLike(indoorTemp: number, dewPoint: number): { indoorHumidity: number, feelsLikeTemp: number } {
    const indoorHumidity = this.indoorHumidityFromDewPoint(dewPoint, indoorTemp);
    const feelsLikeTemp = this.heatIndex(indoorTemp, indoorHumidity);

    return { indoorHumidity, feelsLikeTemp };
  }

  static temperatureFromDewP(dewPoint: number, humidity: number) {
    return (dewPoint - 112 * Math.pow(humidity, 1 / 8) + 112) / (0.9 * Math.pow(humidity, 1 / 8) + 0.1);
  }

  static heatIndex(temperature: number, humidity: number) {
    //https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
    var f = this.CtoF(temperature);
    humidity = humidity * 100.0;
    var hi = 0

    if (f > 80) {
      hi = -42.379 + 2.04901523 * f + 10.14333127 * humidity - 0.22475541 * f * humidity - 0.00683783 * f * f - 0.05481717 * humidity * humidity + 0.00122874 * f * f * humidity + 0.00085282 * f * humidity * humidity - 0.00000199 * humidity * humidity * f * f;

      if (humidity < 13 && f >= 80 && f <= 112) {
        hi -= ((13 - humidity) / 4) * Math.sqrt((17 - Math.abs(f - 95.0)) / 17)
      }

      if (humidity > 85 && f >= 80 && f <= 87) {
        hi += ((humidity - 85) / 10) * ((87 - humidity) / 5)
      }
    } else {
      hi = 0.5 * (f + 61.0 + ((f - 68.0) * 1.2) + (humidity * 0.094));
    }

    return this.FtoC(hi);
  }


  static windChill(temperature: number, windSpeed: number): number {
    return 13.12 + 0.6215 * temperature - 11.37 * Math.pow(windSpeed, 0.16)
      + 0.3965 * temperature * Math.pow(windSpeed, 0.16);
  }

  static snowProbability(temperature: number, humidity: number) {
    //http://www.sciencebits.com/SnowAboveFreezing
    temperature *= 1.0;
    humidity *= 1.0;

    let p = Math.min(1, Math.max(1.0788 - 0.5809 * (-5.3721 * humidity * humidity + 15.167 * humidity + temperature - 9.9154), 0));

    return p;
  }

  static getPercentile(array: number[], quantile: number) {
    array.sort((a, b) => a - b);

    const pos = (array.length - 1) * quantile;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (array[base + 1] !== undefined) {
      return array[base] + rest * (array[base + 1] - array[base]);
    } else {
      return array[base];
    }
  }

  static getPercentileRank(array: number[], value: number) {
    array.sort((a, b) => a - b);
    return percentRank(array, value);
  }
}
