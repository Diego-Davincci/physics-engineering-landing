/**
 * Shows the hover window of a curriculum-map card (md and up).
 *
 * - Mouse: opens ~120ms after resting on a card; moving to another card switches at once.
 * - Keyboard: cards are tabbable and the window follows focus; Escape closes it.
 * - Closes once the map is dragged or moved with the arrow keys, since the card slides out
 *   from under it (a plain click keeps it open).
 * - A horizontal swipe follows the cursor instead: the window switches to whichever card
 *   slides under it.
 * - Sits to the right of the card, or to the left when there is no room, kept inside the map.
 */

/** Matches the md breakpoint (48rem), same as map-controller.ts. */
const desktop = window.matchMedia('(min-width: 48rem)');
const OPEN_DELAY = 120;
/** Gap between the card and the window, and minimum gap to the map edge, in pixels. */
const GAP = 14;
const INSET = 16;

/**
 * Wires the hover window of one map viewport.
 * @param viewport - element with `data-map-viewport`, holding the cards and `data-hover-card`
 */
function mountHoverCard(viewport: HTMLElement) {
  const panel = viewport.querySelector<HTMLElement>('[data-hover-card]');
  if (!panel) return;
  const cards = [...viewport.querySelectorAll<HTMLElement>('[data-card]')];
  const templates = new Map(
    [...viewport.querySelectorAll<HTMLTemplateElement>('template[data-card-detail]')].map((t) => [t.dataset.cardDetail!, t]),
  );

  let current: HTMLElement | null = null;
  let timer = 0;

  /** Fills the window with a card's content (unless it already shows it) and places it beside the card. */
  function show(card: HTMLElement) {
    clearTimeout(timer);
    if (current !== card) {
      const template = templates.get(card.dataset.card!);
      if (!template) return;
      current?.removeAttribute('aria-describedby');
      current = card;
      panel!.replaceChildren(template.content.cloneNode(true));
      card.setAttribute('aria-describedby', panel!.id);
    }
    place(card);
  }

  /** Puts the window to the right of the card, or to its left when there is no room, inside the map. */
  function place(card: HTMLElement) {
    const view = viewport.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    const width = panel!.offsetWidth;
    const height = panel!.offsetHeight;
    const right = rect.right - view.left + GAP;
    const left = right + width + INSET <= view.width ? right : rect.left - view.left - GAP - width;
    const top = Math.min(Math.max(INSET, rect.top - view.top - 6), view.height - height - INSET);
    panel!.style.transform = `translate(${Math.max(INSET, left)}px, ${Math.max(INSET, top)}px)`;
    panel!.dataset.open = '';
  }

  /** Opens after a short rest, or at once if another card's window is already open. */
  function showSoon(card: HTMLElement) {
    clearTimeout(timer);
    if (current) return show(card);
    timer = window.setTimeout(() => show(card), OPEN_DELAY);
  }

  function hide() {
    clearTimeout(timer);
    current?.removeAttribute('aria-describedby');
    current = null;
    delete panel!.dataset.open;
  }

  const cardOf = (target: EventTarget | null) => (target as Element | null)?.closest<HTMLElement>('[data-card]') ?? null;

  function onPointerOver(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || 'dragging' in viewport.dataset) return;
    const card = cardOf(event.target);
    if (card) showSoon(card);
  }

  function onPointerOut(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    // Card → card is handled by pointerover (switches at once). Only leaving to empty space closes,
    // which also keeps a swipe-opened window when the browser's stale hover target catches up.
    if (cardOf(event.target) && !cardOf(event.relatedTarget)) hide();
  }

  /** A drag that actually moves the map (map-controller sets data-dragging) slides the card away. */
  function onPointerMove() {
    if (current && 'dragging' in viewport.dataset) hide();
  }

  /** True while a mouse/pen/touch press is down: focus from a press is the pointer's, not the keyboard's. */
  let pressing = false;
  const onPress = () => (pressing = true);
  const onRelease = () => (pressing = false);

  function onFocusIn(event: FocusEvent) {
    const card = cardOf(event.target);
    if (!card) return hide();
    if (pressing) return;
    // Wait a frame: map-controller may move the map to bring the focused card into view.
    requestAnimationFrame(() => document.activeElement === card && show(card));
  }

  function onFocusOut(event: FocusEvent) {
    if (!cardOf(event.relatedTarget)) hide();
  }

  const moves = new Set(['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
  const onKeyDown = (event: KeyboardEvent) => moves.has(event.key) && hide();
  /** Last mouse position over the map, in client pixels. */
  let mouse: { x: number; y: number } | null = null;
  let wheelFrame = 0;
  const onMouseMove = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') mouse = { x: event.clientX, y: event.clientY };
  };
  const onMouseLeave = () => (mouse = null);

  /**
   * A horizontal swipe pans the map under a still cursor, and browsers fire no pointerover
   * for that. After the map moves, show the window of whichever card is now under the cursor.
   */
  function onHorizontalWheel(event: WheelEvent) {
    if (!mouse || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    cancelAnimationFrame(wheelFrame);
    wheelFrame = requestAnimationFrame(() => {
      if (!mouse) return;
      const card = cardOf(document.elementFromPoint(mouse.x, mouse.y));
      if (card) show(card);
      else hide();
    });
  }

  /** Turns the window on (md and up) or off (stacked layout, no hover). */
  function sync() {
    const on = desktop.matches;
    const method = on ? 'addEventListener' : 'removeEventListener';
    viewport[method]('pointerover', onPointerOver as EventListener);
    viewport[method]('pointerout', onPointerOut as EventListener);
    viewport[method]('pointermove', onPointerMove);
    viewport[method]('pointermove', onMouseMove as EventListener);
    viewport[method]('pointerleave', onMouseLeave);
    viewport[method]('pointerdown', onPress);
    viewport[method]('pointerup', onRelease);
    viewport[method]('pointercancel', onRelease);
    viewport[method]('focusin', onFocusIn as EventListener);
    viewport[method]('focusout', onFocusOut as EventListener);
    viewport[method]('keydown', onKeyDown as EventListener);
    viewport[method]('wheel', onHorizontalWheel as EventListener, { passive: true } as AddEventListenerOptions);
    for (const card of cards) {
      if (on) card.tabIndex = 0;
      else card.removeAttribute('tabindex');
    }
    if (!on) hide();
  }

  desktop.addEventListener('change', sync);
  sync();
}

document.querySelectorAll<HTMLElement>('[data-map-viewport]').forEach(mountHoverCard);
