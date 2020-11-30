import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkDataModalComponent } from './bulk-data-modal.component';

describe('BulkDataModalComponent', () => {
  let component: BulkDataModalComponent;
  let fixture: ComponentFixture<BulkDataModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BulkDataModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BulkDataModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
