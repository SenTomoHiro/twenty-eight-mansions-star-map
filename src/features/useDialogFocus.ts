import { useEffect, type RefObject } from 'react'

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

/** Keep modal keyboard navigation inside the dialog and restore its entry point. */
export function useDialogFocus(dialogRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const background: Array<{ element: HTMLElement; wasInert: boolean }> = []

    // Disable siblings at every ancestor so the header and WebGL controls are
    // excluded from both keyboard navigation and the accessibility tree.
    let branch: HTMLElement = dialog
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== branch) {
          background.push({ element: sibling, wasInert: sibling.inert })
          sibling.setAttribute('inert', '')
        }
      }
      if (branch.parentElement === document.body) break
      branch = branch.parentElement
    }

    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => element.getClientRects().length > 0 && !element.closest('[inert]'))
    const focusFirst = () => (focusable()[0] ?? dialog).focus({ preventScroll: true })
    focusFirst()

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements.at(-1)
      if (!first || !last) {
        event.preventDefault()
        dialog.focus({ preventScroll: true })
      } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    const handleFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) focusFirst()
    }
    document.addEventListener('keydown', handleTab, true)
    document.addEventListener('focusin', handleFocus)

    return () => {
      document.removeEventListener('keydown', handleTab, true)
      document.removeEventListener('focusin', handleFocus)
      for (const { element, wasInert } of background) element.toggleAttribute('inert', wasInert)
      const fallback = document.querySelector<HTMLElement>('.atlas-card__open')
      const target = previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : fallback
      target?.focus({ preventScroll: true })
    }
  }, [dialogRef])
}
