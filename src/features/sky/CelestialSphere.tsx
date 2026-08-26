import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import brightStarsData from '../../data/bright-stars.json'
import { OBSERVATION_CAMERA } from '../../config/observation'
import { FOUR_SYMBOL_BY_ID } from '../../data/fourSymbols'
import {
  IMPORTANT_ASTERISMS,
  IMPORTANT_SOURCE_FIGURE_IDS,
  resolveImportantMembers,
} from '../../data/importantAsterisms'
import mansionStarMappingsData from '../../data/mansion-star-mappings.json'
import { MANSIONS } from '../../data/mansions'
import traditionalSkyData from '../../data/traditional-chinese-sky.json'
import type {
  BrightStar,
  Mansion,
  MansionStarMapping,
  TraditionalChineseSkyData,
  TraditionalSkyReference,
} from '../../types/xingxiu'
import type { ImportantAsterism, ImportantAsterismId } from '../../types/importantAsterism'
import {
  clamp,
  equatorialToCartesian,
  makeObservationDate,
} from '../../utils/astronomy'
import {
  SKY_FOV,
  azimuthDegreesFromYaw,
  fovFromPinch,
  fovFromWheel,
  observationCameraFromDrag,
} from './skyInteraction'
import {
  getCachedLabelTextureLayout,
  type LabelTextureLayout,
} from './skyLabelTexture'
import {
  EMPTY_LABEL_COLLISION_STATE,
  LABEL_COLLISION,
  labelFitsViewportWithHysteresis,
  labelScaleForView,
  resolveLabelVisibility,
  screenRectFromCenter,
  visualLabelHalfSize,
  type LabelCollisionState,
  type ScreenLabel,
} from './skyLabelCollision'
import { buildTraditionalPositionCache, type SkyPositionCache } from './skyModel'
import {
  DEFAULT_PANORAMA_VIEWPORT,
  PANORAMA_ORIENTATION,
  SKY_VIEW,
  VIEW_TRANSITION_DURATION,
  panoramaPanByWorld,
  panoramaPanFromDrag,
  panoramaZoomFromPinch,
  panoramaZoomFromWheel,
  projectEquatorialToPanorama,
  resetPanoramaViewport,
  type ObservationCameraState,
  type PanoramaViewportState,
  type SkyViewMode,
} from './panoramaProjection'
import {
  BACKGROUND_STAR_VISUAL,
  OBSERVATION_TRADITIONAL_VISUAL,
  PANORAMA_VISUAL,
  mansionVisualRole,
  observationMansionVisualState,
} from './skyVisualState'

const brightStars = brightStarsData as BrightStar[]
const mansionStarMappings = mansionStarMappingsData.mappings as MansionStarMapping[]
const traditionalSky = traditionalSkyData as TraditionalChineseSkyData
const mansionMappingById = Object.fromEntries(
  mansionStarMappings.map((mapping) => [mapping.mansionId, mapping]),
) as Record<string, MansionStarMapping>

const SKY_RADIUS = 100
const DEFAULT_FOV = SKY_FOV.default
const MIN_FOV = SKY_FOV.min
const MAX_FOV = SKY_FOV.max
const MAX_PITCH = THREE.MathUtils.degToRad(OBSERVATION_CAMERA.maxAltitude)
const PANORAMA_RADIUS = 42

interface CelestialSphereProps {
  date: string
  time: string
  latitude: number
  longitude: number
  timezone: string
  observerLabel: string
  mode: SkyViewMode
  selectedMansion: Mansion
  selectedImportantAsterism?: ImportantAsterism
  onSelectMansion: (id: string) => void
  onSelectImportantAsterism: (id: ImportantAsterismId) => void
  onTransitionChange: (transitioning: boolean) => void
  resetToken: number
  panoramaResetToken: number
}

interface PointerState {
  x: number
  y: number
  startX: number
  startY: number
}

interface FocusTransition {
  fromYaw: number
  toYaw: number
  fromPitch: number
  toPitch: number
  startedAt: number
  duration: number
}

interface SkyRuntime {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  panoramaScene: THREE.Scene
  panoramaCamera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  staticGroup: THREE.Group
  dynamicGroup: THREE.Group
  panoramaGroup: THREE.Group
  definingPositions: Map<string, THREE.Vector3>
  hitTargets: Array<{ id: string; position: THREE.Vector3 }>
  importantHitTargets: Array<{ id: ImportantAsterismId; position: THREE.Vector3; kind: 'label' | 'member' | 'line' }>
  nonInteractiveTargets: THREE.Vector3[]
  panoramaHitTargets: Array<{ id: string; position: THREE.Vector3 }>
  panoramaImportantHitTargets: SkyRuntime['importantHitTargets']
  panoramaNonInteractiveTargets: THREE.Vector3[]
  labelCandidates: Array<{
    sprite: THREE.Sprite
    position: THREE.Vector3
    kind: 'mansion' | 'important' | 'traditional'
    id: string
    name: string
  }>
  panoramaLabelCandidates: SkyRuntime['labelCandidates']
  yaw: number
  pitch: number
  fov: number
  frame: number
  lastLabelUpdate: number
  lastFrameTimestamp: number
  labelCollisionStates: Record<SkyViewMode, LabelCollisionState>
  viewportVisibleTraditionalIds: Record<SkyViewMode, Set<string>>
  mode: SkyViewMode
  savedObservation: ObservationCameraState
  panoramaViewport: PanoramaViewportState
  transition?: {
    from: SkyViewMode
    to: SkyViewMode
    startedAt: number
  }
  onTransitionChange: (transitioning: boolean) => void
  focus?: FocusTransition
  lastSelectedId?: string
}

const starVertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = aSize * uPixelRatio;
    vAlpha = aAlpha * uOpacity;
  }
`

const starFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (distanceFromCenter > 1.0) discard;
    float halo = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
    float core = 1.0 - smoothstep(0.0, 0.22, distanceFromCenter);
    gl_FragColor = vec4(uColor, vAlpha * (halo * 0.58 + core * 0.78));
  }
`

function directionFromView(yaw: number, pitch: number) {
  const cosPitch = Math.cos(pitch)
  return new THREE.Vector3(
    Math.sin(yaw) * cosPitch,
    Math.sin(pitch),
    Math.cos(yaw) * cosPitch,
  )
}

function updateCamera(runtime: SkyRuntime) {
  runtime.camera.fov = runtime.fov
  runtime.camera.updateProjectionMatrix()
  runtime.camera.lookAt(directionFromView(runtime.yaw, runtime.pitch))
}

function updatePanoramaCamera(runtime: SkyRuntime) {
  runtime.panoramaCamera.zoom = runtime.panoramaViewport.zoom
  runtime.panoramaCamera.position.set(
    runtime.panoramaViewport.panX,
    runtime.panoramaViewport.panY,
    100,
  )
  runtime.panoramaCamera.updateProjectionMatrix()
}

function shortestAngle(from: number, to: number) {
  return from + THREE.MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI
}

function makeLabelTexture(
  title: string,
  subtitle: string,
  color: string,
  compact = false,
) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to create a label texture')

  const layout = getCachedLabelTextureLayout(
    { title, subtitle, compact },
    (text, font) => {
      context.font = font
      return context.measureText(text)
    },
  )
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.ceil(layout.width * pixelRatio)
  canvas.height = Math.ceil(layout.height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  context.clearRect(0, 0, layout.width, layout.height)
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  context.fillStyle = color
  context.font = layout.titleFont
  context.fillText(title, layout.width / 2, layout.titleBaseline)

  if (subtitle && layout.subtitleBaseline !== undefined) {
    context.fillStyle = 'rgba(229, 219, 198, 0.64)'
    context.font = layout.subtitleFont
    context.fillText(subtitle, layout.width / 2, layout.subtitleBaseline)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return { texture, layout }
}

function makeLabelSprite(
  title: string,
  subtitle: string,
  color: string,
  compact = false,
) {
  const { texture, layout } = makeLabelTexture(title, subtitle, color, compact)
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  material.userData.baseOpacity = 1
  material.userData.groupOpacity = 1
  material.userData.collisionOpacity = 1
  const sprite = new THREE.Sprite(material)
  const spriteHeight = compact ? 3.6 : 3.8
  sprite.scale.set(spriteHeight * layout.aspectRatio, spriteHeight, 1)
  sprite.userData.labelLayout = { ...layout, title, subtitle, compact }
  sprite.renderOrder = 20
  return sprite
}

function makeStaticHorizon() {
  const group = new THREE.Group()
  group.name = 'local-horizon'

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(SKY_RADIUS * 1.32, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDirection;
        void main() {
          float heightMix = smoothstep(-0.10, 0.82, vDirection.y);
          float earthward = smoothstep(0.04, -0.55, vDirection.y);
          vec3 horizon = vec3(0.075, 0.083, 0.092);
          vec3 zenith = vec3(0.020, 0.037, 0.055);
          vec3 color = mix(horizon, zenith, heightMix);
          color = mix(color, vec3(0.012, 0.015, 0.018), earthward * 0.5);
          float warmVeil = (1.0 - heightMix) * 0.012;
          color += vec3(warmVeil, warmVeil * 0.72, warmVeil * 0.4);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  )
  skyDome.renderOrder = -10
  group.add(skyDome)

  const groundGeometry = new THREE.SphereGeometry(
    SKY_RADIUS * 0.985,
    64,
    28,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2,
  )
  const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshBasicMaterial({
      color: 0x111519,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.22,
      depthTest: false,
      depthWrite: false,
    }),
  )
  ground.renderOrder = 7
  group.add(ground)

  const horizonPoints = Array.from({ length: 256 }, (_, index) => {
    const angle = (index / 256) * Math.PI * 2
    return new THREE.Vector3(
      Math.sin(angle) * SKY_RADIUS,
      0,
      Math.cos(angle) * SKY_RADIUS,
    )
  })
  const horizonGeometry = new THREE.BufferGeometry().setFromPoints(horizonPoints)
  const horizon = new THREE.LineLoop(
    horizonGeometry,
    new THREE.LineBasicMaterial({
      color: 0xa8845e,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    }),
  )
  horizon.renderOrder = 8
  group.add(horizon)

  const haze = new THREE.Mesh(
    new THREE.RingGeometry(SKY_RADIUS * 0.78, SKY_RADIUS, 128),
    new THREE.MeshBasicMaterial({
      color: 0x6f5a40,
      transparent: true,
      opacity: 0.065,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  haze.rotation.x = -Math.PI / 2
  haze.position.y = 0.06
  group.add(haze)

  const cardinalPoints = [
    { title: '北', subtitle: 'N', azimuth: 0 },
    { title: '东', subtitle: 'E', azimuth: 90 },
    { title: '南', subtitle: 'S', azimuth: 180 },
    { title: '西', subtitle: 'W', azimuth: 270 },
  ]

  cardinalPoints.forEach(({ title, subtitle, azimuth }) => {
    const radians = THREE.MathUtils.degToRad(azimuth)
    const label = makeLabelSprite(title, subtitle, '#e1d2b6', true)
    label.position.set(
      Math.sin(radians) * (SKY_RADIUS * 0.93),
      2.1,
      Math.cos(radians) * (SKY_RADIUS * 0.93),
    )
    group.add(label)
  })

  const zenith = makeLabelSprite('天顶', 'ZENITH', '#e1d2b6', true)
  zenith.position.set(0, SKY_RADIUS * 0.94, 0)
  group.add(zenith)

  return group
}

function starMaterial(color: THREE.ColorRepresentation, opacity: number, pixelRatio: number) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uPixelRatio: { value: pixelRatio },
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
  material.userData.baseOpacity = opacity
  return material
}

function makeStarPoints(
  positions: THREE.Vector3[],
  sizes: number[],
  alphas: number[],
  color: THREE.ColorRepresentation,
  opacity: number,
  pixelRatio: number,
) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions.flatMap((point) => point.toArray()), 3),
  )
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alphas, 1))
  return new THREE.Points(geometry, starMaterial(color, opacity, pixelRatio))
}

