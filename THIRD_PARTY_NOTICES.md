# Third-Party Notices

This repository does not grant new rights to third-party data, texts, software, or linked materials.

## Stellarium Chinese Song Dynasty Sky

The traditional-sky structure and line data are derived from **Stellarium 26.2, Chinese Song Dynasty Sky**, contributed by Sun Shuwei（孙殳玮）and distributed under **CC BY-SA 4.0**.

- Source: <https://github.com/Stellarium/stellarium/tree/v26.2/skycultures/chinese_song_dynasty>
- License: <https://creativecommons.org/licenses/by-sa/4.0/>
- Pinned commit: `2b10b1a3bb534eb4e7586751054bf67b36c22e53`

The unmodified public upstream snapshot is kept under `data-sources/stellarium/chinese_song_dynasty/v26.2/`; the runtime derivative is `src/data/traditional-chinese-sky.json`.

## Astronomy catalogues and databases

The project attributes identifiers, coordinates, magnitudes, and parallaxes to the Bright Star Catalogue, ESA Hipparcos catalogues accessed through CDS VizieR, and the SIMBAD / CDS Sesame services. See [SOURCES.md](SOURCES.md) for the exact catalogues and use.

## Software dependencies

Runtime and development packages are installed from the versions locked in `package-lock.json`. Their individual licenses remain available in their upstream packages and repositories. Core runtime dependencies include React and Three.js; the build and test toolchain includes Vite, TypeScript, ESLint, and Vitest.

## Project illustrations

The twenty-eight digital deity illustrations are project assets that passed individual human review. They are not covered by the Stellarium CC BY-SA notice and are not offered under a separate open asset license in this repository.
