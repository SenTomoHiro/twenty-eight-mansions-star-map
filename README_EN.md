# Twenty-Eight Mansions Star Map

[中文](README.md)

> An interactive web star map centered on the Chinese Twenty-Eight Mansions and the traditional Chinese asterism system.

The project brings modern stellar coordinates, the Twenty-Eight Mansions, traditional asterism relationships, cultural archives, and twenty-eight human-reviewed deity illustrations into one source-aware browser experience. Users can move between a three-dimensional observational sky and a fixed all-sky projection, change the date and time, explore the Four Symbols, and open dedicated features for Beidou, Nandou, and Santai.

## Vision

The goal is to make the spatial and cultural structure of traditional Chinese astronomy explorable with modern web technology while keeping the underlying sources and historical uncertainties visible. This is a cultural visualization and research-navigation project, not a commercial divination service and not a claim to a single authoritative historical mapping.

## Live Demo

[Open the star map](https://sentomohiro.github.io/twenty-eight-mansions-star-map/)

## Origins and Collaboration

The maintainer leads product direction, cultural source review, illustration approval, and final visual and cultural acceptance. GPT / Codex assists with engineering, data organization, implementation, testing, and debugging. Domain decisions remain grounded in reviewable sources and maintainer judgment; AI is not treated as an authority on traditional culture.

## Features

- A draggable and zoomable Three.js celestial sphere plus a fixed all-sky projection.
- A unified data model for the Four Symbols: Azure Dragon, Black Tortoise, White Tiger, and Vermilion Bird.
- Date, time, observer location, and equatorial-to-horizontal coordinate conversion.
- Selection, focus, deity stage, and cultural archive for all Twenty-Eight Mansions.
- Twenty-eight formal digital deity illustrations approved one by one by the maintainer.
- A complete traditional Chinese sky background with source disclosure.
- An independent Important Asterisms layer containing only Beidou Nine Stars, Nandou Six Stars, and Santai.
- Member highlighting, context-safe reuse of Dou-mansion stars for Nandou, and Upper/Middle/Lower Steps for Santai.
- Responsive layouts for desktop, tablet, and mobile.

## Data and Cultural Boundaries

The project keeps modern stellar data, traditional asterism structures, the mansion system, Daoist star worship, and later folk or divination systems conceptually separate. Historical texts, modern identifications, and divine titles may differ across periods and lineages, so records preserve sources, mapping notes, and uncertainty.

Beidou's Bi star is a concrete example: it appears in the cultural record, but this project does not assign it a fabricated HIP, Gaia, or Bayer identity. It is shown only as a clearly differentiated traditional schematic position with the note “modern stellar counterpart not determined.”

## Deity Illustrations

The website ships twenty-eight digital illustrations that passed individual human review. The visual research priority was official photography of the Yuan-dynasty originals, then scroll references based on the original sculptures, then modern colored replicas. Scroll references are not described as original-sculpture photography, and private review materials are not included in this public repository.

## Design Principles

- Keep the architecture simple, stable, data-driven, and separated from presentation.
- Use shared components rather than hard-coded pages for each mansion or asterism.
- Require no login, database, CMS, custom backend, or tracking service.
- Pursue strong visual quality without infrastructure unrelated to the cultural experience.
- State source differences and uncertain mappings explicitly.

## Stack

- React 19
- TypeScript 6
- Vite 8
- Three.js / WebGL
- Responsive CSS
- Vitest

## Local Development

Node.js 20.19+ or 22.12+ is required; the current Node.js 22 LTS is recommended.

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run audit:stellarium-song` reproduces the structural audit of the bundled, version-pinned Stellarium Chinese Song Dynasty sky-culture snapshot.

## Public Repository Layout

```text
src/features/sky          Sky rendering, projection, and interaction
src/features/xingxiu      Mansion navigation, deity stage, and detail views
src/features/asterisms    Important-asterism navigation and detail views
src/data                  Astronomy, asterism, and cultural configuration
src/assets/xingxiu        Approved web illustration assets
data-sources/stellarium   Version-pinned public upstream sky-culture snapshot
scripts                   Data-generation and audit scripts
.github/workflows         GitHub Pages deployment
```

## Sources

See [SOURCES.md](SOURCES.md) for astronomy, classical-text, Daoist, and visual-source notes. Third-party data and software notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Project Status

The current release includes the full Twenty-Eight Mansions star map, twenty-eight formal deity illustrations, cultural archives, the traditional all-sky layer, responsive interaction, and the Beidou, Nandou, and Santai features.

## Contributing

Issues and pull requests are welcome for software defects, responsive behavior, and source-backed corrections to ancient astronomy, modern star mappings, or textual citations. Please identify the source, edition, period, or tradition when proposing cultural-data changes.

## License Status

No project-wide open-source license has been selected yet. Code and digital illustrations remain under default copyright unless separately granted; third-party materials retain their own terms.

