/**
 * Equipment loan behavior.
 *
 * - Locker ↔ receipt: hovering (mouse), focusing or tapping a `[data-item-trigger]`
 *   (locker badge or receipt line) sets `data-state="on"` on every `[data-item]` with that id
 *   and `"dim"` on the rest. Leaving, blurring, tapping elsewhere or Esc clears it.
 * - Tabs "Pedir / Devolver": WAI-ARIA tabs (click, ←/→, Home/End). The selected paper comes
 *   to the front; the other stays visible behind it, `inert`.
 */

/**
 * Wires the locker/receipt highlight inside one loan section.
 * @param root - element with `data-loan`
 */
function mountItems(root: HTMLElement) {
  const marks = [...root.querySelectorAll<HTMLElement | SVGElement>('[data-item]')];

  /** Lights one item and dims the others, or clears everything when `id` is omitted. */
  const show = (id?: string) => {
    for (const mark of marks) {
      if (id) mark.dataset.state = mark.dataset.item === id ? 'on' : 'dim';
      else delete mark.dataset.state;
    }
  };

  for (const trigger of root.querySelectorAll<HTMLElement>('[data-item-trigger]')) {
    const id = trigger.dataset.itemTrigger!;
    trigger.addEventListener('pointerenter', (event) => event.pointerType === 'mouse' && show(id));
    trigger.addEventListener('pointerleave', (event) => event.pointerType === 'mouse' && show());
    trigger.addEventListener('focus', () => show(id));
    trigger.addEventListener('blur', () => show());
    trigger.addEventListener('click', () => show(id));
  }

  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('[data-item-trigger]')) show();
  });
  root.addEventListener('keydown', (event) => event.key === 'Escape' && show());
}

/**
 * Wires one tab list and its stacked panels.
 * @param container - element with `data-loan-tabs`
 */
function mountTabs(container: HTMLElement) {
  const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')!)!);

  /** Selects a tab and brings its paper to the front. */
  const select = (index: number, focus = false) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].dataset.state = on ? 'active' : 'inactive';
      panels[i].inert = !on;
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      const target: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in target)) return;
      event.preventDefault();
      select((target[event.key] + tabs.length) % tabs.length, true);
    });
  });
}

document.querySelectorAll<HTMLElement>('[data-loan]').forEach(mountItems);
document.querySelectorAll<HTMLElement>('[data-loan-tabs]').forEach(mountTabs);
