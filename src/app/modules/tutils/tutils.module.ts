import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class TutilsModule { 
  CtoF(c: number){
      return 1.8 * c + 32;
  }

  FtoC(f: number){
      return (f - 32)*(5/9);
  }
  
  colorT(t: number, rh: number, colors: any) {
    //console.log("h: "+rh)
    var hue = 300;
    var sat = (1 - Math.pow((1 - rh), 2)) * 100;
    var lum = 50;
    var t = this.CtoF(t);

    if (!colors) {
        colors = [
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
    }

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
}
