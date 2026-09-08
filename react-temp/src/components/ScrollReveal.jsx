import { useEffect } from "react";

function ScrollReveal() {
  useEffect(() => {
    const revealedElements =
      new WeakSet();

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "is-revealed"
            );

            observer.unobserve(
              entry.target
            );

            revealedElements.add(
              entry.target
            );
          });
        },
        {
          threshold: 0.1,
          rootMargin:
            "0px 0px -40px 0px",
        }
      );

    function observeRevealElements(
      root = document
    ) {
      const elements =
        root.querySelectorAll?.(
          "[data-reveal]"
        ) || [];

      elements.forEach((element) => {
        if (
          revealedElements.has(element) ||
          element.classList.contains(
            "is-revealed"
          )
        ) {
          return;
        }

        observer.observe(element);
      });

      /*
        If the newly added root itself
        has data-reveal, observe it too.
      */
      if (
        root instanceof Element &&
        root.matches("[data-reveal]") &&
        !revealedElements.has(root) &&
        !root.classList.contains(
          "is-revealed"
        )
      ) {
        observer.observe(root);
      }
    }

    /*
      Observe elements already rendered.
    */
    observeRevealElements();

    /*
      Watch React for elements added later,
      such as services and technicians
      loaded from the API.
    */
    const mutationObserver =
      new MutationObserver(
        (mutations) => {
          mutations.forEach(
            (mutation) => {
              mutation.addedNodes.forEach(
                (node) => {
                  if (
                    node.nodeType !==
                    Node.ELEMENT_NODE
                  ) {
                    return;
                  }

                  observeRevealElements(
                    node
                  );
                }
              );
            }
          );
        }
      );

    mutationObserver.observe(
      document.body,
      {
        childList: true,
        subtree: true,
      }
    );

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}

export default ScrollReveal;