import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'rain-simulator',
  templateUrl: './rain-simulator.component.html',
})
export class RainSimulatorComponent implements OnInit {

  displayRainControls: boolean;
  @Output() onRainTypeSelected: EventEmitter<string> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
    this.displayRainControls = false;
  }

  toggleRainSimControls(): void {
    this.displayRainControls = !this.displayRainControls;
  }

  onOptionSelected(event): void {
    this.onRainTypeSelected.emit(event.srcElement.id);
  }
}