function clippedHorizonSegment(a: THREE.Vector3, b: THREE.Vector3) {
  return [a, b] as const
}

function lineMaterial(color: THREE.ColorRepresentation, opacity: number) {
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  })
  material.userData.baseOpacity = opacity
  return material
}

function setMaterialBaseOpacity(material: THREE.Material, opacity: number) {
  const transparentMaterial = material as THREE.Material & { opacity?: number }
  material.userData.baseOpacity = opacity
  material.userData.groupOpacity ??= 1
  material.userData.collisionOpacity ??= 1
  if (typeof transparentMaterial.opacity === 'number') {
    transparentMaterial.opacity = opacity
      * Number(material.userData.groupOpacity)
      * Number(material.userData.collisionOpacity)
  }
}

function setLabelCollisionOpacity(sprite: THREE.Sprite, opacity: number) {
  const material = sprite.material
  material.userData.collisionOpacity = opacity
  material.userData.targetCollisionOpacity = opacity
  material.opacity = Number(material.userData.baseOpacity ?? 1)
    * Number(material.userData.groupOpacity ?? 1)
    * opacity
}

function setGroupOpacity(group: THREE.Object3D, amount: number) {
  group.traverse((object) => {
    const renderable = object as THREE.Mesh
    const materials = renderable.material
      ? Array.isArray(renderable.material) ? renderable.material : [renderable.material]
      : []
    materials.forEach((material) => {
      const shader = material as THREE.ShaderMaterial
      const baseOpacity = Number(material.userData.baseOpacity ?? 1)
      material.userData.groupOpacity = amount
      const collisionOpacity = Number(material.userData.collisionOpacity ?? 1)
      if (shader.uniforms?.uOpacity) shader.uniforms.uOpacity.value = baseOpacity * amount
      else if ('opacity' in material) {
        (material as THREE.Material & { opacity: number }).opacity = baseOpacity * amount * collisionOpacity
      }
    })
  })
}

function pointFromCache(positions: SkyPositionCache, reference: TraditionalSkyReference) {
  const coordinate = positions.get(reference)
  return coordinate
    ? new THREE.Vector3(coordinate.x, coordinate.y, coordinate.z)
    : undefined
}

function labelCenter(
  positions: SkyPositionCache,
  references: TraditionalSkyReference[],
) {
  const points = references
    .map((reference) => pointFromCache(positions, reference))
    .filter((point): point is THREE.Vector3 => Boolean(point))
  if (points.length === 0) return undefined
  const center = points.reduce((sum, point) => sum.add(point.clone().normalize()), new THREE.Vector3())
  if (center.lengthSq() < 0.000001) return points[0]?.clone()
  return center.normalize().multiplyScalar(SKY_RADIUS * 0.96)
}

function disposeGroup(group: THREE.Object3D) {
  group.traverse((object) => {
    const mesh = object as THREE.Mesh
    mesh.geometry?.dispose()
    const materials = mesh.material
      ? Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      : []
    materials.forEach((material) => {
      const mappedMaterial = material as THREE.Material & { map?: THREE.Texture | null }
      mappedMaterial.map?.dispose()
      material.dispose()
    })
  })
}

