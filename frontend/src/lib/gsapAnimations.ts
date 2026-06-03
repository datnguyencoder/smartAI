import gsap from 'gsap';

export function animatePageIn(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(
    el,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
  );
}

export function animateCartBump(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(el, { scale: 1.04 }, { scale: 1, duration: 0.28, ease: 'back.out(2)' });
}

export function animateDrawer(el: HTMLElement | null, open: boolean) {
  if (!el) return;
  if (open) {
    gsap.fromTo(el, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
  }
}

export function animateModalContent(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(
    el,
    { opacity: 0, scale: 0.96 },
    { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
  );
}
