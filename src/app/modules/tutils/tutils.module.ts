import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class TutilsModule {
  CtoF(c: number) {
    return 1.8 * c + 32;
  }

  FtoC(f: number) {
    return (f - 32) * (5 / 9);
  }
  colorT(t: number, rh: number, visibility: number) {
    //console.log("h: "+rh)
    var hue = 300;
    var sat = (1 - Math.pow((1 - rh), 2)) * 100;
    var lum = visibility < 5 ? (0.67662 - 0.10119 * Math.log(visibility)) * 100 : 50;
    var t = this.CtoF(t);

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
      [125, 330]
    ];
    //    }

    if (t <= 0) hue = 270;
    else if (t > 125) hue = 330;
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

  breathCondensation(t1, h1) {
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

    return [maxH, endRatio - startRatio];
  }

  private gx(t, h) {
    return 3.793068 * h * Math.exp(17.2694 * t / (t + 238.3));
  }

  private hx(t, g) {
    return 1.007 * t - 0.026 + g * (2.501 + 0.00184 * t) + 0.00419 * t;
  }
}