function rebuildSky(
  runtime: SkyRuntime,
  date: string,
  time: string,
  latitude: number,
  longitude: number,
  timezone: string,
  selectedMansion: Mansion,
  selectedImportantAsterism?: ImportantAsterism,
) {
  const previousGroup = runtime.dynamicGroup
  const group = new THREE.Group()
  group.name = 'ra-dec-celestial-sphere'
  const observationDate = makeObservationDate(date, time, timezone)
  const pixelRatio = runtime.renderer.getPixelRatio()
  const positionCache = buildTraditionalPositionCache(
    traditionalSky,
    observationDate,
    latitude,
    longitude,
    SKY_RADIUS,
  )

  const backgroundPositions: THREE.Vector3[] = []
  const backgroundSizes: number[] = []
  const backgroundAlphas: number[] = []
  brightStars.forEach((star) => {
    const coordinate = equatorialToCartesian(
      star,
      observationDate,
      latitude,
      longitude,
      SKY_RADIUS,
    )
    backgroundPositions.push(new THREE.Vector3(coordinate.x, coordinate.y, coordinate.z))
    const strength = clamp((5.3 - star.mag) / 5.6, 0.12, 1)
    const horizonFade = coordinate.y >= 0
      ? clamp(coordinate.y / 18, BACKGROUND_STAR_VISUAL.aboveAlphaFloor, 1)
      : clamp(
          BACKGROUND_STAR_VISUAL.belowAlphaFloor + Math.abs(coordinate.y) / 220,
          BACKGROUND_STAR_VISUAL.belowAlphaFloor,
          BACKGROUND_STAR_VISUAL.belowAlphaCeiling,
        )
    const tierSize = star.mag <= 1.5 ? 6.55 : star.mag <= 3 ? 4.65 : 2.75
    const tierAlpha = star.mag <= 1.5 ? 1 : star.mag <= 3 ? 0.92 : 0.7
    backgroundSizes.push(tierSize + strength)
    backgroundAlphas.push(tierAlpha * horizonFade)
  })
  group.add(makeStarPoints(
    backgroundPositions,
    backgroundSizes,
    backgroundAlphas,
    0xf5ead5,
    1,
    pixelRatio,
  ))

  const definingPositions = new Map<string, THREE.Vector3>()
  const hitTargets: Array<{ id: string; position: THREE.Vector3 }> = []
  const importantHitTargets: SkyRuntime['importantHitTargets'] = []
  const nonInteractiveTargets: THREE.Vector3[] = []
  const labelCandidates: SkyRuntime['labelCandidates'] = []

  const traditionalPositions: THREE.Vector3[] = []
  const traditionalSizes: number[] = []
  const traditionalAlphas: number[] = []
  traditionalSky.stars.forEach((star) => {
    const point = pointFromCache(positionCache, star.hip)
    if (!point) return
    traditionalPositions.push(point)
    traditionalSizes.push(clamp((6.6 - star.mag) * 0.38, 0.75, 2.1))
    traditionalAlphas.push(
      clamp((6.8 - star.mag) / 6.8, 0.24, 0.62)
        * (point.y >= 0 ? 1 : OBSERVATION_TRADITIONAL_VISUAL.below.starOpacity / OBSERVATION_TRADITIONAL_VISUAL.above.starOpacity),
    )
  })
  group.add(makeStarPoints(
    traditionalPositions,
    traditionalSizes,
    traditionalAlphas,
    0xb9ad96,
    OBSERVATION_TRADITIONAL_VISUAL.above.starOpacity,
    pixelRatio,
  ))

  const traditionalLinePositions: number[] = []
  const belowTraditionalLinePositions: number[] = []
  let visibleTraditionalAsterismCount = 0
  traditionalSky.figures.forEach((figure) => {
    if (figure.isLunarMansion || IMPORTANT_SOURCE_FIGURE_IDS.has(figure.id)) return
    const center = labelCenter(positionCache, figure.memberRefs)
    if (center) {
      nonInteractiveTargets.push(center.clone())
      if (center.y >= 0) visibleTraditionalAsterismCount += 1
      const label = makeLabelSprite(figure.name, '', center.y >= 0 ? '#c0b192' : '#91938e', true)
      label.position.copy(center)
      label.scale.multiplyScalar(0.66)
      setMaterialBaseOpacity(
        label.material,
        center.y >= 0
          ? OBSERVATION_TRADITIONAL_VISUAL.above.labelOpacity
          : OBSERVATION_TRADITIONAL_VISUAL.below.labelOpacity,
      )
      setLabelCollisionOpacity(label, 0)
      label.visible = false
      group.add(label)
      labelCandidates.push({
        sprite: label,
        position: center,
        kind: 'traditional',
        id: figure.id,
        name: figure.name,
      })
    }
    figure.lines.forEach((strip) => {
      for (let index = 1; index < strip.length; index += 1) {
        const previous = pointFromCache(positionCache, strip[index - 1]!)
        const current = pointFromCache(positionCache, strip[index]!)
        if (!previous || !current || previous.distanceToSquared(current) < 0.000001) continue
        const segment = clippedHorizonSegment(previous, current)
        const target = segment[0].y < 0 && segment[1].y < 0
          ? belowTraditionalLinePositions
          : traditionalLinePositions
        target.push(...segment[0].toArray(), ...segment[1].toArray())
        nonInteractiveTargets.push(segment[0].clone().lerp(segment[1], 0.5))
      }
    })
    figure.memberRefs.forEach((reference) => {
      const member = pointFromCache(positionCache, reference)
      if (member) nonInteractiveTargets.push(member)
    })
  })
  if (traditionalLinePositions.length > 0) {
    const traditionalLineGeometry = new THREE.BufferGeometry()
    traditionalLineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(traditionalLinePositions, 3),
    )
    const traditionalLines = new THREE.LineSegments(
      traditionalLineGeometry,
      lineMaterial(0xa99a80, OBSERVATION_TRADITIONAL_VISUAL.above.lineOpacity),
    )
    traditionalLines.renderOrder = 1
    group.add(traditionalLines)
  }
  if (belowTraditionalLinePositions.length > 0) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(belowTraditionalLinePositions, 3))
    const lines = new THREE.LineSegments(
      geometry,
      lineMaterial(0x858985, OBSERVATION_TRADITIONAL_VISUAL.below.lineOpacity),
    )
    lines.renderOrder = 1
    group.add(lines)
  }

  MANSIONS.forEach((mansion) => {
    const mapping = mansionMappingById[mansion.id]
    if (!mapping) return
    const selected = !selectedImportantAsterism && mansion.id === selectedMansion.id
    const sameSymbol = !selectedImportantAsterism && mansion.symbolId === selectedMansion.symbolId
    const visualRole = mansionVisualRole(selected, sameSymbol)
    const aboveVisual = observationMansionVisualState(visualRole, false)
    const belowVisual = observationMansionVisualState(visualRole, true)
    const accent = FOUR_SYMBOL_BY_ID[mansion.symbolId].accent
    const positionByHip = new Map<number, THREE.Vector3>()

    mapping.stars.forEach((star) => {
      const coordinate = pointFromCache(positionCache, star.hip)
      if (!coordinate) return
      positionByHip.set(star.hip, coordinate)
      hitTargets.push({ id: mansion.id, position: coordinate.clone() })
    })

    const defining = positionByHip.get(mapping.definingStarHip)
    if (defining) definingPositions.set(mansion.id, defining.clone())

    const visibleStars = mapping.stars.filter((star) => positionByHip.has(star.hip))
    if (visibleStars.length > 0) {
      const positions = visibleStars.map((star) => positionByHip.get(star.hip)!).filter(Boolean)
      const sizes = visibleStars.map((star) => {
        const magnitudeSize = clamp((5.6 - star.mag) * 0.72, 1.1, 4.1)
        return magnitudeSize + (selected ? 4.2 : sameSymbol ? 1.65 : 1)
      })
      const alphas = visibleStars.map((star) => {
        const strength = clamp((5.6 - star.mag) / 5.6, 0.24, 1)
        const belowHorizon = (positionByHip.get(star.hip)?.y ?? 0) < 0
        const horizonFactor = belowHorizon ? belowVisual.starOpacity / aboveVisual.starOpacity : 1
        return strength * horizonFactor
      })
      group.add(makeStarPoints(
        positions,
        sizes,
        alphas,
        new THREE.Color(accent).lerp(new THREE.Color(0xe5d2b2), selected ? 0.38 : 0.12),
        aboveVisual.starOpacity,
        pixelRatio,
      ))
    }

    const aboveLinePositions: number[] = []
    const belowLinePositions: number[] = []
    mapping.lines.forEach((strip) => {
      for (let index = 1; index < strip.length; index += 1) {
        const previousHip = strip[index - 1]
        const hip = strip[index]
        if (previousHip === undefined || hip === undefined) continue
        const previous = positionByHip.get(previousHip)
        const current = positionByHip.get(hip)
        if (!previous || !current) continue
        const segment = clippedHorizonSegment(previous, current)
        if (!segment) continue
        const target = segment[0].y < 0 && segment[1].y < 0
          ? belowLinePositions
          : aboveLinePositions
        target.push(...segment[0].toArray(), ...segment[1].toArray())
        hitTargets.push({
          id: mansion.id,
          position: segment[0].clone().lerp(segment[1], 0.5),
        })
      }
    })

    const addMansionLines = (positions: number[], belowHorizon: boolean) => {
      if (positions.length === 0) return
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      const lines = new THREE.LineSegments(
        geometry,
        lineMaterial(
          selected
            ? new THREE.Color(accent).lerp(new THREE.Color(0xf1ddbb), 0.38)
            : accent,
          (belowHorizon ? belowVisual : aboveVisual).lineOpacity,
        ),
      )
      lines.renderOrder = selected ? 6 : 3
      group.add(lines)
    }
    addMansionLines(aboveLinePositions, false)
    addMansionLines(belowLinePositions, true)

    if (defining) {
      const belowHorizon = defining.y < 0
      const label = makeLabelSprite(
        mansion.name,
        selected ? `${mansion.latin} · HIP ${mapping.definingStarHip}` : mansion.latin,
        selected ? '#ffe9c5' : belowHorizon ? '#969894' : sameSymbol ? '#d1bea0' : '#b9aa90',
      )
      label.position.copy(defining).multiplyScalar(0.955)
      label.position.y += selected ? 2.3 : sameSymbol ? 1.2 : 0.7
      setMaterialBaseOpacity(
        label.material,
        (belowHorizon ? belowVisual : aboveVisual).labelOpacity,
      )
      label.scale.multiplyScalar(selected ? 1 : sameSymbol ? 0.78 : 0.64)
      label.visible = true
      group.add(label)
      labelCandidates.push({
        sprite: label,
        position: label.position.clone(),
        kind: 'mansion',
        id: mansion.id,
        name: mansion.name,
      })
    }
  })

  IMPORTANT_ASTERISMS.forEach((asterism) => {
    const selected = asterism.id === selectedImportantAsterism?.id
    const members = resolveImportantMembers(asterism).filter((member) => member.star)
    const positionByHip = new Map<number, THREE.Vector3>()
    members.forEach((member) => {
      const point = member.hip === undefined ? undefined : pointFromCache(positionCache, member.hip)
      if (!point || member.hip === undefined) return
      positionByHip.set(member.hip, point)
      importantHitTargets.push({ id: asterism.id, position: point.clone(), kind: 'member' })
    })
    const center = labelCenter(positionCache, members.flatMap((member) => member.hip === undefined ? [] : [member.hip]))
    if (center) {
      definingPositions.set(asterism.id, center.clone())
      importantHitTargets.push({ id: asterism.id, position: center.clone(), kind: 'label' })
    }
    const positions = members.flatMap((member) => member.hip === undefined ? [] : [positionByHip.get(member.hip)]).filter((point): point is THREE.Vector3 => Boolean(point))
    if (positions.length > 0) {
      group.add(makeStarPoints(
        positions,
        members.map((member) => clamp((5.8 - member.star!.mag) * 0.7, 1.6, 4.2) + (selected ? 4.4 : 1.75)),
        members.map((member) => clamp((5.8 - member.star!.mag) / 5.8, 0.38, 1)),
        selected ? 0xffddb0 : 0xd8ad78,
        selected ? 1 : selectedImportantAsterism ? 0.24 : 0.7,
        pixelRatio,
      ))
    }
    const linePositions: number[] = []
    asterism.lines.forEach((strip) => {
      for (let index = 1; index < strip.length; index += 1) {
        const previous = positionByHip.get(strip[index - 1]!)
        const current = positionByHip.get(strip[index]!)
        if (!previous || !current) continue
        linePositions.push(...previous.toArray(), ...current.toArray())
        importantHitTargets.push({ id: asterism.id, position: previous.clone().lerp(current, 0.5), kind: 'line' })
      }
    })
    if (linePositions.length > 0) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
      const lines = new THREE.LineSegments(
        geometry,
        lineMaterial(selected ? 0xffddb0 : 0xd8ad78, selected ? 0.95 : selectedImportantAsterism ? 0.16 : 0.5),
      )
      lines.renderOrder = selected ? 9 : 5
      group.add(lines)
    }
    if (center) {
      const label = makeLabelSprite(
        asterism.name,
        selected ? `${asterism.members.length} 位 · IMPORTANT` : '重要星官',
        selected ? '#ffe5bd' : '#d9b785',
      )
      label.position.copy(center).multiplyScalar(0.95)
      label.position.y += selected ? 2.6 : 1.4
      setMaterialBaseOpacity(label.material, selected ? 1 : selectedImportantAsterism ? 0.42 : 0.82)
      label.scale.multiplyScalar(selected ? 1 : 0.74)
      label.visible = true
      group.add(label)
      labelCandidates.push({ sprite: label, position: label.position.clone(), kind: 'important', id: asterism.id, name: asterism.name })
    }
  })

  runtime.scene.add(group)
  runtime.scene.remove(previousGroup)
  disposeGroup(previousGroup)
  runtime.dynamicGroup = group
  runtime.definingPositions = definingPositions
  runtime.hitTargets = hitTargets
  runtime.importantHitTargets = importantHitTargets
  runtime.nonInteractiveTargets = nonInteractiveTargets
  runtime.labelCandidates = labelCandidates
  const canvas = runtime.renderer.domElement
  const visibleMansions = MANSIONS.filter((mansion) => {
    const defining = definingPositions.get(mansion.id)
    return defining ? defining.y >= 0 : false
  }).length
  canvas.dataset.mansionEntityCount = String(MANSIONS.length)
  canvas.dataset.visibleMansionCount = String(visibleMansions)
  canvas.dataset.traditionalFigureCount = String(traditionalSky.metadata.counts.renderFigures)
  canvas.dataset.visibleTraditionalAsterismCount = String(visibleTraditionalAsterismCount)
  canvas.dataset.traditionalStarCount = String(traditionalSky.metadata.counts.uniqueHipStars)
  canvas.dataset.mansionHitTargetCount = String(hitTargets.length)
  canvas.dataset.importantAsterismCount = String(IMPORTANT_ASTERISMS.length)
  canvas.dataset.importantAsterismHitTargetCount = String(importantHitTargets.length)
  canvas.dataset.traditionalNonInteractiveTargetCount = String(nonInteractiveTargets.length)
  canvas.dataset.observation = `${date}T${time}`

  const currentSelectedId = selectedImportantAsterism?.id ?? selectedMansion.id
  if (runtime.lastSelectedId && runtime.lastSelectedId !== currentSelectedId) {
    const targetPosition = definingPositions.get(currentSelectedId)
    if (targetPosition) {
      const normalized = targetPosition.clone().normalize()
      const targetYaw = Math.atan2(normalized.x, normalized.z)
      const truePitch = Math.asin(clamp(normalized.y, -1, 1))
      const targetPitch = clamp(truePitch, -MAX_PITCH, MAX_PITCH)
      runtime.focus = {
        fromYaw: runtime.yaw,
        toYaw: shortestAngle(runtime.yaw, targetYaw),
        fromPitch: runtime.pitch,
        toPitch: targetPitch,
        startedAt: performance.now(),
        duration: 720,
      }
    }
  }
  runtime.lastSelectedId = currentSelectedId
}

