export const startViewTransition = (callback: () => void) => {
  if (!(document as any).startViewTransition) {
    console.log('startViewTransition not supported');
    callback();
  } else {
    (document as any).startViewTransition(callback);
  }
};
