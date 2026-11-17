/**
 * Makes the curriculum map a pannable canvas (from md up; below md the semesters stack
 * and this stays off).
 *
 * - Drag (mouse, pen or a horizontal touch swipe) pans. Vertical touch swipes and plain
 *   mouse wheel still scroll the page, so the map never traps you.
 * - Trackpad horizontal swipe / Shift + wheel pans.
 * - Keyboard (map focused): ←/→ glide to the previous/next semester, ↑/↓ pan.
 *   Tabbing to a card off screen brings it into view.
 * - First time the map scrolls into view, a phosphor beam sweeps the semesters (skipped
 *   with reduced motion).
 */
import { clamp, EDGE, lerp, type Camera } from './camera';

const GLIDE_MS = 450;
/** Matches the md breakpoint (48rem). */
const desktop = window.matchMedia('(min-width: 48rem)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Wires one map viewport.
 * @param viewport - element with `data-map-viewport`, holding `data-map-stage`
 */
function mountMap(viewport: HTMLElement) {
  const stage = viewport.querySelector<HTMLElement>('[data-map-stage]')!;
  const columns = [...stage.querySelectorAll<HTMLElement>('[data-map-column]')];

  let camera: Camera = { x: 0, y: 0 };
  let glide = 0;
  /** Pointer currently dragging the map, and where it was last. */
  let drag: { id: number; x: number; y: number } | null = null;

  const viewSize = () => ({ width: viewport.clientWidth, height: viewport.clientHeight });
  const contentSize = () => ({ width: stage.offsetWidth, height: stage.offsetHeight });
  /** Left inset that lines the first semester up with the page column (same as the title). */
  const pageInset = () => Math.max(EDGE, (viewport.clientWidth - 1280) / 2 + EDGE);

  /** Draws a camera: moves the stage and the dot grid with it. */
  function render(next: Camera) {
    camera = clamp(next, viewSize(), contentSize());
    stage.style.transform = `translate3d(${camera.x}px, ${camera.y}px, 0)`;
    viewport.style.backgroundPosition = `${camera.x}px ${camera.y}px`;
  }

  /** Where the running glide ends, so repeated keys build on it instead of on a mid-glide frame. */
  let goal: Camera | null = null;
  const base = () => goal ?? camera;

  /** Stops a running glide where it is (direct manipulation takes over). */
  function stopGlide() {
    cancelAnimationFrame(glide);
    goal = null;
  }

  /** Eases to a camera (or jumps there with reduced motion). */
  function glideTo(target: Camera) {
    stopGlide();
    const to = clamp(target, viewSize(), contentSize());
    if (reducedMotion.matches) return render(to);
    goal = to;
    const from = camera;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / GLIDE_MS);
      render(lerp(from, to, 1 - (1 - t) ** 3));
      if (t < 1) glide = requestAnimationFrame(step);
      else goal = null;
    };
    glide = requestAnimationFrame(step);
  }

  /** Glides so semester `index` sits at the page inset. */
  function goToColumn(index: number) {
    const column = columns[Math.max(0, Math.min(columns.length - 1, index))];
    glideTo({ ...base(), x: pageInset() - column.offsetLeft });
  }

  /** Index of the semester closest to the page inset (where the camera is heading, if gliding). */
  function currentColumn() {
    const { x } = base();
    const offset = (column: HTMLElement) => Math.abs(x + column.offsetLeft - pageInset());
    return columns.reduce((best, column, i) => (offset(column) < offset(columns[best]) ? i : best), 0);
  }

  // ── Pointer: drag to pan ──
  function onPointerDown(event: PointerEvent) {
    if (drag || event.button !== 0) return;
    stopGlide();
    viewport.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: PointerEvent) {
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!dx && !dy) return;
    viewport.dataset.dragging = '';
    render({ x: camera.x + dx, y: camera.y + dy });
    drag = { ...drag, x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent) {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    delete viewport.dataset.dragging;
  }

  // ── Wheel: horizontal swipe pans, vertical scroll is left to the page ──
  function onWheel(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    stopGlide();
    render({ x: camera.x - event.deltaX, y: camera.y - event.deltaY });
  }

  // ── Keyboard ──
  function onKeyDown(event: KeyboardEvent) {
    const actions: Record<string, () => void> = {
      ArrowRight: () => goToColumn(currentColumn() + 1),
      ArrowLeft: () => goToColumn(currentColumn() - 1),
      ArrowDown: () => glideTo({ ...base(), y: base().y - 120 }),
      ArrowUp: () => glideTo({ ...base(), y: base().y + 120 }),
    };
    const action = actions[event.key];
    if (action && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      action();
    }
  }

  /**
   * Brings a focused card fully into view (instantly, so the hover window can be placed
   * right away). The viewport clips with overflow: hidden, so the browser would otherwise
   * scroll it natively to reveal the card and desync the camera.
   */
  function onFocusIn(event: FocusEvent) {
    const card = (event.target as Element).closest<HTMLElement>('[data-card]');
    if (!card) return;
    resetScroll();
    stopGlide();
    const view = viewport.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    const left = rect.left - view.left;
    const top = rect.top - view.top;
    let { x, y } = camera;
    if (left < EDGE) x += EDGE - left;
    else if (left + rect.width > view.width - EDGE) x -= left + rect.width - (view.width - EDGE);
    if (top < EDGE) y += EDGE - top;
    else if (top + rect.height > view.height - EDGE) y -= top + rect.height - (view.height - EDGE);
    render({ x, y });
  }

  /** The camera owns positioning; undo any native scroll of the clipped viewport. */
  function resetScroll() {
    if (viewport.scrollLeft || viewport.scrollTop) viewport.scrollTo(0, 0);
  }

  // ── Beam sweep: armed (dim) until the map is a quarter visible, then plays once ──
  let beamObserver: IntersectionObserver | undefined;
  function armBeam() {
    if (reducedMotion.matches || viewport.dataset.beam) return;
    viewport.dataset.beam = 'armed';
    beamObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        viewport.dataset.beam = 'on';
        beamObserver?.disconnect();
      },
      { threshold: 0.25 },
    );
    beamObserver.observe(viewport);
  }

  const resize = new ResizeObserver(() => render(camera));

  /** Turns the canvas on (md and up) or off (stacked layout). */
  function sync() {
    const on = desktop.matches;
    const method = on ? 'addEventListener' : 'removeEventListener';
    viewport[method]('pointerdown', onPointerDown as EventListener);
    viewport[method]('pointermove', onPointerMove as EventListener);
    viewport[method]('pointerup', onPointerUp as EventListener);
    viewport[method]('pointercancel', onPointerUp as EventListener);
    viewport[method]('wheel', onWheel as EventListener, { passive: false } as AddEventListenerOptions);
    viewport[method]('keydown', onKeyDown as EventListener);
    viewport[method]('focusin', onFocusIn as EventListener);
    viewport[method]('scroll', resetScroll);

    if (on) {
      viewport.tabIndex = 0;
      resize.observe(viewport);
      render({ x: pageInset(), y: EDGE });
      armBeam();
    } else {
      stopGlide();
      drag = null;
      delete viewport.dataset.dragging;
      viewport.removeAttribute('tabindex');
      resize.disconnect();
      stage.style.transform = '';
      viewport.style.backgroundPosition = '';
    }
  }

  desktop.addEventListener('change', sync);
  sync();
}

document.querySelectorAll<HTMLElement>('[data-map-viewport]').forEach(mountMap);