function panoramaVector(coordinate: { ra: number; dec: number }) {
  const projected = projectEquatorialToPanorama(coordinate, PANORAMA_RADIUS)
  return new THREE.Vector3(projected.x, projected.y, projected.z)
}

function panoramaLabelCenter(cache: SkyPositionCache, references: TraditionalSkyReference[]) {
  const points = references
    .map((reference) => pointFromCache(cache, reference))
    .filter((point): point is THREE.Vector3 => Boolean(point))
  if (points.length === 0) return undefined
  return points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length)
}

function buildPanorama(runtime: SkyRuntime, selectedMansion: Mansion, selectedImportantAsterism?: ImportantAsterism) {
  const previousGroup = runtime.panoramaGroup
  const group = new THREE.Group()
  group.name = 'fixed-ra-dec-all-sky-panorama'
  const pixelRatio = runtime.renderer.getPixelRatio()

  const backdropMaterial = new THREE.MeshBasicMaterial({
    color: 0x080d12,
    transparent: true,
    opacity: 0.965,
    depthWrite: false,
  })
  backdropMaterial.userData.baseOpacity = 0.965
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), backdropMaterial)
  backdrop.position.z = -8
  backdrop.renderOrder = -10
  group.add(backdrop)

  ;[PANORAMA_RADIUS / 4, PANORAMA_RADIUS / 2, PANORAMA_RADIUS * 0.75, PANORAMA_RADIUS].forEach((radius, index) => {
    const points = Array.from({ length: 192 }, (_, pointIndex) => {
      const angle = pointIndex / 192 * Math.PI * 2
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -1)
    })
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      lineMaterial(index === 3 ? 0xa98660 : 0x777166, index === 3 ? 0.42 : 0.11),
    )
    group.add(ring)
  })

  const backgroundPositions = brightStars.map(panoramaVector)
  const backgroundSizes = brightStars.map((star) => star.mag <= 1.5 ? 4.4 : star.mag <= 3 ? 3.1 : 1.8)
  const backgroundAlphas = brightStars.map((star) => clamp((5.3 - star.mag) / 5.6, 0.18, 0.76))
  group.add(makeStarPoints(
    backgroundPositions,
    backgroundSizes.map((size) => size + 0.25),
    backgroundAlphas.map((alpha) => Math.min(1, alpha * 1.12)),
    0xeee2cd,
    PANORAMA_VISUAL.backgroundStarOpacity,
    pixelRatio,
  ))

  const cache: SkyPositionCache = new Map()
  traditionalSky.stars.forEach((star) => {
    const point = panoramaVector(star)
    cache.set(star.hip, { x: point.x, y: point.y, z: point.z, altitude: 0, azimuth: 0 })
  })
  traditionalSky.deepSkyObjects.forEach((object) => {
    const point = panoramaVector(object)
    cache.set(object.id, { x: point.x, y: point.y, z: point.z, altitude: 0, azimuth: 0 })
  })

  const traditionalPositions = traditionalSky.stars.map((star) => pointFromCache(cache, star.hip)!).filter(Boolean)
  const traditionalSizes = traditionalSky.stars.map((star) => clamp((6.6 - star.mag) * 0.3, 0.52, 1.55))
  const traditionalAlphas = traditionalSky.stars.map((star) => clamp((6.8 - star.mag) / 6.8, 0.12, 0.42))
  group.add(makeStarPoints(
    traditionalPositions,
    traditionalSizes.map((size) => size + 0.18),
    traditionalAlphas.map((alpha) => Math.min(0.62, alpha * 1.24)),
    0xb2aa9a,
    PANORAMA_VISUAL.traditionalStarOpacity,
    pixelRatio,
  ))

  const ordinaryLinePositions: number[] = []
  const nonInteractiveTargets: THREE.Vector3[] = []
  const labelCandidates: SkyRuntime['labelCandidates'] = []
  traditionalSky.figures.forEach((figure) => {
    if (figure.isLunarMansion || IMPORTANT_SOURCE_FIGURE_IDS.has(figure.id)) return
    const center = panoramaLabelCenter(cache, figure.memberRefs)
    if (center) {
      nonInteractiveTargets.push(center.clone())
      const label = makeLabelSprite(figure.name, '', '#aaa293', true)
      label.position.copy(center)
      label.scale.multiplyScalar(0.45)
      setMaterialBaseOpacity(label.material, PANORAMA_VISUAL.traditionalLabelOpacity)
      setLabelCollisionOpacity(label, 0)
      label.visible = false
      group.add(label)
      labelCandidates.push({
        sprite: label,
        position: center.clone(),
        kind: 'traditional',
        id: figure.id,
        name: figure.name,
      })
    }
    figure.lines.forEach((strip) => {
      for (let index = 1; index < strip.length; index += 1) {
        const previous = pointFromCache(cache, strip[index - 1]!)
        const current = pointFromCache(cache, strip[index]!)
        if (!previous || !current || previous.distanceToSquared(current) < 0.000001) continue
        ordinaryLinePositions.push(...previous.toArray(), ...current.toArray())
        nonInteractiveTargets.push(previous.clone().lerp(current, 0.5))
      }
    })
  })
  if (ordinaryLinePositions.length > 0) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(ordinaryLinePositions, 3))
    group.add(new THREE.LineSegments(
      geometry,
      lineMaterial(0x9e9482, PANORAMA_VISUAL.traditionalLineOpacity),
    ))
  }

  const hitTargets: Array<{ id: string; position: THREE.Vector3 }> = []
  MANSIONS.forEach((mansion) => {
    const mapping = mansionMappingById[mansion.id]
    if (!mapping) return
    const selected = !selectedImportantAsterism && mansion.id === selectedMansion.id
    const accent = FOUR_SYMBOL_BY_ID[mansion.symbolId].accent
    const positions = mapping.stars.map((star) => ({ star, point: panoramaVector(star) }))
    const positionByHip = new Map(positions.map(({ star, point }) => [star.hip, point]))
    positions.forEach(({ point }) => hitTargets.push({ id: mansion.id, position: point.clone() }))
    group.add(makeStarPoints(
      positions.map(({ point }) => point),
      positions.map(({ star }) => clamp((5.6 - star.mag) * 0.55, 1, 3.4) + (selected ? 3 : 1.05)),
      positions.map(({ star }) => clamp((5.6 - star.mag) / 5.6, 0.26, 1)),
      accent,
      selected ? PANORAMA_VISUAL.mansionStarOpacity.selected : PANORAMA_VISUAL.mansionStarOpacity.other,
      pixelRatio,
    ))

    const lines: number[] = []
    mapping.lines.forEach((strip) => {
      for (let index = 1; index < strip.length; index += 1) {
        const previous = positionByHip.get(strip[index - 1]!)
        const current = positionByHip.get(strip[index]!)
        if (!previous || !current) continue
        lines.push(...previous.toArray(), ...current.toArray())
        hitTargets.push({ id: mansion.id, position: previous.clone().lerp(current, 0.5) })
      }
    })
    if (lines.length > 0) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
      const object = new THREE.LineSegments(
        geometry,
        lineMaterial(
          selected ? new THREE.Color(accent).lerp(new THREE.Color(0xf1ddbb), 0.35) : accent,
          selected ? PANORAMA_VISUAL.mansionLineOpacity.selected : PANORAMA_VISUAL.mansionLineOpacity.other,
        ),
      )
      object.renderOrder = selected ? 6 : 3
      group.add(object)
    }

    const defining = positionByHip.get(mapping.definingStarHip)
    if (defining) {
      const label = makeLabelSprite(
        mansion.name,
        selected ? `${mansion.latin} · HIP ${mapping.definingStarHip}` : mansion.latin,
        selected ? '#ffe6bd' : '#c5b89f',
      )
      label.position.copy(defining)
      label.position.z = 2
      label.scale.multiplyScalar(selected ? 0.76 : 0.54)
      setMaterialBaseOpacity(
        label.material,
        selected ? PANORAMA_VISUAL.mansionLabelOpacity.selected : PANORAMA_VISUAL.mansionLabelOpacity.other,
      )
      label.visible = true
      group.add(label)
      labelCandidates.push({
        sprite: label,
        position: label.position.clone(),
        kind: 'mansion',
        id: mansion.id,
        name: mansion.name,
      })
    }
  })

  const importantHitTargets: SkyRuntime['importantHitTargets'] = []
  IMPORTANT_ASTERISMS.forEach((asterism) => {
    const selected = asterism.id === selectedImportantAsterism?.id
    const members = resolveImportantMembers(asterism).filter((member) => member.star)
    const positions = members.map((member) => ({ member, point: panoramaVector(member.star!) }))
    const positionByHip = new Map(positions.flatMap(({ member, point }) => member.hip === undefined ? [] : [[member.hip, point] as const]))
    positions.forEach(({ point }) => importantHitTargets.push({ id: asterism.id, position: point.clone(), kind: 'member' }))
    group.add(makeStarPoints(
      positions.map(({ point }) => point),
      positions.map(({ member }) => clamp((5.8 - member.star!.mag) * 0.6, 1.4, 3.8) + (selected ? 3.6 : 1.4)),
      positions.map(({ member }) => clamp((5.8 - member.star!.mag) / 5.8, 0.36, 1)),
      selected ? 0xffddb0 : 0xd8ad78,
      selected ? 1 : selectedImportantAsterism ? 0.24 : 0.72,
      pixelRatio,
    ))
    const linePositions: number[] = []
    asterism.lines.forEach((strip) => {
      for (let index = 1; index < strip.length; index += 1) {
        const previous = positionByHip.get(strip[index - 1]!)
        const current = positionByHip.get(strip[index]!)
        if (!previous || !current) continue
        linePositions.push(...previous.toArray(), ...current.toArray())
        importantHitTargets.push({ id: asterism.id, position: previous.clone().lerp(current, 0.5), kind: 'line' })
      }
    })
    if (linePositions.length > 0) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
      const lines = new THREE.LineSegments(geometry, lineMaterial(0xd8ad78, selected ? 0.95 : selectedImportantAsterism ? 0.16 : 0.54))
      lines.renderOrder = selected ? 9 : 5
      group.add(lines)
    }
    const center = panoramaLabelCenter(cache, members.flatMap((member) => member.hip === undefined ? [] : [member.hip]))
    if (center) {
      importantHitTargets.push({ id: asterism.id, position: center.clone(), kind: 'label' })
      const label = makeLabelSprite(asterism.name, selected ? `${asterism.members.length} 位 · IMPORTANT` : '重要星官', selected ? '#ffe5bd' : '#d9b785')
      label.position.copy(center)
      label.position.z = 3
      label.scale.multiplyScalar(selected ? 0.78 : 0.58)
      setMaterialBaseOpacity(label.material, selected ? 1 : selectedImportantAsterism ? 0.42 : 0.86)
      label.visible = true
      group.add(label)
      labelCandidates.push({ sprite: label, position: label.position.clone(), kind: 'important', id: asterism.id, name: asterism.name })
    }
  })

  runtime.panoramaScene.add(group)
  runtime.panoramaScene.remove(previousGroup)
  disposeGroup(previousGroup)
  runtime.panoramaGroup = group
  runtime.panoramaHitTargets = hitTargets
  runtime.panoramaImportantHitTargets = importantHitTargets
  runtime.panoramaNonInteractiveTargets = nonInteractiveTargets
  runtime.panoramaLabelCandidates = labelCandidates
  setGroupOpacity(group, runtime.mode === SKY_VIEW.panorama ? 1 : 0)
  const canvas = runtime.renderer.domElement
  canvas.dataset.panoramaFigureCount = String(traditionalSky.metadata.counts.renderFigures)
  canvas.dataset.panoramaMansionCount = String(MANSIONS.length)
  canvas.dataset.panoramaImportantAsterismCount = String(IMPORTANT_ASTERISMS.length)
  canvas.dataset.panoramaProjection = 'north-pole-azimuthal-equidistant'
}

