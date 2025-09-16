// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

// Import other dependencies
import 'choices.js/public/assets/styles/choices.min.css';
import Choices from 'choices.js';

document.addEventListener("DOMContentLoaded", function () {
  const categoriesElement = document.querySelector(
    'select[name="categories"]'
  );
  if (categoriesElement) {
    const choicesCategories = new Choices(categoriesElement);

    const clonedCategoriesInput = categoriesElement
      .closest(".choices__inner")
      .querySelector(".choices__input--cloned");
    // We need to add the id to the input element for accessibility
    if (clonedCategoriesInput)
      clonedCategoriesInput.id = "id_categories_input";
  }

  const countiesElement = document.querySelector('select[name="counties"]');
  if (countiesElement) {
    const choicesCounties = new Choices(countiesElement);

    const clonedCountiesInput = countiesElement
      .closest(".choices__inner")
      .querySelector(".choices__input--cloned");
    if (clonedCountiesInput) {
      clonedCountiesInput.id = "id_counties_input";
    }
  }
});

import Cookies from 'js-cookie'

window.Cookies = Cookies

import "@fancyapps/ui/dist/fancybox/fancybox.css";
import "@fancyapps/ui/dist/carousel/carousel.css";

import "@fancyapps/ui/dist/fancybox/fancybox.umd.js";
import "@fancyapps/ui/dist/carousel/carousel.umd.js";

import jquery from 'jquery';
window.jQuery = window.$ = jquery;

import 'jquery-migrate';

import * as Sentry from "@sentry/browser";

// Sentry Initialization from Django context
try {
  const contextEl = document.getElementById('django-context');
  if (contextEl) {
    const context = JSON.parse(contextEl.textContent);
    if (context.sentry_dsn) {
      Sentry.init({
        dsn: context.sentry_dsn,
        release: context.release,
        environment: context.environment,
        tracesSampleRate: 0.05,
        attachStacktrace: true,
        integrations: [
          Sentry.browserTracingIntegration(),
        ],
      });

      if (context.user_email) {
        Sentry.setUser({ email: context.user_email });
      }
    }
  }
} catch (e) {
  console.error('Could not initialize Sentry:', e);
}