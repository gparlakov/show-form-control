import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Inject,
  Input,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { fromEvent, Observer } from 'rxjs';
import { HasEventTargetAddRemove } from 'rxjs/internal/observable/fromEvent';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Disable, WindowAnimationFrameProvider, WindowWidthProvider } from './show-form-control';

let count = 0;
const MISSING_HOST = document.createElement('span');
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'show-form-control',
  templateUrl: './show-form-control.component.html',
  styleUrls: ['./show-form-control.component.scss'],
})
export class ShowFormControlComponent implements OnInit, AfterViewInit {
  width = 50;
  height?: number;

  @HostBinding('class.enabled')
  enabled: boolean;

  @ViewChild('hook', { static: true })
  hook: ElementRef;
  get host(): HTMLElement {
    return (this.hook?.nativeElement as HTMLElement)?.parentElement ?? MISSING_HOST;
  }

  drag: (o: Observer<MouseEvent>) => void;

  private animationFrame: WindowAnimationFrameProvider;
  private w: WindowWidthProvider;
  private window: HasEventTargetAddRemove<Event>;

  @Input()
  closed?: boolean;
  offset: number;

  @Input()
  control?: AbstractControl;

  @Input()
  name = 'Drag here';

  constructor(
    @Inject(Disable) disabled: boolean,
    @Optional() @Inject('WINDOW') animationFrame: WindowAnimationFrameProvider,
    @Optional() @Inject('WINDOW') w: WindowWidthProvider,
    @Optional() @Inject('WINDOW') globalWindow: HasEventTargetAddRemove<Event>
  ) {
    this.enabled = !Boolean(disabled);
    this.animationFrame = animationFrame || window;
    this.w = w || window;
    this.window = globalWindow || window;
  }

  ngOnInit() {
    if (this.enabled) {
      if (this.enabled) {
        this.offset = count;
        if (count > 0) {
          this.closed = true;
        }
        count += 1;
      }
    }
  }

  ngAfterViewInit() {
    if (this.enabled) {
      this.calcWidthAfterRedraw();
      this.addOffsetAfterRedraw();
    }

    if (this.enabled) {
      const mouseUp$ = fromEvent(this.window, 'mouseup');
      const mouseMove$ = fromEvent(this.window, 'mousemove');

      this.drag = (o: Observer<MouseEvent>) => {
        mouseMove$.pipe(takeUntil(mouseUp$)).subscribe(o);
      };
    }
  }

  private calcWidthAfterRedraw() {
    this.animationFrame.requestAnimationFrame(() => {
      const rect = this.host.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;

      this.animationFrame.requestAnimationFrame(() => {
        const elem = this.host.getBoundingClientRect();

        const windowWidth = this.w.innerWidth;
        const windowHeight = this.w.innerHeight;

        if (elem.x < 0) {
          this.host.style.left = '0px';
        }
        if (elem.x + elem.width > windowWidth) {
          this.host.style.left = `${windowWidth - elem.width}px`;
        }
        if (elem.y < 0) {
          this.host.style.top = '0px';
        }
        if (elem.y + elem.height > windowHeight) {
          this.host.style.top = `${windowHeight - elem.height}px`;
        }
      });
    });
  }

  private addOffsetAfterRedraw() {
    this.animationFrame.requestAnimationFrame(() => {
      this.host.style.top = `${this.offset}px`;
      this.host.style.right = `${this.offset * 5}px`;
    });
  }

  onToggle() {
    this.closed = !this.closed;
    this.calcWidthAfterRedraw();
  }

  onDragStart(drag: MouseEvent | DragEvent) {
    drag.preventDefault();

    const from = { x: drag.clientX, y: drag.clientY };
    const initial = this.host?.getBoundingClientRect();
    if (typeof this.drag === 'function') {
      this.drag({
        next: (m: MouseEvent) => {
          this.onMouseMove(m, from, initial);
        },
        error: (e) => console.log(e),
        complete: () => this.onDragEnd(),
      });
    }
  }

  // @HostListener('mouseup')
  onDragEnd() {
    if (this.enabled) {
      // this.dragging = false;
      // this.from = null;
    }
  }

  onMouseMove(event: MouseEvent, from: { x: number; y: number }, initial: DOMRect) {
    if (from != null && initial != null) {
      const y = from.y - event.clientY;
      const x = from.x - event.clientX;

      this.host.style.right = 'unset';
      this.host.style.top = initial.top - y + 'px';
      this.host.style.left = initial.left - x + 'px';
    }
  }

  onTextAreaInput(e: Event) {
    const v = (e.target as HTMLTextAreaElement).value;
    if (v) {
      try {
        const x = JSON.parse(v);
        this.control?.patchValue(x);
      } catch {
        // do nothing
      }
    }
  }
}