function projectMansionToCanvas(
  runtime: SkyRuntime,
  point: THREE.Vector3,
  width: number,
  height: number,
  mode = runtime.mode,
) {
  const camera = mode === SKY_VIEW.panorama ? runtime.panoramaCamera : runtime.camera
  const projected = point.clone().project(camera)
  if (projected.z < -1 || projected.z > 1) return undefined
  return {
    x: (projected.x * 0.5 + 0.5) * width,
    y: (-projected.y * 0.5 + 0.5) * height,
  }
}

function projectedLabelHalfSize(
  runtime: SkyRuntime,
  sprite: THREE.Sprite,
  width: number,
  height: number,
  mode: SkyViewMode,
) {
  const camera = mode === SKY_VIEW.panorama ? runtime.panoramaCamera : runtime.camera
  camera.updateMatrixWorld()
  sprite.updateWorldMatrix(true, false)
  const position = sprite.getWorldPosition(new THREE.Vector3())
  const scale = sprite.getWorldScale(new THREE.Vector3())
  const center = position.clone().project(camera)
  const right = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(camera.quaternion)
    .multiplyScalar(scale.x / 2)
  const up = new THREE.Vector3(0, 1, 0)
    .applyQuaternion(camera.quaternion)
    .multiplyScalar(scale.y / 2)
  const rightEdge = position.clone().add(right).project(camera)
  const topEdge = position.clone().add(up).project(camera)
  return {
    width: Math.abs(rightEdge.x - center.x) * width * 0.5,
    height: Math.abs(topEdge.y - center.y) * height * 0.5,
  }
}

function setLabelViewScale(
  sprite: THREE.Sprite,
  factor: number,
) {
  const baseScale = sprite.userData.baseLabelScale as THREE.Vector3 | undefined
  if (!baseScale) sprite.userData.baseLabelScale = sprite.scale.clone()
  sprite.scale.copy(sprite.userData.baseLabelScale as THREE.Vector3).multiplyScalar(factor)
}

function setLabelVisibilityTarget(sprite: THREE.Sprite, visible: boolean) {
  sprite.material.userData.targetCollisionOpacity = visible ? 1 : 0
  if (visible) sprite.visible = true
}

function updateLabelFades(runtime: SkyRuntime, elapsedMs: number) {
  const maximumStep = Math.min(1, elapsedMs / LABEL_COLLISION.fadeDurationMs)
  const candidates = [...runtime.labelCandidates, ...runtime.panoramaLabelCandidates]
  candidates.forEach(({ sprite, kind }) => {
    const material = sprite.material
    if (kind !== 'traditional') {
      material.userData.collisionOpacity = 1
      material.userData.targetCollisionOpacity = 1
      material.opacity = Number(material.userData.baseOpacity ?? 1)
        * Number(material.userData.groupOpacity ?? 1)
      sprite.visible = true
      return
    }
    const current = Number(material.userData.collisionOpacity ?? 0)
    const target = Number(material.userData.targetCollisionOpacity ?? 0)
    const difference = target - current
    const next = Math.abs(difference) <= maximumStep
      ? target
      : current + Math.sign(difference) * maximumStep
    material.userData.collisionOpacity = next
    material.opacity = Number(material.userData.baseOpacity ?? 1)
      * Number(material.userData.groupOpacity ?? 1)
      * next
    sprite.visible = next > 0 || target > 0
  })
}

