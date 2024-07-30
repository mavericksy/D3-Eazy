function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
function addEventListener(el, eventName, eventHandler, selector) {
  if (selector) {
    const wrappedHandler = (e) => {
      if (!e.target) return;
      const el = e.target.closest(selector);
      if (el) {
        const newEvent = Object.create(e, {
          target: {
            value: el
          }
        });
        eventHandler.call(el, newEvent);
      }
    };
    el.addEventListener(eventName, wrappedHandler);
    return wrappedHandler;
  } else {
    const wrappedHandler = (e) => {
      eventHandler.call(el, e);
    };
    el.addEventListener(eventName, wrappedHandler);
    return wrappedHandler;
  }
}
export {
  addEventListener,
  ready
}
