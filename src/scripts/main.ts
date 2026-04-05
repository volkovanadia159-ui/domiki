/**
 * main.ts — Client-side scripts
 * - Scroll animations (IntersectionObserver)
 * - Hero personalization (UTM / referrer)
 */

// ── Scroll Animations ──────────────────────────────────────────────────────────

function initScrollAnimations(): void {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  // Skip if user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// ── Hero Personalization ────────────────────────────────────────────────────────

interface HeroVariant {
  id: string;
  match: { type: string; value?: string };
  title: string;
  subtitle: string;
  cta_text: string;
  cta_action: string;
}

function initHeroPersonalization(): void {
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroCta = document.getElementById('hero-cta');

  if (!heroTitle || !heroSubtitle || !heroCta) return;

  // Check if already personalized this session
  const saved = sessionStorage.getItem('hero_variant');
  if (saved) {
    try {
      const variant: HeroVariant = JSON.parse(saved);
      applyHeroVariant(variant, heroTitle, heroSubtitle, heroCta);
      return;
    } catch {
      // ignore invalid data
    }
  }

  // Fetch variants and match
  fetch('/hero-variants.json')
    .catch(() => null)
    .then(() => {
      // Variants are imported at build time via Astro, so we use inline data
      // For runtime personalization, we read UTM/referrer and match
    });

  // Since hero-variants.json is used at build time, we'll use a simple inline approach
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source')?.toLowerCase();
  const referrer = document.referrer?.toLowerCase() || '';

  // Inline variant rules (mirroring hero-variants.json)
  let variantId = 'default';

  if (utmSource === 'vk') variantId = 'vk';
  else if (utmSource === 'telegram') variantId = 'telegram';
  else if (utmSource === 'yandex') variantId = 'yandex';
  else if (referrer.includes('vk.com')) variantId = 'referrer_vk';

  if (variantId === 'default') return; // Already showing default from SSR

  // Variant data
  const variants: Record<string, Omit<HeroVariant, 'id' | 'match'>> = {
    vk: {
      title: 'Подписчикам ВК — бесплатная доставка!',
      subtitle: 'Картонные домики, которые дети собирают сами. Развивают моторику и фантазию.',
      cta_text: 'Выбрать домик со скидкой',
      cta_action: '#catalog',
    },
    telegram: {
      title: 'Для подписчиков Telegram — специальное предложение',
      subtitle: 'Домики из картона: экологично, увлекательно, полезно. Собери свой мир!',
      cta_text: 'Получить предложение',
      cta_action: '#catalog',
    },
    yandex: {
      title: 'Лучший подарок — тот, что сделан своими руками',
      subtitle: 'Наборы картонных домиков: ребёнок собирает, раскрашивает и играет часами.',
      cta_text: 'Выбрать подарок',
      cta_action: '#catalog',
    },
    referrer_vk: {
      title: 'Рады видеть вас из ВКонтакте!',
      subtitle: 'Картонные домики — творчество и игра в одной коробке.',
      cta_text: 'Посмотреть домики',
      cta_action: '#catalog',
    },
  };

  const v = variants[variantId];
  if (!v) return;

  const variant: HeroVariant = { id: variantId, match: { type: '' }, ...v };
  applyHeroVariant(variant, heroTitle, heroSubtitle, heroCta);
  sessionStorage.setItem('hero_variant', JSON.stringify(variant));

  // Analytics event
  if (typeof window.ym === 'function') {
    window.ym('reachGoal', 'hero_variant', { variant: variantId });
  }
}

function applyHeroVariant(
  variant: HeroVariant,
  title: HTMLElement,
  subtitle: HTMLElement,
  cta: HTMLElement
): void {
  title.textContent = variant.title;
  subtitle.textContent = variant.subtitle;
  cta.textContent = variant.cta_text;
  if (cta instanceof HTMLAnchorElement) {
    cta.href = variant.cta_action;
  }
}

// ── Smooth scroll for anchor links (fallback) ──────────────────────────────────

function initSmoothScroll(): void {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ── Init ────────────────────────────────────────────────────────────────────────

function init(): void {
  initScrollAnimations();
  initHeroPersonalization();
  initSmoothScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Type augmentation for Yandex.Metrika
declare global {
  interface Window {
    ym: (...args: unknown[]) => void;
  }
}