function updateLabelVisibility(runtime: SkyRuntime, width: number, height: number) {
  const mobile = width <= 680
  const panorama = runtime.mode === SKY_VIEW.panorama
  const visibleTraditionalTargets: Array<{
    id: string
    name: string
    x: number
    y: number
    textureWidth: number
    textureHeight: number
    paddingX: number
    aspectRatio: number
    screenWidth: number
  }> = []
  const activeCandidates = panorama ? runtime.panoramaLabelCandidates : runtime.labelCandidates
  activeCandidates.forEach(({ sprite, kind }) => {
    setLabelViewScale(
      sprite,
      labelScaleForView(
        panorama ? 'panorama' : 'observation',
        panorama ? runtime.panoramaViewport.zoom : runtime.fov,
        kind === 'important' ? 'mansion' : kind,
      ),
    )
  })
  const projectedCandidates = activeCandidates.map((candidate) => {
    const fullExtent = projectedLabelHalfSize(
      runtime,
      candidate.sprite,
      width,
      height,
      runtime.mode,
    )
    const layout = candidate.sprite.userData.labelLayout as LabelTextureLayout
    return {
      ...candidate,
      projected: projectMansionToCanvas(runtime, candidate.position, width, height, runtime.mode),
      extent: fullExtent,
      collisionExtent: visualLabelHalfSize(fullExtent, layout),
    }
  })
  const candidates = projectedCandidates.filter((candidate) => candidate.projected)
  const mansionCandidates = candidates.filter(({ kind }) => kind !== 'traditional')
  const viewportVisibleIds = runtime.viewportVisibleTraditionalIds[runtime.mode]
  const safeViewport = {
    left: 8,
    right: width - 8,
    top: 70,
    bottom: height - (mobile ? 118 : 138),
  }
  const activeTraditionalCandidates = candidates.filter((candidate) => {
    if (candidate.kind !== 'traditional') return false
    const projected = candidate.projected!
    const behindRightTools = !panorama
      && projected.x > width - 190
      && projected.y < (mobile ? 315 : 330)
    return !behindRightTools && labelFitsViewportWithHysteresis(
      projected,
      { width: candidate.extent.width, height: candidate.extent.height },
      safeViewport,
      viewportVisibleIds.has(candidate.id),
    )
  })
  const toScreenLabel = (candidate: typeof candidates[number]): ScreenLabel => {
    const projected = candidate.projected!
    return {
      id: candidate.id,
      rect: screenRectFromCenter(projected, candidate.collisionExtent),
    }
  }
  const result = resolveLabelVisibility(
    mansionCandidates.map(toScreenLabel),
    activeTraditionalCandidates.map(toScreenLabel),
    runtime.labelCollisionStates[runtime.mode],
    mobile ? LABEL_COLLISION.mobile : LABEL_COLLISION.desktop,
  )
  runtime.labelCollisionStates[runtime.mode] = result.state
  const activeTraditionalIds = new Set(activeTraditionalCandidates.map(({ id }) => id))
  runtime.viewportVisibleTraditionalIds[runtime.mode] = activeTraditionalIds
  activeCandidates.forEach(({ sprite, id, kind }) => {
    if (kind !== 'traditional') {
      sprite.visible = true
      setLabelVisibilityTarget(sprite, true)
    } else {
      sprite.userData.visibilityReason = runtime.transition
        ? 'transitioning'
        : !activeTraditionalIds.has(id)
          ? 'outsideViewport'
          : result.hiddenReasons[id] ?? 'visible'
      setLabelVisibilityTarget(
        sprite,
        activeTraditionalIds.has(id) && result.visibleTraditionalIds.has(id),
      )
    }
  })
  activeTraditionalCandidates.forEach((candidate) => {
    if (!result.visibleTraditionalIds.has(candidate.id)) return
    const projected = candidate.projected!
    const layout = candidate.sprite.userData.labelLayout as LabelTextureLayout
    visibleTraditionalTargets.push({
      id: candidate.id,
      name: candidate.name,
      x: Math.round(projected.x),
      y: Math.round(projected.y),
      textureWidth: layout.width,
      textureHeight: layout.height,
      paddingX: layout.paddingX,
      aspectRatio: Number(layout.aspectRatio.toFixed(4)),
      screenWidth: Math.round(candidate.extent.width * 2),
    })
  })
  const visibleMansionCount = activeCandidates.filter(({ kind, sprite }) => (
    kind === 'mansion' && sprite.visible
  )).length
  const visibleImportantCount = activeCandidates.filter(({ kind, sprite }) => (
    kind === 'important' && sprite.visible
  )).length
  const visibleTraditionalCount = result.visibleTraditionalIds.size
  runtime.renderer.domElement.dataset.visibleLabelCount = String(
    visibleMansionCount + visibleImportantCount + visibleTraditionalCount,
  )
  runtime.renderer.domElement.dataset.visibleMansionLabelCount = String(visibleMansionCount)
  runtime.renderer.domElement.dataset.visibleImportantAsterismLabelCount = String(visibleImportantCount)
  runtime.renderer.domElement.dataset.visibleTraditionalLabelCount = String(visibleTraditionalCount)
  runtime.renderer.domElement.dataset.hiddenTraditionalGroupCount = String(result.hiddenGroups.length)
  runtime.renderer.domElement.dataset.maxHiddenTraditionalGroupSize = String(
    Math.max(0, ...result.hiddenGroups.map((group) => group.length)),
  )
  runtime.renderer.domElement.dataset.collisionHiddenTraditionalLabelCount = String(
    Object.values(result.hiddenReasons).filter((reason) => reason === 'collision').length,
  )
  runtime.renderer.domElement.dataset.hysteresisHiddenTraditionalLabelCount = String(
    Object.values(result.hiddenReasons).filter((reason) => reason === 'hysteresis').length,
  )
  runtime.renderer.domElement.dataset.outsideViewportTraditionalLabelCount = String(
    activeCandidates.filter(({ kind, id }) => (
      kind === 'traditional' && !activeTraditionalIds.has(id)
    )).length,
  )
  runtime.renderer.domElement.dataset.visibleTraditionalLabelIds = JSON.stringify(
    [...result.visibleTraditionalIds].sort((a, b) => a.localeCompare(b)),
  )
  runtime.renderer.domElement.dataset.traditionalLabelStateSignature = JSON.stringify(result.hiddenGroups)
  runtime.renderer.domElement.dataset.traditionalLabelTargets = JSON.stringify(visibleTraditionalTargets)
  if (import.meta.env.DEV) {
    runtime.renderer.domElement.dataset.labelCollisionDebug = JSON.stringify({
      mode: runtime.mode,
      viewport: { width, height },
      devicePixelRatio: window.devicePixelRatio || 1,
      rendererPixelRatio: runtime.renderer.getPixelRatio(),
      thresholds: mobile ? LABEL_COLLISION.mobile : LABEL_COLLISION.desktop,
      groups: result.hiddenGroups.map((ids) => ({
        id: ids.join('|'),
        size: ids.length,
        ids,
      })),
      labels: projectedCandidates
        .filter(({ kind }) => kind === 'traditional')
        .map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          reason: candidate.sprite.userData.visibilityReason,
          rect: candidate.projected
            ? screenRectFromCenter(candidate.projected, candidate.collisionExtent)
            : undefined,
          conflicts: result.conflictsById[candidate.id] ?? [],
        })),
    })
  } else {
    delete runtime.renderer.domElement.dataset.labelCollisionDebug
  }
  const mansionTargetsById = new Map<string, { id: string; x: number; y: number }>()
  const activeHitTargets = panorama ? runtime.panoramaHitTargets : runtime.hitTargets
  activeHitTargets.forEach(({ id, position }) => {
    if (mansionTargetsById.has(id)) return
    const projected = projectMansionToCanvas(runtime, position, width, height, runtime.mode)
    if (
      !projected
      || projected.x < 24
      || projected.x > width - 210
      || projected.y < 82
      || projected.y > height - 150
    ) return
    mansionTargetsById.set(id, {
      id,
      x: Math.round(projected.x),
      y: Math.round(projected.y),
    })
  })
  runtime.renderer.domElement.dataset.mansionTargetPositions = JSON.stringify([...mansionTargetsById.values()])
  const importantTargetsById = new Map<string, { id: string; x: number; y: number; kind: string }>()
  const activeImportantHitTargets = panorama
    ? runtime.panoramaImportantHitTargets
    : runtime.importantHitTargets
  activeImportantHitTargets.forEach(({ id, position, kind }) => {
    if (importantTargetsById.has(id) || kind === 'label') return
    const projected = projectMansionToCanvas(runtime, position, width, height, runtime.mode)
    if (!projected || projected.x < 0 || projected.x > width || projected.y < 0 || projected.y > height) return
    importantTargetsById.set(id, { id, x: Math.round(projected.x), y: Math.round(projected.y), kind })
  })
  runtime.renderer.domElement.dataset.importantAsterismTargetPositions = JSON.stringify([...importantTargetsById.values()])
  runtime.renderer.domElement.dataset.importantAsterismLabelPositions = JSON.stringify(
    projectedCandidates
      .filter((candidate) => candidate.kind === 'important' && candidate.projected)
      .map((candidate) => ({
        id: candidate.id,
        x: Math.round(candidate.projected!.x),
        y: Math.round(candidate.projected!.y),
      })),
  )
}

