import type { ReactNode, SVGProps } from 'react'

export type AtlasIconName =
  | 'clock'
  | 'mansions'
  | 'asterism'
  | 'reset'
  | 'close'
  | 'compass'
  | 'location'
  | 'expand'
  | 'compress'
  | 'arrow'

const PATHS: Record<AtlasIconName, ReactNode> = {
  clock: (
    <>
      <circle cx='12' cy='12' r='8.4' />
      <path d='M12 7.1v5.2l3.5 2.1' />
      <path d='M12 2.2v1.4M12 20.4v1.4M2.2 12h1.4M20.4 12h1.4' opacity='.45' />
    </>
  ),
  mansions: (
    <>
      <path d='M3.4 19.2c2.4-9.4 14.8-9.4 17.2 0' />
      <circle cx='12' cy='6.6' r='1.7' />
      <circle cx='4.6' cy='17.6' r='1.2' />
      <circle cx='19.4' cy='17.6' r='1.2' />
      <path d='M7.4 12.6h9.2' opacity='.5' />
    </>
  ),
  asterism: (
    <>
      <circle cx='6.6' cy='16.4' r='1.7' />
      <circle cx='16.9' cy='13.4' r='1.7' />
      <circle cx='10.8' cy='7.4' r='1.7' />
      <path d='M7.9 15.2l7.3-1.2M11.7 8.7l4.2 3.1' />
      <circle cx='19.4' cy='5.8' r='1' opacity='.55' />
    </>
  ),
  reset: (
    <>
      <path d='M19.4 12a7.4 7.4 0 1 1-2.3-5.3' />
      <path d='M19.8 4.4v4.4h-4.4' />
    </>
  ),
  close: <path d='M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6' />,
  compass: (
    <>
      <circle cx='12' cy='12' r='8.4' />
      <path d='M15.2 8.8l-2.1 4.3-4.3 2.1 2.1-4.3z' />
    </>
  ),
  location: (
    <>
      <path d='M12 20.6s6.2-6.1 6.2-10.2A6.2 6.2 0 0 0 5.8 10.4c0 4.1 6.2 10.2 6.2 10.2z' />
      <circle cx='12' cy='10.2' r='2.2' />
    </>
  ),
  expand: (
    <>
      <path d='M9.4 3.6H3.6v5.8M14.6 3.6h5.8v5.8M9.4 20.4H3.6v-5.8M14.6 20.4h5.8v-5.8' />
      <circle cx='12' cy='12' r='2.6' opacity='.6' />
    </>
  ),
  compress: (
    <>
      <circle cx='12' cy='12' r='3.1' />
      <path d='M12 3.2v3.6M12 17.2v3.6M3.2 12h3.6M17.2 12h3.6' />
    </>
  ),
  arrow: (
    <>
      <path d='M4.2 12h14.4' />
      <path d='M13 6.4l5.6 5.6-5.6 5.6' />
    </>
  ),
}

interface AtlasIconProps extends SVGProps<SVGSVGElement> {
  name: AtlasIconName
}

export function AtlasIcon({ name, ...rest }: AtlasIconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      width='20'
      height='20'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.35'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      focusable='false'
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
