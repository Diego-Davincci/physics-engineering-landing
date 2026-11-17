/**
 * Makes the curriculum map a pannable, zoomable canvas (from md up; below md the
 * semesters stack and this stays off).
 *
 * - Drag (mouse, pen or a horizontal touch swipe) pans. Vertical touch swipes and plain
 *   mouse wheel still scroll the page, so the map never traps you.
 * - Trackpad horizontal swipe / Shift + wheel pans; Ctrl/⌘ + wheel or trackpad pinch zooms
 *   at the cursor; two-finger touch pinch zooms too.
 * - Keyboard (map focused): ←/→ glide to the previous/next semester, ↑/↓ pan, +/− zoom, 0 shows all.
 * - First time the map scrolls into view, a phosphor beam sweeps the semesters (skipped
 *   with reduced motion).
 */
import { clamp, fit, lerp, LOW_DETAIL_SCALE, MAX_SCALE, MIN_SCALE, zoomAt, type Camera, type Point } from './camera';

/** Dot spacing of the scope grid behind the stage, in pixels at scale 1. */
const GRID = 24;
const ZOOM_STEP = 1.25;
const GLIDE_MS = 450;
/** Matches the md breakpoint (48rem). */
const desktop = window.matchMedia('(min-width: 48rem)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Wires one map viewport.
 * @param viewport - element with `data-map-viewport`, holding `data-map-stage` and the zoom controls
 */
function mountMap(viewport: HTMLElement) {
  const stage = viewport.querySelector<HTMLElement>('[data-map-stage]')!;
  const columns = [...stage.querySelectorAll<HTMLElement>('[data-map-column]')];
  const zoomLabel = viewport.querySelector<HTMLOutputElement>('[data-zoom-level]')!;
  const zoomIn = viewport.querySelector<HTMLButtonElement>('[data-zoom="in"]')!;
  const zoomOut = viewport.querySelector<HTMLButtonElement>('[data-zoom="out"]')!;
  const zoomFit = viewport.querySelector<HTMLButtonElement>('[data-zoom="fit"]')!;

  let camera: Camera = { x: 0, y: 0, scale: 1 };
  let glide = 0;
  const pointers = new Map<number, Point>();

  const viewSize = () => ({ width: viewport.clientWidth, height: viewport.clientHeight });
  const contentSize = () => ({ width: stage.offsetWidth, height: stage.offsetHeight });
  /** Left inset that lines the first semester up with the page column (same as the title). */
  const pageInset = () => Math.max(40, (viewport.clientWidth - 1280) / 2 + 40);

  /** Draws a camera: moves the stage and the dot grid with it, updates detail level and controls. */
  function render(next: Camera) {
    camera = clamp(next, viewSize(), contentSize());
    const { x, y, scale } = camera;
    stage.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    viewport.style.backgroundSize = `${GRID * scale}px ${GRID * scale}px`;
    viewport.style.backgroundPosition = `${x}px ${y}px`;
    viewport.dataset.detail = scale < LOW_DETAIL_SCALE ? 'low' : 'high';
    zoomLabel.value = `${Math.round(scale * 100)} %`;
    zoomIn.disabled = scale >= MAX_SCALE - 0.001;
    zoomOut.disabled = scale <= MIN_SCALE + 0.001;
  }

  /** Where the running glide ends, so repeated clicks/keys build on it instead of on a mid-glide frame. */
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

  const center = (): Point => ({ x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 });

  /** Glides so semester `index` sits at the page inset. */
  function goToColumn(index: number) {
    const column = columns[Math.max(0, Math.min(columns.length - 1, index))];
    const from = base();
    glideTo({ ...from, x: pageInset() - column.offsetLeft * from.scale });
  }

  /** Index of the semester closest to the page inset (where the camera is heading, if gliding). */
  function currentColumn() {
    const { x, scale } = base();
    const offset = (column: HTMLElement) => Math.abs(x + column.offsetLeft * scale - pageInset());
    return columns.reduce((best, column, i) => (offset(column) < offset(columns[best]) ? i : best), 0);
  }

  /** Viewport-relative position of a pointer or wheel event. */
  function local(event: { clientX: number; clientY: number }): Point {
    const rect = viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  // ── Pointer: drag to pan, two-finger pinch to zoom ──
  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || (event.target as Element).closest('[data-map-controls]')) return;
    stopGlide();
    viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, local(event));
    viewport.dataset.dragging = '';
  }

  function onPointerMove(event: PointerEvent) {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const point = local(event);
    if (pointers.size === 2) {
      const [other] = [...pointers].filter(([id]) => id !== event.pointerId).map(([, p]) => p);
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(point.x - other.x, point.y - other.y);
      if (before > 0) render(zoomAt(camera, after / before, { x: (point.x + other.x) / 2, y: (point.y + other.y) / 2 }));
    } else {
      render({ ...camera, x: camera.x + point.x - previous.x, y: camera.y + point.y - previous.y });
    }
    pointers.set(event.pointerId, point);
  }

  function onPointerUp(event: PointerEvent) {
    pointers.delete(event.pointerId);
    if (pointers.size === 0) delete viewport.dataset.dragging;
  }

  // ── Wheel: pinch / Ctrl+wheel zooms, horizontal swipe pans, vertical scroll is left to the page ──
  function onWheel(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      stopGlide();
      render(zoomAt(camera, Math.exp(-event.deltaY * 0.01), local(event)));
    } else if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      event.preventDefault();
      stopGlide();
      render({ ...camera, x: camera.x - event.deltaX, y: camera.y - event.deltaY });
    }
  }

  // ── Keyboard ──
  const onZoomIn = () => glideTo(zoomAt(base(), ZOOM_STEP, center()));
  const onZoomOut = () => glideTo(zoomAt(base(), 1 / ZOOM_STEP, center()));
  const onFit = () => glideTo(fit(viewSize(), contentSize()));

  function onKeyDown(event: KeyboardEvent) {
    const actions: Record<string, () => void> = {
      ArrowRight: () => goToColumn(currentColumn() + 1),
      ArrowLeft: () => goToColumn(currentColumn() - 1),
      ArrowDown: () => glideTo({ ...base(), y: base().y - 120 }),
      ArrowUp: () => glideTo({ ...base(), y: base().y + 120 }),
      '+': onZoomIn,
      '=': onZoomIn,
      '-': onZoomOut,
      '0': onFit,
    };
    const action = actions[event.key];
    if (action && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      action();
    }
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
    if (desktop.matches) {
      viewport.tabIndex = 0;
      viewport.addEventListener('pointerdown', onPointerDown);
      viewport.addEventListener('pointermove', onPointerMove);
      viewport.addEventListener('pointerup', onPointerUp);
      viewport.addEventListener('pointercancel', onPointerUp);
      viewport.addEventListener('wheel', onWheel, { passive: false });
      viewport.addEventListener('keydown', onKeyDown);
      zoomIn.addEventListener('click', onZoomIn);
      zoomOut.addEventListener('click', onZoomOut);
      zoomFit.addEventListener('click', onFit);
      resize.observe(viewport);
      render({ x: pageInset(), y: 40, scale: 1 });
      armBeam();
    } else {
      stopGlide();
      viewport.removeAttribute('tabindex');
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('pointercancel', onPointerUp);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('keydown', onKeyDown);
      zoomIn.removeEventListener('click', onZoomIn);
      zoomOut.removeEventListener('click', onZoomOut);
      zoomFit.removeEventListener('click', onFit);
      resize.disconnect();
      pointers.clear();
      stage.style.transform = '';
      viewport.style.backgroundSize = '';
      viewport.style.backgroundPosition = '';
      delete viewport.dataset.detail;
    }
  }

  desktop.addEventListener('change', sync);
  sync();
}

document.querySelectorAll<HTMLElement>('[data-map-viewport]').forEach(mountMap);