export function CelestialSphere({
  date,
  time,
  latitude,
  longitude,
  timezone,
  observerLabel,
  mode,
  selectedMansion,
  selectedImportantAsterism,
  onSelectMansion,
  onSelectImportantAsterism,
  onTransitionChange,
  resetToken,
  panoramaResetToken,
}: CelestialSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runtimeRef = useRef<SkyRuntime | null>(null)
  const transitionChangeRef = useRef(onTransitionChange)
  const pointersRef = useRef(new Map<number, PointerState>())
  const gestureRef = useRef<{
    moved: boolean
    pinchDistance: number
    pinchFov: number
    pinchPanoramaViewport: PanoramaViewportState
  }>({
    moved: false,
    pinchDistance: 0,
    pinchFov: DEFAULT_FOV,
    pinchPanoramaViewport: resetPanoramaViewport(),
  })
  const [isInteracting, setIsInteracting] = useState(false)
  const [hoveredImportantId, setHoveredImportantId] = useState<ImportantAsterismId | undefined>()
  const [fovReadout, setFovReadout] = useState<number>(DEFAULT_FOV)
  const [panoramaReadout, setPanoramaReadout] = useState<PanoramaViewportState>(resetPanoramaViewport)

  useEffect(() => {
    transitionChangeRef.current = onTransitionChange
  }, [onTransitionChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x07101a, 1)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07101a)
    scene.fog = new THREE.FogExp2(0x07101a, 0.00055)
    const staticGroup = makeStaticHorizon()
    scene.add(staticGroup)

    const panoramaScene = new THREE.Scene()
    const panoramaCamera = new THREE.OrthographicCamera(-52, 52, 52, -52, 0.1, 220)
    panoramaCamera.position.set(0, 0, 100)
    panoramaCamera.lookAt(0, 0, 0)

    const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, 1, 0.1, SKY_RADIUS * 1.5)
    camera.position.set(0, 0, 0)
    const dynamicGroup = new THREE.Group()
    scene.add(dynamicGroup)
    const panoramaGroup = new THREE.Group()
    panoramaScene.add(panoramaGroup)

    const runtime: SkyRuntime = {
      scene,
      camera,
      panoramaScene,
      panoramaCamera,
      renderer,
      staticGroup,
      dynamicGroup,
      panoramaGroup,
      definingPositions: new Map(),
      hitTargets: [],
      importantHitTargets: [],
      nonInteractiveTargets: [],
      panoramaHitTargets: [],
      panoramaImportantHitTargets: [],
      panoramaNonInteractiveTargets: [],
      labelCandidates: [],
      panoramaLabelCandidates: [],
      yaw: THREE.MathUtils.degToRad(OBSERVATION_CAMERA.azimuth),
      pitch: THREE.MathUtils.degToRad(OBSERVATION_CAMERA.altitude),
      fov: DEFAULT_FOV,
      frame: 0,
      lastLabelUpdate: 0,
      lastFrameTimestamp: 0,
      labelCollisionStates: {
        [SKY_VIEW.observation]: {
          ...EMPTY_LABEL_COLLISION_STATE,
          hiddenGroups: [],
          clearPassesById: {},
        },
        [SKY_VIEW.panorama]: {
          ...EMPTY_LABEL_COLLISION_STATE,
          hiddenGroups: [],
          clearPassesById: {},
        },
      },
      viewportVisibleTraditionalIds: {
        [SKY_VIEW.observation]: new Set(),
        [SKY_VIEW.panorama]: new Set(),
      },
      mode: SKY_VIEW.observation,
      savedObservation: {
        azimuth: THREE.MathUtils.degToRad(OBSERVATION_CAMERA.azimuth),
        altitude: THREE.MathUtils.degToRad(OBSERVATION_CAMERA.altitude),
        fov: DEFAULT_FOV,
      },
      panoramaViewport: resetPanoramaViewport(),
      onTransitionChange: (value) => transitionChangeRef.current(value),
    }
    runtimeRef.current = runtime
    updateCamera(runtime)

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const mobile = width <= 680
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.8))
      renderer.setSize(Math.max(1, width), Math.max(1, height), false)
      camera.aspect = Math.max(1, width) / Math.max(1, height)
      camera.updateProjectionMatrix()
      const aspect = Math.max(1, width) / Math.max(1, height)
      if (aspect >= 1) {
        panoramaCamera.left = -52 * aspect
        panoramaCamera.right = 52 * aspect
        panoramaCamera.top = 52
        panoramaCamera.bottom = -52
      } else {
        panoramaCamera.left = -52
        panoramaCamera.right = 52
        panoramaCamera.top = 52 / aspect
        panoramaCamera.bottom = -52 / aspect
      }
      updatePanoramaCamera(runtime)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    const render = (timestamp: number) => {
      runtime.frame = window.requestAnimationFrame(render)
      const elapsedMs = runtime.lastFrameTimestamp > 0
        ? Math.min(50, timestamp - runtime.lastFrameTimestamp)
        : 0
      runtime.lastFrameTimestamp = timestamp
      if (runtime.focus) {
        const progress = clamp(
          (timestamp - runtime.focus.startedAt) / runtime.focus.duration,
          0,
          1,
        )
        const eased = 1 - Math.pow(1 - progress, 3)
        runtime.yaw = THREE.MathUtils.lerp(runtime.focus.fromYaw, runtime.focus.toYaw, eased)
        runtime.pitch = THREE.MathUtils.lerp(
          runtime.focus.fromPitch,
          runtime.focus.toPitch,
          eased,
        )
        if (progress >= 1) runtime.focus = undefined
      }
      if (runtime.transition) {
        const progress = clamp(
          (timestamp - runtime.transition.startedAt) / VIEW_TRANSITION_DURATION,
          0,
          1,
        )
        const eased = progress * progress * (3 - 2 * progress)
        const enteringPanorama = runtime.transition.to === SKY_VIEW.panorama
        const panoramaAmount = enteringPanorama ? eased : 1 - eased
        setGroupOpacity(runtime.panoramaGroup, panoramaAmount)
        const panoramaScale = THREE.MathUtils.lerp(0.78, 1, panoramaAmount)
        runtime.panoramaGroup.scale.setScalar(panoramaScale)
        const fovProgress = enteringPanorama
          ? clamp(progress / 0.66, 0, 1)
          : clamp((progress - 0.12) / 0.88, 0, 1)
        runtime.fov = enteringPanorama
          ? THREE.MathUtils.lerp(runtime.savedObservation.fov, 112, fovProgress)
          : THREE.MathUtils.lerp(112, runtime.savedObservation.fov, fovProgress)
        if (progress >= 1) {
          runtime.mode = runtime.transition.to
          if (runtime.mode === SKY_VIEW.observation) {
            runtime.yaw = runtime.savedObservation.azimuth
            runtime.pitch = runtime.savedObservation.altitude
            runtime.fov = runtime.savedObservation.fov
            setFovReadout(runtime.fov)
          }
          runtime.transition = undefined
          runtime.onTransitionChange(false)
        }
      }
      updateCamera(runtime)
      updatePanoramaCamera(runtime)
      if (timestamp - runtime.lastLabelUpdate >= 90) {
        updateLabelVisibility(runtime, canvas.clientWidth, canvas.clientHeight)
        runtime.lastLabelUpdate = timestamp
      }
      updateLabelFades(runtime, elapsedMs)
      canvas.dataset.cameraAzimuth = azimuthDegreesFromYaw(runtime.yaw).toFixed(1)
      canvas.dataset.cameraAltitude = THREE.MathUtils.radToDeg(runtime.pitch).toFixed(1)
      canvas.dataset.cameraFov = runtime.fov.toFixed(1)
      canvas.dataset.cameraPosition = '0,0,0'
      canvas.dataset.viewMode = runtime.mode
      canvas.dataset.viewTransitioning = String(Boolean(runtime.transition))
      canvas.dataset.panoramaZoom = runtime.panoramaViewport.zoom.toFixed(3)
      canvas.dataset.panoramaPanX = runtime.panoramaViewport.panX.toFixed(3)
      canvas.dataset.panoramaPanY = runtime.panoramaViewport.panY.toFixed(3)
      canvas.dataset.panoramaOrientation = JSON.stringify(PANORAMA_ORIENTATION)
      renderer.autoClear = true
      renderer.render(scene, camera)
      renderer.autoClear = false
      renderer.render(panoramaScene, panoramaCamera)
      renderer.autoClear = true
    }
    runtime.frame = window.requestAnimationFrame(render)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(runtime.frame)
      disposeGroup(scene)
      disposeGroup(panoramaScene)
      renderer.dispose()
      runtimeRef.current = null
    }
  }, [])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    rebuildSky(runtime, date, time, latitude, longitude, timezone, selectedMansion, selectedImportantAsterism)
  }, [date, latitude, longitude, selectedImportantAsterism, selectedMansion, time, timezone])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    buildPanorama(runtime, selectedMansion, selectedImportantAsterism)
  }, [selectedImportantAsterism, selectedMansion])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime || runtime.transition || runtime.mode === mode) return
    if (mode === SKY_VIEW.panorama) {
      runtime.savedObservation = {
        azimuth: runtime.yaw,
        altitude: runtime.pitch,
        fov: runtime.fov,
      }
    }
    runtime.focus = undefined
    runtime.transition = {
      from: runtime.mode,
      to: mode,
      startedAt: performance.now(),
    }
    runtime.onTransitionChange(true)
  }, [mode])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    runtime.yaw = THREE.MathUtils.degToRad(OBSERVATION_CAMERA.azimuth)
    runtime.pitch = THREE.MathUtils.degToRad(OBSERVATION_CAMERA.altitude)
    runtime.fov = DEFAULT_FOV
    runtime.focus = undefined
    runtime.savedObservation = {
      azimuth: runtime.yaw,
      altitude: runtime.pitch,
      fov: runtime.fov,
    }
    setFovReadout(DEFAULT_FOV)
  }, [resetToken])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    runtime.panoramaViewport = resetPanoramaViewport()
    updatePanoramaCamera(runtime)
    setPanoramaReadout(runtime.panoramaViewport)
  }, [panoramaResetToken])

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const runtime = runtimeRef.current
    if (!runtime) return
    const point = pointerPosition(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { ...point, startX: point.x, startY: point.y })
    runtime.focus = undefined
    gestureRef.current.moved = false
    if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()]
      if (first && second) {
        gestureRef.current.pinchDistance = Math.hypot(first.x - second.x, first.y - second.y)
        gestureRef.current.pinchFov = runtime.fov
        gestureRef.current.pinchPanoramaViewport = { ...runtime.panoramaViewport }
      }
    }
    setIsInteracting(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const runtime = runtimeRef.current
    const previous = pointersRef.current.get(event.pointerId)
    if (!runtime) return
    if (!previous) {
      const point = pointerPosition(event)
      const rect = event.currentTarget.getBoundingClientRect()
      const targets = runtime.mode === SKY_VIEW.panorama
        ? runtime.panoramaImportantHitTargets
        : runtime.importantHitTargets
      const nearest = targets.map((target) => {
        const projected = projectMansionToCanvas(runtime, target.position, rect.width, rect.height, runtime.mode)
        return projected ? { ...target, distance: Math.hypot(point.x - projected.x, point.y - projected.y) } : undefined
      }).filter((target): target is NonNullable<typeof target> => Boolean(target)).sort((a, b) => a.distance - b.distance)[0]
      const hoveredId = nearest && nearest.distance < 28 ? nearest.id : ''
      event.currentTarget.dataset.hoveredImportantAsterism = hoveredId
      event.currentTarget.style.cursor = hoveredId ? 'pointer' : 'grab'
      setHoveredImportantId(hoveredId || undefined)
      return
    }
    const point = pointerPosition(event)
    pointersRef.current.set(event.pointerId, { ...point, startX: previous.startX, startY: previous.startY })

    if (runtime.transition) {
      if (Math.hypot(point.x - previous.startX, point.y - previous.startY) > 4) {
        gestureRef.current.moved = true
      }
      return
    }

    if (runtime.mode === SKY_VIEW.panorama) {
      if (pointersRef.current.size === 2) {
        const [first, second] = [...pointersRef.current.values()]
        if (!first || !second) return
        const distance = Math.hypot(first.x - second.x, first.y - second.y)
        runtime.panoramaViewport = panoramaZoomFromPinch(
          gestureRef.current.pinchPanoramaViewport,
          gestureRef.current.pinchDistance,
          distance,
        )
      } else {
        const cameraWidth = runtime.panoramaCamera.right - runtime.panoramaCamera.left
        const cameraHeight = runtime.panoramaCamera.top - runtime.panoramaCamera.bottom
        runtime.panoramaViewport = panoramaPanFromDrag(
          runtime.panoramaViewport,
          point.x - previous.x,
          point.y - previous.y,
          event.currentTarget.clientWidth,
          event.currentTarget.clientHeight,
          cameraWidth,
          cameraHeight,
        )
      }
      updatePanoramaCamera(runtime)
      setPanoramaReadout({ ...runtime.panoramaViewport })
      if (Math.hypot(point.x - previous.startX, point.y - previous.startY) > 4 || pointersRef.current.size === 2) {
        gestureRef.current.moved = true
      }
      return
    }

    if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()]
      if (!first || !second) return
      const distance = Math.hypot(first.x - second.x, first.y - second.y)
      if (gestureRef.current.pinchDistance > 0) {
        runtime.fov = fovFromPinch(
          gestureRef.current.pinchFov,
          gestureRef.current.pinchDistance,
          distance,
        )
        setFovReadout(runtime.fov)
      }
      gestureRef.current.moved = true
      return
    }

    const dx = point.x - previous.x
    const dy = point.y - previous.y
    if (Math.hypot(point.x - previous.startX, point.y - previous.startY) > 4) {
      gestureRef.current.moved = true
    }
    const nextCamera = observationCameraFromDrag(
      runtime.yaw,
      runtime.pitch,
      dx,
      dy,
      -MAX_PITCH,
      MAX_PITCH,
    )
    runtime.yaw = nextCamera.yaw
    runtime.pitch = nextCamera.pitch
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const runtime = runtimeRef.current
    const point = pointerPosition(event)
    if (runtime && !gestureRef.current.moved && pointersRef.current.size === 1) {
      const rect = event.currentTarget.getBoundingClientRect()
      const panorama = runtime.mode === SKY_VIEW.panorama
      const hitTargets = panorama ? runtime.panoramaHitTargets : runtime.hitTargets
      const importantHitTargets = panorama ? runtime.panoramaImportantHitTargets : runtime.importantHitTargets
      const nonInteractiveTargets = panorama
        ? runtime.panoramaNonInteractiveTargets
        : runtime.nonInteractiveTargets
      const nearest = hitTargets
        .map(({ id, position }) => {
          const projected = projectMansionToCanvas(runtime, position, rect.width, rect.height, runtime.mode)
          return projected
            ? { id, distance: Math.hypot(point.x - projected.x, point.y - projected.y) }
            : undefined
        })
        .filter((candidate): candidate is { id: string; distance: number } => Boolean(candidate))
        .sort((a, b) => a.distance - b.distance)[0]
      const nearestImportant = importantHitTargets
        .map(({ id, position, kind }) => {
          const projected = projectMansionToCanvas(runtime, position, rect.width, rect.height, runtime.mode)
          return projected
            ? { id, kind, distance: Math.hypot(point.x - projected.x, point.y - projected.y) }
            : undefined
        })
        .filter((candidate): candidate is { id: ImportantAsterismId; kind: 'label' | 'member' | 'line'; distance: number } => Boolean(candidate))
        .sort((a, b) => a.distance - b.distance)[0]
      const nearestOrdinaryDistance = nonInteractiveTargets
        .map((position) => {
          const projected = projectMansionToCanvas(runtime, position, rect.width, rect.height, runtime.mode)
          return projected ? Math.hypot(point.x - projected.x, point.y - projected.y) : Number.POSITIVE_INFINITY
        })
        .sort((a, b) => a - b)[0] ?? Number.POSITIVE_INFINITY
      const mansionHasPriority = nearest
        && nearest.distance < 30
        && (nearest.distance <= nearestOrdinaryDistance + 4 || nearestOrdinaryDistance >= 18)
      const importantHasPriority = nearestImportant
        && nearestImportant.distance < 30
        && (
          nearestImportant.kind === 'label'
          || selectedImportantAsterism?.id === nearestImportant.id
          || !mansionHasPriority
          || nearestImportant.distance + 5 < nearest.distance
        )
      if (importantHasPriority) onSelectImportantAsterism(nearestImportant.id)
      else if (mansionHasPriority) onSelectMansion(nearest.id)
    }
    pointersRef.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (pointersRef.current.size === 0) setIsInteracting(false)
  }

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    const runtime = runtimeRef.current
    if (!runtime) return
    event.preventDefault()
    if (runtime.transition) return
    if (runtime.mode === SKY_VIEW.panorama) {
      runtime.panoramaViewport = panoramaZoomFromWheel(runtime.panoramaViewport, event.deltaY)
      updatePanoramaCamera(runtime)
      setPanoramaReadout({ ...runtime.panoramaViewport })
      return
    }
    runtime.focus = undefined
    runtime.fov = fovFromWheel(runtime.fov, event.deltaY)
    setFovReadout(runtime.fov)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const runtime = runtimeRef.current
    if (!runtime || runtime.transition) return
    runtime.focus = undefined
    if (runtime.mode === SKY_VIEW.panorama) {
      if (event.key === 'ArrowLeft') runtime.panoramaViewport = panoramaPanByWorld(runtime.panoramaViewport, -4, 0)
      else if (event.key === 'ArrowRight') runtime.panoramaViewport = panoramaPanByWorld(runtime.panoramaViewport, 4, 0)
      else if (event.key === 'ArrowUp') runtime.panoramaViewport = panoramaPanByWorld(runtime.panoramaViewport, 0, 4)
      else if (event.key === 'ArrowDown') runtime.panoramaViewport = panoramaPanByWorld(runtime.panoramaViewport, 0, -4)
      else if (event.key === '+' || event.key === '=') runtime.panoramaViewport = panoramaZoomFromWheel(runtime.panoramaViewport, -120)
      else if (event.key === '-') runtime.panoramaViewport = panoramaZoomFromWheel(runtime.panoramaViewport, 120)
      else if (event.key === '0') runtime.panoramaViewport = resetPanoramaViewport()
      else return
      updatePanoramaCamera(runtime)
      setPanoramaReadout({ ...runtime.panoramaViewport })
      event.preventDefault()
      return
    }
    if (event.key === 'ArrowLeft') runtime.yaw -= THREE.MathUtils.degToRad(7)
    else if (event.key === 'ArrowRight') runtime.yaw += THREE.MathUtils.degToRad(7)
    else if (event.key === 'ArrowUp') runtime.pitch = clamp(runtime.pitch + THREE.MathUtils.degToRad(7), -MAX_PITCH, MAX_PITCH)
    else if (event.key === 'ArrowDown') runtime.pitch = clamp(runtime.pitch - THREE.MathUtils.degToRad(7), -MAX_PITCH, MAX_PITCH)
    else if (event.key === '+' || event.key === '=') runtime.fov = clamp(runtime.fov - 4, MIN_FOV, MAX_FOV)
    else if (event.key === '-') runtime.fov = clamp(runtime.fov + 4, MIN_FOV, MAX_FOV)
    else if (event.key === '0') {
      runtime.yaw = THREE.MathUtils.degToRad(OBSERVATION_CAMERA.azimuth)
      runtime.pitch = THREE.MathUtils.degToRad(OBSERVATION_CAMERA.altitude)
      runtime.fov = DEFAULT_FOV
    } else return
    setFovReadout(runtime.fov)
    event.preventDefault()
  }

  return (
    <div className={`sky-canvas-wrap sky-sphere sky-sphere--${mode}${isInteracting ? ' is-interacting' : ''}`}>
      <canvas
        ref={canvasRef}
        className="sky-canvas sky-webgl"
        aria-describedby="sky-canvas-help"
        aria-label={mode === SKY_VIEW.panorama
          ? '中国传统星空固定全景；上南下北、左东右西，可缩放和平移并点选二十八宿与重要星官，方向不可旋转'
          : `${observerLabel}三维天球；观察者位于天球中心，可拖动环顾地平线上下，并点选星宿或重要星官`}
        data-renderer="three-webgl"
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={(event) => {
          event.currentTarget.dataset.hoveredImportantAsterism = ''
          if (pointersRef.current.size === 0) event.currentTarget.style.cursor = 'grab'
          setHoveredImportantId(undefined)
        }}
        onWheel={handleWheel}
        role="application"
        tabIndex={0}
      />
      <p className="sr-only" id="sky-canvas-help">
        观测视图使用方向键环顾三维天空，加号和减号调整视野。全景视图使用拖动平移、滚轮或双指缩放，方向始终固定；数字零恢复当前模式的默认视图。
      </p>
      <div className="sky-gesture-hint" aria-hidden="true">
        <span>{mode === SKY_VIEW.panorama ? '拖动平移' : '拖动环顾'}</span>
        <i />
        <span>{mode === SKY_VIEW.panorama
          ? `缩放 ${Math.round(panoramaReadout.zoom / DEFAULT_PANORAMA_VIEWPORT.zoom * 100)}%`
          : `视野 ${Math.round(fovReadout)}°`}</span>
      </div>
      <div className="sky-model-badge" aria-hidden="true">
        <span>{mode === SKY_VIEW.panorama ? 'ALL-SKY PROJECTION' : 'CELESTIAL SPHERE'}</span>
        <i />
        <span>THREE · WEBGL</span>
      </div>
      {hoveredImportantId ? (
        <div className="sky-important-hover" aria-hidden="true">
          <small>IMPORTANT ASTERISM</small>
          <span>{IMPORTANT_ASTERISMS.find((asterism) => asterism.id === hoveredImportantId)?.name}</span>
        </div>
      ) : null}
    </div>
  )
}
