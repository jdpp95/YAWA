import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TempGradientComponent } from './temp-gradient.component';

describe('TempGradientComponent', () => {
  let component: TempGradientComponent;
  let fixture: ComponentFixture<TempGradientComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TempGradientComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TempGradientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
