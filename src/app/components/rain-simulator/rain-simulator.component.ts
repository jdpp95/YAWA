import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'rain-simulator',
  templateUrl: './rain-simulator.component.html',
})
export class RainSimulatorComponent implements OnInit {

  displayRainControls: boolean;

  constructor() { }

  ngOnInit(): void {
    this.displayRainControls = false;
  }

  toggleRainSimControls(): void {
    this.displayRainControls = !this.displayRainControls;
  }

  onOptionSelected(event): void {
    console.log(event.srcElement.id)
    // switch(event.srcElement.id){
    //   case 'noRainOption':
    //     break;
    //   case 'drizzleOption':
    //     break;
    //   case 'rainOption':
    //     break;
    //   case 'heavyRainOption':
    //     break;
    // }
  }

}
