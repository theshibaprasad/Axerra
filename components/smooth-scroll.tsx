'use client'
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect } from 'react'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
    const lenis = useLenis()

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.hash && anchor.hash.startsWith('#') && anchor.origin === window.location.origin) {
                e.preventDefault();
                lenis?.scrollTo(anchor.hash);
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [lenis]);

    return (
        <ReactLenis root>
            {children}
        </ReactLenis>
    )
}
